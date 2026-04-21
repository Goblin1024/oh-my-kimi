/**
 * Tests for Agent Router
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assessComplexity, routeTask, explainRoute } from '../router.js';
describe('token/router', () => {
    describe('assessComplexity', () => {
        it('classifies simple review tasks as low', () => {
            assert.equal(assessComplexity('Review this code for style issues'), 'low');
            assert.equal(assessComplexity('Explain how this function works'), 'low');
            assert.equal(assessComplexity('Quick check: is this correct?'), 'low');
        });
        it('classifies design/architecture tasks as high', () => {
            assert.equal(assessComplexity('Design a microservice architecture'), 'high');
            assert.equal(assessComplexity('Refactor the database layer'), 'high');
            assert.equal(assessComplexity('Plan a migration strategy'), 'high');
        });
        it('classifies short prompts as low', () => {
            assert.equal(assessComplexity('hi'), 'low');
        });
        it('classifies long prompts as high', () => {
            const longPrompt = 'a'.repeat(301);
            assert.equal(assessComplexity(longPrompt), 'high');
        });
        it('classifies medium prompts as medium', () => {
            const mediumPrompt = 'a'.repeat(100);
            assert.equal(assessComplexity(mediumPrompt), 'medium');
        });
    });
    describe('routeTask', () => {
        it('routes low complexity to fast config', () => {
            const config = routeTask('review this file');
            assert.equal(config.reasoningEffort, 'low');
            assert.equal(config.maxTokens, 8_000);
            assert.deepEqual(config.allowedTools, ['read', 'search']);
            assert.equal(config.maxSteps, 20);
        });
        it('routes high complexity to thorough config', () => {
            const config = routeTask('design a distributed system');
            assert.equal(config.reasoningEffort, 'high');
            assert.equal(config.maxTokens, 128_000);
            assert.equal(config.allowedTools, 'all');
            assert.equal(config.maxSteps, 50);
        });
        it('routes medium complexity to balanced config', () => {
            const config = routeTask('I need you to implement a new user authentication feature with comprehensive unit tests and integration tests');
            assert.equal(config.reasoningEffort, 'medium');
            assert.equal(config.maxTokens, 32_000);
            assert.equal(config.allowedTools, 'all');
            assert.equal(config.maxSteps, 30);
        });
    });
    describe('explainRoute', () => {
        it('returns a human-readable explanation', () => {
            const prompt = 'review this code';
            const config = routeTask(prompt);
            const explanation = explainRoute(prompt, config);
            assert.ok(explanation.includes('low'));
            assert.ok(explanation.includes('reasoning='));
            assert.ok(explanation.includes('maxTokens='));
        });
    });
});
//# sourceMappingURL=router.test.js.map