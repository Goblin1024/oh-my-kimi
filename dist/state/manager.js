/**
 * State management operations
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { skillActivePath, skillStatePath } from './paths.js';
/**
 * Read state from JSON file
 */
export function readState(filePath) {
    try {
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Write state to JSON file
 */
export function writeState(filePath, state) {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(state, null, 2));
}
/**
 * Get active skill state
 */
export function getActiveSkill(projectRoot) {
    return readState(skillActivePath(projectRoot));
}
/**
 * Set active skill
 */
export function setActiveSkill(state, projectRoot) {
    writeState(skillActivePath(projectRoot), state);
}
/**
 * Get skill-specific state
 */
export function getSkillState(skill, projectRoot) {
    return readState(skillStatePath(skill, projectRoot));
}
/**
 * Set skill-specific state
 */
export function setSkillState(skill, state, projectRoot) {
    writeState(skillStatePath(skill, projectRoot), state);
}
/**
 * Check if a workflow is active
 */
export function isWorkflowActive(projectRoot) {
    const active = getActiveSkill(projectRoot);
    return active?.active === true;
}
/**
 * Cancel active workflow
 */
export function cancelWorkflow(reason = 'User requested', projectRoot) {
    const active = getActiveSkill(projectRoot);
    if (!active?.active)
        return null;
    const cancelled = {
        ...active,
        active: false,
        phase: 'cancelled',
        cancelled_at: new Date().toISOString(),
        reason,
    };
    setActiveSkill(cancelled, projectRoot);
    setSkillState(active.skill, cancelled, projectRoot);
    return cancelled;
}
//# sourceMappingURL=manager.js.map