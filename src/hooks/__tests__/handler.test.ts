/**
 * Tests for the Kimi Hook Handler
 *
 * Since handler.ts reads from stdin and writes to stdout,
 * we test the internal functions by importing the module indirectly.
 * For now, we test the keyword detection logic and state operations
 * through integration-style tests that exercise handler behavior.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('hooks/handler', () => {
  let testDir: string;
  let handlerPath: string;

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `omk-handler-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });
    // The compiled handler.js lives in dist/hooks/handler.js
    handlerPath = join(process.cwd(), 'dist', 'hooks', 'handler.js');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  function runHandler(input: Record<string, unknown>): Record<string, unknown> {
    const result = execFileSync('node', [handlerPath], {
      input: JSON.stringify(input),
      encoding: 'utf-8',
      timeout: 5000,
    });
    // Handler may output to stderr and stdout; parse stdout
    const lines = result.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    return JSON.parse(lastLine);
  }

  describe('UserPromptSubmit — keyword detection', () => {
    it('detects $ralph keyword', () => {
      const output = runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$ralph "implement the feature"',
        cwd: testDir,
      });
      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.skill, 'ralph');
      assert.equal(hookOutput.activated, true);
    });

    it('detects $deep-interview keyword', () => {
      const output = runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$deep-interview "clarify the feature"',
        cwd: testDir,
      });
      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.skill, 'deep-interview');
      assert.equal(hookOutput.activated, true);
    });

    it('detects $ralplan keyword', () => {
      const output = runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$ralplan "plan the auth system"',
        cwd: testDir,
      });
      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.skill, 'ralplan');
      assert.equal(hookOutput.activated, true);
    });

    it('returns no skill for unrecognized prompt', () => {
      const output = runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: 'just a regular question',
        cwd: testDir,
      });
      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.skill, undefined);
      assert.equal(hookOutput.activated, undefined);
    });

    it('handles empty prompt', () => {
      const output = runHandler({
        hook_event_name: 'UserPromptSubmit',
        cwd: testDir,
      });
      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.hookEventName, 'UserPromptSubmit');
    });
  });

  describe('UserPromptSubmit — $cancel', () => {
    it('cancels an active workflow', () => {
      // First activate a workflow
      runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$ralph "build it"',
        cwd: testDir,
      });

      // Then cancel
      const output = runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$cancel',
        cwd: testDir,
      });

      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.skill, 'cancel');
      assert.equal(hookOutput.activated, true);
      assert.ok((hookOutput.message as string).includes('Cancelled'));
    });

    it('cancel with no active workflow does nothing special', () => {
      const output = runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$cancel',
        cwd: testDir,
      });
      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      // No crash, graceful handling
      assert.equal(hookOutput.hookEventName, 'UserPromptSubmit');
    });
  });

  describe('UserPromptSubmit — state persistence', () => {
    it('creates state files when skill is activated', () => {
      runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$ralph "build it"',
        cwd: testDir,
      });

      const stateDir = join(testDir, '.omk', 'state');
      assert.ok(existsSync(join(stateDir, 'skill-active.json')));
      assert.ok(existsSync(join(stateDir, 'ralph-state.json')));

      const activeState = JSON.parse(readFileSync(join(stateDir, 'skill-active.json'), 'utf-8'));
      assert.equal(activeState.skill, 'ralph');
      assert.equal(activeState.active, true);
      assert.equal(activeState.phase, 'starting');
    });
  });

  describe('SessionStart', () => {
    it('reports active workflow on session start', () => {
      // Activate a workflow
      runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$ralph "work"',
        cwd: testDir,
      });

      // Start new session
      const output = runHandler({
        hook_event_name: 'SessionStart',
        cwd: testDir,
      });

      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.skill, 'ralph');
      assert.ok((hookOutput.message as string).includes('Resuming'));
    });

    it('reports no active workflow when none exists', () => {
      const output = runHandler({
        hook_event_name: 'SessionStart',
        cwd: testDir,
      });

      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.ok((hookOutput.message as string).includes('No active'));
    });
  });

  describe('Stop', () => {
    it('blocks stop when workflow is active', () => {
      // Activate
      runHandler({
        hook_event_name: 'UserPromptSubmit',
        prompt: '$ralph "work"',
        cwd: testDir,
      });

      // Attempt stop
      const output = runHandler({
        hook_event_name: 'Stop',
        cwd: testDir,
      });

      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.skill, 'ralph');
      assert.ok((hookOutput.message as string).includes('active'));
    });

    it('allows stop when no workflow active', () => {
      const output = runHandler({
        hook_event_name: 'Stop',
        cwd: testDir,
      });

      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.ok((hookOutput.message as string).includes('No active'));
    });
  });

  describe('Unknown events', () => {
    it('handles unknown event gracefully', () => {
      const output = runHandler({
        hook_event_name: 'SomeUnknownEvent',
        cwd: testDir,
      });
      const hookOutput = output.hookSpecificOutput as Record<string, unknown>;
      assert.equal(hookOutput.hookEventName, 'SomeUnknownEvent');
    });
  });

  describe('Error handling', () => {
    it('returns empty output on invalid JSON input', () => {
      const result = execFileSync('node', [handlerPath], {
        input: 'not valid json',
        encoding: 'utf-8',
        timeout: 5000,
      });
      // Should not crash; should output valid JSON
      const lines = result.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const parsed = JSON.parse(lastLine);
      assert.ok(typeof parsed === 'object');
    });
  });
});
