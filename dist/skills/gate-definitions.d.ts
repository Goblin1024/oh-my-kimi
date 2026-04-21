/**
 * Semantic Gate Definitions
 *
 * Extends the base gate system with semantic analysis gates that detect
 * common anti-patterns in user prompts before workflow activation.
 *
 * New gate types:
 *   - no_shortcut_keywords: detects minimising language ("just", "simply")
 *   - has_verification_plan: requires test/verify intent in prompt
 *   - proper_decomposition: ensures task scope is appropriate
 *   - flag_semantic_check: validates flags match prompt complexity
 */
/** Gate result shared interface */
export interface SemanticGateResult {
    passed: boolean;
    gate: string;
    description: string;
    blocking: boolean;
    details?: string;
}
/**
 * Detect shortcut language that encourages shallow solutions.
 */
export declare function checkShortcutKeywords(prompt: string): SemanticGateResult;
/**
 * Check if the prompt includes intent to verify or test the outcome.
 */
export declare function checkVerificationPlan(prompt: string): SemanticGateResult;
/**
 * Ensure the task is properly decomposed for complex work.
 * Simple tasks (<80 chars, low complexity) always pass.
 * Complex tasks should have multiple steps or sub-tasks indicated.
 */
export declare function checkDecomposition(prompt: string): SemanticGateResult;
/**
 * Validate that flags match the prompt's semantic complexity.
 * E.g., --deliberate on a trivial task is a mismatch.
 */
export declare function checkFlagSemantic(prompt: string, flags: string[], _skill: string): SemanticGateResult;
/**
 * Run all semantic gates against a prompt.
 */
export declare function runSemanticGates(prompt: string, flags?: string[], skill?: string): SemanticGateResult[];
/**
 * Check if any semantic gate is blocking.
 */
export declare function hasBlockingGates(results: SemanticGateResult[]): boolean;
/**
 * Format gate results as a human-readable message.
 */
export declare function formatGateResults(results: SemanticGateResult[]): string;
//# sourceMappingURL=gate-definitions.d.ts.map