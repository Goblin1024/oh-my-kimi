/**
 * Tests for KeywordRegistry
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { KeywordRegistry, createDefaultRegistry } from '../keyword-registry.js';
describe('KeywordRegistry', () => {
    describe('register / listAll', () => {
        it('registers entries sorted by priority descending', () => {
            const registry = new KeywordRegistry();
            registry.register({
                id: 'low',
                patterns: [/low/],
                skill: 'low-skill',
                priority: 1,
                description: 'low priority',
            });
            registry.register({
                id: 'high',
                patterns: [/high/],
                skill: 'high-skill',
                priority: 10,
                description: 'high priority',
            });
            const all = registry.listAll();
            assert.equal(all.length, 2);
            assert.equal(all[0].id, 'high');
            assert.equal(all[1].id, 'low');
        });
        it('replaces entry with same id', () => {
            const registry = new KeywordRegistry();
            registry.register({
                id: 'test',
                patterns: [/v1/],
                skill: 'v1',
                priority: 1,
                description: 'version 1',
            });
            registry.register({
                id: 'test',
                patterns: [/v2/],
                skill: 'v2',
                priority: 2,
                description: 'version 2',
            });
            const all = registry.listAll();
            assert.equal(all.length, 1);
            assert.equal(all[0].skill, 'v2');
        });
    });
    describe('detect', () => {
        it('detects explicit $name invocation', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('$ralph "build the feature"');
            assert.ok(result);
            assert.equal(result.skill, 'ralph');
        });
        it('detects case-insensitive explicit invocation', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('$Ralph "build it"');
            assert.ok(result);
            assert.equal(result.skill, 'ralph');
        });
        it('detects implicit keyword', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect("don't stop until it's done");
            assert.ok(result);
            assert.equal(result.skill, 'ralph');
        });
        it('detects deep-interview implicit keywords', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('deep interview me about auth');
            assert.ok(result);
            assert.equal(result.skill, 'deep-interview');
        });
        it('prefers cancel over other keywords (higher base priority)', () => {
            const registry = createDefaultRegistry();
            // $cancel has priority 50, $ralph has priority 10
            const result = registry.detect('$cancel $ralph');
            assert.ok(result);
            assert.equal(result.skill, 'cancel');
        });
        it('prefers explicit $name over implicit keywords', () => {
            const registry = new KeywordRegistry();
            registry.register({
                id: 'a',
                patterns: [/\$a/i, /implicit-a/i],
                skill: 'a',
                priority: 5,
                description: 'skill a',
            });
            registry.register({
                id: 'b',
                patterns: [/\$b/i, /implicit-b/i],
                skill: 'b',
                priority: 10, // Higher base priority
                description: 'skill b',
            });
            // $a is explicit (+100 boost = 105), implicit-b is implicit (10)
            const result = registry.detect('$a and implicit-b');
            assert.ok(result);
            assert.equal(result.skill, 'a');
        });
        it('returns null for no match', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('just a regular question about weather');
            assert.equal(result, null);
        });
        it('returns null for empty string', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('');
            assert.equal(result, null);
        });
        it('detects plan keywords', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect("let's plan the migration");
            assert.ok(result);
            assert.equal(result.skill, 'plan');
        });
        it('detects analyze keyword', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('$analyze the performance issue');
            assert.ok(result);
            assert.equal(result.skill, 'analyze');
        });
        it('detects build-fix keyword', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('fix build errors');
            assert.ok(result);
            assert.equal(result.skill, 'build-fix');
        });
        it('detects code-review keyword', () => {
            const registry = createDefaultRegistry();
            const result = registry.detect('review code in src/');
            assert.ok(result);
            assert.equal(result.skill, 'code-review');
        });
    });
    describe('get / unregister', () => {
        it('gets entry by id', () => {
            const registry = createDefaultRegistry();
            const entry = registry.get('ralph');
            assert.ok(entry);
            assert.equal(entry.skill, 'ralph');
        });
        it('returns undefined for unknown id', () => {
            const registry = createDefaultRegistry();
            assert.equal(registry.get('nonexistent'), undefined);
        });
        it('unregisters entry by id', () => {
            const registry = createDefaultRegistry();
            const removed = registry.unregister('ralph');
            assert.equal(removed, true);
            assert.equal(registry.get('ralph'), undefined);
        });
        it('returns false when unregistering unknown id', () => {
            const registry = createDefaultRegistry();
            const removed = registry.unregister('nonexistent');
            assert.equal(removed, false);
        });
    });
});
describe('createDefaultRegistry', () => {
    it('has core skill entries', () => {
        const registry = createDefaultRegistry();
        const all = registry.listAll();
        const ids = all.map((e) => e.id);
        assert.ok(ids.includes('ralph'));
        assert.ok(ids.includes('deep-interview'));
        assert.ok(ids.includes('ralplan'));
        assert.ok(ids.includes('cancel'));
        assert.ok(ids.includes('team'));
    });
    it('has at least 11 entries', () => {
        const registry = createDefaultRegistry();
        assert.ok(registry.listAll().length >= 11);
    });
    it('cancel has highest base priority', () => {
        const registry = createDefaultRegistry();
        const all = registry.listAll();
        // First entry should be cancel (priority 50)
        assert.equal(all[0].id, 'cancel');
    });
});
//# sourceMappingURL=keyword-registry.test.js.map