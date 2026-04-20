/**
 * Structured Logger
 *
 * Writes structured logs to .omk/logs/system.log for observability.
 */

import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>;
}

class Logger {
  private logFile: string;

  constructor() {
    const logDir = join(process.cwd(), '.omk', 'logs');
    try {
      mkdirSync(logDir, { recursive: true });
    } catch {
      // Ignore
    }
    this.logFile = join(logDir, 'system.log');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private write(level: LogLevel, component: string, message: string, meta?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      meta,
    };

    try {
      appendFileSync(this.logFile, JSON.stringify(entry) + '\n', 'utf-8');
    } catch {
      // Best effort logging, do not crash the host process if filesystem is readonly
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(component: string, message: string, meta?: Record<string, any>) {
    this.write('info', component, message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(component: string, message: string, meta?: Record<string, any>) {
    this.write('warn', component, message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(component: string, message: string, meta?: Record<string, any>) {
    this.write('error', component, message, meta);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(component: string, message: string, meta?: Record<string, any>) {
    if (process.env.OMK_DEBUG) {
      this.write('debug', component, message, meta);
    }
  }
}

export const logger = new Logger();
