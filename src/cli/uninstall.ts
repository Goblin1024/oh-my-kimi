/**
 * omk uninstall - Remove OMK hooks and skills
 */

import { existsSync, readFileSync, writeFileSync, cpSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import * as TOML from '@iarna/toml';

const KIMI_HOME = join(homedir(), '.kimi');
const KIMI_CONFIG = join(KIMI_HOME, 'config.toml');
const OMK_SKILLS_DIR = join(KIMI_HOME, 'skills', 'omk');

interface KimiHook {
  event: string;
  command: string;
  [key: string]: unknown;
}

interface KimiConfig {
  hooks?: KimiHook[];
  [key: string]: unknown;
}

export async function uninstall(): Promise<void> {
  console.log('🗑️ Uninstalling oh-my-kimi\n');

  // 1. Clean config.toml
  if (existsSync(KIMI_CONFIG)) {
    console.log('1. Removing OMK hooks from config.toml...');
    try {
      // Backup
      const backupPath = `${KIMI_CONFIG}.bak`;
      cpSync(KIMI_CONFIG, backupPath);
      console.log(`  - Backed up config to ${backupPath}`);

      const content = readFileSync(KIMI_CONFIG, 'utf-8');
      const config = TOML.parse(content) as KimiConfig;

      if (config.hooks && Array.isArray(config.hooks)) {
        const originalCount = config.hooks.length;
        config.hooks = config.hooks.filter(
          (h) => !(h.command && typeof h.command === 'string' && h.command.includes('omk'))
        );

        if (config.hooks.length < originalCount) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tomlContent = TOML.stringify(config as unknown as any);
          writeFileSync(KIMI_CONFIG, tomlContent);
          console.log(`  ✓ Removed ${originalCount - config.hooks.length} OMK hooks`);
        } else {
          console.log(`  - No OMK hooks found in config`);
        }
      }
    } catch (err) {
      console.error(
        `  ✗ Failed to update config: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 2. Remove skills dir
  console.log('\n2. Removing OMK skills directory...');
  if (existsSync(OMK_SKILLS_DIR)) {
    try {
      rmSync(OMK_SKILLS_DIR, { recursive: true, force: true });
      console.log(`  ✓ Removed ${OMK_SKILLS_DIR}`);
    } catch (err) {
      console.error(
        `  ✗ Failed to remove skills dir: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  } else {
    console.log(`  - Directory does not exist: ${OMK_SKILLS_DIR}`);
  }

  console.log('\n✅ Uninstall complete.');
  console.log('Note: To completely remove the CLI, run "npm uninstall -g oh-my-kimi"');
}
