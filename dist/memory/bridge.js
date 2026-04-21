/**
 * MemPalace Bridge
 *
 * Bridges OMK (Node.js/TypeScript) to MemPalace (Python-based local-first AI
 * memory system). Spawns the `mempalace` CLI and handles stdio, result parsing,
 * and graceful fallbacks when MemPalace is not installed.
 */
import { spawn } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
/* -------------------------------------------------------------------------- */
/*                               Palace Path                                  */
/* -------------------------------------------------------------------------- */
const PALACE_PATH_FILE = join('.omk', 'palace-path');
function getOmkDir(projectRoot) {
    return join(projectRoot || process.cwd(), '.omk');
}
function getPalacePathFile(projectRoot) {
    return join(projectRoot || process.cwd(), PALACE_PATH_FILE);
}
/**
 * Read the cached palace path for a project.
 * Falls back to `<projectRoot>/.mempalace` if no cache exists.
 */
export function getPalacePath(projectRoot) {
    const file = getPalacePathFile(projectRoot);
    if (existsSync(file)) {
        try {
            const cached = readFileSync(file, 'utf-8').trim();
            if (cached)
                return resolve(projectRoot || process.cwd(), cached);
        }
        catch {
            // Fall through to default
        }
    }
    return resolve(projectRoot || process.cwd(), '.mempalace');
}
/**
 * Cache a palace path for the current project.
 * The path is stored relative to the project root when possible.
 */
export function setPalacePath(palacePath, projectRoot) {
    const root = projectRoot || process.cwd();
    const omkDir = getOmkDir(root);
    if (!existsSync(omkDir)) {
        mkdirSync(omkDir, { recursive: true });
    }
    const absolute = resolve(root, palacePath);
    const relative = absolute.startsWith(root + (process.platform === 'win32' ? '\\' : '/'))
        ? absolute.slice(root.length + 1)
        : absolute;
    writeFileSync(getPalacePathFile(root), relative, 'utf-8');
}
/* -------------------------------------------------------------------------- */
/*                               Detection                                    */
/* -------------------------------------------------------------------------- */
let cachedAvailability;
/**
 * Detect whether `mempalace` is available in PATH.
 * The result is cached for the lifetime of the process.
 */
