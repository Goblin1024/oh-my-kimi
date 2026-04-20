/**
 * Team State Manager
 *
 * Manages the state of the active team session.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { omkStateDir } from '../state/paths.js';
function getTeamStatePath(cwd) {
    const dir = omkStateDir(cwd);
    mkdirSync(dir, { recursive: true });
    return join(dir, 'team-active.json');
}
export function getTeamState(cwd) {
    const filePath = getTeamStatePath(cwd);
    if (existsSync(filePath)) {
        try {
            return JSON.parse(readFileSync(filePath, 'utf-8'));
        }
        catch {
            return null;
        }
    }
    return null;
}
export function setTeamState(state, cwd) {
    const filePath = getTeamStatePath(cwd);
    writeFileSync(filePath, JSON.stringify(state, null, 2));
}
export function updateWorkerState(workerId, updates, cwd) {
    const state = getTeamState(cwd);
    if (!state)
        return;
    const worker = state.workers.find((w) => w.id === workerId);
    if (worker) {
        Object.assign(worker, updates);
        setTeamState(state, cwd);
    }
}
//# sourceMappingURL=state.js.map