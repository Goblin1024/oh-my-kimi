/**
 * Lightweight file-lock utility using atomic mkdir/rmdir.
 *
 * Node.js does not ship a built-in file-lock API.  We use the fact that
 * `fs.mkdir(path)` is atomic on all major platforms: if two processes
 * race to create the same directory, exactly one succeeds.
 */
import { mkdir, rmdir } from 'fs/promises';
/**
 * Acquire an advisory lock for the given file path.
 * The lock is represented by a sibling directory ending in `.lock`.
 */
export async function acquireLock(filePath, options = {}) {
    const lockDir = `${filePath}.lock`;
    const { timeout = 5000, retryInterval = 50, stale = false } = options;
    const start = Date.now();
    while (true) {
        try {
            await mkdir(lockDir, { recursive: false });
            // Acquired
            return {
                release: async () => {
                    try {
                        await rmdir(lockDir);
                    }
                    catch {
                        // Best-effort cleanup
                    }
                },
            };
        }
        catch {
            // Lock held by someone else
            if (Date.now() - start > timeout) {
                if (stale)
                    return null;
                throw new Error(`Timeout acquiring lock for ${filePath}`);
            }
            await sleep(retryInterval);
        }
    }
}
/**
 * Execute a function while holding an advisory lock on `filePath`.
 */
export async function withLock(filePath, fn, options) {
    const lock = await acquireLock(filePath, options);
    if (!lock) {
        throw new Error(`Could not acquire lock for ${filePath}`);
    }
    try {
        return await fn();
    }
    finally {
        await lock.release();
    }
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=lock.js.map