/**
 * Evidence Requirements
 *
 * Defines the per-skill, per-phase evidence prerequisites.
 * Phase transitions are blocked until all required evidence for the target
 * phase has been submitted and validated.
 */
import type { Evidence, ValidationResult } from '../evidence/schema.js';
export interface PhaseRequirement {
    step: string;
    description: string;
    validator?: (evidence: Evidence) => ValidationResult;
}
export type SkillEvidenceRequirements = Record<string, PhaseRequirement[]>;
export declare const validateTestEvidence: (e: Evidence) => ValidationResult;
export declare const validateBuildEvidence: (e: Evidence) => ValidationResult;
export declare const validateLintEvidence: (e: Evidence) => ValidationResult;
export declare const validateTypesEvidence: (e: Evidence) => ValidationResult;
export declare const validateReviewEvidence: (e: Evidence) => ValidationResult;
export declare const validateTodoEvidence: (e: Evidence) => ValidationResult;
export declare const validateDiffEvidence: (e: Evidence) => ValidationResult;
export declare const validateContextEvidence: (e: Evidence) => ValidationResult;
export declare const validatePrdEvidence: (e: Evidence) => ValidationResult;
export declare const validateUserApproval: (e: Evidence) => ValidationResult;
export declare const validateSpecEvidence: (e: Evidence) => ValidationResult;
export declare const SKILL_EVIDENCE_REQUIREMENTS: Record<string, Record<string, PhaseRequirement[]>>;
/**
 * Get the evidence requirements for a specific skill and target phase.
 */
export declare function getPhaseRequirements(skill: string, phase: string): PhaseRequirement[] | undefined;
/**
 * Check if a skill has any evidence requirements defined.
 */
export declare function hasEvidenceRequirements(skill: string): boolean;
//# sourceMappingURL=evidence-requirements.d.ts.map