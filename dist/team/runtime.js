/**
 * Team Runtime
 *
 * Orchestrates multiple child processes for parallel agent execution.
 */
import { spawn } from 'child_process';
import { getTeamState, setTeamState, updateWorkerState } from './state.js';
import { resolveAgentForSkill, loadAgentPrompt } from '../hooks/agents-overlay.js';
import { join } from 'path';
import { createWriteStream, mkdirSync, existsSync, rmSync } from 'fs';
export class TeamRuntime {
    workers = new Map();
    constructor() {
        // Workers always spawn real kimi processes
    }
    async startTeam(count, role, task, cwd) {
        const existingState = getTeamState(cwd);
        if (existingState?.active) {
            throw new Error('A team session is already active. Shutdown first with "omk team shutdown".');
        }
        const state = {
            active: true,
            role,
            task,
            startedAt: new Date().toISOString(),
            workers: [],
        };
        const rolePromptFile = resolveAgentForSkill(role);
        const rolePrompt = loadAgentPrompt(rolePromptFile) || 'You are an AI assistant.';
        for (let i = 1; i <= count; i++) {
            const workerId = `w${i}`;
            const workerState = {
                id: workerId,
                status: 'starting',
                task: `[Worker ${i}/${count}] ${task}\n\nRole Context:\n${rolePrompt}`,
                startedAt: new Date().toISOString(),
            };
            state.workers.push(workerState);
        }
        // Clear previous logs when starting a new team
        const logDir = join(cwd || process.cwd(), '.omk', 'logs', 'team', 'latest');
        if (existsSync(logDir)) {
            try {
                rmSync(logDir, { recursive: true, force: true });
            }
            catch {
                // ignore
            }
        }
        setTeamState(state, cwd);
        // Spawn processes
        for (const workerState of state.workers) {
            this.spawnWorker(workerState, cwd);
        }
    }
    spawnWorker(workerState, cwd) {
        const workerId = workerState.id;
        // Setup logging first so error handler can use it
        const logDir = join(cwd || process.cwd(), '.omk', 'logs', 'team', 'latest');
        mkdirSync(logDir, { recursive: true });
        const logStream = createWriteStream(join(logDir, `${workerId}.log`), { flags: 'a' });
        logStream.on('error', () => {
            /* ignore teardown errors */
        });
        // Support mock mode for tests when 'kimi' is not available
        const isMockMode = process.env.OMK_MOCK_TEAM === '1';
        const mockDelay = parseInt(process.env.MOCK_DELAY || '100', 10);
        const child = isMockMode
            ? spawn('node', [
                '-e',
                `setTimeout(() => { console.log('Mock worker completed'); process.exit(0); }, ${mockDelay})`,
            ], { cwd, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] })
            : spawn('kimi', [], {
                cwd,
                env: process.env,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        child.on('error', (err) => {
            if (err.code === 'ENOENT') {
                console.error(`\x1b[31m[${workerId}]\x1b[0m Error: 'kimi' command not found in PATH. Please install Kimi CLI to use team mode.`);
            }
            else {
                console.error(`\x1b[31m[${workerId}]\x1b[0m Error spawning worker: ${err.message}`);
            }
            logStream.end();
            this.workers.delete(workerId);
            void (async () => {
                await updateWorkerState(workerId, { status: 'failed', finishedAt: new Date().toISOString() }, cwd);
                this.checkTeamCompletion(cwd);
            })();
        });
        this.workers.set(workerId, child);
        updateWorkerState(workerId, { pid: child.pid, status: 'running' }, cwd);
        // Send task
        if (child.stdin) {
            child.stdin.write(workerState.task);
            child.stdin.end();
        }
        // Handle output
        child.stdout?.on('data', (data) => {
            process.stdout.write(`\x1b[36m[${workerId}]\x1b[0m ${data}`);
            logStream.write(data);
        });
        child.stderr?.on('data', (data) => {
            process.stderr.write(`\x1b[31m[${workerId}]\x1b[0m ${data}`);
            logStream.write(data);
        });
        // Handle exit
        child.on('exit', (code, signal) => {
            logStream.end();
            this.workers.delete(workerId);
            let status;
            if (signal === 'SIGTERM' || signal === 'SIGKILL') {
                status = 'terminated';
            }
            else {
                status = code === 0 ? 'completed' : 'failed';
            }
            // Only update if not already terminated by shutdownTeam — wrap in async IIFE
            // because updateWorkerState is now async (uses withFileLock)
            void (async () => {
                const currentState = getTeamState(cwd);
                const currentWorker = currentState?.workers.find((w) => w.id === workerId);
                if (currentWorker && currentWorker.status !== 'terminated') {
                    await updateWorkerState(workerId, { status, finishedAt: new Date().toISOString() }, cwd);
                }
                this.checkTeamCompletion(cwd);
            })();
        });
    }
    checkTeamCompletion(cwd) {
        const state = getTeamState(cwd);
        if (!state)
            return;
        const allDone = state.workers.every((w) => w.status === 'completed' || w.status === 'failed' || w.status === 'terminated');
        if (allDone && state.active) {
            state.active = false;
            state.finishedAt = new Date().toISOString();
            setTeamState(state, cwd);
            console.log('\n\x1b[32m✨ All team workers have finished.\x1b[0m');
        }
    }
    async shutdownTeam(cwd) {
        const state = getTeamState(cwd);
        if (!state || !state.active) {
            console.log('No active team session found.');
            return;
        }
        console.log('Shutting down team workers...');
        for (const worker of state.workers) {
            if (worker.status === 'running' || worker.status === 'starting') {
                const child = this.workers.get(worker.id);
                if (child) {
                    child.kill('SIGTERM');
                }
                else if (worker.pid) {
                    // Fallback if the process exists but not tracked in memory
                    try {
                        process.kill(worker.pid, 'SIGTERM');
                    }
                    catch {
                        // Ignore if already dead
                    }
                }
                worker.status = 'terminated';
                worker.finishedAt = new Date().toISOString();
            }
        }
        state.active = false;
        state.finishedAt = new Date().toISOString();
        setTeamState(state, cwd);
        console.log('\x1b[31mTeam session terminated.\x1b[0m');
    }
}
//# sourceMappingURL=runtime.js.map