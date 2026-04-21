/**
 * Engineering Quality Metrics
 *
 * Tracks evidence submission discipline, claim accuracy, and shortcut attempts
 * across workflow sessions. Written to .omk/audit/ for post-session analysis.
 */
import type { Evidence } from './schema.js';
import type { ShortcutAttempt } from './anti-pattern-detector.js';
export interface EngineeringQualityReport {
    skill: string;
    sessionId: string;
    startedAt: string;
    completedAt?: string;
    evidenceSubmissionRate: number;
    evidenceValidationRate: number;
    claimAccuracy: number;
    unverifiedClaims: string[];
    stepsCompleted: number;
    stepsSkipped: number;
    shortcutAttempts: ShortcutAttempt[];
    reviewRounds: number;
}
export declare function writeQualityReport(report: EngineeringQualityReport, cwd?: string): void;
export declare function readLatestQualityReport(skill: string, cwd?: string): EngineeringQualityReport | null;
/**
 * Build a quality report from raw evidence and shortcut data.
 */
export declare function buildQualityReport(options: {
    skill: string;
    sessionId: string;
    requiredSteps: string[];
    evidence: Evidence[];
    checkedClaims: {
        claim: string;
        valid: boolean;
        reason?: string;
    }[];
    shortcuts: ShortcutAttempt[];
    cwd?: string;
}): EngineeringQualityReport;
//# sourceMappingURL=metrics.d.ts.map