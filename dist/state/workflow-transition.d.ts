/**
 * Workflow State Machine
 *
 * Defines the valid state transitions for an active workflow.
 * Prevents illegal state jumps and ensures phase consistency.
 *
 * Enhanced to support per-skill phase lists loaded from SKILL.md manifests.
 */
export type WorkflowPhase = 'starting' | 'planning' | 'executing' | 'verifying' | 'completing' | 'completed' | 'cancelled';
export declare class IllegalStateTransitionError extends Error {
    readonly skill: string;
    readonly fromPhase: string;
    readonly toPhase: string;
    constructor(skill: string, fromPhase: string, toPhase: string);
}
export declare class TransitionBlockedError extends Error {
    constructor(message: string);
}
/**
 * Validates if a transition from one phase to another is allowed.
 *
 * @param fromPhase The current phase
 * @param toPhase The target phase
 * @param skill Optional skill name to load per-skill phase rules
 * @param cwd Optional project root for manifest lookup
 * @param evidenceDir Optional evidence directory for phase prerequisite checks
 * @returns true if allowed, false otherwise
 */
export declare function isValidTransition(fromPhase: string, toPhase: string, skill?: string, cwd?: string, _evidenceDir?: string): boolean;
/**
 * Ensures a transition is valid. Throws if invalid.
 */
export declare function assertValidTransition(skill: string, fromPhase: string, toPhase: string, cwd?: string): void;
//# sourceMappingURL=workflow-transition.d.ts.map