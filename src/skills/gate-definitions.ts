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

import { assessComplexity } from '../token/router.js';

/** Gate result shared interface */
export interface SemanticGateResult {
  passed: boolean;
  gate: string;
  description: string;
  blocking: boolean;
  details?: string;
}

// ── Keyword detection ──

const SHORTCUT_KEYWORDS = [
  'just',
  'simply',
  'quick fix',
  'quickly',
  'easy way',
  'hack',
  'workaround',
  'band-aid',
  'patch it',
  'temporary fix',
];

const VERIFICATION_KEYWORDS = [
  'test',
  'verify',
  'validate',
  'check',
  'ensure',
  'confirm',
  'prove',
  'demonstrate',
  'assert',
  'coverage',
];

// ── Gate evaluators ──

/**
 * Detect shortcut language that encourages shallow solutions.
 */
export function checkShortcutKeywords(prompt: string): SemanticGateResult {
  const lower = prompt.toLowerCase();
  const found = SHORTCUT_KEYWORDS.filter((kw) => lower.includes(kw));
  const passed = found.length === 0;

  return {
    passed,
    gate: 'no_shortcut_keywords',
    description: 'Prompt must not contain minimising language that encourages shallow solutions',
    blocking: false, // Warning only — does not block
    details: passed
      ? undefined
      : `Detected shortcut keywords: ${found.join(', ')}. Consider rephrasing for clarity.`,
  };
}

/**
 * Check if the prompt includes intent to verify or test the outcome.
 */
export function checkVerificationPlan(prompt: string): SemanticGateResult {
  const lower = prompt.toLowerCase();
  const found = VERIFICATION_KEYWORDS.filter((kw) => lower.includes(kw));
  const passed = found.length > 0;

  return {
    passed,
    gate: 'has_verification_plan',
    description: 'Prompt should express intent to verify or test the outcome',
    blocking: false,
    details: passed
      ? `Verification intent detected: ${found.join(', ')}`
      : 'No verification intent detected. Consider adding test/validation requirements.',
  };
}

/**
 * Ensure the task is properly decomposed for complex work.
 * Simple tasks (<80 chars, low complexity) always pass.
 * Complex tasks should have multiple steps or sub-tasks indicated.
 */
export function checkDecomposition(prompt: string): SemanticGateResult {
  const complexity = assessComplexity(prompt);

  // Low complexity tasks don't need decomposition
  if (complexity === 'low') {
    return {
      passed: true,
      gate: 'proper_decomposition',
      description: 'Task scope is appropriate for the complexity level',
      blocking: false,
      details: 'Low-complexity task — no decomposition required',
    };
  }

  // High complexity tasks should mention multiple steps/phases/aspects
  const decompositionIndicators = [
    'step',
    'phase',
    'first',
    'then',
    'next',
    'after',
    'before',
    'part',
    'component',
    'module',
    'layer',
    'break down',
    'decompose',
  ];

  const lower = prompt.toLowerCase();
  const found = decompositionIndicators.filter((ind) => lower.includes(ind));
  const passed = found.length >= 2 || prompt.length > 200;

  return {
    passed,
    gate: 'proper_decomposition',
    description: 'Complex tasks should indicate decomposition into steps or components',
    blocking: false,
    details: passed
      ? `Decomposition indicators: ${found.join(', ') || 'implied by length'}`
      : 'Complex task lacks clear decomposition. Consider breaking it into named steps.',
  };
}

/**
 * Validate that flags match the prompt's semantic complexity.
 * E.g., --deliberate on a trivial task is a mismatch.
 */
export function checkFlagSemantic(
  prompt: string,
  flags: string[],
  _skill: string
): SemanticGateResult {
  if (flags.length === 0) {
    return {
      passed: true,
      gate: 'flag_semantic_check',
      description: 'Flags should match the semantic complexity of the task',
      blocking: false,
      details: 'No flags provided — semantic check skipped',
    };
  }

  const complexity = assessComplexity(prompt);
  const issues: string[] = [];

  for (const flag of flags) {
    const lower = flag.toLowerCase();

    // --deliberate on low-complexity tasks
    if (lower === '--deliberate' && complexity === 'low') {
      issues.push(`'--deliberate' on a low-complexity task is inefficient (budget ×4)`);
    }

    // --eco on high-complexity tasks
    if (lower === '--eco' && complexity === 'high') {
      issues.push(`'--eco' on a high-complexity task may cause token exhaustion`);
    }

    // --quick on high-complexity tasks
    if (lower === '--quick' && complexity === 'high') {
      issues.push(`'--quick' on a high-complexity task risks incomplete results`);
    }

    // --verbose on simple tasks
    if (lower === '--verbose' && complexity === 'low') {
      issues.push(`'--verbose' on a simple task wastes tokens (budget ×1.5)`);
    }
  }

  const passed = issues.length === 0;

  return {
    passed,
    gate: 'flag_semantic_check',
    description: 'Flags should match the semantic complexity of the task',
    blocking: false,
    details: passed
      ? `Flags ${flags.join(', ')} match ${complexity} complexity`
      : issues.join('; '),
  };
}

/**
 * Run all semantic gates against a prompt.
 */
export function runSemanticGates(
  prompt: string,
  flags: string[] = [],
  skill: string = ''
): SemanticGateResult[] {
  return [
    checkShortcutKeywords(prompt),
    checkVerificationPlan(prompt),
    checkDecomposition(prompt),
    checkFlagSemantic(prompt, flags, skill),
  ];
}

/**
 * Check if any semantic gate is blocking.
 */
export function hasBlockingGates(results: SemanticGateResult[]): boolean {
  return results.some((r) => !r.passed && r.blocking);
}

/**
 * Format gate results as a human-readable message.
 */
export function formatGateResults(results: SemanticGateResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    const icon = r.passed ? '✓' : r.blocking ? '✗' : '⚠';
    lines.push(`${icon} ${r.gate}: ${r.description}`);
    if (r.details) {
      lines.push(`   → ${r.details}`);
    }
  }
  return lines.join('\n');
}
