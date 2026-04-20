/**
 * Atomic file operations for safe concurrent state management.
 *
 * Provides two primitives:
 *  - writeAtomic: write-to-temp-then-rename, ensuring the target file is
 *    never partially written.
 *  - withFileLock: a lightweight spin-lock backed by a `.lock` file that
 *    works on every platform (no native bindings required).
 */

import { writeFileSync, renameSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

const LOCK_SPIN_INTERVAL_MS = 50;
const LOCK_TIMEOUT_MS = 5000;
const LOCK_STALE_THRESHOLD_MS = 10_000;

/**
 * Write `content` to `filePath` atomically.
 *
 * Strategy: write to a sibling temp file first, then rename.
 * Rename is atomic on POSIX and effectively atomic on Windows (NTFS).
 */
export function writeAtomic(filePath: string, content: string): void {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  // Unique temp path to avoid collisions when multiple processes run
  const tmpPath = join(dir, `.tmp-${randomBytes(6).toString('hex')}`);

  try {
    writeFileSync(tmpPath, content, 'utf-8');
    renameSync(tmpPath, filePath);
  } catch (err) {
    // Clean up temp file if rename fails
    try {
      unlinkSync(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}

/**
 * Execute `fn` while holding an exclusive lock on `lockPath`.
 *
 * Lock implementation:
 * - Create a `${lockPath}.lock` sentinel file containing our PID.
 * - If lock file already exists and is not stale, spin-wait up to LOCK_TIMEOUT_MS.
 * - A lock is considered stale if its mtime is older than LOCK_STALE_THRESHOLD_MS,
 *   protecting against crashed processes leaving orphan locks.
 * - Always release (delete) the lock file in a finally block.
 */
export async function withFileLock<T>(lockPath: string, fn: () => T | Promise<T>): Promise<T> {
  const lockFile = `${lockPath}.lock`;
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  // Acquire lock
  while (true) {
    if (!existsSync(lockFile)) {
      // Try to create the lock file
      try {
        // Write our PID into the lock file so it can be inspected
        writeFileSync(lockFile, String(process.pid), { flag: 'wx' });
        break; // Lock acquired
      } catch (err: unknown) {
        // EEXIST means another process beat us — continue spinning
        if (isEexist(err)) {
          // Fall through to stale check
        } else {
          throw err;
        }
      }
    }

    // Check if stale
    if (existsSync(lockFile)) {
      try {
        const { statSync } = await import('fs');
        const stat = statSync(lockFile);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_THRESHOLD_MS) {
          // Lock is stale — forcibly remove
          unlinkSync(lockFile);
          continue;
        }
      } catch {
        // Stat failed — lock may have already been released
        continue;
      }
    }

    if (Date.now() > deadline) {
      throw new Error(`withFileLock: timeout waiting for lock on "${lockPath}"`);
    }

    await sleep(LOCK_SPIN_INTERVAL_MS);
  }

  // Execute critical section
  try {
    return await fn();
  } finally {
    // Release lock
    try {
      unlinkSync(lockFile);
    } catch {
      // Ignore — lock may have been cleaned up already
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEexist(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === 'EEXIST'
  );
}
