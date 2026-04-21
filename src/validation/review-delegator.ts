/**
 * Review Delegator
 *
 * Creates review tasks from cross-validation rules and writes them to
 * the team mailbox so independent agents can pick them up.
 */

import type { Evidence } from '../evidence/schema.js';
import type { CrossValidationRule, ValidationCheckResult } from './cross-validation.js';
import { appendMessage, type MailboxMessage } from '../team/mailbox.js';
import { getMaxRunningTasks } from '../team/slot-manager.js';

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

let reviewCounter = 0;

function generateReviewId(): string {
  reviewCounter++;
  return `review-${Date.now()}-${reviewCounter}`;
}

/**
 * Create review tasks for all blocking validation results.
 */
export function createReviewTasks(
  blockingResults: ValidationCheckResult[],
  originalEvidence: Evidence
): ReviewTask[] {
  const tasks: ReviewTask[] = [];

  for (const result of blockingResults) {
    for (const role of result.requiredReviewers) {
      tasks.push({
        id: generateReviewId(),
        rule: result.rule,
        reviewerRole: role,
        originalStep: originalEvidence.step,
        originalSubmitter: originalEvidence.submitter,
        description:
          `Review ${result.evidenceStep} for ${originalEvidence.step}. ` +
          `Reason: ${result.details}`,
        priority: result.rule.includes('security') ? 'high' : 'medium',
      });
    }
  }

  return tasks;
}

/**
 * Write a review task to the team mailbox.
 */
export function delegateReview(mailboxPath: string, task: ReviewTask): void {
  const message: MailboxMessage = {
    id: task.id,
    from: 'cross-validation',
    to: task.reviewerRole,
    type: 'review_request',
    payload: task,
    timestamp: new Date().toISOString(),
    delivered: false,
  };

  appendMessage(mailboxPath, message);
}

/**
 * Check whether a review task has been completed by looking for
 * the expected evidence step in the evidence list.
 */
export function isReviewComplete(rule: CrossValidationRule, evidence: Evidence[]): boolean {
  const reviewEvidence = evidence.filter((ev) => ev.step === rule.evidenceStep);
  const validReviewers = reviewEvidence
    .map((ev) => ev.reviewerAgent)
    .filter((r): r is string => Boolean(r));

  return validReviewers.length >= rule.minReviewerCount;
}

/**
 * High-level orchestration: given blocking results, create tasks,
 * check slot availability, and delegate to mailbox.
 *
 * Returns the list of tasks that were actually delegated.
 */
export function orchestrateReviews(
  blockingResults: ValidationCheckResult[],
  originalEvidence: Evidence,
  mailboxPath: string,
  maxSlots?: number
): { delegated: ReviewTask[]; queued: ReviewTask[] } {
  const tasks = createReviewTasks(blockingResults, originalEvidence);
  const slots = maxSlots ?? getMaxRunningTasks() ?? 4;

  const delegated: ReviewTask[] = [];
  const queued: ReviewTask[] = [];

  for (const task of tasks) {
    if (delegated.length < slots) {
      delegateReview(mailboxPath, task);
      delegated.push(task);
    } else {
      queued.push(task);
    }
  }

  return { delegated, queued };
}
