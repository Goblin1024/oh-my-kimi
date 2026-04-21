/**
 * Tests for Context Pruner
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldPrune,
  generateSummary,
  compressEvidence,
  estimateTokens,
  getPruningRecommendations,
} from '../pruner.js';
import type { Evidence } from '../../evidence/schema.js';

describe('token/pruner', () => {
  describe('shouldPrune', () => {
    it('returns false when usage is below 70%', () => {
      assert.ok(!shouldPrune(50_000, 100_000));
    });

    it('returns true when usage exceeds 70%', () => {
      assert.ok(shouldPrune(71_000, 100_000));
    });

    it('returns false at exactly 70%', () => {
      assert.ok(!shouldPrune(70_000, 100_000));
    });
  });

  describe('generateSummary', () => {
    it('returns short output unchanged', () => {
      const short = 'short output';
      assert.equal(generateSummary(short), short);
    });

    it('summarizes test output with pass/fail counts', () => {
      const testOutput = 'Running tests...\nTest 1 passed\nTest 2 passed\n5 pass\n0 fail\nDone';
      const summary = generateSummary(testOutput);
      assert.ok(summary.includes('passed'));
    });

    it('summarizes build errors', () => {
      const buildOutput = 'Compiling...\nError in file.ts\nAnother error here\nBuild failed';
      const summary = generateSummary(buildOutput);
      assert.ok(summary.includes('error'));
    });

    it('summarizes build success', () => {
      const buildOutput = 'Compiling...\nBuild success\nOutput written';
      const summary = generateSummary(buildOutput);
      assert.ok(summary.includes('success'));
    });

    it('falls back to first and last lines for generic output', () => {
      const generic = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}: ${'x'.repeat(30)}`).join(
        '\n'
      );
      const summary = generateSummary(generic);
      assert.ok(summary.includes('Line 1'));
      assert.ok(summary.includes('Line 10'));
      assert.ok(summary.includes('10 lines'));
    });
  });

  describe('compressEvidence', () => {
    it('returns small evidence unchanged', () => {
      const ev: Evidence = {
        skill: 'test',
        step: 'step1',
        phase: 'phase1',
        submittedAt: new Date().toISOString(),
        submitter: 'test',
        evidenceType: 'command_output',
        exitCode: 0,
        output: 'small output',
      };
      const compressed = compressEvidence(ev);
      assert.equal(compressed.output, 'small output');
      assert.equal(compressed.metadata?.pruned, undefined);
    });

    it('compresses large evidence', () => {
      const largeOutput = 'x'.repeat(6_000);
      const ev: Evidence = {
        skill: 'test',
        step: 'step1',
        phase: 'phase1',
        submittedAt: new Date().toISOString(),
        submitter: 'test',
        evidenceType: 'command_output',
        exitCode: 0,
        output: largeOutput,
      };
      const compressed = compressEvidence(ev);
      assert.ok(compressed.output!.length < largeOutput.length);
      assert.equal(compressed.metadata?.pruned, true);
      assert.ok(compressed.metadata?.originalOutputLength);
      assert.ok(compressed.metadata?.prunedAt);
    });
  });

  describe('estimateTokens', () => {
    it('estimates tokens from character count', () => {
      assert.equal(estimateTokens(''), 0);
      assert.equal(estimateTokens('abcd'), 1);
      assert.equal(estimateTokens('a'.repeat(100)), 25);
    });
  });

  describe('getPruningRecommendations', () => {
    it('returns empty when below prune threshold', () => {
      const evidence: Evidence[] = [];
      const recs = getPruningRecommendations(evidence, 10_000, 100_000);
      assert.equal(recs.length, 0);
    });

    it('recommends pruning large evidence when above threshold', () => {
      const ev: Evidence = {
        skill: 'test',
        step: 'big_step',
        phase: 'phase1',
        submittedAt: new Date().toISOString(),
        submitter: 'test',
        evidenceType: 'command_output',
        exitCode: 0,
        output: 'x'.repeat(6_000),
      };
      const recs = getPruningRecommendations([ev], 80_000, 100_000);
      assert.equal(recs.length, 1);
      assert.equal(recs[0].step, 'big_step');
      assert.ok(recs[0].savings > 0);
      assert.ok(recs[0].recommended);
    });

    it('sorts by savings descending', () => {
      const ev1: Evidence = {
        skill: 'test',
        step: 'small',
        phase: 'phase1',
        submittedAt: new Date().toISOString(),
        submitter: 'test',
        evidenceType: 'command_output',
        exitCode: 0,
        output: 'x'.repeat(6_000),
      };
      const ev2: Evidence = {
        skill: 'test',
        step: 'large',
        phase: 'phase1',
        submittedAt: new Date().toISOString(),
        submitter: 'test',
        evidenceType: 'command_output',
        exitCode: 0,
        output: 'x'.repeat(20_000),
      };
      const recs = getPruningRecommendations([ev1, ev2], 80_000, 100_000);
      assert.equal(recs[0].step, 'large');
      assert.equal(recs[1].step, 'small');
    });
  });
});
