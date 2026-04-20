/**
 * Agents Overlay Injector
 *
 * Dynamically resolves the agent role prompt for a given active skill.
 * This ensures that Kimi always receives its operating principles
 * upon session start without hardcoding them into the project workspace.
 */
/**
 * Maps a skill name to an agent role prompt file.
 */
export declare function resolveAgentForSkill(skill: string): string;
/**
 * Loads the prompt text for a specific agent role.
 */
export declare function loadAgentPrompt(promptFile: string): string | null;
/**
 * Generates the overlay text to inject for the active skill.
 */
export declare function injectOverlay(skill: string): string;
//# sourceMappingURL=agents-overlay.d.ts.map