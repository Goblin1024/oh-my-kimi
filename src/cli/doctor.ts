/**
 * omk doctor - Check OMK installation and configuration
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const KIMI_HOME = join(homedir(), '.kimi');
const KIMI_CONFIG = join(KIMI_HOME, 'config.toml');
const OMK_SKILLS_DIR = join(KIMI_HOME, 'skills', 'omk');

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export async function doctor(): Promise<void> {
  console.log('oh-my-kimi doctor\n');

  const checks: CheckResult[] = [];

  // Check 1: Kimi CLI installation
  checks.push(checkKimiCli());

  // Check 2: OMK skills directory
  checks.push(checkSkillsDir());

  // Check 3: Individual skills
  checks.push(...checkSkills());

  // Check 4: Hooks configuration
  checks.push(checkHooks());

  // Print results
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
    console.log(`${icon} ${check.name}`);
    console.log(`  ${check.message}`);
    console.log('');

    if (check.status === 'pass') passCount++;
    else if (check.status === 'fail') failCount++;
    else warnCount++;
  }

  // Summary
  console.log('-'.repeat(40));
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
  
  if (failCount === 0) {
    console.log('\nAll checks passed! OMK is ready to use.');
  } else {
    console.log('\nSome checks failed. Run "omk setup" to fix.');
    process.exit(1);
  }
}

function checkKimiCli(): CheckResult {
  if (existsSync(KIMI_HOME)) {
    return {
      name: 'Kimi CLI',
      status: 'pass',
      message: `Found at ${KIMI_HOME}`
    };
  }
  return {
    name: 'Kimi CLI',
    status: 'fail',
    message: 'Not found. Please install Kimi CLI first.'
  };
}

function checkSkillsDir(): CheckResult {
  if (existsSync(OMK_SKILLS_DIR)) {
    return {
      name: 'OMK Skills Directory',
      status: 'pass',
      message: OMK_SKILLS_DIR
    };
  }
  return {
    name: 'OMK Skills Directory',
    status: 'fail',
    message: `Not found at ${OMK_SKILLS_DIR}. Run "omk setup".`
  };
}

function checkSkills(): CheckResult[] {
  const skills = ['ralph', 'deep-interview', 'ralplan', 'cancel'];
  const results: CheckResult[] = [];

  for (const skill of skills) {
    const skillFile = join(OMK_SKILLS_DIR, skill, 'SKILL.md');
    if (existsSync(skillFile)) {
      results.push({
        name: `Skill: ${skill}`,
        status: 'pass',
        message: 'SKILL.md found'
      });
    } else {
      results.push({
        name: `Skill: ${skill}`,
        status: 'warn',
        message: 'SKILL.md not found'
      });
    }
  }

  return results;
}

function checkHooks(): CheckResult {
  if (!existsSync(KIMI_CONFIG)) {
    return {
      name: 'Kimi Hooks',
      status: 'fail',
      message: `Config file not found: ${KIMI_CONFIG}`
    };
  }

  try {
    const content = readFileSync(KIMI_CONFIG, 'utf-8');
    if (content.includes('omk') || content.includes('oh-my-kimi')) {
      return {
        name: 'Kimi Hooks',
        status: 'pass',
        message: 'OMK hooks configured in config.toml'
      };
    }
    return {
      name: 'Kimi Hooks',
      status: 'fail',
      message: 'OMK hooks not found. Run "omk setup".'
    };
  } catch (e) {
    return {
      name: 'Kimi Hooks',
      status: 'fail',
      message: 'Could not read config.toml'
    };
  }
}
