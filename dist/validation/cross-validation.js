/**
 * Cross-Validation Network
 *
 * Enforces the principle: "No agent approves its own work."
 * Critical steps require independent verification by designated reviewers.
 */
/** Built-in cross-validation rules */
export const CROSS_VALIDATION_RULES = [
    {
        name: 'architect_output',
        requiresReviewBy: ['critic'],
        minReviewerCount: 1,
        evidenceStep: 'architect_approved',
    },
    {
        name: 'implementation',
        requiresReviewBy: ['test-engineer', 'code-reviewer'],
        minReviewerCount: 1,
        evidenceStep: 'code_reviewed',
    },
    {
        name: 'security_touch',
        requiresReviewBy: ['security-reviewer'],
        minReviewerCount: 1,
        evidenceStep: 'security_approved',
        trigger: (_ev, files) => files?.some((f) => /auth|password|token|secret|encrypt/i.test(f)) ?? false,
    },
    {
        name: 'large_change',
        requiresReviewBy: ['architect'],
        minReviewerCount: 1,
        evidenceStep: 'architect_approved',
        trigger: (ev) => (ev.linesAdded ?? 0) + (ev.linesRemoved ?? 0) > 100,
    },
];
/**
 * Check whether all applicable cross-validation rules are satisfied
 * for a given set of evidence.
 *
 * @param evidence - All evidence submitted so far
 * @param changedFiles - Optional list of changed file paths (for file-based triggers)
 * @returns Array of per-rule results
 */
export function checkCrossValidation(evidence, changedFiles) {
    return CROSS_VALIDATION_RULES.map((rule) => {
        const triggered = rule.trigger
            ? rule.trigger(evidence[0] ?? {}, changedFiles)
            : true;
        if (!triggered) {
            return {
                rule: rule.name,
                satisfied: true,
                requiredReviewers: rule.requiresReviewBy,
                foundReviewers: [],
                evidenceStep: rule.evidenceStep,
                triggered: false,
                details: 'Rule not triggered for this change set',
            };
        }
        // Find evidence matching the required step
        const reviewEvidence = evidence.filter((ev) => ev.step === rule.evidenceStep);
        // Extract reviewer agents from the evidence
        const foundReviewers = reviewEvidence
            .map((ev) => ev.reviewerAgent)
            .filter((r) => Boolean(r));
        // Check if any of the found reviewers match the required roles
        const validReviewers = foundReviewers.filter((r) => rule.requiresReviewBy.some((required) => r.toLowerCase().includes(required.toLowerCase())));
        const satisfied = validReviewers.length >= rule.minReviewerCount;
        return {
            rule: rule.name,
            satisfied,
            requiredReviewers: rule.requiresReviewBy,
            foundReviewers: validReviewers,
            evidenceStep: rule.evidenceStep,
            triggered: true,
            details: satisfied
                ? `Approved by ${validReviewers.join(', ')}`
                : `Requires review by ${rule.requiresReviewBy.join(' or ')}; found ${validReviewers.length}/${rule.minReviewerCount}`,
        };
    });
}
/**
 * Return only the rules that are triggered but NOT satisfied.
 */
export function getBlockingValidations(evidence, changedFiles) {
    return checkCrossValidation(evidence, changedFiles).filter((r) => r.triggered && !r.satisfied);
}
/**
 * Check if any cross-validation rule is blocking progression.
 */
export function hasBlockingValidations(evidence, changedFiles) {
    return getBlockingValidations(evidence, changedFiles).length > 0;
}
/**
 * Format validation results as a human-readable summary.
 */
export function formatValidationResults(results) {
    const lines = [];
    for (const r of results) {
        const icon = r.satisfied ? '✓' : r.triggered ? '✗' : '○';
        lines.push(`${icon} ${r.rule}: ${r.details}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=cross-validation.js.map