/**
 * Agent Router
 *
 * Routes tasks to appropriate Agent configurations based on complexity
 * assessment. Uses reasoning_effort and tool restrictions to optimize
 * token consumption.
 */
/**
 * Assess task complexity from the prompt text.
 */
export function assessComplexity(prompt) {
    const lower = prompt.toLowerCase();
    // High complexity indicators
    const highSignals = [
        'architect',
        'design',
        'refactor',
        'restructure',
        'migration',
        'security audit',
        'performance',
        'scale',
        'microservice',
        'distributed',
    ];
    if (highSignals.some((s) => lower.includes(s)))
        return 'high';
    if (prompt.length > 300)
        return 'high';
    // Low complexity indicators
    const lowSignals = [
        'review',
        'check',
        'explain',
        'summarize',
        'find',
        'search',
        'what is',
        'how to',
        'quick',
        'simple',
    ];
    if (lowSignals.some((s) => lower.includes(s)))
        return 'low';
    if (prompt.length < 80)
        return 'low';
    return 'medium';
}
/**
 * Route a task to the optimal Agent configuration.
 */
export function routeTask(prompt) {
    const complexity = assessComplexity(prompt);
    switch (complexity) {
        case 'low':
            return {
                reasoningEffort: 'low',
                maxTokens: 8_000,
                allowedTools: ['read', 'search'],
                maxSteps: 20,
            };
        case 'high':
            return {
                reasoningEffort: 'high',
                maxTokens: 128_000,
                allowedTools: 'all',
                maxSteps: 50,
            };
        case 'medium':
        default:
            return {
                reasoningEffort: 'medium',
                maxTokens: 32_000,
                allowedTools: 'all',
                maxSteps: 30,
            };
    }
}
/**
 * Get a human-readable description of why this route was chosen.
 */
export function explainRoute(prompt, config) {
    const complexity = assessComplexity(prompt);
    return (`Task complexity: ${complexity} → ` +
        `reasoning=${config.reasoningEffort}, ` +
        `maxTokens=${config.maxTokens.toLocaleString()}, ` +
        `tools=${Array.isArray(config.allowedTools) ? config.allowedTools.join('+') : 'all'}, ` +
        `maxSteps=${config.maxSteps}`);
}
//# sourceMappingURL=router.js.map