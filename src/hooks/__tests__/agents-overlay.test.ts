/**
 * Tests for Agents Overlay
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAgentForSkill, injectOverlay } from '../agents-overlay.js';

describe('hooks/agents-overlay', () => {
  describe('resolveAgentForSkill', () => {
    it('maps ralph to executor.md', () => {
      assert.equal(resolveAgentForSkill('ralph'), 'executor.md');
    });

    it('maps ralplan to architect.md', () => {
      assert.equal(resolveAgentForSkill('ralplan'), 'architect.md');
    });

    it('maps analyze to explorer.md', () => {
      assert.equal(resolveAgentForSkill('analyze'), 'explorer.md');
    });

    it('defaults to executor.md for unknown skills', () => {
      assert.equal(resolveAgentForSkill('unknown-skill'), 'executor.md');
    });
  });

  describe('injectOverlay', () => {
    it('generates overlay string for known skill', () => {
      const overlay = injectOverlay('ralph');
      assert.ok(overlay.includes('[OMK DYNAMIC CONTEXT: RUNTIME OVERLAY]'));
      assert.ok(overlay.includes('Skill Activated: ralph'));
      // The executor.md contains 'Role: Executor'
      assert.ok(overlay.includes('Role: Executor'));
    });
  });
});
