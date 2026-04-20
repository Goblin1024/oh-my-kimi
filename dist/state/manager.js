/**
 * State management operations
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { skillActivePath, skillStatePath } from './paths.js';
import { assertValidTransition } from './workflow-transition.js';
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
 * Save the active skill state globally.
 */
export function setActiveSkill(state, cwd) {
    const filePath = skillActivePath(cwd);
    // If a previous state exists, validate the transition
    const previousState = readState(filePath);
    if (previousState && previousState.skill === state.skill) {
        assertValidTransition(state.skill, previousState.phase, state.phase);
    }
    writeState(filePath, state);
}
/**
 * Retrieve skill-specific persistent state.
 */
export function getSkillState(skill, projectRoot) {
    return readState(skillStatePath(skill, projectRoot));
}
/**
 * Save skill-specific persistent state.
 */
export function setSkillState(skill, state, cwd) {
    const filePath = skillStatePath(skill, cwd);
    // Validate transition
    const previousState = readState(filePath);
    if (previousState) {
        assertValidTransition(skill, previousState.phase, state.phase);
    }
    writeState(filePath, state);
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