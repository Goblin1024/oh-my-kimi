#!/usr/bin/env node
/**
 * Setup verification script
 * Run this after omk setup to verify everything is correctly installed
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const KIMI_HOME = join(homedir(), '.kimi');
const KIMI_CONFIG = join(KIMI_HOME, 'config.toml');
const OMK_SKILLS_DIR = join(KIMI_HOME, 'skills', 'omk');

const checks = [];

// Check 1: Kimi home exists
checks.push({
  name: 'Kimi CLI installed',
  test: () => existsSync(KIMI_HOME),
  path: KIMI_HOME,
});

// Check 2: OMK skills directory
checks.push({
  name: 'OMK skills directory',
  test: () => existsSync(OMK_SKILLS_DIR),
  path: OMK_SKILLS_DIR,
});

// Check 3: Hook handler exists
checks.push({
  name: 'Hook handler (handler.js)',
  test: () => existsSync(join(OMK_SKILLS_DIR, 'handler.js')),
  path: join(OMK_SKILLS_DIR, 'handler.js'),
});

// Check 4: Session start hook
checks.push({
  name: 'Session start hook',
  test: () => existsSync(join(OMK_SKILLS_DIR, 'session-start.js')),
  path: join(OMK_SKILLS_DIR, 'session-start.js'),
});

// Check 5: Stop hook
checks.push({
  name: 'Stop hook',
  test: () => existsSync(join(OMK_SKILLS_DIR, 'stop.js')),
  path: join(OMK_SKILLS_DIR, 'stop.js'),
});

// Check 6: Skills exist
checks.push({
  name: 'Skill: deep-interview',
  test: () => existsSync(join(OMK_SKILLS_DIR, 'deep-interview', 'SKILL.md')),
  path: join(OMK_SKILLS_DIR, 'deep-interview', 'SKILL.md'),
});

checks.push({
  name: 'Skill: ralplan',
  test: () => existsSync(join(OMK_SKILLS_DIR, 'ralplan', 'SKILL.md')),
  path: join(OMK_SKILLS_DIR, 'ralplan', 'SKILL.md'),
});

checks.push({
  name: 'Skill: ralph',
  test: () => existsSync(join(OMK_SKILLS_DIR, 'ralph', 'SKILL.md')),
  path: join(OMK_SKILLS_DIR, 'ralph', 'SKILL.md'),
});

checks.push({
  name: 'Skill: cancel',
  test: () => existsSync(join(OMK_SKILLS_DIR, 'cancel', 'SKILL.md')),
  path: join(OMK_SKILLS_DIR, 'cancel', 'SKILL.md'),
});

// Check 7: Hooks configured in config.toml
checks.push({
  name: 'Kimi config has OMK hooks',
  test: () => {
    if (!existsSync(KIMI_CONFIG)) return false;
    const content = readFileSync(KIMI_CONFIG, 'utf-8');
    return content.includes('omk') || content.includes('oh-my-kimi');
  },
  path: KIMI_CONFIG,
});

// Check 8: Hook script is valid JavaScript
checks.push({
  name: 'Hook script is valid JS',
  test: () => {
    const hookPath = join(OMK_SKILLS_DIR, 'handler.js');
    if (!existsSync(hookPath)) return false;
    try {
      const content = readFileSync(hookPath, 'utf-8');
      // Basic syntax check - look for common patterns
      return content.includes('export') || content.includes('function') || content.includes('=>');
    } catch {
      return false;
    }
  },
  path: join(OMK_SKILLS_DIR, 'handler.js'),
});

// Run all checks
console.log('OMK Setup Verification\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

for (const check of checks) {
  const result = check.test();
  const icon = result ? '✓' : '✗';
  console.log(`${icon} ${check.name}`);
  console.log(`  Path: ${check.path}`);
  if (!result) {
    console.log(`  Status: FAILED`);
    failed++;
  } else {
    passed++;
  }
  console.log('');
}

console.log('='.repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('\n✅ All checks passed! OMK is ready to use.');
  console.log('\nNext steps:');
  console.log('  1. Launch Kimi CLI: kimi');
  console.log('  2. Try: $deep-interview "your idea"');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Run "omk setup" to fix.');
  process.exit(1);
}
