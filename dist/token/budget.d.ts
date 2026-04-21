/**
 * Token Budget Tracker
 *
 * Tracks token consumption per skill session and enforces budget limits.
 * Provides efficiency scoring to help optimize token usage over time.
 */
export interface BudgetConfig {
    /** Total token budget for this skill session */
    budget: number;
    /** Warning threshold (default: 80% of budget) */
    warningThreshold: number;
    /** Critical threshold (default: 95% of budget) */
    criticalThreshold: number;
}
/**
 * Determine the default token budget for a skill.
 */
export declare function getDefaultBudget(skill: string, flags?: string[]): number;
/**
 * Token budget tracker for a single skill session.
 */
export declare class TokenBudget {
    private skill;
    private budget;
    private used;
    private warningThreshold;
    private criticalThreshold;
    private startTime;
    constructor(skill: string, budget: number);
    /**
     * Record token consumption (positive) or reclaim tokens (negative).
     */
    consume(tokens: number): void;
    /**
     * Remaining tokens.
     */
    remaining(): number;
    /**
     * Whether the budget has been exceeded.
     */
    isExceeded(): boolean;
    /**
     * Check current status against thresholds.
     * Returns: 'ok' | 'warning' | 'critical' | 'exceeded'
     */
    status(): 'ok' | 'warning' | 'critical' | 'exceeded';
    /**
     * Get efficiency score (0-100).
     * Higher is better. Based on remaining budget ratio and time.
     */
    getEfficiencyScore(): number;
    /**
     * Get a summary object for logging/auditing.
     */
    getSummary(): {
        skill: string;
        budget: number;
        used: number;
        remaining: number;
        status: string;
        efficiency: number;
    };
}
//# sourceMappingURL=budget.d.ts.map