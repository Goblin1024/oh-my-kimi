const SKILL_CATEGORIES = new Set(['execution', 'planning', 'shortcut', 'utility']);
const AGENT_CATEGORIES = new Set(['build', 'review', 'domain', 'product', 'coordination']);
const ENTRY_STATUSES = new Set(['active', 'alias', 'merged', 'deprecated', 'internal']);
const REQUIRED_CORE_SKILLS = new Set(['ralplan', 'team', 'ralph', 'plan', 'deep-interview']);
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function assertNonEmptyString(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`catalog_manifest_invalid:${field}`);
    }
}
export function validateCatalogManifest(input) {
    if (!isObject(input))
        throw new Error('catalog_manifest_invalid:root');
    if (typeof input.schemaVersion !== 'number' || !Number.isInteger(input.schemaVersion)) {
        throw new Error('catalog_manifest_invalid:schemaVersion');
    }
    assertNonEmptyString(input.catalogVersion, 'catalogVersion');
    if (!Array.isArray(input.skills))
        throw new Error('catalog_manifest_invalid:skills');
    if (!Array.isArray(input.agents))
        throw new Error('catalog_manifest_invalid:agents');
    const seenSkills = new Set();
    const skills = input.skills.map((entry, index) => {
        if (!isObject(entry))
            throw new Error(`catalog_manifest_invalid:skills[${index}]`);
        assertNonEmptyString(entry.name, `skills[${index}].name`);
        assertNonEmptyString(entry.category, `skills[${index}].category`);
        assertNonEmptyString(entry.status, `skills[${index}].status`);
        if (!SKILL_CATEGORIES.has(entry.category)) {
            throw new Error(`catalog_manifest_invalid:skills[${index}].category`);
        }
        if (!ENTRY_STATUSES.has(entry.status)) {
            throw new Error(`catalog_manifest_invalid:skills[${index}].status`);
        }
        const name = entry.name.trim();
        if (seenSkills.has(name))
            throw new Error(`catalog_manifest_invalid:duplicate_skill:${name}`);
        seenSkills.add(name);
        const canonical = typeof entry.canonical === 'string' && entry.canonical.trim() !== ''
            ? entry.canonical.trim()
            : undefined;
        if ((entry.status === 'alias' || entry.status === 'merged') && !canonical) {
            throw new Error(`catalog_manifest_invalid:skills[${index}].canonical`);
        }
        return {
            name,
            category: entry.category,
            status: entry.status,
            canonical,
            core: entry.core === true,
            internalRequired: entry.internalRequired === true,
        };
    });
    const seenAgents = new Set();
    const agents = input.agents.map((entry, index) => {
        if (!isObject(entry))
            throw new Error(`catalog_manifest_invalid:agents[${index}]`);
        assertNonEmptyString(entry.name, `agents[${index}].name`);
        assertNonEmptyString(entry.category, `agents[${index}].category`);
        assertNonEmptyString(entry.status, `agents[${index}].status`);
        if (!AGENT_CATEGORIES.has(entry.category)) {
            throw new Error(`catalog_manifest_invalid:agents[${index}].category`);
        }
        if (!ENTRY_STATUSES.has(entry.status)) {
            throw new Error(`catalog_manifest_invalid:agents[${index}].status`);
        }
        const name = entry.name.trim();
        if (seenAgents.has(name))
            throw new Error(`catalog_manifest_invalid:duplicate_agent:${name}`);
        seenAgents.add(name);
        const canonical = typeof entry.canonical === 'string' && entry.canonical.trim() !== ''
            ? entry.canonical.trim()
            : undefined;
        if ((entry.status === 'alias' || entry.status === 'merged') && !canonical) {
            throw new Error(`catalog_manifest_invalid:agents[${index}].canonical`);
        }
        return {
            name,
            category: entry.category,
            status: entry.status,
            canonical,
        };
    });
    for (const coreSkill of REQUIRED_CORE_SKILLS) {
        const skill = skills.find((s) => s.name === coreSkill);
        if (!skill || skill.status !== 'active') {
            throw new Error(`catalog_manifest_invalid:missing_core_skill:${coreSkill}`);
        }
    }
    return {
        schemaVersion: input.schemaVersion,
        catalogVersion: input.catalogVersion,
        skills,
        agents,
    };
}
export function summarizeCatalogCounts(manifest) {
    return {
        skillCount: manifest.skills.length,
        promptCount: manifest.agents.length,
        activeSkillCount: manifest.skills.filter((s) => s.status === 'active').length,
        activeAgentCount: manifest.agents.filter((a) => a.status === 'active').length,
    };
}
//# sourceMappingURL=schema.js.map