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
export declare const CROSS_VALIDATION_RULES: CrossValidationRule[];
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
export declare function checkCrossValidation(evidence: Evidence[], changedFiles?: string[]): ValidationCheckResult[];
/**
 * Return only the rules that are triggered but NOT satisfied.
 */
export declare function getBlockingValidations(evidence: Evidence[], changedFiles?: string[]): ValidationCheckResult[];
/**
 * Check if any cross-validation rule is blocking progression.
 */
export declare function hasBlockingValidations(evidence: Evidence[], changedFiles?: string[]): boolean;
/**
 * Format validation results as a human-readable summary.
 */
export declare function formatValidationResults(results: ValidationCheckResult[]): string;
//# sourceMappingURL=cross-validation.d.ts.map