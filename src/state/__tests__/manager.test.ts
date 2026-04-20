/**
 * Tests for state manager operations
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  readState,
  writeState,
  getActiveSkill,
  setActiveSkill,
  getSkillState,
  setSkillState,
  isWorkflowActive,
  cancelWorkflow,
  type SkillState,
} from '../manager.js';

describe('state/manager', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `omk-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  function makeState(overrides: Partial<SkillState> = {}): SkillState {
    return {
      skill: 'ralph',
      active: true,
      phase: 'starting',
      activated_at: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  describe('readState', () => {
    it('returns parsed state from file', () => {
      const filePath = join(testDir, 'test.json');
      const state = makeState();
      mkdirSync(join(testDir), { recursive: true });
      writeFileSync(filePath, JSON.stringify(state));
      const result = readState(filePath);
      assert.deepStrictEqual(result, state);
    });

    it('returns null for non-existent file', () => {
      const result = readState(join(testDir, 'nonexistent.json'));
      assert.equal(result, null);
    });

    it('returns null for invalid JSON', () => {
      const filePath = join(testDir, 'bad.json');
      writeFileSync(filePath, 'not json');
      const result = readState(filePath);
      assert.equal(result, null);
    });
  });

  describe('writeState', () => {
    it('writes state to file and creates parent dirs', () => {
      const filePath = join(testDir, 'sub', 'dir', 'state.json');
      const state = makeState();
      writeState(filePath, state);

      const content = readFileSync(filePath, 'utf-8');
      assert.deepStrictEqual(JSON.parse(content), state);
    });
  });

  describe('getActiveSkill / setActiveSkill', () => {
    it('round-trips active skill state', () => {
      const state = makeState({ skill: 'deep-interview' });
      setActiveSkill(state, testDir);
      const result = getActiveSkill(testDir);
      assert.deepStrictEqual(result, state);
    });

    it('returns null when no active skill file', () => {
      const result = getActiveSkill(testDir);
      assert.equal(result, null);
    });
  });

  describe('getSkillState / setSkillState', () => {
    it('round-trips skill-specific state', () => {
      const state = makeState({ skill: 'ralplan', phase: 'planning' });
      setSkillState('ralplan', state, testDir);
      const result = getSkillState('ralplan', testDir);
      assert.deepStrictEqual(result, state);
    });
  });

  describe('isWorkflowActive', () => {
    it('returns true when active skill is active', () => {
      setActiveSkill(makeState({ active: true }), testDir);
      assert.equal(isWorkflowActive(testDir), true);
    });

    it('returns false when active skill is not active', () => {
      setActiveSkill(makeState({ active: false }), testDir);
      assert.equal(isWorkflowActive(testDir), false);
    });

    it('returns false when no active skill file', () => {
      assert.equal(isWorkflowActive(testDir), false);
    });
  });

  describe('cancelWorkflow', () => {
    it('cancels an active workflow and returns cancelled state', () => {
      setActiveSkill(makeState({ skill: 'ralph', active: true }), testDir);
      const result = cancelWorkflow('test reason', testDir);

      assert.ok(result);
      assert.equal(result.active, false);
      assert.equal(result.phase, 'cancelled');
      assert.equal(result.reason, 'test reason');
      assert.ok(result.cancelled_at);

      // Verify persisted
      const persisted = getActiveSkill(testDir);
      assert.equal(persisted?.active, false);
      assert.equal(persisted?.phase, 'cancelled');
    });

    it('also updates skill-specific state on cancel', () => {
      setActiveSkill(makeState({ skill: 'ralph', active: true }), testDir);
      cancelWorkflow('done', testDir);

      const skillState = getSkillState('ralph', testDir);
      assert.ok(skillState);
      assert.equal(skillState.active, false);
      assert.equal(skillState.phase, 'cancelled');
    });

    it('returns null when no active workflow', () => {
      const result = cancelWorkflow('noop', testDir);
      assert.equal(result, null);
    });

    it('returns null when workflow already inactive', () => {
      setActiveSkill(makeState({ active: false }), testDir);
      const result = cancelWorkflow('noop', testDir);
      assert.equal(result, null);
    });
  });
});
