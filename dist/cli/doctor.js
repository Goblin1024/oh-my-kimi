/**
 * omk doctor - Check OMK installation and configuration
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const KIMI_HOME = join(homedir(), '.kimi');
const KIMI_CONFIG = join(KIMI_HOME, 'config.toml');
const OMK_SKILLS_DIR = join(KIMI_HOME, 'skills', 'omk');
export async function doctor() {
    console.log('oh-my-kimi doctor\n');
    const checks = [];
    // Check 1: Kimi CLI installation
    checks.push(checkKimiCli());
    // Check 2: OMK skills directory
    checks.push(checkSkillsDir());
    // Check 3: Individual skills
    checks.push(...checkSkills());
    // Check 4: Hooks configuration
    checks.push(checkHooks());
    // Check 5: Integrity
    checks.push(checkIntegrity());
    // Print results
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
    // Summary
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
function checkKimiCli() {
    if (existsSync(KIMI_HOME)) {
        return {
            name: 'Kimi CLI',
            status: 'pass',
            message: `Found at ${KIMI_HOME}`,
        };
    }
    return {
        name: 'Kimi CLI',
        status: 'fail',
        message: 'Not found. Please install Kimi CLI first.',
    };
}
function checkSkillsDir() {
    if (existsSync(OMK_SKILLS_DIR)) {
        return {
            name: 'OMK Skills Directory',
            status: 'pass',
            message: OMK_SKILLS_DIR,
        };
    }
    return {
        name: 'OMK Skills Directory',
        status: 'fail',
        message: `Not found at ${OMK_SKILLS_DIR}. Run "omk setup".`,
    };
}
function checkSkills() {
    const results = [];
    if (!existsSync(OMK_SKILLS_DIR)) {
        return [];
    }
    try {
        const entries = readdirSync(OMK_SKILLS_DIR);
        const skills = entries.filter((f) => statSync(join(OMK_SKILLS_DIR, f)).isDirectory());
        if (skills.length === 0) {
            results.push({
                name: 'Skills',
                status: 'warn',
                message: 'No skills found in ' + OMK_SKILLS_DIR,
            });
            return results;
        }
        for (const skill of skills) {
            const skillFile = join(OMK_SKILLS_DIR, skill, 'SKILL.md');
            if (existsSync(skillFile)) {
                results.push({
                    name: `Skill: ${skill}`,
                    status: 'pass',
                    message: 'SKILL.md found',
                });
            }
            else {
                results.push({
                    name: `Skill: ${skill}`,
                    status: 'warn',
                    message: 'SKILL.md not found',
                });
            }
        }
    }
    catch (err) {
        results.push({
            name: 'Skills scan',
            status: 'fail',
            message: `Failed to read skills directory: ${err}`,
        });
    }
    return results;
}
function checkHooks() {
    if (!existsSync(KIMI_CONFIG)) {
        return {
            name: 'Hooks config',
            status: 'fail',
            message: 'Kimi config.toml not found',
        };
    }
    try {
        const content = readFileSync(KIMI_CONFIG, 'utf-8');
        if (content.includes('omk') || content.includes('oh-my-kimi')) {
            return {
                name: 'Hooks config',
                status: 'pass',
                message: 'OMK hooks configured',
            };
        }
        return {
            name: 'Hooks config',
            status: 'fail',
            message: 'OMK hooks not found in config.toml',
        };
    }
    catch (_e) {
        return {
            name: 'Hooks config',
            status: 'fail',
            message: 'Could not read config.toml',
        };
    }
}
function checkIntegrity() {
    const integrityFile = join(OMK_SKILLS_DIR, 'integrity.json');
    if (!existsSync(integrityFile)) {
        return {
            name: 'Version Integrity',
            status: 'warn',
            message: 'integrity.json not found (please run `omk setup`)',
        };
    }
    try {
        const stored = JSON.parse(readFileSync(integrityFile, 'utf-8'));
        // Find CLI package.json
        let packagePath = join(__dirname, '..', '..', 'package.json');
        if (!existsSync(packagePath)) {
            packagePath = join(__dirname, '..', 'package.json');
        }
        // Version check
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
        // Handler hash check (tamper detection)
        const handlerPath = join(OMK_SKILLS_DIR, 'handler.js');
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