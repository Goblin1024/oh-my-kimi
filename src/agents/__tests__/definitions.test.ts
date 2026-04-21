/**
 * Tests for Agent Definitions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_DEFINITIONS } from '../definitions.js';

describe('agents/definitions', () => {
  it('exports AGENT_DEFINITIONS with core agents', () => {
    assert.ok(AGENT_DEFINITIONS['architect']);
    assert.ok(AGENT_DEFINITIONS['executor']);
    assert.ok(AGENT_DEFINITIONS['debugger']);
    assert.ok(AGENT_DEFINITIONS['code-reviewer']);
    assert.ok(AGENT_DEFINITIONS['qa-tester']);
    assert.ok(AGENT_DEFINITIONS['security-reviewer']);
    assert.ok(AGENT_DEFINITIONS['planner']);
    assert.ok(AGENT_DEFINITIONS['writer']);
    assert.ok(AGENT_DEFINITIONS['verifier']);
    assert.ok(AGENT_DEFINITIONS['analyst']);
  });

  it('each agent has required fields', () => {
    for (const [key, def] of Object.entries(AGENT_DEFINITIONS)) {
      assert.equal(typeof def.name, 'string', `${key} should have name`);
      assert.equal(typeof def.description, 'string', `${key} should have description`);
      assert.ok(
        ['low', 'medium', 'high'].includes(def.reasoningEffort),
        `${key} should have valid reasoningEffort`
      );
      assert.ok(
        ['frontier', 'standard', 'fast'].includes(def.modelClass),
        `${key} should have valid modelClass`
      );
    }
  });

  it('each agent has token budget configuration', () => {
    for (const [key, def] of Object.entries(AGENT_DEFINITIONS)) {
      assert.ok(
        typeof def.tokenBudget === 'number' && def.tokenBudget > 0,
        `${key} should have a positive tokenBudget`
      );
      assert.ok(
        typeof def.maxSteps === 'number' && def.maxSteps > 0,
        `${key} should have a positive maxSteps`
      );
      assert.ok(def.allowedTools !== undefined, `${key} should have allowedTools`);
    }
  });

  it('has expected agent configurations', () => {
    const sr = AGENT_DEFINITIONS['style-reviewer'];
    assert.equal(sr.tokenBudget, 8_000);
    assert.equal(sr.maxSteps, 15);
    assert.deepEqual(sr.allowedTools, ['read']);

    const arch = AGENT_DEFINITIONS['architect'];
    assert.equal(arch.tokenBudget, 128_000);
    assert.equal(arch.maxSteps, 50);
  });
});
