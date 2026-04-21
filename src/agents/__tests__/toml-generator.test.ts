/**
 * Tests for Agent TOML Generator
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSystemPrompt,
  generateAgentTOML,
  generateAllAgentTOMLs,
  previewAgentTOMLs,
} from '../toml-generator.js';
import { AGENT_DEFINITIONS } from '../definitions.js';

describe('agents/toml-generator', () => {
  describe('generateSystemPrompt', () => {
    it('includes agent name and description', () => {
      const def = AGENT_DEFINITIONS['architect'];
      const prompt = generateSystemPrompt(def);
      assert.ok(prompt.includes('Architect'));
      assert.ok(prompt.includes(def.description));
    });

    it('includes OMK configuration block', () => {
      const def = AGENT_DEFINITIONS['executor'];
      const prompt = generateSystemPrompt(def);
      assert.ok(prompt.includes('Token Budget:'));
      assert.ok(prompt.includes('Max Steps:'));
      assert.ok(prompt.includes('Allowed Tools:'));
    });
  });

  describe('generateAgentTOML', () => {
    it('generates valid TOML structure', () => {
      const def = AGENT_DEFINITIONS['planner'];
      const toml = generateAgentTOML(def);

      assert.ok(toml.includes('name = "planner"'));
      assert.ok(toml.includes('[model]'));
      assert.ok(toml.includes('reasoning_effort'));
      assert.ok(toml.includes('[prompt]'));
      assert.ok(toml.includes('system = """'));
    });

    it('includes OMK metadata comments', () => {
      const def = AGENT_DEFINITIONS['style-reviewer'];
      const toml = generateAgentTOML(def);

      assert.ok(toml.includes('# omk:tokenBudget'));
      assert.ok(toml.includes('# omk:maxSteps'));
      assert.ok(toml.includes('# omk:allowedTools'));
    });

    it('handles agents with all tools allowed', () => {
      const def = AGENT_DEFINITIONS['architect'];
      const toml = generateAgentTOML(def);
      assert.ok(toml.includes('omk:allowedTools = "all"'));
    });

    it('handles agents with restricted tools', () => {
      const def = AGENT_DEFINITIONS['style-reviewer'];
      const toml = generateAgentTOML(def);
      assert.ok(toml.includes('read'));
    });
  });

  describe('generateAllAgentTOMLs', () => {
    it('generates TOML for all registered agents', () => {
      const all = generateAllAgentTOMLs();
      const keys = Object.keys(all);
      assert.ok(keys.length >= 20, `Expected >= 20 agents, got ${keys.length}`);
      assert.ok(keys.includes('architect'));
      assert.ok(keys.includes('executor'));
      assert.ok(keys.includes('debugger'));
    });
  });

  describe('previewAgentTOMLs', () => {
    it('returns summary for all agents', () => {
      const previews = previewAgentTOMLs();
      assert.ok(previews.length >= 20);

      const planner = previews.find((p) => p.name === 'planner');
      assert.ok(planner);
      assert.equal(planner!.reasoningEffort, 'medium');
      assert.equal(planner!.tokenBudget, 16_000);
      assert.equal(planner!.maxSteps, 20);
    });
  });
});
