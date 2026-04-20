/**
 * Tests for src/state/atomic.ts
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeAtomic, withFileLock } from '../atomic.js';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('state/atomic', () => {
  const testDir = join(process.cwd(), '.tmp-atomic-test');

  after(() => {
    try {
      rmSync(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (_e) {
      // ignore EBUSY on Windows
    }
  });

  describe('writeAtomic', () => {
    it('creates the file with correct content', () => {
      mkdirSync(testDir, { recursive: true });
      const filePath = join(testDir, 'test-write.json');
      writeAtomic(filePath, '{"ok":true}');
      assert.equal(readFileSync(filePath, 'utf-8'), '{"ok":true}');
    });

    it('overwrites existing file atomically', () => {
      const filePath = join(testDir, 'test-overwrite.json');
      writeAtomic(filePath, '{"v":1}');
      writeAtomic(filePath, '{"v":2}');
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      assert.equal(parsed.v, 2);
    });

    it('creates parent directories if they do not exist', () => {
      const deepPath = join(testDir, 'deep', 'nested', 'file.json');
      writeAtomic(deepPath, '{}');
      assert.ok(existsSync(deepPath));
    });
  });

  describe('withFileLock', () => {
    it('executes the callback and returns its value', async () => {
      mkdirSync(testDir, { recursive: true });
      const lockBase = join(testDir, 'test.lock-base');
      const result = await withFileLock(lockBase, () => 42);
      assert.equal(result, 42);
    });

    it('removes the lock file after execution', async () => {
      const lockBase = join(testDir, 'test2.lock-base');
      await withFileLock(lockBase, () => 'done');
      assert.ok(!existsSync(`${lockBase}.lock`));
    });

    it('removes the lock file even when callback throws', async () => {
      const lockBase = join(testDir, 'test3.lock-base');
      await assert.rejects(() =>
        withFileLock(lockBase, () => {
          throw new Error('boom');
        })
      );
      assert.ok(!existsSync(`${lockBase}.lock`));
    });

    it('serialises concurrent writes correctly', async () => {
      const filePath = join(testDir, 'concurrent.json');
      writeAtomic(filePath, '{"counter":0}');

      const lockBase = filePath;
      const increment = () =>
        withFileLock(lockBase, () => {
          const current = JSON.parse(readFileSync(filePath, 'utf-8')) as { counter: number };
          writeAtomic(filePath, JSON.stringify({ counter: current.counter + 1 }));
        });

      await Promise.all([increment(), increment(), increment(), increment(), increment()]);

      const final = JSON.parse(readFileSync(filePath, 'utf-8')) as { counter: number };
      assert.equal(final.counter, 5);
    });
  });
});
