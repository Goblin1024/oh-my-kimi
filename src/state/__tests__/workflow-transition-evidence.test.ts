/**
 * Tests for Evidence-Locked Phase Transitions
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  assertValidTransition,
  IllegalStateTransitionError,
  TransitionBlockedError,
} from '../workflow-transition.js';
import { submitEvidence } from '../evidence.js';
import type { Evidence } from '../../evidence/schema.js';

describe('state/workflow-transition evidence lock', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `omk-transition-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  function makeEvidence(skill: string, step: string, phase: string): Evidence {
    return {
      skill,
      step,
      phase,
      submittedAt: new Date().toISOString(),
      submitter: 'test',
      evidenceType: 'command_output',
      exitCode: 0,
      command: 'npm test',
      output: 'all tests passed',
    };
  }

  it('allows transition when evidence requirements are met', () => {
    submitEvidence(makeEvidence('ralph', 'tests_passed', 'verifying'), testDir);
    submitEvidence(makeEvidence('ralph', 'build_passed', 'verifying'), testDir);
    submitEvidence(makeEvidence('ralph', 'lint_clean', 'verifying'), testDir);
    submitEvidence(makeEvidence('ralph', 'types_clean', 'verifying'), testDir);

    assert.doesNotThrow(() => {
      assertValidTransition('ralph', 'executing', 'verifying', testDir);
    });
  });

  it('blocks transition when evidence is missing', () => {
    submitEvidence(makeEvidence('ralph', 'tests_passed', 'verifying'), testDir);

    assert.throws(() => {
      assertValidTransition('ralph', 'executing', 'verifying', testDir);
    }, TransitionBlockedError);
  });

  it('blocks ralplan approving without PRD evidence', () => {
    assert.throws(() => {
      assertValidTransition('ralplan', 'documenting', 'approving', testDir);
    }, TransitionBlockedError);
  });

  it('allows ralplan approving with PRD evidence', () => {
    const ev: Evidence = {
      skill: 'ralplan',
      step: 'prd_written',
      phase: 'approving',
      submittedAt: new Date().toISOString(),
      submitter: 'test',
      evidenceType: 'file_artifact',
      exitCode: 0,
      artifactPath: join(testDir, '.omk', 'plans', 'prd-auth.md'),
      artifactSize: 600,
    };

    // Create the PRD file so validation passes
    mkdirSync(join(testDir, '.omk', 'plans'), { recursive: true });
    writeFileSync(join(testDir, '.omk', 'plans', 'prd-auth.md'), 'a'.repeat(600));

    submitEvidence(ev, testDir);

    assert.doesNotThrow(() => {
      assertValidTransition('ralplan', 'documenting', 'approving', testDir);
    });
  });

  it('skips evidence check when evidenceDir is not provided', () => {
    assert.doesNotThrow(() => {
      assertValidTransition('ralph', 'executing', 'verifying');
    });
  });

  it('still checks phase name validity with evidence lock', () => {
    assert.throws(() => {
      assertValidTransition('ralph', 'starting', 'nonexistent-phase', testDir);
    }, IllegalStateTransitionError);
  });
});
