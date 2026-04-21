/**
 * omk doctor - Check OMK installation and configuration
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { tryReadCatalogManifest } from '../catalog/reader.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function doctor() {
    console.log('oh-my-kimi doctor\n');
    const cwd = process.cwd();
    const scope = resolveDoctorScope(cwd);
    const dirs = resolveDoctorPaths(cwd, scope);
    console.log(`Resolved scope: ${scope}\n`);
    const checks = [];
    checks.push(checkKimiCli());
    checks.push(checkDirectory('Kimi home', dirs.kimiHomeDir));
    checks.push(...checkSkills(dirs.skillsDir));
    checks.push(...checkPrompts(dirs.promptsDir));
    checks.push(...checkAgents(dirs.agentsDir));
    checks.push(checkHooks(dirs.configPath));
    checks.push(checkIntegrity(dirs.skillsDir));
    checks.push(checkDirectory('State dir', dirs.omkStateDir));
    checks.push(checkMcpRegistration(dirs.kimiHomeDir));
    let passCount = 0;
    let failCount = 0;
    let warnCount = 0;
    for (const check of checks) {
        const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
        console.log(`${icon} ${check.name}`);
        console.log(`  ${check.message}`);
        console.log('');
        if (check.status === 'pass')
            passCount++;
        else if (check.status === 'fail')
            failCount++;
        else
            warnCount++;
    }
    console.log('-'.repeat(40));
    console.log(`Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
    if (failCount === 0) {
        console.log('\nAll checks passed! OMK is ready to use.');
    }
    else {
        console.log('\nSome checks failed. Run "omk setup" to fix.');
        process.exit(1);
    }
}
function resolveDoctorScope(cwd) {
    const scopePath = join(cwd, '.omk', 'setup-scope.json');
    if (!existsSync(scopePath))
        return 'user';
    try {
        const raw = JSON.parse(readFileSync(scopePath, 'utf-8'));
        if (raw.scope === 'user' || raw.scope === 'project')
            return raw.scope;
    }
    catch {
        // ignore
    }
    return 'user';
}
function resolveDoctorPaths(cwd, scope) {
    if (scope === 'project') {
        const kimiHomeDir = join(cwd, '.kimi');
        return {
            kimiHomeDir,
            configPath: join(kimiHomeDir, 'config.toml'),
            promptsDir: join(kimiHomeDir, 'prompts'),
            skillsDir: join(kimiHomeDir, 'skills'),
            agentsDir: join(kimiHomeDir, 'agents'),
            omkStateDir: join(cwd, '.omk', 'state'),
        };
    }
    const kimiHomeDir = join(homedir(), '.kimi');
    return {
        kimiHomeDir,
        configPath: join(kimiHomeDir, 'config.toml'),
        promptsDir: join(kimiHomeDir, 'prompts'),
        skillsDir: join(kimiHomeDir, 'skills'),
        agentsDir: join(kimiHomeDir, 'agents'),
        omkStateDir: join(cwd, '.omk', 'state'),
    };
}
function checkKimiCli() {
    const kimiHome = join(homedir(), '.kimi');
    if (existsSync(kimiHome)) {
        return { name: 'Kimi CLI', status: 'pass', message: `Found at ${kimiHome}` };
    }
    return { name: 'Kimi CLI', status: 'fail', message: 'Not found. Please install Kimi CLI first.' };
}
function checkDirectory(name, path) {
    if (existsSync(path)) {
        return { name, status: 'pass', message: path };
    }
    return { name, status: 'warn', message: `${path} (not created yet)` };
}
function checkSkills(skillsDir) {
    const results = [];
    const manifest = tryReadCatalogManifest();
    const expected = manifest?.skills.filter((s) => s.status === 'active') ?? [];
    if (!existsSync(skillsDir)) {
        results.push({ name: 'Skills', status: 'warn', message: 'Skills directory not found' });
        return results;
    }
    const entries = readdirSync(skillsDir).filter((f) => statSync(join(skillsDir, f)).isDirectory());
    const installed = entries.filter((e) => existsSync(join(skillsDir, e, 'SKILL.md')));
    if (installed.length < expected.length) {
        results.push({
            name: 'Skills',
            status: 'warn',
            message: `${installed.length} installed (expected >= ${expected.length})`,
        });
    }
    else {
        results.push({
            name: 'Skills',
            status: 'pass',
            message: `${installed.length} skills installed`,
        });
    }
    return results;
}
function checkPrompts(promptsDir) {
    const results = [];
    const manifest = tryReadCatalogManifest();
    const expected = manifest?.agents.filter((a) => a.status === 'active') ?? [];
    if (!existsSync(promptsDir)) {
        results.push({ name: 'Prompts', status: 'warn', message: 'Prompts directory not found' });
        return results;
    }
    const files = readdirSync(promptsDir).filter((f) => f.endsWith('.md'));
    if (files.length < expected.length) {
        results.push({
            name: 'Prompts',
            status: 'warn',
            message: `${files.length} prompts (expected >= ${expected.length})`,
        });
    }
    else {
        results.push({
            name: 'Prompts',
            status: 'pass',
            message: `${files.length} agent prompts installed`,
        });
    }
    return results;
}
function checkAgents(agentsDir) {
    const results = [];
    const manifest = tryReadCatalogManifest();
    const expected = manifest?.agents.filter((a) => a.status === 'active') ?? [];
    if (!existsSync(agentsDir)) {
        results.push({ name: 'Agents', status: 'warn', message: 'Agents directory not found' });
        return results;
    }
    const files = readdirSync(agentsDir).filter((f) => f.endsWith('.toml'));
    if (files.length < expected.length) {
        results.push({
            name: 'Agents',
            status: 'warn',
            message: `${files.length} agents (expected >= ${expected.length})`,
        });
    }
    else {
        results.push({
            name: 'Agents',
            status: 'pass',
            message: `${files.length} native agents installed`,
        });
    }
    return results;
}
function checkHooks(configPath) {
    if (!existsSync(configPath)) {
        return { name: 'Hooks config', status: 'fail', message: 'Kimi config.toml not found' };
    }
    try {
        const content = readFileSync(configPath, 'utf-8');
        if (content.includes('omk') || content.includes('oh-my-kimi')) {
            return { name: 'Hooks config', status: 'pass', message: 'OMK hooks configured' };
        }
        return { name: 'Hooks config', status: 'fail', message: 'OMK hooks not found in config.toml' };
    }
    catch (_e) {
        return { name: 'Hooks config', status: 'fail', message: 'Could not read config.toml' };
    }
}
function checkMcpRegistration(kimiHomeDir) {
    const mcpPath = join(kimiHomeDir, 'mcp.json');
    if (!existsSync(mcpPath)) {
        return {
            name: 'MCP Registration',
            status: 'warn',
            message: 'mcp.json not found. Run `omk setup` to register MCP servers.',
        };
    }
    try {
        const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
        const servers = mcpConfig.mcpServers ? Object.keys(mcpConfig.mcpServers) : [];
        const expected = ['omk-state-server', 'omk-memory-server', 'omk-trace-server'];
        const missing = expected.filter((s) => !servers.includes(s));
        if (missing.length === 0) {
            return {
                name: 'MCP Registration',
                status: 'pass',
                message: `All 3 OMK MCP servers registered`,
            };
        }
        return {
            name: 'MCP Registration',
            status: 'warn',
            message: `Missing MCP servers: ${missing.join(', ')}. Run \`omk setup\` to fix.`,
        };
    }
    catch {
        return {
            name: 'MCP Registration',
            status: 'fail',
            message: 'Could not parse mcp.json',
        };
    }
}
function checkIntegrity(skillsDir) {
    const integrityFile = join(skillsDir, 'omk', 'integrity.json');
    if (!existsSync(integrityFile)) {
        return {
            name: 'Version Integrity',
            status: 'warn',
            message: 'integrity.json not found (please run `omk setup`)',
        };
    }
    try {
        const stored = JSON.parse(readFileSync(integrityFile, 'utf-8'));
        let packagePath = join(__dirname, '..', '..', 'package.json');
        if (!existsSync(packagePath)) {
            packagePath = join(__dirname, '..', 'package.json');
        }
        if (existsSync(packagePath)) {
            const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
            if (pkg.version !== stored.version) {
                return {
                    name: 'Version Integrity',
                    status: 'fail',
                    message: `CLI is v${pkg.version} but installed skills are v${stored.version}. Run 'omk setup' to fix.`,
                };
            }
        }
        const handlerPath = join(skillsDir, 'omk', 'handler.js');
        if (stored.handlerHash && stored.handlerHash !== 'none' && existsSync(handlerPath)) {
            const currentContent = readFileSync(handlerPath, 'utf-8');
            const currentHash = createHash('sha256').update(currentContent).digest('hex');
            if (currentHash !== stored.handlerHash) {
                return {
                    name: 'Version Integrity',
                    status: 'fail',
                    message: 'Hook handler hash mismatch — file may have been modified. Run `omk setup` to restore.',
                };
            }
            return {
                name: 'Version Integrity',
                status: 'pass',
                message: `Matched v${stored.version}, handler SHA-256 verified`,
            };
        }
        return {
            name: 'Version Integrity',
            status: 'pass',
            message: `Matched v${stored.version}`,
        };
    }
    catch (err) {
        return {
            name: 'Version Integrity',
            status: 'warn',
            message: `Failed to verify integrity: ${err}`,
        };
    }
}
//# sourceMappingURL=doctor.js.map