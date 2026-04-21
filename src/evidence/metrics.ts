/**
 * Engineering Quality Metrics
 *
 * Tracks evidence submission discipline, claim accuracy, and shortcut attempts
 * across workflow sessions. Written to .omk/audit/ for post-session analysis.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Evidence } from './schema.js';
import type { ShortcutAttempt } from './anti-pattern-detector.js';

export interface EngineeringQualityReport {
  skill: string;
  sessionId: string;
  startedAt: string;
  completedAt?: string;

  // Submission discipline
  evidenceSubmissionRate: number; // submitted / required
  evidenceValidationRate: number; // passed / submitted

  // Claim accuracy
  claimAccuracy: number; // claims with matching evidence / total claims checked
  unverifiedClaims: string[];

  // Step completeness
  stepsCompleted: number;
  stepsSkipped: number;

  // Shortcut detection
  shortcutAttempts: ShortcutAttempt[];

  // Review depth
  reviewRounds: number;
}

function getAuditDir(cwd?: string): string {
  const dir = join(cwd || process.cwd(), '.omk', 'audit');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeQualityReport(report: EngineeringQualityReport, cwd?: string): void {
  const dir = getAuditDir(cwd);
  const filename = `quality-${report.skill}-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(join(dir, filename), JSON.stringify(report, null, 2));
}

export function readLatestQualityReport(
  skill: string,
  cwd?: string
): EngineeringQualityReport | null {
  const dir = getAuditDir(cwd);
  if (!existsSync(dir)) return null;

  const files = readdirSync(dir)
    .filter((f: string) => f.startsWith(`quality-${skill}-`) && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  try {
    const content = readFileSync(join(dir, files[0]), 'utf-8');
    return JSON.parse(content) as EngineeringQualityReport;
  } catch {
    return null;
  }
}

/**
 * Build a quality report from raw evidence and shortcut data.
 */
export function buildQualityReport(options: {
  skill: string;
  sessionId: string;
  requiredSteps: string[];
  evidence: Evidence[];
  checkedClaims: { claim: string; valid: boolean; reason?: string }[];
  shortcuts: ShortcutAttempt[];
  cwd?: string;
}): EngineeringQualityReport {
  const { skill, sessionId, requiredSteps, evidence, checkedClaims, shortcuts } = options;

  const submittedSteps = new Set(evidence.map((e) => e.step));
  const submittedCount = requiredSteps.filter((s) => submittedSteps.has(s)).length;

  const validEvidence = evidence.filter((e) => {
    // Simple heuristic: if exitCode is present, it must be 0
    if ('exitCode' in e && e.exitCode !== 0) return false;
    return true;
  });

  const unverified = checkedClaims.filter((c) => !c.valid).map((c) => c.claim);
  const accurateClaims = checkedClaims.filter((c) => c.valid).length;

  return {
    skill,
    sessionId,
    startedAt: evidence[0]?.submittedAt || new Date().toISOString(),
    evidenceSubmissionRate: requiredSteps.length > 0 ? submittedCount / requiredSteps.length : 1,
    evidenceValidationRate: evidence.length > 0 ? validEvidence.length / evidence.length : 1,
    claimAccuracy: checkedClaims.length > 0 ? accurateClaims / checkedClaims.length : 1,
    unverifiedClaims: unverified,
    stepsCompleted: submittedCount,
    stepsSkipped: requiredSteps.length - submittedCount,
    shortcutAttempts: shortcuts,
    reviewRounds: evidence.filter((e) => e.step.includes('_approved')).length,
  };
}
