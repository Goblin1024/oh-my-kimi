/**
 * Tests for Semantic Gate Definitions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkShortcutKeywords,
  checkVerificationPlan,
  checkDecomposition,
  checkFlagSemantic,
  runSemanticGates,
  hasBlockingGates,
  formatGateResults,
} from '../gate-definitions.js';

describe('skills/gate-definitions', () => {
  describe('checkShortcutKeywords', () => {
    it('passes when no shortcut keywords are present', () => {
      const result = checkShortcutKeywords('Implement a user authentication module with tests');
      assert.equal(result.passed, true);
      assert.equal(result.gate, 'no_shortcut_keywords');
    });

    it('fails when shortcut keywords are present', () => {
      const result = checkShortcutKeywords('Just fix this quickly with a workaround');
      assert.equal(result.passed, false);
      assert.ok(result.details?.includes('just'));
    });

    it('is non-blocking', () => {
      const result = checkShortcutKeywords('Just do it');
      assert.equal(result.blocking, false);
    });
  });

  describe('checkVerificationPlan', () => {
    it('passes when verification keywords are present', () => {
      const result = checkVerificationPlan('Implement auth and write tests to verify');
      assert.equal(result.passed, true);
      assert.ok(result.details?.includes('test'));
    });

    it('fails when no verification intent is found', () => {
      const result = checkVerificationPlan('Implement the auth module');
      assert.equal(result.passed, false);
    });

    it('is non-blocking', () => {
      const result = checkVerificationPlan('Do something');
      assert.equal(result.blocking, false);
    });
  });

  describe('checkDecomposition', () => {
    it('passes for low-complexity tasks without decomposition', () => {
      const result = checkDecomposition('Review this file');
      assert.equal(result.passed, true);
      assert.ok(result.details?.includes('Low-complexity'));
    });

    it('passes for complex tasks with decomposition indicators', () => {
      const result = checkDecomposition(
        'First refactor the database layer, then update the API, and finally write tests'
      );
      assert.equal(result.passed, true);
    });

    it('fails for complex tasks without clear decomposition', () => {
      const result = checkDecomposition(
        'Design a complete microservices architecture from scratch'
      );
      assert.equal(result.passed, false);
      assert.ok(result.details?.includes('decomposition'));
    });
  });

  describe('checkFlagSemantic', () => {
    it('passes when no flags are provided', () => {
      const result = checkFlagSemantic('Implement auth', [], 'ralph');
      assert.equal(result.passed, true);
    });

    it('warns about --deliberate on simple tasks', () => {
      const result = checkFlagSemantic('Review this', ['--deliberate'], 'ralph');
      assert.equal(result.passed, false);
      assert.ok(result.details?.includes('deliberate'));
    });

    it('warns about --eco on complex tasks', () => {
      const result = checkFlagSemantic(
        'Design distributed system architecture',
        ['--eco'],
        'ralph'
      );
      assert.equal(result.passed, false);
      assert.ok(result.details?.includes('eco'));
    });

    it('passes when flags match complexity', () => {
      const result = checkFlagSemantic(
        'Design distributed system architecture',
        ['--deliberate'],
        'ralph'
      );
      assert.equal(result.passed, true);
    });
  });

  describe('runSemanticGates', () => {
    it('runs all gates and returns results', () => {
      const results = runSemanticGates('Just implement auth', ['--eco'], 'ralph');
      assert.equal(results.length, 4);
      assert.ok(results.some((r) => r.gate === 'no_shortcut_keywords'));
      assert.ok(results.some((r) => r.gate === 'has_verification_plan'));
      assert.ok(results.some((r) => r.gate === 'proper_decomposition'));
      assert.ok(results.some((r) => r.gate === 'flag_semantic_check'));
    });
  });

  describe('hasBlockingGates', () => {
    it('returns false when all gates pass', () => {
      const results = runSemanticGates('Implement auth with tests and verify coverage');
      assert.equal(hasBlockingGates(results), false);
    });

    it('returns false when only non-blocking gates fail', () => {
      const results = runSemanticGates('Just do it');
      assert.equal(hasBlockingGates(results), false);
    });
  });

  describe('formatGateResults', () => {
    it('formats results as readable text', () => {
      const results = runSemanticGates('Just do it');
      const text = formatGateResults(results);
      assert.ok(text.includes('no_shortcut_keywords'));
      assert.ok(text.includes('has_verification_plan'));
    });
  });
});
