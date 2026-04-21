/**
 * Kimi Runtime
 *
 * Spawns real `kimi` CLI processes for team workers.
 * Provides heartbeat monitoring and auto-restart capabilities.
 */

import { spawn, ChildProcess, type SpawnOptions } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { appendMessage } from './mailbox.js';
import type { MailboxMessage } from './mailbox.js';

export interface KimiRuntimeOptions {
  cwd?: string;
  agentFile?: string;
  sessionId?: string;
  env?: Record<string, string>;
  logDir?: string;
  mailboxPath?: string;
  maxRestarts?: number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
}

export type WorkerStatus = 'starting' | 'running' | 'crashed' | 'stopped' | 'restarting';

export interface RuntimeState {
  pid?: number;
  status: WorkerStatus;
  startedAt: string;
  lastHeartbeatAt?: string;
  restartCount: number;
  exitCode?: number;
  exitSignal?: string;
}

/**
 * Wraps a single kimi worker process with monitoring and restart logic.
 */
export class KimiRuntime {
  private child: ChildProcess | null = null;
  private state: RuntimeState;
  private options: KimiRuntimeOptions;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private logStream: ReturnType<typeof createWriteStream> | null = null;
  private onExitCallback?: (state: RuntimeState) => void;

  constructor(options: KimiRuntimeOptions = {}) {
    this.options = {
      maxRestarts: 3,
      heartbeatIntervalMs: 5_000,
      heartbeatTimeoutMs: 15_000,
      ...options,
    };
    this.state = {
      status: 'starting',
      startedAt: new Date().toISOString(),
      restartCount: 0,
    };
  }

  getState(): RuntimeState {
    return { ...this.state };
  }

  /**
   * Spawn the kimi process.
   */
  start(taskInput?: string): void {
    if (this.child) {
      throw new Error('KimiRuntime already started. Stop first.');
    }

    this.state.status = 'starting';
    this.state.startedAt = new Date().toISOString();

    const args: string[] = [];
    if (this.options.agentFile) {
      args.push('--agent-file', this.options.agentFile);
    }
    if (this.options.sessionId) {
      args.push('--session', this.options.sessionId);
    }

    const spawnOpts: SpawnOptions = {
      cwd: this.options.cwd,
      env: { ...process.env, ...this.options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    };

    // Setup logging
    if (this.options.logDir) {
      mkdirSync(this.options.logDir, { recursive: true });
      const logPath = join(this.options.logDir, `${this.options.sessionId || 'worker'}.log`);
      this.logStream = createWriteStream(logPath, { flags: 'a' });
    }

    const isMock = process.env.OMK_MOCK_TEAM === '1';

    this.child = isMock ? this.spawnMock(args, spawnOpts) : spawn('kimi', args, spawnOpts);

    this.attachHandlers();

    if (taskInput && this.child.stdin) {
      this.child.stdin.write(taskInput);
      this.child.stdin.end();
    }

    this.state.pid = this.child.pid;
    this.state.status = 'running';
    this.startHeartbeat();
  }

  private spawnMock(args: string[], opts: SpawnOptions): ChildProcess {
    const delay = parseInt(process.env.MOCK_DELAY || '500', 10);
    return spawn(
      'node',
      [
        '-e',
        `setTimeout(() => { console.log('Mock kimi worker completed'); process.exit(0); }, ${delay})`,
      ],
      opts
    );
  }

  private attachHandlers(): void {
    if (!this.child) return;

    this.child.on('error', (err) => {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        this.log('[RUNTIME] Error: kimi command not found in PATH');
      } else {
        this.log(`[RUNTIME] Spawn error: ${err.message}`);
      }
      this.handleCrash();
    });

    this.child.stdout?.on('data', (data) => {
      this.log(`[STDOUT] ${data}`);
    });

    this.child.stderr?.on('data', (data) => {
      this.log(`[STDERR] ${data}`);
    });

    this.child.on('exit', (code, signal) => {
      this.state.exitCode = code ?? undefined;
      this.state.exitSignal = signal ?? undefined;

      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        this.state.status = 'stopped';
        this.cleanup();
        this.onExitCallback?.(this.getState());
      } else if (code !== 0) {
        this.handleCrash();
      } else {
        this.state.status = 'stopped';
        this.cleanup();
        this.onExitCallback?.(this.getState());
      }
    });
  }

  private handleCrash(): void {
    this.cleanup();
    const maxRestarts = this.options.maxRestarts ?? 3;

    if (this.state.restartCount < maxRestarts) {
      this.state.status = 'restarting';
      this.state.restartCount++;
      this.log(`[RUNTIME] Restarting (${this.state.restartCount}/${maxRestarts})...`);
      setTimeout(() => this.start(), 1_000);
    } else {
      this.state.status = 'crashed';
      this.log('[RUNTIME] Max restarts exceeded. Worker permanently failed.');
      this.onExitCallback?.(this.getState());
    }
  }

  private startHeartbeat(): void {
    const interval = this.options.heartbeatIntervalMs ?? 5_000;
    this.heartbeatTimer = setInterval(() => {
      if (!this.child || this.child.killed) {
        this.handleCrash();
        return;
      }
      this.state.lastHeartbeatAt = new Date().toISOString();

      // Write heartbeat to mailbox if configured
      if (this.options.mailboxPath) {
        const hb: MailboxMessage = {
          id: `hb-${Date.now()}`,
          from: this.options.sessionId || 'worker',
          to: 'leader',
          type: 'heartbeat',
          payload: { pid: this.state.pid, status: this.state.status },
          timestamp: this.state.lastHeartbeatAt,
          delivered: false,
        };
        try {
          appendMessage(this.options.mailboxPath, hb);
        } catch {
          // ignore mailbox write failures
        }
      }
    }, interval);
  }

  /**
   * Gracefully stop the worker (SIGTERM).
   */
  stop(): void {
    if (this.child && !this.child.killed) {
      this.child.kill('SIGTERM');
    }
    this.cleanup();
    this.state.status = 'stopped';
  }

  /**
   * Force kill the worker (SIGKILL).
   */
  kill(): void {
    if (this.child && !this.child.killed) {
      this.child.kill('SIGKILL');
    }
    this.cleanup();
    this.state.status = 'stopped';
  }

  private cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.logStream?.end();
    this.logStream = null;
    this.child = null;
  }

  private log(line: string): void {
    if (this.logStream) {
      this.logStream.write(line + (line.endsWith('\n') ? '' : '\n'));
    }
  }

  /**
   * Register a callback invoked when the worker exits permanently
   * (either normally or after max restarts).
   */
  onExit(callback: (state: RuntimeState) => void): void {
    this.onExitCallback = callback;
  }
}

/**
 * Spawn multiple kimi workers with slot awareness.
 */
export function spawnWorkers(
  count: number,
  options: Omit<KimiRuntimeOptions, 'sessionId'>,
  tasks: string[]
): KimiRuntime[] {
  const runtimes: KimiRuntime[] = [];
  for (let i = 0; i < count; i++) {
    const opts: KimiRuntimeOptions = {
      ...options,
      sessionId: `worker-${i + 1}`,
    };
    const rt = new KimiRuntime(opts);
    rt.start(tasks[i]);
    runtimes.push(rt);
  }
  return runtimes;
}
