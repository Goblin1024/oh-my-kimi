/**
 * Evidence Schema
 *
 * Defines the machine-checkable evidence format used by the Evidence-Based Workflow Engine.
 * Every significant claim by the AI must be backed by an Evidence record.
 */
export type EvidenceType = 'command_output' | 'file_artifact' | 'review_signature' | 'diff_record' | 'context_record';
export interface Evidence {
    /** Skill that produced this evidence */
    skill: string;
    /** Step identifier (e.g. 'tests_passed', 'prd_written') */
    step: string;
    /** Phase this evidence unlocks */
    phase: string;
    /** ISO timestamp when evidence was submitted */
    submittedAt: string;
    /** Agent name that submitted the evidence */
    submitter: string;
    /** Type of evidence */
    evidenceType: EvidenceType;
    command?: string;
    output?: string;
    exitCode: number;
    cwd?: string;
    artifactPath?: string;
    artifactHash?: string;
    artifactSize?: number;
    reviewerAgent?: string;
    reviewResult?: 'approved' | 'rejected' | 'changes_requested';
    reviewEvidencePath?: string;
    filesModified?: string[];
    linesAdded?: number;
    linesRemoved?: number;
    diffHash?: string;
    filesRead?: string[];
    dependenciesAnalyzed?: boolean;
    metadata?: Record<string, unknown>;
}
export interface ValidationResult {
    valid: boolean;
    reason?: string;
}
//# sourceMappingURL=schema.d.ts.map