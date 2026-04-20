/**
 * Structured Logger
 *
 * Writes structured logs to .omk/logs/system.log for observability.
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
declare class Logger {
    private logFile;
    constructor();
    private write;
    info(component: string, message: string, meta?: Record<string, any>): void;
    warn(component: string, message: string, meta?: Record<string, any>): void;
    error(component: string, message: string, meta?: Record<string, any>): void;
    debug(component: string, message: string, meta?: Record<string, any>): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map