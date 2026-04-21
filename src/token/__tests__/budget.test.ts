/**
 * Tests for Token Budget Tracker
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultBudget, TokenBudget } from '../budget.js';

describe('token/budget', () => {
  describe('getDefaultBudget', () => {
    it('returns default budget for known skills', () => {
      assert.equal(getDefaultBudget('plan'), 16_000);
      assert.equal(getDefaultBudget('ralph'), 32_000);
      assert.equal(getDefaultBudget('autopilot'), 128_000);
    });

    it('returns 32K for unknown skills', () => {
      assert.equal(getDefaultBudget('unknown-skill'), 32_000);
    });

    it('applies flag multipliers', () => {
      const base = getDefaultBudget('plan');
      assert.equal(getDefaultBudget('plan', ['--quick']), Math.round(base * 0.5));
      assert.equal(getDefaultBudget('plan', ['--eco']), Math.round(base * 0.25));
    });

    it('stacks multiple flags', () => {
      const base = getDefaultBudget('plan');
      assert.equal(getDefaultBudget('plan', ['--quick', '--eco']), Math.round(base * 0.5 * 0.25));
    });

    it('ignores unknown flags', () => {
      const base = getDefaultBudget('plan');
      assert.equal(getDefaultBudget('plan', ['--unknown']), base);
    });
  });

  describe('TokenBudget', () => {
    it('tracks consumption', () => {
      const budget = new TokenBudget('test', 10_000);
      assert.equal(budget.remaining(), 10_000);

      budget.consume(3_000);
      assert.equal(budget.remaining(), 7_000);

      budget.consume(5_000);
      assert.equal(budget.remaining(), 2_000);
    });

    it('does not go negative on remaining', () => {
      const budget = new TokenBudget('test', 1_000);
      budget.consume(5_000);
      assert.equal(budget.remaining(), 0);
    });

    it('detects exceeded budget', () => {
      const budget = new TokenBudget('test', 1_000);
      assert.ok(!budget.isExceeded());

      budget.consume(1_001);
      assert.ok(budget.isExceeded());
    });

    it('reports ok status below warning threshold', () => {
      const budget = new TokenBudget('test', 10_000);
      budget.consume(7_000); // 70%, below 80% warning
      assert.equal(budget.status(), 'ok');
    });

    it('reports warning status at warning threshold', () => {
      const budget = new TokenBudget('test', 10_000);
      budget.consume(8_000); // exactly 80%
      assert.equal(budget.status(), 'warning');
    });

    it('reports critical status at critical threshold', () => {
      const budget = new TokenBudget('test', 10_000);
      budget.consume(9_500); // exactly 95%
      assert.equal(budget.status(), 'critical');
    });

    it('reports exceeded status', () => {
      const budget = new TokenBudget('test', 10_000);
      budget.consume(10_001);
      assert.equal(budget.status(), 'exceeded');
    });

    it('returns a summary object', () => {
      const budget = new TokenBudget('test', 10_000);
      budget.consume(2_000);
      const summary = budget.getSummary();

      assert.equal(summary.skill, 'test');
      assert.equal(summary.budget, 10_000);
      assert.equal(summary.used, 2_000);
      assert.equal(summary.remaining, 8_000);
      assert.equal(summary.status, 'ok');
      assert.ok(typeof summary.efficiency === 'number');
    });

    it('efficiency score decreases with consumption', () => {
      const budget = new TokenBudget('test', 10_000);
      const score1 = budget.getEfficiencyScore();
      budget.consume(5_000);
      const score2 = budget.getEfficiencyScore();
      assert.ok(score2 < score1, 'efficiency should decrease as tokens are consumed');
    });
  });
});
