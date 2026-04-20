/**
 * Team Runtime
 *
 * Orchestrates multiple child processes for parallel agent execution.
 */
export declare class TeamRuntime {
    private workers;
    private isMockMode;
    constructor();
    startTeam(count: number, role: string, task: string, cwd?: string): Promise<void>;
    private spawnWorker;
    private checkTeamCompletion;
    shutdownTeam(cwd?: string): Promise<void>;
}
//# sourceMappingURL=runtime.d.ts.map