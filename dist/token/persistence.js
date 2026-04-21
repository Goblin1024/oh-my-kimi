/**
 * Token State Persistence
 *
 * Saves and loads token budget snapshots to/from disk so the HUD and
 * other tools can observe token usage without recalculating from evidence.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { omkStateDir } from '../state/paths.js';
function tokenStatePath(skill, cwd) {
    const dir = omkStateDir(cwd);
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });
    return join(dir, `token-${skill}.json`);
}
/**
 * Save a token state snapshot to disk.
 */
export function saveTokenState(snapshot, cwd) {
    const path = tokenStatePath(snapshot.skill, cwd);
    writeFileSync(path, JSON.stringify(snapshot, null, 2), 'utf-8');
}
/**
 * Load the most recent token state snapshot for a skill.
 */
export function loadTokenState(skill, cwd) {
    const path = tokenStatePath(skill, cwd);
    if (!existsSync(path))
        return null;
    try {
        const raw = JSON.parse(readFileSync(path, 'utf-8'));
        return raw;
    }
    catch {
        return null;
    }
}
/**
 * Delete a token state snapshot.
 */
export function clearTokenState(skill, cwd) {
    const path = tokenStatePath(skill, cwd);
    if (existsSync(path)) {
        unlinkSync(path);
    }
}
//# sourceMappingURL=persistence.js.map