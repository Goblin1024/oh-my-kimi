/**
 * omk setup - Install OMK skills and configure Kimi hooks
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  cpSync,
  readdirSync,
  statSync,
} from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import * as TOML from '@iarna/toml';

// Typed representation of the Kimi config TOML
interface KimiHook {
  event: string;
  command: string;
  matcher?: string;
  timeout?: number;
}

interface KimiConfig {
  hooks?: KimiHook[];
  [key: string]: unknown;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KIMI_HOME = join(homedir(), '.kimi');
const KIMI_CONFIG = join(KIMI_HOME, 'config.toml');
const OMK_SKILLS_DIR = join(KIMI_HOME, 'skills', 'omk');

// Step tracking for verification
interface SetupStep {
  name: string;
  action: () => void | Promise<void>;
  verify: () => boolean;
}

export async function setup(): Promise<void> {
  console.log('🚀 oh-my-kimi setup\n');
  console.log('='.repeat(50));
  console.log('');

  // Find package root
  const packageRoot = findPackageRoot();
  console.log(`Package root: ${packageRoot}`);
  console.log('');

  // Define all setup steps
  const steps: SetupStep[] = [
    {
      name: 'Check Kimi CLI installation',
      action: () => {
        if (!existsSync(KIMI_HOME)) {
          throw new Error('Kimi CLI not found. Please install Kimi CLI first.');
        }
      },
      verify: () => existsSync(KIMI_HOME),
    },
    {
      name: 'Create OMK skills directory',
      action: () => {
        mkdirSync(OMK_SKILLS_DIR, { recursive: true });
      },
      verify: () => existsSync(OMK_SKILLS_DIR),
    },
    {
      name: 'Copy hook handler',
      action: () => {
        const source = join(packageRoot, 'dist', 'hooks', 'handler.js');
        const target = join(OMK_SKILLS_DIR, 'handler.js');
        if (!existsSync(source)) {
          throw new Error(`Hook handler not found at ${source}. Run "npm run build" first.`);
        }
        cpSync(source, target);
      },
      verify: () => existsSync(join(OMK_SKILLS_DIR, 'handler.js')),
    },
    {
      name: 'Copy session-start hook',
      action: () => {
        // Session start uses the same handler with different entry point
        const source = join(packageRoot, 'dist', 'hooks', 'handler.js');
        const target = join(OMK_SKILLS_DIR, 'session-start.js');
        // For now, copy the same file - handler.js handles all events
        cpSync(source, target);
      },
      verify: () => existsSync(join(OMK_SKILLS_DIR, 'session-start.js')),
    },
    {
      name: 'Copy stop hook',
      action: () => {
        const source = join(packageRoot, 'dist', 'hooks', 'handler.js');
        const target = join(OMK_SKILLS_DIR, 'stop.js');
        cpSync(source, target);
      },
      verify: () => existsSync(join(OMK_SKILLS_DIR, 'stop.js')),
    },
    {
      name: 'Install skills',
      action: () => {
        const skillsRoot = join(packageRoot, 'skills');
        if (!existsSync(skillsRoot)) return;

        const skills = readdirSync(skillsRoot).filter((f) =>
          statSync(join(skillsRoot, f)).isDirectory()
        );

        for (const skill of skills) {
          const sourceDir = join(skillsRoot, skill);
          const targetDir = join(OMK_SKILLS_DIR, skill);

          mkdirSync(targetDir, { recursive: true });
          const skillFile = join(sourceDir, 'SKILL.md');
          if (existsSync(skillFile)) {
            cpSync(skillFile, join(targetDir, 'SKILL.md'));
          }
        }
      },
      verify: () => {
        const skillsRoot = join(packageRoot, 'skills');
        if (!existsSync(skillsRoot)) return true;
        const skills = readdirSync(skillsRoot).filter((f) =>
          statSync(join(skillsRoot, f)).isDirectory()
        );
        return skills.every((skill) => existsSync(join(OMK_SKILLS_DIR, skill, 'SKILL.md')));
      },
    },
    {
      name: 'Copy prompts',
      action: () => {
        const sourcePrompts = join(packageRoot, 'prompts');
        const targetPrompts = join(KIMI_HOME, 'prompts', 'omk');
        if (existsSync(sourcePrompts)) {
          mkdirSync(targetPrompts, { recursive: true });
          const prompts = readdirSync(sourcePrompts).filter((f) => f.endsWith('.md'));
          for (const prompt of prompts) {
            cpSync(join(sourcePrompts, prompt), join(targetPrompts, prompt));
          }
        }
      },
      verify: () => {
        const sourcePrompts = join(packageRoot, 'prompts');
        if (!existsSync(sourcePrompts)) return true;
        const targetPrompts = join(KIMI_HOME, 'prompts', 'omk');
        const prompts = readdirSync(sourcePrompts).filter((f) => f.endsWith('.md'));
        return prompts.every((prompt) => existsSync(join(targetPrompts, prompt)));
      },
    },
    {
      name: 'Configure Kimi hooks',
      action: () => {
        configureHooks();
      },
      verify: () => {
        if (!existsSync(KIMI_CONFIG)) return false;
        const content = readFileSync(KIMI_CONFIG, 'utf-8');
        return content.includes('omk') || content.includes('oh-my-kimi');
      },
    },
    {
      name: 'Write integrity hash',
      action: () => {
        const pkgPath = join(packageRoot, 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

        // Compute SHA-256 of the handler script for tamper detection
        const handlerPath = join(OMK_SKILLS_DIR, 'handler.js');
        let handlerHash = 'none';
        if (existsSync(handlerPath)) {
          const handlerContent = readFileSync(handlerPath, 'utf-8');
          handlerHash = createHash('sha256').update(handlerContent).digest('hex');
        }

        const integrity = { version: pkg.version, handlerHash };
        writeFileSync(join(OMK_SKILLS_DIR, 'integrity.json'), JSON.stringify(integrity, null, 2));
      },
      verify: () => existsSync(join(OMK_SKILLS_DIR, 'integrity.json')),
    },
  ];

  // Execute each step with verification
  let allPassed = true;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepNum = i + 1;

    console.log(`Step ${stepNum}/${steps.length}: ${step.name}`);

    try {
      // Execute action
      await step.action();

      // Verify
      const verified = step.verify();
      if (verified) {
        console.log(`  ✓ Success\n`);
      } else {
        console.log(`  ✗ Verification failed\n`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      allPassed = false;
    }
  }

  console.log('='.repeat(50));
  console.log('');

  if (allPassed) {
    console.log('✅ Setup completed successfully!\n');

    // Run final verification
    console.log('Running final verification...\n');
    await runFinalVerification();

    console.log('\nNext steps:');
    console.log('  1. Launch Kimi CLI: kimi');
    console.log('  2. Try: $deep-interview "your idea"');
  } else {
    console.log('❌ Setup completed with errors.\n');
    console.log('Please check the error messages above.');
    process.exit(1);
  }
}

function findPackageRoot(): string {
  // Try to find package.json by walking up from __dirname
  let current = __dirname;
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(current, 'package.json'))) {
      return current;
    }
    current = dirname(current);
  }
  // Fallback to current working directory
  return process.cwd();
}

function configureHooks(): void {
  let config: KimiConfig = {};

  // Read existing config
  if (existsSync(KIMI_CONFIG)) {
    try {
      const content = readFileSync(KIMI_CONFIG, 'utf-8');
      config = TOML.parse(content) as KimiConfig;
    } catch (_e) {
      console.warn('  ⚠ Could not parse existing config, creating new one');
    }
  }

  // Ensure hooks array exists
  if (!config.hooks) {
    config.hooks = [];
  }

  // Check if OMK hooks already exist
  const hasOmkHooks = config.hooks.some((h) => h.command && h.command.includes('omk'));

  if (hasOmkHooks) {
    console.log('  ℹ OMK hooks already configured');
    return;
  }

  // Add OMK hooks
  const omkHooks = [
    {
      event: 'UserPromptSubmit',
      command: `node ${join(OMK_SKILLS_DIR, 'handler.js')}`,
      matcher: '\\$[a-z-]+',
    },
    {
      event: 'SessionStart',
      command: `node ${join(OMK_SKILLS_DIR, 'session-start.js')}`,
    },
    {
      event: 'Stop',
      command: `node ${join(OMK_SKILLS_DIR, 'stop.js')}`,
      timeout: 30,
    },
  ];

  config.hooks.push(...omkHooks);

  // Write config back — cast through unknown to satisfy TOML library's JsonMap type
  // (KimiConfig uses unknown value types but all actual values are TOML-serializable)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tomlContent = TOML.stringify(config as unknown as any);
  writeFileSync(KIMI_CONFIG, tomlContent);

  console.log(`  ✓ Added hooks to ~/.kimi/config.toml`);
}

async function runFinalVerification(): Promise<void> {
  // Dynamically discover expected skills from the bundled skills/ directory
  const root = findPackageRoot();
  const skillsRoot = join(root, 'skills');
  const expectedSkills = existsSync(skillsRoot)
    ? readdirSync(skillsRoot).filter((f) => statSync(join(skillsRoot, f)).isDirectory())
    : ['ralph', 'deep-interview', 'ralplan', 'cancel'];

  const checks = [
    {
      name: 'Hook handler executable',
      test: () => existsSync(join(OMK_SKILLS_DIR, 'handler.js')),
    },
    {
      name: `All ${expectedSkills.length} skills installed`,
      test: () => expectedSkills.every((skill) => existsSync(join(OMK_SKILLS_DIR, skill, 'SKILL.md'))),
    },
    {
      name: 'Kimi config updated',
      test: () => {
        if (!existsSync(KIMI_CONFIG)) return false;
        const content = readFileSync(KIMI_CONFIG, 'utf-8');
        return content.includes('omk');
      },
    },
  ];

  let passed = 0;

  for (const check of checks) {
    const result = check.test();
    const icon = result ? '✓' : '✗';
    console.log(`  ${icon} ${check.name}`);
    if (result) passed++;
  }

  console.log(`\nVerification: ${passed}/${checks.length} checks passed`);
}
