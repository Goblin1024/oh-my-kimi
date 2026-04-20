/**
 * Agents Overlay Injector
 *
 * Dynamically resolves the agent role prompt for a given active skill.
 * This ensures that Kimi always receives its operating principles
 * upon session start without hardcoding them into the project workspace.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Get the root of the oh-my-kimi package
function getPackageRoot() {
    // If we are in dist/hooks, root is ../..
    // If we are in src/hooks, root is ../..
    return join(__dirname, '..', '..');
}
/**
 * Maps a skill name to an agent role prompt file.
 */
export function resolveAgentForSkill(skill) {
    const mapping = {
        architect: 'architect.md',
        ralplan: 'architect.md',
        executor: 'executor.md',
        ralph: 'executor.md',
        debugger: 'debugger.md',
        'build-fix': 'debugger.md',
        'code-reviewer': 'code-reviewer.md',
        'code-review': 'code-reviewer.md',
        'qa-tester': 'qa-tester.md',
        'security-reviewer': 'security-reviewer.md',
        planner: 'planner.md',
        plan: 'planner.md',
        'deep-interview': 'planner.md',
        explorer: 'explorer.md',
        analyze: 'explorer.md',
        writer: 'writer.md',
        verifier: 'verifier.md',
        team: 'architect.md',
    };
    return mapping[skill] || 'executor.md'; // Default to executor if unknown
}
/**
 * Loads the prompt text for a specific agent role.
 */
export function loadAgentPrompt(promptFile) {
    // Try package root first (where it lives locally or when installed globally)
    const rootDir = getPackageRoot();
    const promptPath = join(rootDir, 'prompts', promptFile);
    if (existsSync(promptPath)) {
        return readFileSync(promptPath, 'utf-8');
    }
    return null;
}
/**
 * Generates the overlay text to inject for the active skill.
 */
export function injectOverlay(skill) {
    const promptFile = resolveAgentForSkill(skill);
    const promptText = loadAgentPrompt(promptFile);
    if (!promptText) {
        return `[OMK: Missing prompt for role mapped to '${skill}']`;
    }
    return `
---
[OMK DYNAMIC CONTEXT: RUNTIME OVERLAY]
Skill Activated: ${skill}

${promptText}
---
`;
}
//# sourceMappingURL=agents-overlay.js.map