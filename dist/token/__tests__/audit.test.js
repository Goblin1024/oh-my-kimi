/**
 * Tests for Token Audit
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { auditSession, SessionAuditor } from '../audit.js';
describe('token/audit', () => {
    describe('auditSession', () => {
        it('generates a report for a simple session', () => {
            const report = auditSession({
                skill: 'plan',
                prompt: 'create a plan for new feature',
            });
            assert.equal(report.skill, 'plan');
            assert.ok(report.route);
            assert.ok(report.routeExplanation);
            assert.ok(report.budget.default > 0);
            assert.ok(report.budget.adjusted > 0);
            assert.ok(report.evidence);
        });
        it('analyzes evidence token costs', () => {
            const evidence = [
                {
                    skill: 'test',
                    step: 'step1',
                    phase: 'phase1',
                    submittedAt: new Date().toISOString(),
                    submitter: 'test',
                    evidenceType: 'command_output',
                    exitCode: 0,
                    output: 'x'.repeat(10_000),
                },
            ];
            const report = auditSession({
                skill: 'plan',
                prompt: 'review this',
                evidence,
            });
            assert.equal(report.evidence.totalCount, 1);
            assert.ok(report.evidence.totalTokenEstimate > 0);
            assert.equal(report.evidence.prunableCount, 1);
        });
        it('recommends pruning when evidence exceeds threshold', () => {
            const evidence = [
                {
                    skill: 'test',
                    step: 'step1',
                    phase: 'phase1',
                    submittedAt: new Date().toISOString(),
                    submitter: 'test',
                    evidenceType: 'command_output',
                    exitCode: 0,
                    output: 'x'.repeat(30_000),
                },
            ];
            // ecomode has default budget 8K, threshold ~5.6K tokens
            const report = auditSession({
                skill: 'ecomode',
                prompt: 'review this',
                evidence,
            });
            assert.ok(report.recommendations.length > 0);
            assert.ok(report.recommendations.some((r) => r.includes('pruning')), 'should recommend pruning');
        });
        it('adjusts budget for flags', () => {
            const report1 = auditSession({ skill: 'plan', prompt: 'test' });
            const report2 = auditSession({ skill: 'plan', prompt: 'test', flags: ['--eco'] });
            assert.ok(report2.budget.adjusted < report1.budget.adjusted);
        });
    });
    describe('SessionAuditor', () => {
        it('initializes with correct route and budget', () => {
            const auditor = new SessionAuditor('plan', 'review this code');
            const route = auditor.getRoute();
            assert.equal(route.reasoningEffort, 'low');
            const summary = auditor.summary();
            assert.equal(summary.skill, 'plan');
        });
        it('tracks evidence and token consumption', () => {
            const auditor = new SessionAuditor('plan', 'test');
            const ev = {
                skill: 'plan',
                step: 'step1',
                phase: 'phase1',
                submittedAt: new Date().toISOString(),
                submitter: 'test',
                evidenceType: 'command_output',
                exitCode: 0,
                output: 'test output with some content',
            };
            auditor.addEvidence(ev);
            const summary = auditor.summary();
            assert.ok(summary.used > 0);
        });
        it('detects when pruning is needed', () => {
            const auditor = new SessionAuditor('plan', 'test');
            // Add large evidence to push usage high
            const ev = {
                skill: 'plan',
                step: 'step1',
                phase: 'phase1',
                submittedAt: new Date().toISOString(),
                submitter: 'test',
                evidenceType: 'command_output',
                exitCode: 0,
                output: 'x'.repeat(50_000),
            };
            auditor.addEvidence(ev);
            assert.ok(auditor.shouldPrune());
        });
        it('prunes evidence and reclaims tokens', () => {
            const auditor = new SessionAuditor('plan', 'test');
            // Multi-line large output to ensure compression works
            const output = Array.from({ length: 200 }, (_, i) => `Line ${i}: some output content here`).join('\n');
            const ev = {
                skill: 'plan',
                step: 'step1',
                phase: 'phase1',
                submittedAt: new Date().toISOString(),
                submitter: 'test',
                evidenceType: 'command_output',
                exitCode: 0,
                output,
            };
            auditor.addEvidence(ev);
            const before = auditor.summary().used;
            const pruned = auditor.prune();
            const after = auditor.summary().used;
            assert.equal(pruned.length, 1);
            assert.ok(pruned[0].metadata?.pruned);
            assert.ok(after < before, 'should reclaim tokens after pruning');
        });
        it('generates an audit report', () => {
            const auditor = new SessionAuditor('plan', 'test');
            const report = auditor.audit();
            assert.equal(report.skill, 'plan');
            assert.ok(report.budget);
            assert.ok(report.evidence);
        });
        it('caps budget to route maxTokens', () => {
            // autopilot has 128K default but a short prompt routes to low (8K max)
            const auditor = new SessionAuditor('autopilot', 'review');
            const summary = auditor.summary();
            assert.equal(summary.budget, 8_000);
        });
    });
});
//# sourceMappingURL=audit.test.js.map