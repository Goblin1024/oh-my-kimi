/**
 * Review Delegator
 *
 * Creates review tasks from cross-validation rules and writes them to
 * the team mailbox so independent agents can pick them up.
 */
import { appendMessage } from '../team/mailbox.js';
import { getMaxRunningTasks } from '../team/slot-manager.js';
let reviewCounter = 0;
function generateReviewId() {
    reviewCounter++;
    return `review-${Date.now()}-${reviewCounter}`;
}
/**
 * Create review tasks for all blocking validation results.
 */
export function createReviewTasks(blockingResults, originalEvidence) {
    const tasks = [];
    for (const result of blockingResults) {
        for (const role of result.requiredReviewers) {
            tasks.push({
                id: generateReviewId(),
                rule: result.rule,
                reviewerRole: role,
                originalStep: originalEvidence.step,
                originalSubmitter: originalEvidence.submitter,
                description: `Review ${result.evidenceStep} for ${originalEvidence.step}. ` +
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
export function delegateReview(mailboxPath, task) {
    const message = {
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
export function isReviewComplete(rule, evidence) {
    const reviewEvidence = evidence.filter((ev) => ev.step === rule.evidenceStep);
    const validReviewers = reviewEvidence
        .map((ev) => ev.reviewerAgent)
        .filter((r) => Boolean(r));
    return validReviewers.length >= rule.minReviewerCount;
}
/**
 * High-level orchestration: given blocking results, create tasks,
 * check slot availability, and delegate to mailbox.
 *
 * Returns the list of tasks that were actually delegated.
 */
export function orchestrateReviews(blockingResults, originalEvidence, mailboxPath, maxSlots) {
    const tasks = createReviewTasks(blockingResults, originalEvidence);
    const slots = maxSlots ?? getMaxRunningTasks() ?? 4;
    const delegated = [];
    const queued = [];
    for (const task of tasks) {
        if (delegated.length < slots) {
            delegateReview(mailboxPath, task);
            delegated.push(task);
        }
        else {
            queued.push(task);
        }
    }
    return { delegated, queued };
}
//# sourceMappingURL=review-delegator.js.map