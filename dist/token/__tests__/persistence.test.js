/**
 * Tests for Token State Persistence
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { saveTokenState, loadTokenState, clearTokenState } from '../persistence.js';
describe('token/persistence', () => {
    let testDir;
    beforeEach(() => {
        testDir = join(tmpdir(), `omk-token-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        mkdirSync(testDir, { recursive: true });
    });
    afterEach(() => {
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });
    function makeSnapshot(skill) {
        return {
            skill,
            budget: 32_000,
            used: 12_000,
            remaining: 20_000,
            status: 'ok',
            efficiency: 75,
            route: {
                reasoningEffort: 'medium',
                maxTokens: 32_000,
                maxSteps: 30,
            },
            timestamp: new Date().toISOString(),
        };
    }
    it('saves and loads a token state snapshot', () => {
        const snap = makeSnapshot('ralph');
        saveTokenState(snap, testDir);
        const loaded = loadTokenState('ralph', testDir);
        assert.ok(loaded);
        assert.equal(loaded.skill, 'ralph');
        assert.equal(loaded.budget, 32_000);
        assert.equal(loaded.used, 12_000);
        assert.equal(loaded.efficiency, 75);
    });
    it('returns null for non-existent state', () => {
        const loaded = loadTokenState('unknown', testDir);
        assert.equal(loaded, null);
    });
    it('clears token state', () => {
        const snap = makeSnapshot('plan');
        saveTokenState(snap, testDir);
        const statePath = join(testDir, '.omk', 'state', 'token-plan.json');
        assert.ok(existsSync(statePath), `Expected state file at ${statePath}`);
        clearTokenState('plan', testDir);
        assert.ok(!existsSync(statePath));
    });
    it('overwrites existing state', () => {
        const snap1 = makeSnapshot('ralph');
        snap1.used = 5_000;
        saveTokenState(snap1, testDir);
        const snap2 = makeSnapshot('ralph');
        snap2.used = 15_000;
        saveTokenState(snap2, testDir);
        const loaded = loadTokenState('ralph', testDir);
        assert.equal(loaded.used, 15_000);
    });
});
//# sourceMappingURL=persistence.test.js.map