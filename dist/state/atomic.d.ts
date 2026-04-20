/**
 * Atomic file operations for safe concurrent state management.
 *
 * Provides two primitives:
 *  - writeAtomic: write-to-temp-then-rename, ensuring the target file is
 *    never partially written.
 *  - withFileLock: a lightweight spin-lock backed by a `.lock` file that
 *    works on every platform (no native bindings required).
 */
/**
 * Write `content` to `filePath` atomically.
 *
 * Strategy: write to a sibling temp file first, then rename.
 * Rename is atomic on POSIX and effectively atomic on Windows (NTFS).
 */
export declare function writeAtomic(filePath: string, content: string): void;
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
export declare function withFileLock<T>(lockPath: string, fn: () => T | Promise<T>): Promise<T>;
//# sourceMappingURL=atomic.d.ts.map