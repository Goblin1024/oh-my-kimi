/**
 * Tests for Explore Command
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { searchCodebase } from '../explore.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
describe('cli/explore', () => {
    const testDir = join(process.cwd(), '.tmp-explore-test');
    before(() => {
        mkdirSync(testDir, { recursive: true });
        writeFileSync(join(testDir, 'test1.ts'), 'const hello = "world";\nconsole.log(hello);');
        writeFileSync(join(testDir, 'test2.txt'), 'Another file\nWith hello inside');
        mkdirSync(join(testDir, 'node_modules'));
        writeFileSync(join(testDir, 'node_modules', 'ignored.ts'), 'const hello = "ignore me";');
    });
    after(() => {
        rmSync(testDir, { recursive: true, force: true });
    });
    it('finds literal string matches', () => {
        const results = searchCodebase(testDir, 'hello');
        assert.equal(results.length, 3);
        const files = results.map((r) => r.file);
        assert.ok(files.some((f) => f.includes('test1.ts')));
        assert.ok(files.some((f) => f.includes('test2.txt')));
        assert.ok(!files.some((f) => f.includes('ignored.ts'))); // Should ignore node_modules
    });
    it('supports case-insensitive matching by default', () => {
        const results = searchCodebase(testDir, 'HELLO');
        assert.equal(results.length, 3);
    });
    it('supports regex matching when flag is true', () => {
        const results = searchCodebase(testDir, 'h.*o', true);
        assert.equal(results.length, 3);
    });
    it('returns empty array when no matches', () => {
        const results = searchCodebase(testDir, 'nonexistent');
        assert.equal(results.length, 0);
    });
});
//# sourceMappingURL=explore.test.js.map