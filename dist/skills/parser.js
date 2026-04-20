/**
 * Skill Manifest Parser
 *
 * Reads and parses the YAML frontmatter from SKILL.md files, returning a
 * typed SkillManifest that the rest of the code can use for validation and
 * workflow control — instead of treating SKILL.md as opaque documentation.
 *
 * Expected frontmatter format:
 * ---
 * name: ralplan
 * description: Architecture planning and approval
 * trigger: $ralplan
 * flags:
 *   - name: --deliberate
 *     description: Enable extended multi-round review
 * phases:
 *   - starting
 *   - planning
 *   - reviewing
 *   - approved
 * gates:
 *   - type: prompt_specificity
 *     description: Prompt must reference a specific task or feature
 * ---
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/** Default phases used when a skill doesn't specify its own */
export const DEFAULT_PHASES = ['starting', 'executing', 'verifying', 'completing', 'cancelled'];
/** Cache parsed manifests to avoid repeated disk reads */
const manifestCache = new Map();
/**
 * Locate a SKILL.md file for the given skill name.
 * Search order:
 *  1. Project local   : <cwd>/skills/<name>/SKILL.md
 *  2. Kimi global     : ~/.kimi/skills/omk/<name>/SKILL.md
 *  3. Package bundled : <packageRoot>/skills/<name>/SKILL.md
 */
function findSkillFile(skillName, cwd) {
    const projectRoot = cwd ?? process.cwd();
    const kimiHome = join(homedir(), '.kimi', 'skills', 'omk');
    const packageRoot = join(__dirname, '..', '..');
    const candidates = [
        join(projectRoot, 'skills', skillName, 'SKILL.md'),
        join(kimiHome, skillName, 'SKILL.md'),
        join(packageRoot, 'skills', skillName, 'SKILL.md'),
    ];
    for (const candidate of candidates) {
        if (existsSync(candidate))
            return candidate;
    }
    return null;
}
/**
 * Minimal YAML frontmatter parser.
 *
 * Handles simple key-value pairs and single-level lists, sufficient for our
 * frontmatter schema. Does NOT require a yaml library dependency.
 */
function parseFrontmatter(content) {
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!fmMatch) {
        return { meta: {}, body: content };
    }
    const yamlBlock = fmMatch[1];
    const body = fmMatch[2] ?? '';
    const meta = {};
    // Parse each line
    let currentList = null;
    let currentListItem = null;
    const lines = yamlBlock.split(/\r?\n/);
    for (const line of lines) {
        // Top-level key: value
        const kvMatch = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
        if (kvMatch && !line.startsWith('  ') && !line.startsWith('\t')) {
            // Flush previous list item
            if (currentListItem && currentList) {
                currentList.push(currentListItem);
                currentListItem = null;
            }
            const key = kvMatch[1];
            const val = kvMatch[2].trim();
            if (val === '' || val === '|' || val === '>') {
                // Starts a list or block — will be populated by sub-items
                meta[key] = [];
                currentList = meta[key];
            }
            else {
                currentList = null;
                meta[key] = val;
            }
            continue;
        }
        // List item start: "  - name: foo" or "  - simple_value"
        const listItemMatch = line.match(/^\s+-\s+(.*)$/);
        if (listItemMatch && currentList !== null) {
            // Flush previous item
            if (currentListItem) {
                currentList.push(currentListItem);
            }
            const rest = listItemMatch[1].trim();
            const innerKv = rest.match(/^([a-zA-Z_-]+):\s*(.*)$/);
            if (innerKv) {
                currentListItem = { [innerKv[1]]: innerKv[2].trim() };
            }
            else {
                // Simple string item — store as a string-keyed object for uniform handling
                currentList.push(rest);
                currentListItem = null;
            }
            continue;
        }
        // Continuation of current list item: "    description: foo"
        const indentedKv = line.match(/^\s{4,}([a-zA-Z_-]+):\s*(.*)$/);
        if (indentedKv && currentListItem) {
            currentListItem[indentedKv[1]] = indentedKv[2].trim();
            continue;
        }
    }
    // Flush final list item
    if (currentListItem && currentList) {
        currentList.push(currentListItem);
    }
    return { meta, body };
}
/**
 * Load and parse the manifest for a given skill name.
 * Returns null if the SKILL.md cannot be found.
 * Results are cached per skill name.
 */
export function loadSkillManifest(skillName, cwd) {
    const cacheKey = `${skillName}:${cwd ?? ''}`;
    if (manifestCache.has(cacheKey)) {
        return manifestCache.get(cacheKey);
    }
    const filePath = findSkillFile(skillName, cwd);
    if (!filePath)
        return null;
    try {
        const content = readFileSync(filePath, 'utf-8');
        const { meta } = parseFrontmatter(content);
        const manifest = {
            name: String(meta['name'] ?? skillName),
            description: String(meta['description'] ?? ''),
            trigger: meta['trigger'] ? String(meta['trigger']) : undefined,
            flags: normalizeFlags(meta['flags']),
            phases: normalizePhases(meta['phases']),
            gates: normalizeGates(meta['gates']),
            raw: meta,
        };
        manifestCache.set(cacheKey, manifest);
        return manifest;
    }
    catch {
        return null;
    }
}
/** Clear the manifest cache (useful in tests) */
export function clearManifestCache() {
    manifestCache.clear();
}
function normalizeFlags(raw) {
    if (!Array.isArray(raw))
        return [];
    const result = [];
    for (const item of raw) {
        if (typeof item === 'object' && item !== null && 'name' in item) {
            const obj = item;
            result.push({
                name: String(obj['name']),
                description: String(obj['description'] ?? ''),
                required: obj['required'] === 'true' || obj['required'] === true,
            });
        }
    }
    return result;
}
function normalizePhases(raw) {
    if (!Array.isArray(raw))
        return DEFAULT_PHASES;
    const phases = raw.map((p) => String(p)).filter(Boolean);
    return phases.length > 0 ? phases : DEFAULT_PHASES;
}
function normalizeGates(raw) {
    if (!Array.isArray(raw))
        return [];
    const result = [];
    for (const item of raw) {
        if (typeof item === 'object' && item !== null && 'type' in item) {
            const obj = item;
            result.push({
                type: String(obj['type']),
                description: String(obj['description'] ?? ''),
                pattern: obj['pattern'] ? String(obj['pattern']) : undefined,
                blocking: obj['blocking'] !== 'false' && obj['blocking'] !== false,
            });
        }
    }
    return result;
}
//# sourceMappingURL=parser.js.map