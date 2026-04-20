/**
 * Team State Manager
 *
 * Manages the state of the active team session.
 * All writes use writeAtomic and updateWorkerState uses withFileLock
 * to eliminate the classic read-modify-write race condition.
 */
export interface WorkerState {
    id: string;
    pid?: number;
    status: 'starting' | 'running' | 'completed' | 'failed' | 'terminated';
    task: string;
    startedAt: string;
    finishedAt?: string;
}
export interface TeamState {
    active: boolean;
    role: string;
    task: string;
    startedAt: string;
    finishedAt?: string;
    workers: WorkerState[];
}
export declare function getTeamState(cwd?: string): TeamState | null;
export declare function setTeamState(state: TeamState, cwd?: string): void;
/**
 * Atomically update a single worker's fields within the team state.
 *
 * Uses withFileLock to prevent the race condition where two worker exit
 * events arrive simultaneously and both read stale state before writing.
 */
export declare function updateWorkerState(workerId: string, updates: Partial<WorkerState>, cwd?: string): Promise<void>;
//# sourceMappingURL=state.d.ts.map