/**
 * Honesty Validator
 *
 * Pattern-matches AI claims against submitted evidence.
 * If the AI claims X without evidence, the system detects and reports it.
 */

import { existsSync } from 'fs';
import type { Evidence, ValidationResult } from './schema.js';

export function validateClaim(claim: string, evidence: Evidence[]): ValidationResult {
  const lowerClaim = claim.toLowerCase();

  // Pattern: "all tests pass" / "tests passed"
  if (
    lowerClaim.includes('test') &&
    (lowerClaim.includes('pass') || lowerClaim.includes('all green'))
  ) {
    const ev = evidence.find((e) => e.step === 'tests_passed');
    if (!ev) return { valid: false, reason: 'Claimed tests pass but no test evidence submitted' };
    if (ev.exitCode !== 0) return { valid: false, reason: `Tests exited with code ${ev.exitCode}` };
    if (!ev.command?.includes('test'))
      return { valid: false, reason: 'Evidence command does not appear to be a test runner' };
  }

  // Pattern: "build successful" / "build passes"
  if (
    lowerClaim.includes('build') &&
    (lowerClaim.includes('success') || lowerClaim.includes('pass'))
  ) {
    const ev = evidence.find((e) => e.step === 'build_passed');
    if (!ev)
      return { valid: false, reason: 'Claimed build success but no build evidence submitted' };
    if (ev.exitCode !== 0) return { valid: false, reason: `Build exited with code ${ev.exitCode}` };
  }

  // Pattern: "lint clean" / "lint passes"
  if (
    lowerClaim.includes('lint') &&
    (lowerClaim.includes('clean') || lowerClaim.includes('pass'))
  ) {
    const ev = evidence.find((e) => e.step === 'lint_clean');
    if (!ev) return { valid: false, reason: 'Claimed lint clean but no lint evidence submitted' };
    if (ev.exitCode !== 0) return { valid: false, reason: `Lint exited with code ${ev.exitCode}` };
  }

  // Pattern: "types clean" / "type check passes"
  if (
    (lowerClaim.includes('type') || lowerClaim.includes('tsc')) &&
    (lowerClaim.includes('clean') || lowerClaim.includes('pass') || lowerClaim.includes('no error'))
  ) {
    const ev = evidence.find((e) => e.step === 'types_clean');
    if (!ev)
      return { valid: false, reason: 'Claimed types clean but no type-check evidence submitted' };
    if (ev.exitCode !== 0)
      return { valid: false, reason: `Type check exited with code ${ev.exitCode}` };
  }

  // Pattern: "file created" / "saved to" / "wrote to"
  const fileMatch = claim.match(/saved to|created|wrote.*?to\s+(\S+)/i);
  if (fileMatch) {
    const claimedPath = fileMatch[1];
    const fileEvidence = evidence.find((e) => e.artifactPath === claimedPath);
    if (!fileEvidence)
      return {
        valid: false,
        reason: `Claimed file ${claimedPath} but no artifact evidence submitted`,
      };
    if (!existsSync(claimedPath))
      return { valid: false, reason: `Claimed file ${claimedPath} does not exist on disk` };
  }

  // Pattern: "reviewed by architect" / "architect approved"
  if (
    lowerClaim.includes('architect') &&
    (lowerClaim.includes('review') || lowerClaim.includes('approv'))
  ) {
    const ev = evidence.find((e) => e.step === 'architect_approved');
    if (!ev)
      return { valid: false, reason: 'Claimed architect review but no review evidence submitted' };
    if (ev.reviewResult !== 'approved')
      return { valid: false, reason: `Architect review result was ${ev.reviewResult}` };
  }

  // Pattern: "reviewed by security-reviewer"
  if (
    lowerClaim.includes('security') &&
    (lowerClaim.includes('review') || lowerClaim.includes('approv'))
  ) {
    const ev = evidence.find((e) => e.step === 'security_approved');
    if (!ev)
      return { valid: false, reason: 'Claimed security review but no review evidence submitted' };
    if (ev.reviewResult !== 'approved')
      return { valid: false, reason: `Security review result was ${ev.reviewResult}` };
  }

  // Pattern: "code reviewed" / "reviewed by code-reviewer"
  if (lowerClaim.includes('code') && lowerClaim.includes('review')) {
    const ev = evidence.find((e) => e.step === 'code_reviewed');
    if (!ev)
      return { valid: false, reason: 'Claimed code review but no review evidence submitted' };
    if (ev.reviewResult !== 'approved')
      return { valid: false, reason: `Code review result was ${ev.reviewResult}` };
  }

  // Pattern: "todo cleared" / "all todos done"
  if (
    lowerClaim.includes('todo') &&
    (lowerClaim.includes('clear') || lowerClaim.includes('done') || lowerClaim.includes('empty'))
  ) {
    const ev = evidence.find((e) => e.step === 'todo_cleared');
    if (!ev) return { valid: false, reason: 'Claimed TODO cleared but no TODO evidence submitted' };
  }

  // Pattern: "PRD written" / "spec written"
  if (
    (lowerClaim.includes('prd') || lowerClaim.includes('spec')) &&
    (lowerClaim.includes('written') ||
      lowerClaim.includes('done') ||
      lowerClaim.includes('created'))
  ) {
    const ev = evidence.find((e) => e.step === 'prd_written' || e.step === 'spec_written');
    if (!ev)
      return {
        valid: false,
        reason: 'Claimed document written but no artifact evidence submitted',
      };
    if (ev.artifactPath && !existsSync(ev.artifactPath)) {
      return { valid: false, reason: `Claimed document ${ev.artifactPath} does not exist on disk` };
    }
  }

  return { valid: true };
}
