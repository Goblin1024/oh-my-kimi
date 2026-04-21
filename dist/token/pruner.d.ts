/**
 * Context Pruner
 *
 * Compresses large evidence outputs into structured summaries to free up
 * context window space. Helps prevent token exhaustion during long sessions.
 */
import type { Evidence } from '../evidence/schema.js';
/**
 * Check if a given token usage level warrants pruning.
 */
export declare function shouldPrune(sessionTokenUsage: number, budget: number): boolean;
/**
 * Generate a concise summary of command output.
 */
export declare function generateSummary(output: string): string;
/**
 * Compress an evidence record by replacing large outputs with summaries.
 */
export declare function compressEvidence(ev: Evidence): Evidence;
/**
 * Estimate token count from a string.
 * Rough heuristic: ~4 characters per token for English/Chinese mixed text.
 */
export declare function estimateTokens(text: string): number;
/**
 * Get pruning recommendations for a set of evidence.
 */
export declare function getPruningRecommendations(evidence: Evidence[], sessionTokenUsage: number, budget: number): Array<{
    step: string;
    currentSize: number;
    savings: number;
    recommended: boolean;
}>;
//# sourceMappingURL=pruner.d.ts.map