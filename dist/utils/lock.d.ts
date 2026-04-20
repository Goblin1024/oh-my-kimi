/**
 * Lightweight file-lock utility using atomic mkdir/rmdir.
 *
 * Node.js does not ship a built-in file-lock API.  We use the fact that
 * `fs.mkdir(path)` is atomic on all major platforms: if two processes
 * race to create the same directory, exactly one succeeds.
 */
export interface LockOptions {
    /** Max time to wait for the lock (ms). Default: 5000 */
    timeout?: number;
    /** Interval between retries (ms). Default: 50 */
    retryInterval?: number;
    /** If true, never throw; resolve false on timeout. Default: false */
    stale?: boolean;
}
/**
 * Acquire an advisory lock for the given file path.
 * The lock is represented by a sibling directory ending in `.lock`.
 */
export declare function acquireLock(filePath: string, options?: LockOptions): Promise<{
    release: () => Promise<void>;
} | null>;
/**
 * Execute a function while holding an advisory lock on `filePath`.
 */
export declare function withLock<T>(filePath: string, fn: () => Promise<T>, options?: LockOptions): Promise<T>;
//# sourceMappingURL=lock.d.ts.map