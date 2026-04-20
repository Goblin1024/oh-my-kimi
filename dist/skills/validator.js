/**
 * Skill Validator
 *
 * Provides two code-enforced constraint functions:
 *
 *  - validateFlags(skillName, args): checks that the flags provided in the
 *    user's prompt are declared in the SKILL.md manifest.
 *
 *  - checkGates(skillName, prompt, cwd): evaluates the gate predicates defined
 *    in the manifest and returns any failures, so the hook handler can decide
 *    whether to block activation.
 *
 * This replaces pure "LLM self-discipline" with actual code constraints.
 */
import { loadSkillManifest } from './parser.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
/**
 * Validate flags extracted from the user prompt against the manifest.
 *
 * Example: `$ralplan --deliberate --unknown` → unknownFlags: ['--unknown']
 */
export function validateFlags(skillName, rawArgs, cwd) {
    const manifest = loadSkillManifest(skillName, cwd);
    // Extract flags (tokens starting with --)
    const providedFlags = rawArgs.match(/--[a-z-]+/gi) ?? [];
    if (providedFlags.length === 0 || !manifest || manifest.flags.length === 0) {
        return { valid: true, unknownFlags: [] };
    }
    const knownFlagNames = new Set(manifest.flags.map((f) => f.name.toLowerCase()));
    const unknownFlags = providedFlags.filter((f) => !knownFlagNames.has(f.toLowerCase()));
    if (unknownFlags.length > 0) {
        const known = manifest.flags.map((f) => f.name).join(', ');
        return {
            valid: false,
            unknownFlags,
            message: `Unknown flag(s) for $${skillName}: ${unknownFlags.join(', ')}. Known flags: ${known}`,
        };
    }
    return { valid: true, unknownFlags: [] };
}
/**
 * Run all gates defined in the manifest against the current prompt + context.
 *
 * Returns an array of gate results. The caller decides how to handle failures
 * (e.g., block activation, warn, or pass through).
 */
export function checkGates(skillName, prompt, cwd) {
    const manifest = loadSkillManifest(skillName, cwd);
    if (!manifest || manifest.gates.length === 0)
        return [];
    const workDir = cwd ?? process.cwd();
    return manifest.gates.map((gate) => evaluateGate(gate.type, gate.description, gate.blocking ?? true, prompt, workDir, gate.pattern));
}
function evaluateGate(type, description, blocking, prompt, cwd, pattern) {
    switch (type) {
        case 'prompt_specificity': {
            // Gate: the prompt must provide more than a bare keyword trigger
            const withoutCmd = prompt.replace(/\$[a-z-]+\s*/i, '').trim();
            const passed = withoutCmd.length >= 10;
            return { passed, gate: type, description, blocking };
        }
        case 'has_active_plan': {
            // Gate: an approved plan must exist in .omk/plans/
            const plansDir = join(cwd, '.omk', 'plans');
            const passed = existsSync(plansDir);
            return { passed, gate: type, description, blocking };
        }
        case 'workflow_not_active': {
            // Gate: no other workflow should be active right now
            const stateFile = join(cwd, '.omk', 'state', 'skill-active.json');
            if (!existsSync(stateFile))
                return { passed: true, gate: type, description, blocking };
            try {
                const state = JSON.parse(readFileSync(stateFile, 'utf-8'));
                return { passed: !state?.active, gate: type, description, blocking };
            }
            catch {
                return { passed: true, gate: type, description, blocking };
            }
        }
        case 'custom': {
            if (!pattern)
                return { passed: true, gate: type, description, blocking };
            try {
                const regex = new RegExp(pattern, 'i');
                return { passed: regex.test(prompt), gate: type, description, blocking };
            }
            catch {
                // Invalid regex — treat as passed to avoid false blocks
                return { passed: true, gate: type, description, blocking };
            }
        }
        default:
            return { passed: true, gate: type, description, blocking };
    }
}
//# sourceMappingURL=validator.js.map