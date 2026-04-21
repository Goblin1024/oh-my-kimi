/**
 * Tests for Cross-Validation Network
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkCrossValidation,
  getBlockingValidations,
  hasBlockingValidations,
  formatValidationResults,
  CROSS_VALIDATION_RULES,
} from '../cross-validation.js';
import type { Evidence } from '../../evidence/schema.js';

function makeEvidence(
  step: string,
  reviewerAgent?: string,
  linesAdded = 0,
  linesRemoved = 0
): Evidence {
  return {
    skill: 'ralph',
    step,
    phase: 'verifying',
    submittedAt: new Date().toISOString(),
    submitter: 'test',
    evidenceType: 'review_signature',
    exitCode: 0,
    reviewerAgent,
    linesAdded,
    linesRemoved,
  };
}

describe('validation/cross-validation', () => {
  describe('CROSS_VALIDATION_RULES', () => {
    it('has at least 4 built-in rules', () => {
      assert.ok(CROSS_VALIDATION_RULES.length >= 4);
    });

    it('each rule has required fields', () => {
      for (const rule of CROSS_VALIDATION_RULES) {
        assert.ok(rule.name);
        assert.ok(rule.requiresReviewBy.length > 0);
        assert.ok(rule.minReviewerCount > 0);
        assert.ok(rule.evidenceStep);
      }
    });
  });

  describe('checkCrossValidation', () => {
    it('returns all rules with triggered=false when no evidence', () => {
      const results = checkCrossValidation([]);
      assert.equal(results.length, CROSS_VALIDATION_RULES.length);
      // Rules without triggers should show triggered=true but satisfied=false
      // Rules with triggers (security_touch, large_change) should show triggered=false
      const security = results.find((r) => r.rule === 'security_touch');
      assert.ok(security);
      assert.equal(security!.triggered, false);
    });

    it('satisfied when architect_approved evidence exists', () => {
      const evidence = [makeEvidence('architect_approved', 'critic')];
      const results = checkCrossValidation(evidence);
      const arch = results.find((r) => r.rule === 'architect_output');
      assert.ok(arch);
      assert.equal(arch!.satisfied, true);
      assert.equal(arch!.foundReviewers.length, 1);
    });

    it('not satisfied when wrong reviewer submits', () => {
      const evidence = [makeEvidence('architect_approved', 'executor')];
      const results = checkCrossValidation(evidence);
      const arch = results.find((r) => r.rule === 'architect_output');
      assert.ok(arch);
      assert.equal(arch!.satisfied, false);
    });

    it('triggers security_touch for auth files', () => {
      const evidence = [makeEvidence('security_approved', 'security-reviewer')];
      const results = checkCrossValidation(evidence, ['src/auth.ts']);
      const sec = results.find((r) => r.rule === 'security_touch');
      assert.ok(sec);
      assert.equal(sec!.triggered, true);
      assert.equal(sec!.satisfied, true);
    });

    it('does not trigger security_touch for unrelated files', () => {
      const evidence: Evidence[] = [];
      const results = checkCrossValidation(evidence, ['src/utils.ts']);
      const sec = results.find((r) => r.rule === 'security_touch');
      assert.ok(sec);
      assert.equal(sec!.triggered, false);
      assert.equal(sec!.satisfied, true);
    });

    it('triggers large_change for >100 lines', () => {
      const evidence = [makeEvidence('architect_approved', 'architect', 80, 30)];
      const results = checkCrossValidation(evidence);
      const large = results.find((r) => r.rule === 'large_change');
      assert.ok(large);
      assert.equal(large!.triggered, true);
      assert.equal(large!.satisfied, true);
    });

    it('does not trigger large_change for small changes', () => {
      const evidence = [makeEvidence('architect_approved', 'architect', 10, 5)];
      const results = checkCrossValidation(evidence);
      const large = results.find((r) => r.rule === 'large_change');
      assert.ok(large);
      assert.equal(large!.triggered, false);
    });
  });

  describe('getBlockingValidations', () => {
    it('returns empty when all rules satisfied', () => {
      const evidence = [
        makeEvidence('architect_approved', 'critic'),
        makeEvidence('code_reviewed', 'code-reviewer'),
      ];
      const blocking = getBlockingValidations(evidence);
      assert.equal(blocking.length, 0);
    });

    it('returns unsatisfied triggered rules', () => {
      const evidence = [makeEvidence('architect_approved', 'executor')];
      const blocking = getBlockingValidations(evidence);
      assert.ok(blocking.length > 0);
      assert.ok(blocking.some((b) => b.rule === 'architect_output'));
    });
  });

  describe('hasBlockingValidations', () => {
    it('returns false when no blocking rules', () => {
      const evidence = [
        makeEvidence('architect_approved', 'critic'),
        makeEvidence('code_reviewed', 'code-reviewer'),
      ];
      assert.ok(!hasBlockingValidations(evidence));
    });

    it('returns true when a rule is blocking', () => {
      const evidence = [makeEvidence('architect_approved', 'wrong-agent')];
      assert.ok(hasBlockingValidations(evidence));
    });
  });

  describe('formatValidationResults', () => {
    it('formats results as readable text', () => {
      const evidence = [makeEvidence('architect_approved', 'critic')];
      const results = checkCrossValidation(evidence);
      const text = formatValidationResults(results);
      assert.ok(text.includes('architect_output'));
      assert.ok(text.includes('✓') || text.includes('✗') || text.includes('○'));
    });
  });
});
