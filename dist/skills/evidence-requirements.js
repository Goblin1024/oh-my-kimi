/**
 * Evidence Requirements
 *
 * Defines the per-skill, per-phase evidence prerequisites.
 * Phase transitions are blocked until all required evidence for the target
 * phase has been submitted and validated.
 */
import { existsSync, statSync } from 'fs';
// ── Shared validators ──
function ok() {
    return { valid: true };
}
function fail(reason) {
    return { valid: false, reason };
}
export const validateTestEvidence = (e) => {
    if (e.exitCode !== 0)
        return fail(`Tests exited with code ${e.exitCode}`);
    if (!e.command?.includes('test'))
        return fail('Evidence command does not appear to be a test runner');
    return ok();
};
export const validateBuildEvidence = (e) => {
    if (e.exitCode !== 0)
        return fail(`Build exited with code ${e.exitCode}`);
    return ok();
};
export const validateLintEvidence = (e) => {
    if (e.exitCode !== 0)
        return fail(`Lint exited with code ${e.exitCode}`);
    return ok();
};
export const validateTypesEvidence = (e) => {
    if (e.exitCode !== 0)
        return fail(`Type check exited with code ${e.exitCode}`);
    return ok();
};
export const validateReviewEvidence = (e) => {
    if (e.reviewResult !== 'approved')
        return fail(`Review result was '${e.reviewResult}', expected 'approved'`);
    if (!e.reviewerAgent)
        return fail('Missing reviewerAgent in review evidence');
    return ok();
};
export const validateTodoEvidence = (e) => {
    const pending = e.metadata?.pendingCount;
    if (pending !== undefined && pending > 0)
        return fail(`TODO list has ${pending} pending items`);
    return ok();
};
export const validateDiffEvidence = (e) => {
    if (!e.filesModified || e.filesModified.length === 0)
        return fail('No files modified in diff evidence');
    return ok();
};
export const validateContextEvidence = (e) => {
    if (!e.filesRead || e.filesRead.length === 0)
        return fail('No files read in context evidence');
    return ok();
};
export const validatePrdEvidence = (e) => {
    if (!e.artifactPath)
        return fail('Missing artifactPath for PRD evidence');
    if (!existsSync(e.artifactPath))
        return fail(`PRD file does not exist: ${e.artifactPath}`);
    const size = statSync(e.artifactPath).size;
    if (size < 500)
        return fail(`PRD file is only ${size} bytes (minimum 500)`);
    return ok();
};
export const validateUserApproval = (e) => {
    if (e.evidenceType !== 'review_signature' && e.evidenceType !== 'context_record') {
        return fail('User approval must be a review_signature or context_record');
    }
    return ok();
};
export const validateSpecEvidence = (e) => {
    if (!e.artifactPath)
        return fail('Missing artifactPath for spec evidence');
    if (!existsSync(e.artifactPath))
        return fail(`Spec file does not exist: ${e.artifactPath}`);
    return ok();
};
// ── Per-skill requirements ──
export const SKILL_EVIDENCE_REQUIREMENTS = {
    ralph: {
        executing: [
            {
                step: 'context_loaded',
                description: 'Read project context and dependencies',
                validator: validateContextEvidence,
            },
        ],
        verifying: [
            { step: 'tests_passed', description: 'npm test exited 0', validator: validateTestEvidence },
            {
                step: 'build_passed',
                description: 'npm run build exited 0',
                validator: validateBuildEvidence,
            },
            { step: 'lint_clean', description: 'npm run lint exited 0', validator: validateLintEvidence },
            {
                step: 'types_clean',
                description: 'tsc --noEmit exited 0',
                validator: validateTypesEvidence,
            },
        ],
        completing: [
            {
                step: 'architect_approved',
                description: 'Independent architect review passed',
                validator: validateReviewEvidence,
            },
            {
                step: 'todo_cleared',
                description: 'Zero pending TODO items',
                validator: validateTodoEvidence,
            },
            {
                step: 'diff_recorded',
                description: 'All changes documented with diff',
                validator: validateDiffEvidence,
            },
        ],
    },
    ralplan: {
        designing: [
            {
                step: 'context_reviewed',
                description: 'Context analyzed and documented',
                validator: validateContextEvidence,
            },
        ],
        documenting: [
            {
                step: 'approaches_documented',
                description: '≥2 approaches with tradeoffs',
                validator: (e) => (e.metadata?.approachCount ?? 0) >= 2
                    ? ok()
                    : fail('Fewer than 2 approaches documented'),
            },
        ],
        approving: [
            {
                step: 'prd_written',
                description: 'PRD > 500 bytes in .omk/plans/prd-*.md',
                validator: validatePrdEvidence,
            },
        ],
        completed: [
            {
                step: 'user_approved',
                description: 'Explicit user approval recorded',
                validator: validateUserApproval,
            },
        ],
    },
    'deep-interview': {
        clarifying: [
            {
                step: 'questions_asked',
                description: '≥3 clarifying questions',
                validator: (e) => (e.metadata?.questionCount ?? 0) >= 3
                    ? ok()
                    : fail('Fewer than 3 questions asked'),
            },
        ],
        completed: [
            {
                step: 'spec_written',
                description: 'Specification document written',
                validator: validateSpecEvidence,
            },
        ],
    },
};
/**
 * Get the evidence requirements for a specific skill and target phase.
 */
export function getPhaseRequirements(skill, phase) {
    const skillReqs = SKILL_EVIDENCE_REQUIREMENTS[skill];
    if (!skillReqs)
        return undefined;
    return skillReqs[phase];
}
/**
 * Check if a skill has any evidence requirements defined.
 */
export function hasEvidenceRequirements(skill) {
    return skill in SKILL_EVIDENCE_REQUIREMENTS;
}
//# sourceMappingURL=evidence-requirements.js.map