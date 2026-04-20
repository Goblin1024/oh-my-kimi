/**
 * Workflow State Machine
 *
 * Defines the valid state transitions for an active workflow.
 * Prevents illegal state jumps and ensures phase consistency.
 */
export type WorkflowPhase = 'starting' | 'planning' | 'executing' | 'verifying' | 'completed' | 'cancelled';
export declare class IllegalStateTransitionError extends Error {
    readonly skill: string;
    readonly fromPhase: string;
    readonly toPhase: string;
    constructor(skill: string, fromPhase: string, toPhase: string);
}
/**
 * Validates if a transition from one phase to another is allowed.
 *
 * @param fromPhase The current phase
 * @param toPhase The target phase
 * @returns true if allowed, false otherwise
 */
export declare function isValidTransition(fromPhase: string, toPhase: string): boolean;
/**
 * Ensures a transition is valid. Throws if invalid.
 */
export declare function assertValidTransition(skill: string, fromPhase: string, toPhase: string): void;
//# sourceMappingURL=workflow-transition.d.ts.map