/**
 * State management operations
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
    [key: string]: any;
}
/**
 * Read state from JSON file
 */
export declare function readState<T = any>(filePath: string): T | null;
/**
 * Write state to JSON file
 */
export declare function writeState(filePath: string, state: any): void;
/**
 * Get active skill state
 */
export declare function getActiveSkill(projectRoot?: string): SkillState | null;
/**
 * Set active skill
 */
export declare function setActiveSkill(state: SkillState, projectRoot?: string): void;
/**
 * Get skill-specific state
 */
export declare function getSkillState(skill: string, projectRoot?: string): SkillState | null;
/**
 * Set skill-specific state
 */
export declare function setSkillState(skill: string, state: SkillState, projectRoot?: string): void;
/**
 * Check if a workflow is active
 */
export declare function isWorkflowActive(projectRoot?: string): boolean;
/**
 * Cancel active workflow
 */
export declare function cancelWorkflow(reason?: string, projectRoot?: string): SkillState | null;
//# sourceMappingURL=manager.d.ts.map