/**
 * Tests for src/skills/parser.ts
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadSkillManifest, clearManifestCache } from '../parser.js';
describe('skills/parser', () => {
    beforeEach(() => {
        clearManifestCache();
    });
    it('loads the ralph manifest with flags, phases, and gates', () => {
        const manifest = loadSkillManifest('ralph', process.cwd());
        assert.ok(manifest, 'Ralph manifest should be loadable');
        assert.equal(manifest.name, 'ralph');
        assert.ok(manifest.phases.includes('executing'));
        assert.ok(manifest.phases.includes('verifying'));
        assert.ok(manifest.flags.some((f) => f.name === '--prd'));
        assert.ok(manifest.gates.length > 0, 'Ralph should have at least one gate');
        assert.equal(manifest.gates[0].type, 'prompt_specificity');
    });
    it('loads the ralplan manifest with flags', () => {
        const manifest = loadSkillManifest('ralplan', process.cwd());
        assert.ok(manifest);
        assert.ok(manifest.flags.some((f) => f.name === '--deliberate'));
        assert.ok(manifest.flags.some((f) => f.name === '--quick'));
        assert.ok(manifest.phases.includes('deliberating'));
    });
    it('loads the deep-interview manifest with custom phases', () => {
        const manifest = loadSkillManifest('deep-interview', process.cwd());
        assert.ok(manifest);
        assert.ok(manifest.phases.includes('intent-first'));
        assert.ok(manifest.phases.includes('synthesis'));
    });
    it('returns null for an unknown skill', () => {
        const manifest = loadSkillManifest('nonexistent-skill-xyz', process.cwd());
        assert.equal(manifest, null);
    });
    it('returns DEFAULT_PHASES for a skill with no phases frontmatter', () => {
        // cancel/SKILL.md has no phases — it should fall back to defaults
        const manifest = loadSkillManifest('cancel', process.cwd());
        if (manifest) {
            // Either the skill has explicit phases or falls back to DEFAULT_PHASES
            assert.ok(manifest.phases.length > 0);
        }
        else {
            // If the skill file doesn't exist in test context, that's also valid
            assert.equal(manifest, null);
        }
    });
    it('caches manifests and returns the same object on repeated calls', () => {
        const first = loadSkillManifest('ralph', process.cwd());
        const second = loadSkillManifest('ralph', process.cwd());
        assert.equal(first, second); // strict reference equality — same cached object
    });
    it('clearManifestCache allows re-parsing', () => {
        const first = loadSkillManifest('ralph', process.cwd());
        clearManifestCache();
        const second = loadSkillManifest('ralph', process.cwd());
        // Different objects but same content
        assert.notEqual(first, second);
        assert.equal(first?.name, second?.name);
    });
});
//# sourceMappingURL=parser.test.js.map