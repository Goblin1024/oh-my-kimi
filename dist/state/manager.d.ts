/**
 * State management operations
 *
 * All writes use writeAtomic (write-to-temp-then-rename) so that concurrent
 * hook invocations or HUD polling can never observe a partially-written JSON.
 */
export interface SkillState {
    skill: string;
    active: boolean;
    phase: string;
    activated_at: string;
    updated_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    session_id?: string;
    iteration?: number;
    reason?: string;
}
/**
 * Read state from JSON file
 */
export declare function readState<T extends SkillState = SkillState>(filePath: string): T | null;
/**
 * Write state to JSON file using an atomic rename so reads always see
 * complete JSON even under concurrent access.
 */
export declare function writeState(filePath: string, state: SkillState): void;
/**
 * Get active skill state
 */
export declare function getActiveSkill(projectRoot?: string): SkillState | null;
/**
 * Save the active skill state globally.
 */
export declare function setActiveSkill(state: SkillState, cwd?: string): void;
/**
 * Retrieve skill-specific persistent state.
 */
export declare function getSkillState(skill: string, projectRoot?: string): SkillState | null;
/**
 * Save skill-specific persistent state.
 */
export declare function setSkillState(skill: string, state: SkillState, cwd?: string): void;
/**
 * Check if a workflow is active
 */
export declare function isWorkflowActive(projectRoot?: string): boolean;
/**
 * Cancel active workflow
 */
export declare function cancelWorkflow(reason?: string, projectRoot?: string): SkillState | null;
//# sourceMappingURL=manager.d.ts.map