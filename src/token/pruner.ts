/**
 * Context Pruner
 *
 * Compresses large evidence outputs into structured summaries to free up
 * context window space. Helps prevent token exhaustion during long sessions.
 */

import type { Evidence } from '../evidence/schema.js';

const PRUNE_THRESHOLD_BYTES = 5_000;

/**
 * Check if a given token usage level warrants pruning.
 */
export function shouldPrune(sessionTokenUsage: number, budget: number): boolean {
  return sessionTokenUsage / budget > 0.7;
}

/**
 * Generate a concise summary of command output.
 */
export function generateSummary(output: string): string {
  if (!output || output.length < 200) return output;

  const lines = output.trim().split('\n');

  // For test output: extract pass/fail count
  const passMatch = output.match(/(\d+)\s+pass/i);
  const failMatch = output.match(/(\d+)\s+fail/i);
  if (passMatch || failMatch) {
    return `Tests: ${passMatch ? passMatch[1] + ' passed' : ''}${failMatch && failMatch[1] !== '0' ? ', ' + failMatch[1] + ' failed' : ''}`;
  }

  // For build output: extract success/failure
  if (output.includes('error') || output.includes('Error')) {
    const errorCount = (output.match(/error/gi) || []).length;
    return `Build: ${errorCount} error(s) found`;
  }
  if (output.includes('success') || output.includes('built')) {
    return 'Build: success';
  }

  // Generic: first and last meaningful lines
  const first = lines.find((l) => l.trim().length > 0) ?? '';
  const last = [...lines].reverse().find((l) => l.trim().length > 0) ?? '';

  // For single-line ultra-long output, truncate with length hint
  if (lines.length === 1 && first.length > 500) {
    return `${first.slice(0, 80)}... [${first.length} chars, truncated]`;
  }

  return `${first.trim()} ... ${last.trim()} (${lines.length} lines)`;
}

/**
 * Compress an evidence record by replacing large outputs with summaries.
 */
export function compressEvidence(ev: Evidence): Evidence {
  if (!ev.output || ev.output.length < PRUNE_THRESHOLD_BYTES) {
    return ev;
  }

  const summary = generateSummary(ev.output);
  return {
    ...ev,
    output: summary,
    metadata: {
      ...ev.metadata,
      originalOutputLength: ev.output.length,
      pruned: true,
      prunedAt: new Date().toISOString(),
    },
  };
}

/**
 * Estimate token count from a string.
 * Rough heuristic: ~4 characters per token for English/Chinese mixed text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get pruning recommendations for a set of evidence.
 */
export function getPruningRecommendations(
  evidence: Evidence[],
  sessionTokenUsage: number,
  budget: number
): Array<{ step: string; currentSize: number; savings: number; recommended: boolean }> {
  if (!shouldPrune(sessionTokenUsage, budget)) {
    return [];
  }

  return evidence
    .filter((ev) => ev.output && ev.output.length > PRUNE_THRESHOLD_BYTES)
    .map((ev) => {
      const summary = generateSummary(ev.output!);
      const savings = estimateTokens(ev.output!) - estimateTokens(summary);
      return {
        step: ev.step,
        currentSize: ev.output!.length,
        savings,
        recommended: savings > 100,
      };
    })
    .sort((a, b) => b.savings - a.savings);
}
