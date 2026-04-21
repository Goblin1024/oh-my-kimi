/**
 * Cross-Validation Network
 *
 * Enforces the principle: "No agent approves its own work."
 * Critical steps require independent verification by designated reviewers.
 */

import type { Evidence } from '../evidence/schema.js';

export interface CrossValidationRule {
  /** Human-readable rule name */
  name: string;
  /** Agent roles that can satisfy this review */
  requiresReviewBy: string[];
  /** Minimum number of independent reviewers required */
  minReviewerCount: number;
  /** Evidence step name that proves the review happened */
  evidenceStep: string;
  /** Optional trigger function to decide if this rule applies */
  trigger?: (evidence: Evidence, changedFiles?: string[]) => boolean;
}

/** Built-in cross-validation rules */
export const CROSS_VALIDATION_RULES: CrossValidationRule[] = [
  {
    name: 'architect_output',
    requiresReviewBy: ['critic'],
    minReviewerCount: 1,
    evidenceStep: 'architect_approved',
  },
  {
    name: 'implementation',
    requiresReviewBy: ['test-engineer', 'code-reviewer'],
    minReviewerCount: 1,
    evidenceStep: 'code_reviewed',
  },
  {
    name: 'security_touch',
    requiresReviewBy: ['security-reviewer'],
    minReviewerCount: 1,
    evidenceStep: 'security_approved',
    trigger: (_ev, files) =>
      files?.some((f) => /auth|password|token|secret|encrypt/i.test(f)) ?? false,
  },
  {
    name: 'large_change',
    requiresReviewBy: ['architect'],
    minReviewerCount: 1,
    evidenceStep: 'architect_approved',
    trigger: (ev) => (ev.linesAdded ?? 0) + (ev.linesRemoved ?? 0) > 100,
  },
];

export interface ValidationCheckResult {
  rule: string;
  satisfied: boolean;
  requiredReviewers: string[];
  foundReviewers: string[];
  evidenceStep: string;
  triggered: boolean;
  details?: string;
}

/**
 * Check whether all applicable cross-validation rules are satisfied
 * for a given set of evidence.
 *
 * @param evidence - All evidence submitted so far
 * @param changedFiles - Optional list of changed file paths (for file-based triggers)
 * @returns Array of per-rule results
 */
export function checkCrossValidation(
  evidence: Evidence[],
  changedFiles?: string[]
): ValidationCheckResult[] {
  return CROSS_VALIDATION_RULES.map((rule) => {
    const triggered = rule.trigger
      ? rule.trigger(evidence[0] ?? ({} as Evidence), changedFiles)
      : true;

    if (!triggered) {
      return {
        rule: rule.name,
        satisfied: true,
        requiredReviewers: rule.requiresReviewBy,
        foundReviewers: [],
        evidenceStep: rule.evidenceStep,
        triggered: false,
        details: 'Rule not triggered for this change set',
      };
    }

    // Find evidence matching the required step
    const reviewEvidence = evidence.filter((ev) => ev.step === rule.evidenceStep);

    // Extract reviewer agents from the evidence
    const foundReviewers = reviewEvidence
      .map((ev) => ev.reviewerAgent)
      .filter((r): r is string => Boolean(r));

    // Check if any of the found reviewers match the required roles
    const validReviewers = foundReviewers.filter((r) =>
      rule.requiresReviewBy.some((required) => r.toLowerCase().includes(required.toLowerCase()))
    );

    const satisfied = validReviewers.length >= rule.minReviewerCount;

    return {
      rule: rule.name,
      satisfied,
      requiredReviewers: rule.requiresReviewBy,
      foundReviewers: validReviewers,
      evidenceStep: rule.evidenceStep,
      triggered: true,
      details: satisfied
        ? `Approved by ${validReviewers.join(', ')}`
        : `Requires review by ${rule.requiresReviewBy.join(' or ')}; found ${validReviewers.length}/${rule.minReviewerCount}`,
    };
  });
}

/**
 * Return only the rules that are triggered but NOT satisfied.
 */
export function getBlockingValidations(
  evidence: Evidence[],
  changedFiles?: string[]
): ValidationCheckResult[] {
  return checkCrossValidation(evidence, changedFiles).filter((r) => r.triggered && !r.satisfied);
}

/**
 * Check if any cross-validation rule is blocking progression.
 */
export function hasBlockingValidations(evidence: Evidence[], changedFiles?: string[]): boolean {
  return getBlockingValidations(evidence, changedFiles).length > 0;
}

/**
 * Format validation results as a human-readable summary.
 */
export function formatValidationResults(results: ValidationCheckResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    const icon = r.satisfied ? '✓' : r.triggered ? '✗' : '○';
    lines.push(`${icon} ${r.rule}: ${r.details}`);
  }
  return lines.join('\n');
}
