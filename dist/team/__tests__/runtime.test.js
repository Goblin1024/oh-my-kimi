/**
 * Tests for Team Runtime
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { TeamRuntime } from '../runtime.js';
import { getTeamState, setTeamState } from '../state.js';
import { join } from 'path';
import { mkdirSync, rmSync } from 'fs';
describe('team/runtime', () => {
    const testDir = join(process.cwd(), '.tmp-team-test');
    before(() => {
        mkdirSync(testDir, { recursive: true });
        // Force mock mode
        process.env.OMK_MOCK_TEAM = '1';
        process.env.MOCK_DELAY = '100'; // Make it very fast for tests
    });
    after(() => {
        try {
            rmSync(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        }
        catch (_e) {
            // Ignore EBUSY if it still happens on Windows
        }
    });
    it('can start a team and wait for completion', async () => {
        // Ensure clean state
        setTeamState({ active: false, role: '', task: '', startedAt: '', workers: [] }, testDir);
        const runtime = new TeamRuntime();
        await runtime.startTeam(2, 'executor', 'Run a test task', testDir);
        const state = getTeamState(testDir);
        assert.ok(state);
        assert.equal(state?.active, true);
        assert.equal(state?.workers.length, 2);
        // Allow mock workers to finish
        await new Promise((resolve) => setTimeout(resolve, 300));
        const finalState = getTeamState(testDir);
        assert.equal(finalState?.active, false); // should be false when all workers finish
        assert.ok(finalState?.workers.every((w) => w.status === 'completed'));
    });
    it('can gracefully shutdown an active team', async () => {
        setTeamState({ active: false, role: '', task: '', startedAt: '', workers: [] }, testDir);
        const runtime = new TeamRuntime();
        // Slow mock so we can shut it down
        process.env.MOCK_DELAY = '5000';
        await runtime.startTeam(1, 'planner', 'Long task', testDir);
        const state = getTeamState(testDir);
        assert.equal(state?.active, true);
        await runtime.shutdownTeam(testDir);
        const afterShutdown = getTeamState(testDir);
        assert.equal(afterShutdown?.active, false);
        assert.equal(afterShutdown?.workers[0].status, 'terminated');
    });
});
//# sourceMappingURL=runtime.test.js.map