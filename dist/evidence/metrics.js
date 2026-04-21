/**
 * Engineering Quality Metrics
 *
 * Tracks evidence submission discipline, claim accuracy, and shortcut attempts
 * across workflow sessions. Written to .omk/audit/ for post-session analysis.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
function getAuditDir(cwd) {
    const dir = join(cwd || process.cwd(), '.omk', 'audit');
    mkdirSync(dir, { recursive: true });
    return dir;
}
export function writeQualityReport(report, cwd) {
    const dir = getAuditDir(cwd);
    const filename = `quality-${report.skill}-${new Date().toISOString().slice(0, 10)}.json`;
    writeFileSync(join(dir, filename), JSON.stringify(report, null, 2));
}
export function readLatestQualityReport(skill, cwd) {
    const dir = getAuditDir(cwd);
    if (!existsSync(dir))
        return null;
    const files = readdirSync(dir)
        .filter((f) => f.startsWith(`quality-${skill}-`) && f.endsWith('.json'))
        .sort()
        .reverse();
    if (files.length === 0)
        return null;
    try {
        const content = readFileSync(join(dir, files[0]), 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Build a quality report from raw evidence and shortcut data.
 */
export function buildQualityReport(options) {
    const { skill, sessionId, requiredSteps, evidence, checkedClaims, shortcuts } = options;
    const submittedSteps = new Set(evidence.map((e) => e.step));
    const submittedCount = requiredSteps.filter((s) => submittedSteps.has(s)).length;
    const validEvidence = evidence.filter((e) => {
        // Simple heuristic: if exitCode is present, it must be 0
        if ('exitCode' in e && e.exitCode !== 0)
            return false;
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
//# sourceMappingURL=metrics.js.map