export async function isMemPalaceAvailable() {
    if (cachedAvailability !== undefined)
        return cachedAvailability;
    return new Promise((resolve) => {
        const child = spawn('mempalace', ['--version'], {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let exited = false;
        const timer = setTimeout(() => {
            if (!exited) {
                child.kill();
                cachedAvailability = false;
                resolve(false);
            }
        }, 5000);
        child.on('error', () => {
            exited = true;
            clearTimeout(timer);
            cachedAvailability = false;
            resolve(false);
        });
        child.on('exit', (code) => {
            exited = true;
            clearTimeout(timer);
            cachedAvailability = code === 0;
            resolve(code === 0);
        });
    });
}
/** Clear the availability cache (useful for testing). */
export function clearAvailabilityCache() {
    cachedAvailability = undefined;
}
/* -------------------------------------------------------------------------- */
/*                               Spawn Helper                                 */
/* -------------------------------------------------------------------------- */
function runMemPalace(args, options) {
    return new Promise((resolve) => {
        const child = spawn('mempalace', args, {
            shell: true,
            cwd: options?.cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        let exited = false;
        const timer = setTimeout(() => {
            if (!exited) {
                child.kill();
                resolve({
                    stdout,
                    stderr: stderr || 'Command timed out',
                    exitCode: null,
                    success: false,
                });
            }
        }, options?.timeout || 120_000);
        child.stdout?.on('data', (chunk) => {
            stdout += chunk.toString('utf-8');
        });
        child.stderr?.on('data', (chunk) => {
            stderr += chunk.toString('utf-8');
        });
        child.on('error', (err) => {
            exited = true;
            clearTimeout(timer);
            resolve({
                stdout,
                stderr: stderr || err.message,
                exitCode: null,
                success: false,
            });
        });
        child.on('exit', (code) => {
            exited = true;
            clearTimeout(timer);
            resolve({
                stdout,
                stderr,
                exitCode: code,
                success: code === 0,
            });
        });
    });
}
function buildArgs(base, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
options, mappers) {
    const args = [...base];
    if (!options)
        return args;
    for (const [key, mapper] of Object.entries(mappers)) {
        const value = options[key];
        if (value !== undefined && value !== null) {
            args.push(...mapper(value));
        }
    }
    return args;
}
/* -------------------------------------------------------------------------- */
/*                               Parsers                                      */
/* -------------------------------------------------------------------------- */
/**
 * Parse `mempalace search` stdout into structured results.
 *
 * Example output:
 *   ============================================================
 *     Results for: "why graphql"
 *   ============================================================
 *
 *     [1] my_app / src
 *         Source: app.ts
 *         Match:  0.823
 *
 *         import { graphql } from ...
 *
 *     ──────────────────────────────────────────────────────────
 */
export function parseSearchOutput(stdout) {
    const results = [];
    const blocks = stdout.split(/\n\s{2}─{40,}\n/);
    for (const block of blocks) {
        const headerMatch = block.match(/\[\d+\]\s+(\S+)\s+\/\s+(\S+)/);
        const sourceMatch = block.match(/Source:\s*(.+)/);
        const matchMatch = block.match(/Match:\s*([\d.]+)/);
        if (headerMatch) {
            const wing = headerMatch[1].trim();
            const room = headerMatch[2].trim();
            const source = sourceMatch ? sourceMatch[1].trim() : '?';
            const similarity = matchMatch ? parseFloat(matchMatch[1]) : 0;
            // Extract body text — everything after the header lines
            const lines = block.split('\n');
            let bodyStart = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(/Match:\s*[\d.]+/)) {
                    bodyStart = i + 2; // Skip Match line + blank line
                    break;
                }
            }
            const text = bodyStart >= 0 ? lines.slice(bodyStart).join('\n').trim() : '';
            results.push({ wing, room, source, similarity, text });
        }
    }
    return results;
}
/**
 * Parse `mempalace status` stdout into structured results.
 *
 * Example output:
 *   ========================================================
 *     MemPalace Status — 42 drawers
 *   ========================================================
 *
 *     WING: my_app
 *       ROOM: src                 30 drawers
 *       ROOM: tests               12 drawers
 *
 *   ========================================================
 */
export function parseStatusOutput(stdout) {
    const totalMatch = stdout.match(/MemPalace Status \u2014 (\d+) drawers/);
    if (!totalMatch)
        return undefined;
    const totalDrawers = parseInt(totalMatch[1], 10);
    const wings = [];
    const wingRe = /WING:\s*(.+)/g;
    const roomRe = /ROOM:\s*(\S+)\s+(\d+) drawers/g;
    let wingMatch;
    while ((wingMatch = wingRe.exec(stdout)) !== null) {
        const wingName = wingMatch[1].trim();
        // Collect rooms until the next WING or end of block
        const wingStart = wingMatch.index;
        const nextWing = stdout.indexOf('WING:', wingStart + 1);
        const wingBlock = nextWing > 0 ? stdout.slice(wingStart, nextWing) : stdout.slice(wingStart);
        const rooms = [];
        let roomMatch;
        while ((roomMatch = roomRe.exec(wingBlock)) !== null) {
            rooms.push({ name: roomMatch[1].trim(), drawers: parseInt(roomMatch[2], 10) });
        }
        // Reset roomRe lastIndex because we sliced the string
        roomRe.lastIndex = 0;
        wings.push({ name: wingName, rooms });
    }
    return { totalDrawers, wings };
}
/**
 * Parse `mempalace wake-up` stdout, returning only the L0+L1 context text.
 *
 * Example output:
 *   Wake-up text (~123 tokens):
 *   ==================================================
 *   <L0 + L1 text here>
 */
export function parseWakeUpOutput(stdout) {
    const lines = stdout.split('\n');
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('====')) {
            start = i + 1;
            break;
        }
    }
    if (start === -1)
        return stdout.trim();
    return lines.slice(start).join('\n').trim();
}
/* -------------------------------------------------------------------------- */
/*                               Bridge Factory                               */
/* -------------------------------------------------------------------------- */
/**
 * Create a MemPalace bridge for the given project root.
 *
 * If `mempalace` is not installed, the returned bridge still exposes the same
 * API but every command resolves to a `CommandResult` with `success: false`
 * and a helpful `stderr` message.
 */
