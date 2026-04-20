#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

function findTests(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      findTests(full, files);
    } else if (entry.name.endsWith('.test.js')) {
      files.push(full);
    }
  }
  return files;
}

const tests = findTests('dist');
if (tests.length === 0) {
  console.error('No compiled test files found in dist/. Run `npm run build` first.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...tests], {
  stdio: 'inherit',
  shell: false,
});

process.exit(result.status ?? 0);
