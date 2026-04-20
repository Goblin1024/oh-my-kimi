/**
 * Tests for doctor command
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('cli/doctor', () => {
  it('doctor exports a function', async () => {
    const { doctor } = await import('../doctor.js');
    assert.equal(typeof doctor, 'function');
  });
});