export async function createBridge(projectRoot) {
    const available = await isMemPalaceAvailable();
    const palacePath = getPalacePath(projectRoot);
    const root = projectRoot || process.cwd();
    const fallback = (cmd) => Promise.resolve({
        stdout: '',
        stderr: `MemPalace is not installed. Command "${cmd}" cannot be executed.\n` +
            'Install it from https://github.com/MemPalace/mempalace or run `pip install mempalace`.',
        exitCode: 127,
        success: false,
    });
    return {
        available,
        palacePath,
        async init(projectPath, options = {}) {
            if (!available)
                return fallback('init');
            const args = buildArgs(['init', projectPath], options, {
                yes: (v) => (v ? ['--yes'] : []),
                lang: (v) => ['--lang', String(v)],
            });
            return runMemPalace(args, { cwd: root });
        },
        async mine(projectPath, options = {}) {
            if (!available)
                return fallback('mine');
            const args = buildArgs(['mine', projectPath], options, {
                mode: (v) => ['--mode', String(v)],
                wing: (v) => ['--wing', String(v)],
                agent: (v) => ['--agent', String(v)],
                limit: (v) => ['--limit', String(v)],
                dryRun: (v) => (v ? ['--dry-run'] : []),
                noGitignore: (v) => (v ? ['--no-gitignore'] : []),
                includeIgnored: (v) => Array.isArray(v) ? v.flatMap((p) => ['--include-ignored', p]) : [],
                extract: (v) => ['--extract', String(v)],
            });
            if (!args.includes('--palace')) {
                args.push('--palace', palacePath);
            }
            return runMemPalace(args, { cwd: root });
        },
        async search(query, options = {}) {
            if (!available)
                return { ...(await fallback('search')), results: [] };
            const args = buildArgs(['search', query], options, {
                wing: (v) => ['--wing', String(v)],
                room: (v) => ['--room', String(v)],
                results: (v) => ['--results', String(v)],
            });
            if (!args.includes('--palace')) {
                args.push('--palace', palacePath);
            }
            const result = await runMemPalace(args, { cwd: root });
            return { ...result, results: result.success ? parseSearchOutput(result.stdout) : [] };
        },
        async wakeUp(options = {}) {
            if (!available)
                return fallback('wake-up');
            const args = buildArgs(['wake-up'], options, {
                wing: (v) => ['--wing', String(v)],
            });
            if (!args.includes('--palace')) {
                args.push('--palace', palacePath);
            }
            return runMemPalace(args, { cwd: root });
        },
        async status(_options = {}) {
            if (!available)
                return { ...(await fallback('status')) };
            const args = ['status'];
            if (!args.includes('--palace')) {
                args.push('--palace', palacePath);
            }
            const result = await runMemPalace(args, { cwd: root });
            return {
                ...result,
                status: result.success ? parseStatusOutput(result.stdout) : undefined,
            };
        },
    };
}
/* -------------------------------------------------------------------------- */
/*                     Standalone Convenience Functions                       */
/* -------------------------------------------------------------------------- */
/**
 * Search MemPalace for semantically similar content.
 *
 * @param query - Search query string
 * @param options - Optional filters (wing, room, limit)
 * @returns Array of search results; empty if MemPalace is unavailable
 */
export async function searchMemPalace(query, options) {
    const available = await isMemPalaceAvailable();
    if (!available) {
        console.warn('[MemPalace] not installed — search returning empty results');
        return [];
    }
    const palacePath = getPalacePath();
    const args = ['search', query];
    if (options?.wing)
        args.push('--wing', options.wing);
    if (options?.room)
        args.push('--room', options.room);
    if (options?.limit)
        args.push('--results', String(options.limit));
    args.push('--palace', palacePath);
    const result = await runMemPalace(args);
    return result.success ? parseSearchOutput(result.stdout) : [];
}
/**
 * Python wrapper script for adding a drawer via the MemPalace Python API.
 * Injected into a temporary file and executed at runtime so the bridge does
 * not depend on a separate Python file being present in the distributed
 * package.
 */
