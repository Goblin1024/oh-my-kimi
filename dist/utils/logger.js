/**
 * Structured Logger
 *
 * Writes structured logs to .omk/logs/system.log for observability.
 */
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
class Logger {
    logFile;
    constructor() {
        const logDir = join(process.cwd(), '.omk', 'logs');
        try {
            mkdirSync(logDir, { recursive: true });
        }
        catch {
            // Ignore
        }
        this.logFile = join(logDir, 'system.log');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    write(level, component, message, meta) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            component,
            message,
            meta,
        };
        try {
            appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf-8');
        }
        catch {
            // Best effort logging, do not crash the host process if filesystem is readonly
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info(component, message, meta) {
        this.write('info', component, message, meta);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn(component, message, meta) {
        this.write('warn', component, message, meta);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error(component, message, meta) {
        this.write('error', component, message, meta);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug(component, message, meta) {
        if (process.env.OMK_DEBUG) {
            this.write('debug', component, message, meta);
        }
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map