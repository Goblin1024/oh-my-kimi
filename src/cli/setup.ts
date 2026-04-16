/**
 * omk setup - Install OMK skills and configure Kimi hooks
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import * as TOML from '@iarna/toml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const KIMI_HOME = join(homedir(), '.kimi');
const KIMI_CONFIG = join(KIMI_HOME, 'config.toml');
const OMK_SKILLS_DIR = join(KIMI_HOME, 'skills', 'omk');

export async function setup(): Promise<void> {
  console.log('🚀 oh-my-kimi setup\n');

  // 1. Check Kimi CLI installation
  console.log('Checking Kimi CLI...');
  if (!existsSync(KIMI_HOME)) {
    console.error('❌ Kimi CLI not found. Please install Kimi CLI first:');
    console.error('   https://moonshotai.github.io/kimi-cli/');
    process.exit(1);
  }
  console.log('✓ Kimi CLI found\n');

  // 2. Create OMK skills directory
  console.log('Creating OMK skills directory...');
  mkdirSync(OMK_SKILLS_DIR, { recursive: true });
  console.log(`✓ ${OMK_SKILLS_DIR}\n`);

  // 3. Copy skills
  console.log('Installing OMK skills...');
  const sourceSkillsDir = join(__dirname, '..', '..', '..', 'skills');
  if (existsSync(sourceSkillsDir)) {
    const skills = ['ralph', 'deep-interview', 'ralplan', 'cancel'];
    for (const skill of skills) {
      const source = join(sourceSkillsDir, skill);
      const target = join(OMK_SKILLS_DIR, skill);
      if (existsSync(source)) {
        mkdirSync(target, { recursive: true });
        // Copy SKILL.md
        const skillFile = join(source, 'SKILL.md');
        if (existsSync(skillFile)) {
          cpSync(skillFile, join(target, 'SKILL.md'));
          console.log(`  ✓ ${skill}`);
        }
      }
    }
  }
  console.log('');

  // 4. Configure hooks
  console.log('Configuring Kimi hooks...');
  await configureHooks();
  console.log('✓ Hooks configured\n');

  // 5. Create project template
  console.log('Creating project template...');
  const templatesDir = join(__dirname, '..', '..', '..', 'templates');
  if (existsSync(templatesDir)) {
    const agnetsMdSource = join(templatesDir, 'AGENTS.md');
    if (existsSync(agnetsMdSource)) {
      console.log('  ✓ AGENTS.md template ready');
    }
  }
  console.log('');

  console.log('✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Run: omk doctor');
  console.log('  2. Launch Kimi CLI: kimi');
  console.log('  3. Try: $deep-interview "your idea"');
}

async function configureHooks(): Promise<void> {
  let config: any = {};
  
  // Read existing config
  if (existsSync(KIMI_CONFIG)) {
    try {
      const content = readFileSync(KIMI_CONFIG, 'utf-8');
      config = TOML.parse(content);
    } catch (e) {
      console.warn('  ⚠ Could not parse existing config, creating new one');
    }
  }

  // Ensure hooks array exists
  if (!config.hooks) {
    config.hooks = [];
  }

  // Check if OMK hooks already exist
  const hasOmkHooks = config.hooks.some((h: any) => 
    h.command && h.command.includes('omk')
  );

  if (hasOmkHooks) {
    console.log('  ✓ OMK hooks already configured');
    return;
  }

  // Add OMK hooks
  const omkHooks = [
    {
      event: 'UserPromptSubmit',
      command: `node ${join(OMK_SKILLS_DIR, 'hook.js')}`,
      matcher: '\\$[a-z-]+'
    },
    {
      event: 'SessionStart',
      command: `node ${join(OMK_SKILLS_DIR, 'session-start.js')}`
    },
    {
      event: 'Stop',
      command: `node ${join(OMK_SKILLS_DIR, 'stop.js')}`,
      timeout: 30
    }
  ];

  config.hooks.push(...omkHooks);

  // Write config back
  const tomlContent = TOML.stringify(config);
  writeFileSync(KIMI_CONFIG, tomlContent);
  
  console.log('  ✓ Added hooks to ~/.kimi/config.toml');
}
