/**
 * Anti-Pattern Detector
 *
 * Detects common shortcut patterns in AI behavior.
 * These patterns indicate the AI is trying to skip steps or make unverified claims.
 */

import type { Evidence } from './schema.js';

export interface ShortcutAttempt {
  type: string;
  description: string;
  severity: 'warning' | 'error';
}

export function detectShortcuts(
  skill: string,
  evidence: Evidence[],
  claim?: string
): ShortcutAttempt[] {
  const attempts: ShortcutAttempt[] = [];

  // 1. Phantom test results: claiming tests pass without evidence
  if (claim && /test.*pass|pass.*test/i.test(claim)) {
    const hasEvidence = evidence.some((e) => e.step === 'tests_passed');
    if (!hasEvidence) {
      attempts.push({
        type: 'phantom_test',
        description: 'Claimed tests pass without submitting test evidence',
        severity: 'error',
      });
    }
  }

  // 2. Phantom build: claiming build success without evidence
  if (claim && /build.*success|success.*build/i.test(claim)) {
    const hasEvidence = evidence.some((e) => e.step === 'build_passed');
    if (!hasEvidence) {
      attempts.push({
        type: 'phantom_build',
        description: 'Claimed build success without submitting build evidence',
        severity: 'error',
      });
    }
  }

  // 3. Self-approval: no independent review evidence for critical steps
  if (skill === 'ralph' || skill === 'autopilot') {
    const hasReview = evidence.some(
      (e) => e.step === 'architect_approved' || e.step === 'code_reviewed'
    );
    const hasChanges = evidence.some((e) => e.filesModified && e.filesModified.length > 0);
    if (hasChanges && !hasReview) {
      attempts.push({
        type: 'self_approval',
        description: 'Modified files but no independent review evidence found',
        severity: 'warning',
      });
    }
  }

  // 4. Minimal effort: very small diff for complex skills
  const diffEvidence = evidence.find((e) => e.step === 'diff_recorded');
  if (diffEvidence && diffEvidence.linesAdded !== undefined && diffEvidence.linesAdded < 3) {
    attempts.push({
      type: 'minimal_effort',
      description: `Only ${diffEvidence.linesAdded} lines added — possible shortcut for skill '${skill}'`,
      severity: 'warning',
    });
  }

  // 5. Missing context: no files read before modifications
  const contextEvidence = evidence.find((e) => e.step === 'context_loaded');
  const filesRead = contextEvidence?.filesRead ?? [];
  const filesModified = diffEvidence?.filesModified ?? [];
  if (filesModified.length > 0 && filesRead.length === 0) {
    attempts.push({
      type: 'unread_write',
      description: 'Modified files without reading any context first',
      severity: 'error',
    });
  }

  // 6. Skipped verification: entering verifying/completing without test/build evidence
  const hasTestEvidence = evidence.some((e) => e.step === 'tests_passed');
  const hasBuildEvidence = evidence.some((e) => e.step === 'build_passed');
  if ((skill === 'ralph' || skill === 'autopilot') && evidence.length > 2) {
    if (!hasTestEvidence && !hasBuildEvidence) {
      attempts.push({
        type: 'skipped_verification',
        description: 'Multiple evidence steps submitted but no test or build verification found',
        severity: 'error',
      });
    }
  }

  return attempts;
}
