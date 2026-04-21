/**
 * Agent Router
 *
 * Routes tasks to appropriate Agent configurations based on complexity
 * assessment. Uses reasoning_effort and tool restrictions to optimize
 * token consumption.
 */
export interface AgentConfig {
    /** reasoning_effort for Kimi Agent TOML */
    reasoningEffort: 'low' | 'medium' | 'high';
    /** Max tokens to allocate */
    maxTokens: number;
    /** Allowed tool categories */
    allowedTools: string[] | 'all';
    /** Max steps for this agent */
    maxSteps: number;
}
/**
 * Assess task complexity from the prompt text.
 */
export declare function assessComplexity(prompt: string): 'low' | 'medium' | 'high';
/**
 * Route a task to the optimal Agent configuration.
 */
export declare function routeTask(prompt: string): AgentConfig;
/**
 * Get a human-readable description of why this route was chosen.
 */
export declare function explainRoute(prompt: string, config: AgentConfig): string;
//# sourceMappingURL=router.d.ts.map