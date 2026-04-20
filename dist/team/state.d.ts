/**
 * Team State Manager
 *
 * Manages the state of the active team session.
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
export declare function updateWorkerState(workerId: string, updates: Partial<WorkerState>, cwd?: string): void;
//# sourceMappingURL=state.d.ts.map