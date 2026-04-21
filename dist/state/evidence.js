/**
 * Evidence Persistence Layer
 *
 * Provides read/write operations for machine-checkable workflow evidence.
 * Evidence is stored as individual JSON files under:
 *   .omk/evidence/{skill}/{timestamp}-{step}.json
 *
 * All writes use atomic rename (writeAtomic) to prevent corruption under
 * concurrent access from multiple workers or the HUD.
 */
import { mkdirSync, readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { writeAtomic } from './atomic.js';
import { getPhaseRequirements } from '../skills/evidence-requirements.js';
/**
 * Get the evidence directory for a given skill.
 */
export function getEvidenceDir(skill, cwd) {
    const projectRoot = cwd ?? process.cwd();
    return join(projectRoot, '.omk', 'evidence', skill);
}
/**
 * Submit a new evidence record.
 * Writes to .omk/evidence/{skill}/{timestamp}-{step}.json
 */
export function submitEvidence(ev, cwd) {
    const dir = getEvidenceDir(ev.skill, cwd);
    mkdirSync(dir, { recursive: true });
    const timestamp = ev.submittedAt.replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomSuffix}-${ev.step}.json`;
    const filePath = join(dir, fileName);
    writeAtomic(filePath, JSON.stringify(ev, null, 2));
}
/**
 * List all evidence records for a skill, newest first.
 */
export function listEvidence(skill, cwd) {
    const dir = getEvidenceDir(skill, cwd);
    if (!existsSync(dir))
        return [];
    const files = readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .reverse();
    const results = [];
    for (const file of files) {
        try {
            const content = readFileSync(join(dir, file), 'utf-8');
            results.push(JSON.parse(content));
        }
        catch {
            // Skip corrupted evidence files
        }
    }
    return results;
}
/**
 * Find the most recent evidence for a specific step.
 */
export function findEvidence(skill, step, cwd) {
    const all = listEvidence(skill, cwd);
    return all.find((e) => e.step === step) ?? null;
}
/**
 * Get all evidence records that satisfy the requirements for a target phase.
 * Returns an object with `satisfied` (boolean) and `missing` (array of requirement descriptions).
 */
export function getEvidenceForSkillPhase(skill, phase, cwd) {
    const requirements = getPhaseRequirements(skill, phase);
    if (!requirements || requirements.length === 0) {
        return { evidence: [], satisfied: true, missing: [] };
    }
    const allEvidence = listEvidence(skill, cwd);
    const found = [];
    const missing = [];
    for (const req of requirements) {
        const ev = allEvidence.find((e) => e.step === req.step);
        if (ev) {
            found.push(ev);
        }
        else {
            missing.push(req.description);
        }
    }
    return {
        evidence: found,
        satisfied: missing.length === 0,
        missing,
    };
}
/**
 * Check if a phase transition is blocked by missing evidence.
 * Returns null if allowed, or a descriptive error message if blocked.
 */
export function checkPhaseEvidence(skill, toPhase, cwd) {
    const { satisfied, missing } = getEvidenceForSkillPhase(skill, toPhase, cwd);
    if (satisfied)
        return null;
    return (`🚫 BLOCKED: Cannot enter '${toPhase}'.\n` +
        `Missing evidence:\n` +
        missing.map((m) => `  - ${m}`).join('\n') +
        `\n→ Submit via: omk_submit_evidence({skill:"${skill}", step:"<step>", ...})`);
}
//# sourceMappingURL=evidence.js.map