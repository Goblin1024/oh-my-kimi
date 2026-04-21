/**
 * Skill Manifest Parser
 *
 * Reads and parses the YAML frontmatter from SKILL.md files, returning a
 * typed SkillManifest that the rest of the code can use for validation and
 * workflow control — instead of treating SKILL.md as opaque documentation.
 *
 * Expected frontmatter format:
 * ---
 * name: ralplan
 * description: Architecture planning and approval
 * trigger: $ralplan
 * flags:
 *   - name: --deliberate
 *     description: Enable extended multi-round review
 * phases:
 *   - starting
 *   - planning
 *   - reviewing
 *   - approved
 * gates:
 *   - type: prompt_specificity
 *     description: Prompt must reference a specific task or feature
 * ---
 */
export interface SkillFlag {
    name: string;
    description: string;
    required?: boolean;
}
export type GateType = 'prompt_specificity' | 'has_active_plan' | 'workflow_not_active' | 'custom' | 'no_shortcut_keywords' | 'has_verification_plan' | 'proper_decomposition' | 'flag_semantic_check';
export interface SkillGate {
    type: GateType;
    description: string;
    /** For type='custom', a JS regex pattern that the prompt must match */
    pattern?: string;
    /** Whether gate failure blocks activation (default: true) */
    blocking?: boolean;
}
export interface SkillManifest {
    name: string;
    description: string;
    trigger?: string;
    flags: SkillFlag[];
    phases: string[];
    gates: SkillGate[];
    /** Raw frontmatter lines not parsed into known fields */
    raw: Record<string, unknown>;
}
/** Default phases used when a skill doesn't specify its own */
export declare const DEFAULT_PHASES: string[];
/**
 * Load and parse the manifest for a given skill name.
 * Returns null if the SKILL.md cannot be found.
 * Results are cached per skill name.
 */
export declare function loadSkillManifest(skillName: string, cwd?: string): SkillManifest | null;
/** Clear the manifest cache (useful in tests) */
export declare function clearManifestCache(): void;
//# sourceMappingURL=parser.d.ts.map