/**
 * Tests for Agent Definitions Registry
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentRegistry, agentRegistry } from '../definitions.js';
describe('agents/definitions', () => {
    describe('AgentRegistry', () => {
        it('initializes with default agents', () => {
            const registry = new AgentRegistry();
            const agents = registry.listAgents();
            // Should have exactly 10 core agents
            assert.equal(agents.length, 10);
            // Verify specific core agents exist
            assert.ok(registry.getAgent('architect'));
            assert.ok(registry.getAgent('executor'));
            assert.ok(registry.getAgent('debugger'));
            assert.ok(registry.getAgent('code-reviewer'));
            assert.ok(registry.getAgent('qa-tester'));
            assert.ok(registry.getAgent('security-reviewer'));
            assert.ok(registry.getAgent('planner'));
            assert.ok(registry.getAgent('explorer'));
            assert.ok(registry.getAgent('writer'));
            assert.ok(registry.getAgent('verifier'));
        });
        it('can register new agents', () => {
            const registry = new AgentRegistry();
            const initialCount = registry.listAgents().length;
            registry.register({
                id: 'custom-bot',
                name: 'Custom Bot',
                description: 'A custom test bot',
                promptFile: 'custom.md',
                complexity: 'low',
                tags: ['test'],
            });
            assert.equal(registry.listAgents().length, initialCount + 1);
            const custom = registry.getAgent('custom-bot');
            assert.ok(custom);
            assert.equal(custom.name, 'Custom Bot');
        });
        it('overwrites agent with same id', () => {
            const registry = new AgentRegistry();
            registry.register({
                id: 'architect',
                name: 'Modified Architect',
                description: 'Modified desc',
                promptFile: 'architect.md',
                complexity: 'standard',
                tags: ['test'],
            });
            const modified = registry.getAgent('architect');
            assert.ok(modified);
            assert.equal(modified.name, 'Modified Architect');
            assert.equal(modified.complexity, 'standard');
        });
        it('returns undefined for unknown agent id', () => {
            const registry = new AgentRegistry();
            assert.equal(registry.getAgent('unknown'), undefined);
        });
    });
    describe('Global agentRegistry instance', () => {
        it('is exported and initialized', () => {
            assert.ok(agentRegistry);
            assert.equal(agentRegistry.listAgents().length, 10);
        });
    });
});
//# sourceMappingURL=definitions.test.js.map