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
export function assessComplexity(prompt: string): 'low' | 'medium' | 'high' {
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
  if (highSignals.some((s) => lower.includes(s))) return 'high';
  if (prompt.length > 300) return 'high';

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
  if (lowSignals.some((s) => lower.includes(s))) return 'low';
  if (prompt.length < 80) return 'low';

  return 'medium';
}

/**
 * Route a task to the optimal Agent configuration.
 */
export function routeTask(prompt: string): AgentConfig {
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
export function explainRoute(prompt: string, config: AgentConfig): string {
  const complexity = assessComplexity(prompt);
  return (
    `Task complexity: ${complexity} → ` +
    `reasoning=${config.reasoningEffort}, ` +
    `maxTokens=${config.maxTokens.toLocaleString()}, ` +
    `tools=${Array.isArray(config.allowedTools) ? config.allowedTools.join('+') : 'all'}, ` +
    `maxSteps=${config.maxSteps}`
  );
}
