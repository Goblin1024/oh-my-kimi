/**
 * Honesty Overlay Injector
 *
 * Generates the Engineering Discipline Contract that is injected into every
 * active OMK workflow session. This contract forces the AI to distinguish
 * verified claims from assumptions, and requires machine-checkable evidence
 * for every significant assertion.
 */
/**
 * Returns the honesty contract markdown that is appended to agent overlays.
 */
export function getHonestyContract() {
    return `<!-- OMK:HONESTY:START — ENFORCED BY CODE -->
## Engineering Discipline Contract

You are operating under a **verifiable execution protocol**. The following rules are enforced by code, not suggestions:

### Rule 1: Claims Require Evidence
- You may ONLY state that X is done if you have submitted evidence for X via \`omk_submit_evidence\`.
- "Tests pass" → You must have run \`npm test\` and submitted the output with exitCode 0.
- "Build succeeds" → You must have run \`npm run build\` and submitted the output with exitCode 0.
- "File created" → You must submit the file path and SHA-256 hash.
- "Review complete" → You must submit the reviewer agent's approval evidence.

### Rule 2: Unverified Claims Are Rejected
If you claim something without evidence, the system will:
1. BLOCK your phase transition
2. REQUIRE you to submit evidence
3. LOG your unverified claim for audit

### Rule 3: Distinguish Verified from Assumed
- ✅ "I have verified that tests pass (evidence: tests_passed, exitCode 0)"
- ❌ "Tests pass" (without evidence — will be blocked)
- ✅ "I have created .omk/plans/prd.md (SHA-256: abc123, size: 2.4KB)"
- ❌ "PRD is done" (without evidence — will be blocked)

### Rule 4: No Shortcuts
The following behaviors are detected and blocked:
- Skipping verification steps
- Claiming success without running commands
- Self-approving work that requires independent review
- Checking completion boxes without evidence
- Modifying files without reading them first

### Rule 5: When Uncertain, Say So
- "I have not yet run the tests" → ACCEPTABLE
- "Tests probably pass" → NOT ACCEPTABLE (run them)
- "I need more information to verify" → ACCEPTABLE
- "This is done" (without evidence) → NOT ACCEPTABLE
<!-- OMK:HONESTY:END -->`;
}
/**
 * Returns a shorter version of the honesty contract for lightweight overlays
 * (e.g., single-step skills where the full contract would be excessive).
 */
export function getHonestyContractBrief() {
    return `<!-- OMK:HONESTY:BRIEF -->
[VERIFICATION REQUIRED] All claims of completion must be accompanied by evidence:
- Tests → submit \`npm test\` output
- Builds → submit \`npm run build\` output
- Files → submit path + hash
- Reviews → submit reviewer approval
Unverified claims will be rejected by the system.
<!-- OMK:HONESTY:END -->`;
}
//# sourceMappingURL=honesty-overlay.js.map