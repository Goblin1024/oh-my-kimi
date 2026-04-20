/**
 * Tests for src/skills/validator.ts
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateFlags, checkGates } from '../validator.js';
import { clearManifestCache } from '../parser.js';
describe('skills/validator', () => {
    beforeEach(() => {
        clearManifestCache();
    });
    describe('validateFlags', () => {
        it('returns valid when no flags are provided', () => {
            const result = validateFlags('ralph', '$ralph implement the auth module', process.cwd());
            assert.equal(result.valid, true);
            assert.deepEqual(result.unknownFlags, []);
        });
        it('returns valid for a known flag', () => {
            const result = validateFlags('ralph', '$ralph --prd implement the auth module', process.cwd());
            assert.equal(result.valid, true);
        });
        it('returns invalid for an unknown flag', () => {
            const result = validateFlags('ralph', '$ralph --unknown-flag implement something', process.cwd());
            assert.equal(result.valid, false);
            assert.ok(result.unknownFlags.includes('--unknown-flag'));
            assert.ok(result.message?.includes('--unknown-flag'));
        });
        it('returns valid for skills with no flags defined', () => {
            const result = validateFlags('cancel', '$cancel', process.cwd());
            assert.equal(result.valid, true);
        });
        it('accepts known ralplan flags', () => {
            const result = validateFlags('ralplan', '$ralplan --deliberate build the auth system', process.cwd());
            assert.equal(result.valid, true);
        });
    });
    describe('checkGates', () => {
        it('passes prompt_specificity gate with a detailed prompt', () => {
            const results = checkGates('ralph', '$ralph implement the user authentication module', process.cwd());
            const gate = results.find((r) => r.gate === 'prompt_specificity');
            assert.ok(gate, 'Should have prompt_specificity gate');
            assert.equal(gate.passed, true);
        });
        it('fails prompt_specificity gate with a bare prompt', () => {
            const results = checkGates('ralph', '$ralph x', process.cwd());
            const gate = results.find((r) => r.gate === 'prompt_specificity');
            assert.ok(gate);
            assert.equal(gate.passed, false);
            assert.equal(gate.blocking, true);
        });
        it('returns empty array for skills with no gates', () => {
            const results = checkGates('cancel', '$cancel', process.cwd());
            assert.deepEqual(results, []);
        });
    });
});
//# sourceMappingURL=validator.test.js.map