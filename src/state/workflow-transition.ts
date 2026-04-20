/**
 * Workflow State Machine
 *
 * Defines the valid state transitions for an active workflow.
 * Prevents illegal state jumps and ensures phase consistency.
 */

export type WorkflowPhase =
  | 'starting'
  | 'planning'
  | 'executing'
  | 'verifying'
  | 'completed'
  | 'cancelled';

/**
 * Valid transition map.
 * Key: current phase
 * Value: array of allowed next phases
 */
const VALID_TRANSITIONS: Record<WorkflowPhase, WorkflowPhase[]> = {
  starting: ['planning', 'executing', 'completed', 'cancelled'],
  planning: ['executing', 'completed', 'cancelled'],
  executing: ['verifying', 'completed', 'cancelled'],
  verifying: ['executing', 'completed', 'cancelled'], // Can loop back to executing if verification fails
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

export class IllegalStateTransitionError extends Error {
  constructor(
    public readonly skill: string,
    public readonly fromPhase: string,
    public readonly toPhase: string
  ) {
    super(
      `Illegal state transition in skill '${skill}': cannot move from '${fromPhase}' to '${toPhase}'.`
    );
    this.name = 'IllegalStateTransitionError';
  }
}

/**
 * Validates if a transition from one phase to another is allowed.
 *
 * @param fromPhase The current phase
 * @param toPhase The target phase
 * @returns true if allowed, false otherwise
 */
export function isValidTransition(fromPhase: string, toPhase: string): boolean {
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
  const allowed = VALID_TRANSITIONS[fromPhase as WorkflowPhase];
  return allowed.includes(toPhase as WorkflowPhase);
}

/**
 * Ensures a transition is valid. Throws if invalid.
 */
export function assertValidTransition(skill: string, fromPhase: string, toPhase: string): void {
  // Skip check if the phase isn't actually changing
  if (fromPhase === toPhase) {
    return;
  }

  if (!isValidTransition(fromPhase, toPhase)) {
    throw new IllegalStateTransitionError(skill, fromPhase, toPhase);
  }
}
