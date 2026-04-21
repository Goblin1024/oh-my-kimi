/**
 * Review Delegator
 *
 * Creates review tasks from cross-validation rules and writes them to
 * the team mailbox so independent agents can pick them up.
 */
import type { Evidence } from '../evidence/schema.js';
import type { CrossValidationRule, ValidationCheckResult } from './cross-validation.js';
export interface ReviewTask {
    id: string;
    rule: string;
    reviewerRole: string;
    originalStep: string;
    originalSubmitter: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    deadline?: string;
}
/**
 * Create review tasks for all blocking validation results.
 */
export declare function createReviewTasks(blockingResults: ValidationCheckResult[], originalEvidence: Evidence): ReviewTask[];
/**
 * Write a review task to the team mailbox.
 */
export declare function delegateReview(mailboxPath: string, task: ReviewTask): void;
/**
 * Check whether a review task has been completed by looking for
 * the expected evidence step in the evidence list.
 */
export declare function isReviewComplete(rule: CrossValidationRule, evidence: Evidence[]): boolean;
/**
 * High-level orchestration: given blocking results, create tasks,
 * check slot availability, and delegate to mailbox.
 *
 * Returns the list of tasks that were actually delegated.
 */
export declare function orchestrateReviews(blockingResults: ValidationCheckResult[], originalEvidence: Evidence, mailboxPath: string, maxSlots?: number): {
    delegated: ReviewTask[];
    queued: ReviewTask[];
};
//# sourceMappingURL=review-delegator.d.ts.map