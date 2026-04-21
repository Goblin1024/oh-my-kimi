/**
 * Evidence Schema
 *
 * Defines the machine-checkable evidence format used by the Evidence-Based Workflow Engine.
 * Every significant claim by the AI must be backed by an Evidence record.
 */

export type EvidenceType =
  | 'command_output'
  | 'file_artifact'
  | 'review_signature'
  | 'diff_record'
  | 'context_record';

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

  // ── command_output: AI must have RUN the command ──
  command?: string;
  output?: string;
  exitCode: number;
  cwd?: string;

  // ── file_artifact: AI must have CREATED the file ──
  artifactPath?: string;
  artifactHash?: string;
  artifactSize?: number;

  // ── review_signature: AI must have DELEGATED review ──
  reviewerAgent?: string;
  reviewResult?: 'approved' | 'rejected' | 'changes_requested';
  reviewEvidencePath?: string;

  // ── diff_record: AI must show WHAT changed ──
  filesModified?: string[];
  linesAdded?: number;
  linesRemoved?: number;
  diffHash?: string;

  // ── context_record: AI must prove it READ before writing ──
  filesRead?: string[];
  dependenciesAnalyzed?: boolean;

  // Free-form metadata for extensibility
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}
