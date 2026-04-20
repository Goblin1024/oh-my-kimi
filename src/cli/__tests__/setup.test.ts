/**
 * Tests for setup command
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('cli/setup', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(() => {
    testDir = join(tmpdir(), `omk-setup-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });

    originalEnv = process.env.KIMI_HOME;
    process.env.KIMI_HOME = join(testDir, '.kimi');
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.KIMI_HOME = originalEnv;
    } else {
      delete process.env.KIMI_HOME;
    }

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  // These tests are currently mostly placeholders since setup.ts uses
  // hardcoded homedir() imports that are hard to mock without a mocking library.
  // Full integration tests would require spawning a process with mocked homedir.

  it('setup exports a function', async () => {
    const { setup } = await import('../setup.js');
    assert.equal(typeof setup, 'function');
  });
});
