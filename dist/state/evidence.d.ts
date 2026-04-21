/**
 * Evidence Persistence Layer
 *
 * Provides read/write operations for machine-checkable workflow evidence.
 * Evidence is stored as individual JSON files under:
 *   .omk/evidence/{skill}/{timestamp}-{step}.json
 *
 * All writes use atomic rename (writeAtomic) to prevent corruption under
 * concurrent access from multiple workers or the HUD.
 */
import type { Evidence } from '../evidence/schema.js';
/**
 * Get the evidence directory for a given skill.
 */
export declare function getEvidenceDir(skill: string, cwd?: string): string;
/**
 * Submit a new evidence record.
 * Writes to .omk/evidence/{skill}/{timestamp}-{step}.json
 */
export declare function submitEvidence(ev: Evidence, cwd?: string): void;
/**
 * List all evidence records for a skill, newest first.
 */
export declare function listEvidence(skill: string, cwd?: string): Evidence[];
/**
 * Find the most recent evidence for a specific step.
 */
export declare function findEvidence(skill: string, step: string, cwd?: string): Evidence | null;
/**
 * Get all evidence records that satisfy the requirements for a target phase.
 * Returns an object with `satisfied` (boolean) and `missing` (array of requirement descriptions).
 */
export declare function getEvidenceForSkillPhase(skill: string, phase: string, cwd?: string): {
    evidence: Evidence[];
    satisfied: boolean;
    missing: string[];
};
/**
 * Check if a phase transition is blocked by missing evidence.
 * Returns null if allowed, or a descriptive error message if blocked.
 */
export declare function checkPhaseEvidence(skill: string, toPhase: string, cwd?: string): string | null;
//# sourceMappingURL=evidence.d.ts.map