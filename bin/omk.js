#!/usr/bin/env node

// oh-my-kimi CLI entry point
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const distEntry = join(root, 'dist', 'cli', 'index.js');

if (existsSync(distEntry)) {
  const { main } = await import(pathToFileURL(distEntry).href);
  await main(process.argv.slice(2));
  process.exit(process.exitCode ?? 0);
} else {
  console.error('oh-my-kimi: run "npm run build" first');
  process.exit(1);
}
