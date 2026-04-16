/**
 * State file path utilities
 */
/** Get Kimi home directory */
export declare function kimiHome(): string;
/** Get OMK skills directory */
export declare function omkSkillsDir(): string;
/** Get project OMK state directory */
export declare function omkStateDir(projectRoot?: string): string;
/** Get project OMK plans directory */
export declare function omkPlansDir(projectRoot?: string): string;
/** Get project OMK context directory */
export declare function omkContextDir(projectRoot?: string): string;
/** Get skill-active state file path */
export declare function skillActivePath(projectRoot?: string): string;
/** Get specific skill state file path */
export declare function skillStatePath(skill: string, projectRoot?: string): string;
//# sourceMappingURL=paths.d.ts.map