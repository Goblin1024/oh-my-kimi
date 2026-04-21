/**
 * Tests for Evidence Persistence Layer
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { submitEvidence, listEvidence, findEvidence, getEvidenceForSkillPhase, getEvidenceDir, } from '../evidence.js';
describe('state/evidence', () => {
    let testDir;
    const skill = 'ralph';
    beforeEach(() => {
        testDir = join(tmpdir(), `omk-evidence-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        mkdirSync(testDir, { recursive: true });
    });
    afterEach(() => {
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });
    function makeEvidence(step, phase) {
        return {
            skill,
            step,
            phase,
            submittedAt: new Date().toISOString(),
            submitter: 'test',
            evidenceType: 'command_output',
            exitCode: 0,
            command: 'npm test',
            output: 'all tests passed',
        };
    }
    it('submits evidence to the correct directory', () => {
        const ev = makeEvidence('tests_passed', 'verifying');
        submitEvidence(ev, testDir);
        const dir = getEvidenceDir(skill, testDir);
        assert.ok(existsSync(dir), 'evidence directory should be created');
    });
    it('lists all evidence for a skill', () => {
        submitEvidence(makeEvidence('tests_passed', 'verifying'), testDir);
        submitEvidence(makeEvidence('build_passed', 'verifying'), testDir);
        const all = listEvidence(skill, testDir);
        assert.equal(all.length, 2);
        assert.ok(all.some((e) => e.step === 'tests_passed'));
        assert.ok(all.some((e) => e.step === 'build_passed'));
    });
    it('finds the most recent evidence for a step', () => {
        const ev1 = makeEvidence('tests_passed', 'verifying');
        ev1.submittedAt = new Date(Date.now() - 1000).toISOString();
        submitEvidence(ev1, testDir);
        const ev2 = makeEvidence('tests_passed', 'verifying');
        ev2.submittedAt = new Date().toISOString();
        submitEvidence(ev2, testDir);
        const found = findEvidence(skill, 'tests_passed', testDir);
        assert.ok(found);
        assert.equal(found.submitter, 'test');
    });
    it('returns null when evidence is not found', () => {
        const found = findEvidence(skill, 'nonexistent', testDir);
        assert.equal(found, null);
    });
    it('checks phase requirements correctly', () => {
        submitEvidence(makeEvidence('tests_passed', 'verifying'), testDir);
        submitEvidence(makeEvidence('build_passed', 'verifying'), testDir);
        submitEvidence(makeEvidence('lint_clean', 'verifying'), testDir);
        submitEvidence(makeEvidence('types_clean', 'verifying'), testDir);
        const result = getEvidenceForSkillPhase('ralph', 'verifying', testDir);
        assert.ok(result.satisfied, 'verifying requirements should be satisfied');
        assert.equal(result.missing.length, 0);
    });
    it('reports missing evidence for a phase', () => {
        submitEvidence(makeEvidence('tests_passed', 'verifying'), testDir);
        const result = getEvidenceForSkillPhase('ralph', 'verifying', testDir);
        assert.ok(!result.satisfied, 'verifying requirements should NOT be satisfied');
        assert.ok(result.missing.length > 0);
    });
    it('returns empty for unknown skill/phase', () => {
        const result = getEvidenceForSkillPhase('unknown-skill', 'unknown-phase', testDir);
        assert.ok(result.satisfied);
        assert.equal(result.evidence.length, 0);
        assert.equal(result.missing.length, 0);
    });
    it('returns empty list when no evidence exists', () => {
        const all = listEvidence(skill, testDir);
        assert.equal(all.length, 0);
    });
});
//# sourceMappingURL=evidence.test.js.map