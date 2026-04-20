/**
 * Hook Audit Log
 *
 * Records every hook invocation with input, output, and timing for
 * post-mortem diagnostics. Rotates daily and caps file size.
 */
import { appendFileSync, existsSync, renameSync, mkdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB rotation
function getAuditDir() {
    const dir = join(process.cwd(), '.omk', 'logs', 'audit');
    mkdirSync(dir, { recursive: true });
    return dir;
}
function getAuditFilePath() {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return join(getAuditDir(), `hooks-${date}.jsonl`);
}
function rotateIfNeeded(path) {
    if (!existsSync(path))
        return;
    try {
        const stats = statSync(path);
        if (stats.size > MAX_SIZE_BYTES) {
            const rotated = `${path}.${Date.now()}`;
            renameSync(path, rotated);
        }
    }
    catch {
        // Ignore rotation errors
    }
}
/**
 * Append a single audit entry to the daily JSONL file.
 */
export function writeAudit(entry) {
    const filePath = getAuditFilePath();
    rotateIfNeeded(filePath);
    try {
        appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf-8');
    }
    catch {
        // Best-effort: never crash the hook path
    }
}
/**
 * Read the most recent N audit entries for diagnostics.
 */
export function readRecentAudit(count = 50) {
    const filePath = getAuditFilePath();
    if (!existsSync(filePath))
        return [];
    try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        const entries = [];
        for (const line of lines) {
            try {
                entries.push(JSON.parse(line));
            }
            catch {
                // Skip malformed lines
            }
        }
        return entries.slice(-count);
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=audit.js.map