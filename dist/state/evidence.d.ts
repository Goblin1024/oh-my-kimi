/**
 * Evidence State Management
 *
 * CRUD operations for workflow evidence files.
 * All writes are atomic (writeAtomic) to prevent corruption under concurrent access.
 */
import type { Evidence } from '../evidence/schema.js';
/**
 * Submit a new evidence record.
 */
export declare function submitEvidence(evidence: Evidence, cwd?: string): void;
/**
 * List all evidence files for a skill.
 */
export declare function listEvidence(skill: string, cwd?: string): Evidence[];
/**
 * Find the most recent evidence for a specific step.
 */
export declare function findEvidence(skill: string, step: string, cwd?: string): Evidence | null;
/**
 * Check if all required evidence for a phase transition is present and valid.
 */
export declare function verifyEvidenceForPhase(skill: string, phase: string, cwd?: string): {
    passed: boolean;
    missing: string[];
    invalid: {
        step: string;
        reason: string;
    }[];
};
/**
 * Clean up evidence older than the retention period (default 30 days).
 */
export declare function cleanupOldEvidence(skill: string, maxAgeDays?: number, cwd?: string): number;
//# sourceMappingURL=evidence.d.ts.map