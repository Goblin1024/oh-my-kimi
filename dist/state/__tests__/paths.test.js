/**
 * Tests for state path utilities
 */
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { kimiHome, omkSkillsDir, omkStateDir, omkPlansDir, omkContextDir, skillActivePath, skillStatePath, } from '../paths.js';
import { join } from 'path';
import { homedir } from 'os';
describe('paths', () => {
    const originalEnv = process.env.KIMI_HOME;
    after(() => {
        // Restore original env
        if (originalEnv !== undefined) {
            process.env.KIMI_HOME = originalEnv;
        }
        else {
            delete process.env.KIMI_HOME;
        }
    });
    describe('kimiHome', () => {
        it('returns default path when KIMI_HOME is not set', () => {
            delete process.env.KIMI_HOME;
            const result = kimiHome();
            assert.equal(result, join(homedir(), '.kimi'));
        });
        it('returns KIMI_HOME env value when set', () => {
            process.env.KIMI_HOME = '/custom/kimi/home';
            const result = kimiHome();
            assert.equal(result, '/custom/kimi/home');
        });
    });
    describe('omkSkillsDir', () => {
        it('returns skills/omk under kimi home', () => {
            delete process.env.KIMI_HOME;
            const result = omkSkillsDir();
            assert.equal(result, join(homedir(), '.kimi', 'skills', 'omk'));
        });
    });
    describe('omkStateDir', () => {
        it('returns .omk/state under project root', () => {
            const result = omkStateDir('/my/project');
            assert.equal(result, join('/my/project', '.omk', 'state'));
        });
        it('uses cwd when no project root given', () => {
            const result = omkStateDir();
            assert.equal(result, join(process.cwd(), '.omk', 'state'));
        });
    });
    describe('omkPlansDir', () => {
        it('returns .omk/plans under project root', () => {
            const result = omkPlansDir('/my/project');
            assert.equal(result, join('/my/project', '.omk', 'plans'));
        });
    });
    describe('omkContextDir', () => {
        it('returns .omk/context under project root', () => {
            const result = omkContextDir('/my/project');
            assert.equal(result, join('/my/project', '.omk', 'context'));
        });
    });
    describe('skillActivePath', () => {
        it('returns skill-active.json under state dir', () => {
            const result = skillActivePath('/my/project');
            assert.equal(result, join('/my/project', '.omk', 'state', 'skill-active.json'));
        });
    });
    describe('skillStatePath', () => {
        it('returns skill-specific state file under state dir', () => {
            const result = skillStatePath('ralph', '/my/project');
            assert.equal(result, join('/my/project', '.omk', 'state', 'ralph-state.json'));
        });
        it('handles deep-interview skill name', () => {
            const result = skillStatePath('deep-interview', '/my/project');
            assert.equal(result, join('/my/project', '.omk', 'state', 'deep-interview-state.json'));
        });
    });
});
//# sourceMappingURL=paths.test.js.map