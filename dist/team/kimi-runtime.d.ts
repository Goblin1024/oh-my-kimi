/**
 * Kimi Runtime
 *
 * Spawns real `kimi` CLI processes for team workers.
 * Provides heartbeat monitoring and auto-restart capabilities.
 */
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
export declare class KimiRuntime {
    private child;
    private state;
    private options;
    private heartbeatTimer;
    private logStream;
    private onExitCallback?;
    constructor(options?: KimiRuntimeOptions);
    getState(): RuntimeState;
    /**
     * Spawn the kimi process.
     */
    start(taskInput?: string): void;
    private spawnMock;
    private attachHandlers;
    private handleCrash;
    private startHeartbeat;
    /**
     * Gracefully stop the worker (SIGTERM).
     */
    stop(): void;
    /**
     * Force kill the worker (SIGKILL).
     */
    kill(): void;
    private cleanup;
    private log;
    /**
     * Register a callback invoked when the worker exits permanently
     * (either normally or after max restarts).
     */
    onExit(callback: (state: RuntimeState) => void): void;
}
/**
 * Spawn multiple kimi workers with slot awareness.
 */
export declare function spawnWorkers(count: number, options: Omit<KimiRuntimeOptions, 'sessionId'>, tasks: string[]): KimiRuntime[];
//# sourceMappingURL=kimi-runtime.d.ts.map