const ADD_DRAWER_SCRIPT = `import sys, json, hashlib
from datetime import datetime

def main():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON: {e}"}))
        sys.exit(1)

    palace_path = payload.get("palace_path", "")
    wing = payload.get("wing", "")
    room = payload.get("room", "")
    content = payload.get("content", "")
    tags = payload.get("tags", [])
    source_file = payload.get("source_file", "omk-bridge")
    added_by = payload.get("added_by", "omk")

    if not wing or not room or not content:
        print(json.dumps({"success": False, "error": "wing, room, and content are required"}))
        sys.exit(1)

    try:
        from mempalace.config import sanitize_name, sanitize_content
        from mempalace.palace import get_collection
    except ImportError as e:
        print(json.dumps({"success": False, "error": f"MemPalace not installed: {e}"}))
        sys.exit(1)

    try:
        wing = sanitize_name(wing, "wing")
        room = sanitize_name(room, "room")
        content = sanitize_content(content)
    except ValueError as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

    try:
        col = get_collection(palace_path, create=True)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to open palace: {e}"}))
        sys.exit(1)

    drawer_id = f"drawer_{wing}_{room}_{hashlib.sha256((wing + room + content).encode()).hexdigest()[:24]}"

    try:
        existing = col.get(ids=[drawer_id])
        if existing and existing.get("ids"):
            print(json.dumps({"success": True, "reason": "already_exists", "drawer_id": drawer_id}))
            return
    except Exception:
        pass

    metadata = {
        "wing": wing,
        "room": room,
        "source_file": source_file,
        "chunk_index": 0,
        "added_by": added_by,
        "filed_at": datetime.now().isoformat(),
    }
    if tags:
        metadata["tags"] = ",".join(tags)

    try:
        col.upsert(
            ids=[drawer_id],
            documents=[content],
            metadatas=[metadata],
        )
        print(json.dumps({"success": True, "drawer_id": drawer_id}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
/** Resolve the Python executable to use for the add-drawer wrapper. */
function resolvePythonCmd() {
    return process.env.OMK_MEMPALACE_PYTHON || 'python';
}
/**
 * Add verbatim content to MemPalace as a new drawer.
 *
 * Uses the MemPalace Python API via a temporary wrapper script because the
 * CLI does not expose a direct "add" command.
 *
 * @param content - Verbatim text to store
 * @param metadata - Wing, room, and optional tags
 */
export async function addToMemPalace(content, metadata) {
    const available = await isMemPalaceAvailable();
    if (!available) {
        console.warn('[MemPalace] not installed — addToMemPalace skipped');
        return;
    }
    const tmpDir = mkdtempSync(join(tmpdir(), 'omk-mempalace-'));
    const scriptPath = join(tmpDir, 'add_drawer.py');
    try {
        writeFileSync(scriptPath, ADD_DRAWER_SCRIPT, 'utf-8');
        const payload = JSON.stringify({
            palace_path: getPalacePath(),
            wing: metadata.wing,
            room: metadata.room,
            content,
            tags: metadata.tags || [],
            source_file: 'omk-bridge',
            added_by: 'omk',
        });
        const result = await new Promise((resolve) => {
            const child = spawn(resolvePythonCmd(), [scriptPath], {
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            let exited = false;
            const timer = setTimeout(() => {
                if (!exited) {
                    child.kill();
                    resolve({
                        stdout,
                        stderr: stderr || 'addToMemPalace timed out',
                        exitCode: null,
                        success: false,
                    });
                }
            }, 30_000);
            child.stdout?.on('data', (chunk) => {
                stdout += chunk.toString('utf-8');
            });
            child.stderr?.on('data', (chunk) => {
                stderr += chunk.toString('utf-8');
            });
            child.on('error', (err) => {
                exited = true;
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr: stderr || err.message,
                    exitCode: null,
                    success: false,
                });
            });
            child.on('exit', (code) => {
                exited = true;
                clearTimeout(timer);
                resolve({
                    stdout,
                    stderr,
                    exitCode: code,
                    success: code === 0,
                });
            });
            child.stdin?.write(payload);
            child.stdin?.end();
        });
        if (!result.success) {
            console.warn('[MemPalace] addToMemPalace failed:', result.stderr || result.stdout);
        }
        else {
            try {
                const parsed = JSON.parse(result.stdout.trim());
                if (!parsed.success) {
                    console.warn('[MemPalace] addToMemPalace failed:', parsed.error);
                }
            }
            catch {
                // Non-JSON stdout is acceptable for idempotent no-ops
            }
        }
    }
    finally {
        rmSync(tmpDir, { recursive: true, force: true });
    }
}
/**
 * Get the current MemPalace status.
 *
 * @returns Structured palace status; empty status if MemPalace is unavailable
 */
export async function getMemPalaceStatus() {
    const available = await isMemPalaceAvailable();
    if (!available) {
        console.warn('[MemPalace] not installed — returning empty status');
        return { totalDrawers: 0, wings: [] };
    }
    const palacePath = getPalacePath();
    const result = await runMemPalace(['status', '--palace', palacePath]);
    return result.success ? parseStatusOutput(result.stdout) || { totalDrawers: 0, wings: [] } : { totalDrawers: 0, wings: [] };
}
/**
 * Load L0 + L1 wake-up context from MemPalace.
 *
 * @returns Wake-up text (identity + essential story); empty string if unavailable
 */
export async function wakeUpMemPalace() {
    const available = await isMemPalaceAvailable();
    if (!available) {
        console.warn('[MemPalace] not installed — wake-up returning empty string');
        return '';
    }
    const palacePath = getPalacePath();
    const result = await runMemPalace(['wake-up', '--palace', palacePath]);
    return result.success ? parseWakeUpOutput(result.stdout) : '';
}
//# sourceMappingURL=bridge.js.map