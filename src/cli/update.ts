/**
 * omk update - Check for updates and guide the user
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function update(): Promise<void> {
  console.log('🔄 Checking for oh-my-kimi updates...\n');

  try {
    // Simple way to find package.json relative to dist/cli
    let packagePath = join(__dirname, '..', '..', 'package.json');
    if (!existsSync(packagePath)) {
      packagePath = join(__dirname, '..', 'package.json');
    }

    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8')) as { version: string };
    const currentVersion = pkg.version;

    console.log(`Current version: v${currentVersion}`);

    // Try to get latest version from npm registry
    try {
      const latestVersion = execSync('npm show oh-my-kimi version', { encoding: 'utf-8' }).trim();

      console.log(`Latest version:  v${latestVersion}\n`);

      if (currentVersion === latestVersion) {
        console.log('✅ You are already on the latest version.');
      } else {
        console.log(`🎉 A new version is available!`);
        console.log('\nTo update, run:');
        console.log('  npm install -g oh-my-kimi@latest');
        console.log('  omk setup');
      }
    } catch {
      console.log('⚠ Could not check npm registry (package might not be published yet).');
      console.log('To update from source:');
      console.log('  git pull');
      console.log('  npm install');
      console.log('  npm run build');
      console.log('  npm install -g .');
      console.log('  omk setup');
    }
  } catch (err) {
    console.error(`Failed to check update: ${err instanceof Error ? err.message : String(err)}`);
  }
}
