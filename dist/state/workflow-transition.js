/**
 * Workflow State Machine
 *
 * Defines the valid state transitions for an active workflow.
 * Prevents illegal state jumps and ensures phase consistency.
 *
 * Enhanced to support per-skill phase lists loaded from SKILL.md manifests.
 */
import { loadSkillManifest } from '../skills/parser.js';
/**
 * Valid transition map.
 * Key: current phase
 * Value: array of allowed next phases
 */
const VALID_TRANSITIONS = {
    starting: ['planning', 'executing', 'completed', 'cancelled'],
    planning: ['executing', 'completed', 'cancelled'],
    executing: ['verifying', 'completed', 'cancelled'],
    verifying: ['executing', 'completed', 'cancelled'], // Can loop back to executing if verification fails
    completed: [], // Terminal state
    cancelled: [], // Terminal state
};
/**
 * Build a linear transition map from a skill's declared phases.
 * Each phase can move to the next one, plus 'cancelled' as an escape hatch.
 */
function buildTransitionsFromPhases(phases) {
    const map = {};
    for (let i = 0; i < phases.length; i++) {
        const next = ['cancelled'];
        if (i + 1 < phases.length) {
            next.push(phases[i + 1]);
        }
        // Also allow jumping to 'completed' from any non-terminal phase
        if (phases[i] !== 'completed' && phases[i] !== 'cancelled') {
            next.push('completed');
        }
        map[phases[i]] = next;
    }
    // Terminal states
    map['completed'] = [];
    map['cancelled'] = [];
    return map;
}
function getSkillTransitions(skill, cwd) {
    const manifest = loadSkillManifest(skill, cwd);
    if (manifest && manifest.phases.length > 0 && !manifest.phases.every((p) => p in VALID_TRANSITIONS)) {
        // Skill defines custom phases — build a transition map from them
        return buildTransitionsFromPhases(manifest.phases);
    }
    return null;
}
export class IllegalStateTransitionError extends Error {
    skill;
    fromPhase;
    toPhase;
    constructor(skill, fromPhase, toPhase) {
        super(`Illegal state transition in skill '${skill}': cannot move from '${fromPhase}' to '${toPhase}'.`);
        this.skill = skill;
        this.fromPhase = fromPhase;
        this.toPhase = toPhase;
        this.name = 'IllegalStateTransitionError';
    }
}
/**
 * Validates if a transition from one phase to another is allowed.
 *
 * @param fromPhase The current phase
 * @param toPhase The target phase
 * @param skill Optional skill name to load per-skill phase rules
 * @param cwd Optional project root for manifest lookup
 * @returns true if allowed, false otherwise
 */
export function isValidTransition(fromPhase, toPhase, skill, cwd) {
    // Load per-skill transitions if a skill is provided
    if (skill) {
        const skillTransitions = getSkillTransitions(skill, cwd);
        if (skillTransitions) {
            const allowed = skillTransitions[fromPhase];
            if (allowed) {
                return allowed.includes(toPhase);
            }
            // Unknown phase in custom skill — fail-open
            return true;
        }
    }
    // If the fromPhase isn't recognized, we allow it (fail-open) to maintain backwards compatibility
    // or allow custom skill phases.
    if (!(fromPhase in VALID_TRANSITIONS)) {
        return true;
    }
    // If the toPhase isn't a standard phase, we also allow it for custom skill phases.
    if (!(toPhase in VALID_TRANSITIONS)) {
        return true;
    }
    // Both are standard phases, check the matrix
    const allowed = VALID_TRANSITIONS[fromPhase];
    return allowed.includes(toPhase);
}
/**
 * Ensures a transition is valid. Throws if invalid.
 */
export function assertValidTransition(skill, fromPhase, toPhase, cwd) {
    // Skip check if the phase isn't actually changing
    if (fromPhase === toPhase) {
        return;
    }
    if (!isValidTransition(fromPhase, toPhase, skill, cwd)) {
        throw new IllegalStateTransitionError(skill, fromPhase, toPhase);
    }
}
//# sourceMappingURL=workflow-transition.js.map