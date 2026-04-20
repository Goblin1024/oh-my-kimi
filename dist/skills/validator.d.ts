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
import { GateType } from './parser.js';
export interface FlagValidationResult {
    valid: boolean;
    unknownFlags: string[];
    message?: string;
}
export interface GateCheckResult {
    passed: boolean;
    gate: GateType;
    description: string;
    blocking: boolean;
}
/**
 * Validate flags extracted from the user prompt against the manifest.
 *
 * Example: `$ralplan --deliberate --unknown` → unknownFlags: ['--unknown']
 */
export declare function validateFlags(skillName: string, rawArgs: string, cwd?: string): FlagValidationResult;
/**
 * Run all gates defined in the manifest against the current prompt + context.
 *
 * Returns an array of gate results. The caller decides how to handle failures
 * (e.g., block activation, warn, or pass through).
 */
export declare function checkGates(skillName: string, prompt: string, cwd?: string): GateCheckResult[];
//# sourceMappingURL=validator.d.ts.map