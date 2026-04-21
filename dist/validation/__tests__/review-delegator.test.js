/**
 * Tests for Review Delegator
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createReviewTasks, delegateReview, isReviewComplete, orchestrateReviews, } from '../review-delegator.js';
import { readMessages } from '../../team/mailbox.js';
describe('validation/review-delegator', () => {
    let testDir;
    let mailboxPath;
    beforeEach(() => {
        testDir = join(tmpdir(), `omk-review-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        mkdirSync(testDir, { recursive: true });
        mailboxPath = join(testDir, 'mailbox.jsonl');
    });
    afterEach(() => {
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });
    function makeEvidence(step, reviewerAgent) {
        return {
            skill: 'ralph',
            step,
            phase: 'verifying',
            submittedAt: new Date().toISOString(),
            submitter: 'test',
            evidenceType: 'review_signature',
            exitCode: 0,
            reviewerAgent,
        };
    }
    describe('createReviewTasks', () => {
        it('creates tasks for blocking results', () => {
            const blocking = [
                {
                    rule: 'architect_output',
                    satisfied: false,
                    requiredReviewers: ['critic'],
                    foundReviewers: [],
                    evidenceStep: 'architect_approved',
                    triggered: true,
                },
            ];
            const original = makeEvidence('design_doc');
            const tasks = createReviewTasks(blocking, original);
            assert.equal(tasks.length, 1);
            assert.equal(tasks[0].reviewerRole, 'critic');
            assert.equal(tasks[0].originalStep, 'design_doc');
            assert.ok(tasks[0].id.startsWith('review-'));
        });
        it('creates multiple tasks for multiple required reviewers', () => {
            const blocking = [
                {
                    rule: 'implementation',
                    satisfied: false,
                    requiredReviewers: ['test-engineer', 'code-reviewer'],
                    foundReviewers: [],
                    evidenceStep: 'code_reviewed',
                    triggered: true,
                },
            ];
            const tasks = createReviewTasks(blocking, makeEvidence('impl'));
            assert.equal(tasks.length, 2);
        });
        it('marks security reviews as high priority', () => {
            const blocking = [
                {
                    rule: 'security_touch',
                    satisfied: false,
                    requiredReviewers: ['security-reviewer'],
                    foundReviewers: [],
                    evidenceStep: 'security_approved',
                    triggered: true,
                },
            ];
            const tasks = createReviewTasks(blocking, makeEvidence('auth'));
            assert.equal(tasks[0].priority, 'high');
        });
    });
    describe('delegateReview', () => {
        it('writes a review task to the mailbox', () => {
            const task = {
                id: 'review-1',
                rule: 'architect_output',
                reviewerRole: 'critic',
                originalStep: 'design',
                originalSubmitter: 'test',
                description: 'Please review',
                priority: 'medium',
            };
            delegateReview(mailboxPath, task);
            const messages = readMessages(mailboxPath);
            assert.equal(messages.length, 1);
            assert.equal(messages[0].type, 'review_request');
            assert.equal(messages[0].to, 'critic');
        });
    });
    describe('isReviewComplete', () => {
        it('returns true when enough reviewer evidence exists', () => {
            const evidence = [makeEvidence('architect_approved', 'critic')];
            const complete = isReviewComplete({
                name: 'architect_output',
                requiresReviewBy: ['critic'],
                minReviewerCount: 1,
                evidenceStep: 'architect_approved',
            }, evidence);
            assert.equal(complete, true);
        });
        it('returns false when no review evidence', () => {
            const complete = isReviewComplete({
                name: 'architect_output',
                requiresReviewBy: ['critic'],
                minReviewerCount: 1,
                evidenceStep: 'architect_approved',
            }, []);
            assert.equal(complete, false);
        });
    });
    describe('orchestrateReviews', () => {
        it('delegates tasks within slot limits', () => {
            const blocking = [
                {
                    rule: 'implementation',
                    satisfied: false,
                    requiredReviewers: ['test-engineer', 'code-reviewer', 'security-reviewer'],
                    foundReviewers: [],
                    evidenceStep: 'code_reviewed',
                    triggered: true,
                },
            ];
            const { delegated, queued } = orchestrateReviews(blocking, makeEvidence('impl'), mailboxPath, 2);
            assert.equal(delegated.length, 2);
            assert.equal(queued.length, 1);
        });
        it('delegates all tasks when slots are unlimited', () => {
            const blocking = [
                {
                    rule: 'architect_output',
                    satisfied: false,
                    requiredReviewers: ['critic'],
                    foundReviewers: [],
                    evidenceStep: 'architect_approved',
                    triggered: true,
                },
            ];
            const { delegated, queued } = orchestrateReviews(blocking, makeEvidence('design'), mailboxPath, 10);
            assert.equal(queued.length, 0);
            assert.equal(delegated.length, 1);
        });
    });
});
//# sourceMappingURL=review-delegator.test.js.map