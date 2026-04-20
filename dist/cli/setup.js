/**
 * omk setup - Install OMK skills, prompts, agents and configure Kimi hooks
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import * as TOML from '@iarna/toml';
import { tryReadCatalogManifest } from '../catalog/reader.js';
import { AGENT_DEFINITIONS } from '../agents/definitions.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function resolveScopeDirectories(scope, projectRoot) {
    if (scope === 'project') {
        const kimiHomeDir = join(projectRoot, '.kimi');
        return {
            kimiHomeDir,
            configPath: join(kimiHomeDir, 'config.toml'),
            promptsDir: join(kimiHomeDir, 'prompts'),
            skillsDir: join(kimiHomeDir, 'skills'),
            agentsDir: join(kimiHomeDir, 'agents'),
            omkStateDir: join(projectRoot, '.omk', 'state'),
            omkPlansDir: join(projectRoot, '.omk', 'plans'),
        };
    }
    const kimiHomeDir = join(homedir(), '.kimi');
    return {
        kimiHomeDir,
        configPath: join(kimiHomeDir, 'config.toml'),
        promptsDir: join(kimiHomeDir, 'prompts'),
        skillsDir: join(kimiHomeDir, 'skills'),
        agentsDir: join(kimiHomeDir, 'agents'),
        omkStateDir: join(projectRoot, '.omk', 'state'),
        omkPlansDir: join(projectRoot, '.omk', 'plans'),
    };
}
function readPersistedScope(projectRoot) {
    const scopePath = join(projectRoot, '.omk', 'setup-scope.json');
    if (!existsSync(scopePath))
        return undefined;
    try {
        const raw = JSON.parse(readFileSync(scopePath, 'utf-8'));
        if (raw.scope === 'user' || raw.scope === 'project')
            return raw.scope;
    }
    catch {
        // ignore invalid
    }
    return undefined;
}
function persistScope(projectRoot, scope) {
    const scopeDir = join(projectRoot, '.omk');
    mkdirSync(scopeDir, { recursive: true });
    writeFileSync(join(scopeDir, 'setup-scope.json'), JSON.stringify({ scope }, null, 2));
}
function findPackageRoot() {
    let current = __dirname;
    for (let i = 0; i < 5; i++) {
        if (existsSync(join(current, 'package.json'))) {
            return current;
        }
        current = dirname(current);
    }
    return process.cwd();
}
export async function setup(scopeArg) {
    const projectRoot = process.cwd();
    const persisted = readPersistedScope(projectRoot);
    let scope = 'user';
    if (scopeArg === 'user' || scopeArg === 'project') {
        scope = scopeArg;
    }
    else if (persisted) {
        scope = persisted;
    }
    const dirs = resolveScopeDirectories(scope, projectRoot);
    const packageRoot = findPackageRoot();
    console.log('🚀 oh-my-kimi setup\n');
    console.log('='.repeat(50));
    console.log(`Scope: ${scope}`);
    console.log('');
    const manifest = tryReadCatalogManifest(packageRoot);
    const activeSkills = manifest?.skills.filter((s) => s.status === 'active') ?? [];
    const activeAgents = manifest?.agents.filter((a) => a.status === 'active') ?? [];
    // Step 1: Create directories
    console.log('Step 1/6: Creating directories...');
    mkdirSync(dirs.kimiHomeDir, { recursive: true });
    mkdirSync(dirs.promptsDir, { recursive: true });
    mkdirSync(dirs.skillsDir, { recursive: true });
    mkdirSync(dirs.agentsDir, { recursive: true });
    mkdirSync(dirs.omkStateDir, { recursive: true });
    mkdirSync(dirs.omkPlansDir, { recursive: true });
    persistScope(projectRoot, scope);
    console.log('  ✓ Success\n');
    // Step 2: Install prompts (active agents)
    const promptSummary = { updated: 0, unchanged: 0, skipped: 0 };
    console.log('Step 2/6: Installing agent prompts...');
    const promptsSrc = join(packageRoot, 'prompts');
    if (existsSync(promptsSrc) && activeAgents.length > 0) {
        for (const agent of activeAgents) {
            const src = join(promptsSrc, `${agent.name}.md`);
            const dst = join(dirs.promptsDir, `${agent.name}.md`);
            if (!existsSync(src)) {
                promptSummary.skipped++;
                continue;
            }
            if (existsSync(dst) && readFileSync(src, 'utf-8') === readFileSync(dst, 'utf-8')) {
                promptSummary.unchanged++;
                continue;
            }
            cpSync(src, dst);
            promptSummary.updated++;
        }
    }
    console.log(`  ✓ Prompts: updated=${promptSummary.updated}, unchanged=${promptSummary.unchanged}, skipped=${promptSummary.skipped}\n`);
    // Step 3: Install skills (active skills)
    const skillSummary = { updated: 0, unchanged: 0, skipped: 0 };
    console.log('Step 3/6: Installing skills...');
    const skillsSrc = join(packageRoot, 'skills');
    if (existsSync(skillsSrc) && activeSkills.length > 0) {
        for (const skill of activeSkills) {
            const srcDir = join(skillsSrc, skill.name);
            const dstDir = join(dirs.skillsDir, skill.name);
            const srcFile = join(srcDir, 'SKILL.md');
            if (!existsSync(srcFile)) {
                skillSummary.skipped++;
                continue;
            }
            mkdirSync(dstDir, { recursive: true });
            const dstFile = join(dstDir, 'SKILL.md');
            if (existsSync(dstFile) && readFileSync(srcFile, 'utf-8') === readFileSync(dstFile, 'utf-8')) {
                skillSummary.unchanged++;
                continue;
            }
            cpSync(srcFile, dstFile);
            skillSummary.updated++;
        }
    }
    console.log(`  ✓ Skills: updated=${skillSummary.updated}, unchanged=${skillSummary.unchanged}, skipped=${skillSummary.skipped}\n`);
    // Step 4: Generate native agent TOMLs
    const agentSummary = { updated: 0, unchanged: 0, skipped: 0 };
    console.log('Step 4/6: Installing native agent configs...');
    for (const agent of activeAgents) {
        const def = AGENT_DEFINITIONS[agent.name];
        if (!def) {
            agentSummary.skipped++;
            continue;
        }
        const promptPath = join(promptsSrc, `${agent.name}.md`);
        let promptContent = '';
        if (existsSync(promptPath)) {
            promptContent = readFileSync(promptPath, 'utf-8');
        }
        const toml = generateAgentToml(def, promptContent);
        const dst = join(dirs.agentsDir, `${agent.name}.toml`);
        if (existsSync(dst) && readFileSync(dst, 'utf-8') === toml) {
            agentSummary.unchanged++;
            continue;
        }
        writeFileSync(dst, toml);
        agentSummary.updated++;
    }
    console.log(`  ✓ Agents: updated=${agentSummary.updated}, unchanged=${agentSummary.unchanged}, skipped=${agentSummary.skipped}\n`);
    // Step 5: Configure hooks
    console.log('Step 5/6: Configuring Kimi hooks...');
    configureHooks(dirs.configPath, dirs.skillsDir);
    console.log('  ✓ Success\n');
    // Step 6: Write integrity hash
    console.log('Step 6/6: Writing integrity hash...');
    const pkgPath = join(packageRoot, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const handlerPath = join(dirs.skillsDir, 'omk', 'handler.js');
    let handlerHash = 'none';
    if (existsSync(handlerPath)) {
        handlerHash = createHash('sha256').update(readFileSync(handlerPath, 'utf-8')).digest('hex');
    }
    const integrity = { version: pkg.version, handlerHash, scope };
    writeFileSync(join(dirs.skillsDir, 'omk', 'integrity.json'), JSON.stringify(integrity, null, 2));
    console.log('  ✓ Success\n');
    console.log('='.repeat(50));
    console.log('');
    console.log('✅ Setup completed successfully!\n');
    console.log(`  Prompts: ${promptSummary.updated} updated, ${promptSummary.unchanged} unchanged`);
    console.log(`  Skills:  ${skillSummary.updated} updated, ${skillSummary.unchanged} unchanged`);
    console.log(`  Agents:  ${agentSummary.updated} updated, ${agentSummary.unchanged} unchanged`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Launch Kimi CLI: kimi');
    console.log('  2. Try: $architect, $planner, or $deep-interview');
}
function configureHooks(configPath, skillsDir) {
    let config = {};
    if (existsSync(configPath)) {
        try {
            config = TOML.parse(readFileSync(configPath, 'utf-8'));
        }
        catch (_e) {
            console.warn('  ⚠ Could not parse existing config, creating new one');
        }
    }
    if (!config.hooks) {
        config.hooks = [];
    }
    const omkSkillsDir = join(skillsDir, 'omk');
    const hasOmkHooks = config.hooks.some((h) => h.command && h.command.includes('omk'));
    if (hasOmkHooks) {
        console.log('  ℹ OMK hooks already configured');
        return;
    }
    const omkHooks = [
        {
            event: 'UserPromptSubmit',
            command: `node ${join(omkSkillsDir, 'handler.js')}`,
            matcher: '\\$[a-z-]+',
        },
        {
            event: 'SessionStart',
            command: `node ${join(omkSkillsDir, 'session-start.js')}`,
        },
        {
            event: 'Stop',
            command: `node ${join(omkSkillsDir, 'stop.js')}`,
            timeout: 30,
        },
    ];
    config.hooks.push(...omkHooks);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeFileSync(configPath, TOML.stringify(config));
    console.log(`  ✓ Added hooks to ${configPath}`);
}
function generateAgentToml(def, promptContent) {
    const lines = [
        `# Native agent config for Kimi Code CLI`,
        `# Generated by oh-my-kimi`,
        ``,
        `name = "${def.name}"`,
        `description = "${def.description.replace(/"/g, '\\"')}"`,
        ``,
        `[model]`,
        `reasoning_effort = "${def.reasoningEffort}"`,
        ``,
    ];
    if (promptContent) {
        lines.push(`[prompt]`);
        lines.push(`system = """`);
        lines.push(promptContent);
        lines.push(`"""`);
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=setup.js.map