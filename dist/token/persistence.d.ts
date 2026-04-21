/**
 * Token State Persistence
 *
 * Saves and loads token budget snapshots to/from disk so the HUD and
 * other tools can observe token usage without recalculating from evidence.
 */
export interface TokenStateSnapshot {
    skill: string;
    budget: number;
    used: number;
    remaining: number;
    status: string;
    efficiency: number;
    route: {
        reasoningEffort: string;
        maxTokens: number;
        maxSteps: number;
    };
    timestamp: string;
}
/**
 * Save a token state snapshot to disk.
 */
export declare function saveTokenState(snapshot: TokenStateSnapshot, cwd?: string): void;
/**
 * Load the most recent token state snapshot for a skill.
 */
export declare function loadTokenState(skill: string, cwd?: string): TokenStateSnapshot | null;
/**
 * Delete a token state snapshot.
 */
export declare function clearTokenState(skill: string, cwd?: string): void;
//# sourceMappingURL=persistence.d.ts.map