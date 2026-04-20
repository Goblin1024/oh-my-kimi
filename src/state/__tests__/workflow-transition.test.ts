/**
 * Tests for Workflow State Machine
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTransition,
  assertValidTransition,
  IllegalStateTransitionError,
} from '../workflow-transition.js';

describe('state/workflow-transition', () => {
  describe('isValidTransition', () => {
    it('allows starting -> planning', () => {
      assert.equal(isValidTransition('starting', 'planning'), true);
    });

    it('allows executing -> verifying', () => {
      assert.equal(isValidTransition('executing', 'verifying'), true);
    });

    it('allows verifying -> executing (loop back)', () => {
      assert.equal(isValidTransition('verifying', 'executing'), true);
    });

    it('allows any valid phase to completed', () => {
      assert.equal(isValidTransition('starting', 'completed'), true);
      assert.equal(isValidTransition('planning', 'completed'), true);
      assert.equal(isValidTransition('executing', 'completed'), true);
      assert.equal(isValidTransition('verifying', 'completed'), true);
    });

    it('allows any valid phase to cancelled', () => {
      assert.equal(isValidTransition('starting', 'cancelled'), true);
      assert.equal(isValidTransition('executing', 'cancelled'), true);
    });

    it('denies completed -> executing', () => {
      assert.equal(isValidTransition('completed', 'executing'), false);
    });

    it('denies cancelled -> starting', () => {
      assert.equal(isValidTransition('cancelled', 'starting'), false);
    });

    it('denies verifying -> planning', () => {
      assert.equal(isValidTransition('verifying', 'planning'), false);
    });

    it('allows unknown custom phases from existing phases', () => {
      assert.equal(isValidTransition('starting', 'custom-phase'), true);
    });

    it('allows unknown custom phases to standard phases', () => {
      assert.equal(isValidTransition('custom-phase', 'executing'), true);
    });
  });

  describe('assertValidTransition', () => {
    it('does nothing on valid transition', () => {
      assert.doesNotThrow(() => {
        assertValidTransition('ralph', 'starting', 'executing');
      });
    });

    it('does nothing on same phase transition', () => {
      assert.doesNotThrow(() => {
        assertValidTransition('ralph', 'completed', 'completed');
      });
    });

    it('throws IllegalStateTransitionError on invalid transition', () => {
      assert.throws(
        () => {
          assertValidTransition('ralph', 'completed', 'executing');
        },
        (err: unknown) => {
          assert.ok(err instanceof IllegalStateTransitionError);
          assert.equal(err.name, 'IllegalStateTransitionError');
          assert.ok(err.message.includes("cannot move from 'completed' to 'executing'"));
          return true;
        }
      );
    });
  });
});
