/**
 * Tests for src/utils/bm25.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { searchBM25 } from '../bm25.js';
describe('utils/bm25', () => {
    it('returns empty array when no documents are provided', () => {
        assert.deepEqual(searchBM25([], 'test'), []);
    });
    it('returns empty array when query is empty or whitespace', () => {
        const docs = [{ id: '1', content: 'hello world' }];
        assert.deepEqual(searchBM25(docs, '   '), []);
    });
    it('ranks exact matches higher than partial matches', () => {
        const docs = [
            { id: '1', content: 'apple banana orange' },
            { id: '2', content: 'apple apple apple banana' },
            { id: '3', content: 'grape kiwi' },
        ];
        const results = searchBM25(docs, 'apple');
        assert.equal(results.length, 2);
        // Doc 2 has more apples, should score higher
        assert.equal(results[0].id, '2');
        assert.equal(results[1].id, '1');
    });
    it('handles case insensitivity and punctuation', () => {
        const docs = [{ id: '1', content: 'Hello, World!' }];
        const results = searchBM25(docs, 'hello world');
        assert.equal(results.length, 1);
        assert.equal(results[0].id, '1');
    });
    it('returns at most topK results', () => {
        const docs = Array.from({ length: 10 }, (_, i) => ({
            id: String(i),
            content: 'test document with keywords',
        }));
        const results = searchBM25(docs, 'test', 3);
        assert.equal(results.length, 3);
    });
});
//# sourceMappingURL=bm25.test.js.map