/**
 * State file path utilities
 */
import { join } from 'path';
import { homedir } from 'os';
/** Get Kimi home directory */
export function kimiHome() {
    return process.env.KIMI_HOME || join(homedir(), '.kimi');
}
/** Get OMK skills directory */
export function omkSkillsDir() {
    return join(kimiHome(), 'skills', 'omk');
}
/** Get project OMK state directory */
export function omkStateDir(projectRoot) {
    return join(projectRoot || process.cwd(), '.omk', 'state');
}
/** Get project OMK plans directory */
export function omkPlansDir(projectRoot) {
    return join(projectRoot || process.cwd(), '.omk', 'plans');
}
/** Get project OMK context directory */
export function omkContextDir(projectRoot) {
    return join(projectRoot || process.cwd(), '.omk', 'context');
}
/** Get skill-active state file path */
export function skillActivePath(projectRoot) {
    return join(omkStateDir(projectRoot), 'skill-active.json');
}
/** Get specific skill state file path */
export function skillStatePath(skill, projectRoot) {
    return join(omkStateDir(projectRoot), `${skill}-state.json`);
}
//# sourceMappingURL=paths.js.map