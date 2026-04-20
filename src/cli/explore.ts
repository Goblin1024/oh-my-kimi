/**
 * Explore Command
 *
 * A read-only command to quickly search the codebase using simple string matching or regex.
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

export interface ExploreResult {
  file: string;
  lineNum: number;
  content: string;
}

import { execSync } from 'child_process';

/**
 * Get all files respecting .gitignore using git ls-files.
 * Falls back to basic recursive traversal if git is not available or not a git repo.
 */
function getFilesToSearch(dir: string): string[] {
  try {
    const stdout = execSync('git ls-files --cached --others --exclude-standard', {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return stdout.split(/\r?\n/).filter(Boolean);
  } catch {
    // Fallback if not a git repo or git fails
    return getFilesRecursive(dir, dir);
  }
}

function getFilesRecursive(dir: string, baseDir: string): string[] {
  const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.omk', '.kimi'];
  const IGNORE_EXTS = ['.jpg', '.png', '.mp4', '.pdf', '.zip', '.tar', '.gz', '.woff2'];
  let results: string[] = [];

  try {
    const files = readdirSync(dir);
    for (const file of files) {
      if (IGNORE_DIRS.includes(file)) continue;
      if (IGNORE_EXTS.some((ext) => file.toLowerCase().endsWith(ext))) continue;

      const fullPath = join(dir, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        results = results.concat(getFilesRecursive(fullPath, baseDir));
      } else if (stat.isFile()) {
        results.push(
          fullPath
            .replace(baseDir + (baseDir.endsWith('/') || baseDir.endsWith('\\') ? '' : '/'), '')
            .replace(/\\/g, '/')
        );
      }
    }
  } catch {
    // Ignore access errors
  }
  return results;
}

/**
 * Search the codebase for a pattern.
 */
export function searchCodebase(
  dir: string,
  query: string,
  isRegex = false,
  baseDir = dir,
  results: ExploreResult[] = []
): ExploreResult[] {
  const IGNORE_EXTS = [
    '.jpg',
    '.png',
    '.mp4',
    '.pdf',
    '.zip',
    '.tar',
    '.gz',
    '.woff2',
    '.ttf',
    '.eot',
    '.svg',
    '.bin',
    '.exe',
    '.dll',
  ];

  const files = getFilesToSearch(dir);

  let pattern: RegExp;
  if (isRegex) {
    pattern = new RegExp(query, 'g');
  } else {
    // Escape string for regex to do case-insensitive match
    pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  }

  for (const relativeFile of files) {
    // Basic extension check to skip binaries
    if (IGNORE_EXTS.some((ext) => relativeFile.toLowerCase().endsWith(ext))) continue;

    const fullPath = join(baseDir, relativeFile);

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // ReDoS Protection: Skip extremely long lines
        if (line.length > 2000) continue;

        if (pattern.test(line)) {
          results.push({
            file: relativeFile,
            lineNum: i + 1,
            content: line.trim(),
          });
          // Reset regex state if global
          pattern.lastIndex = 0;
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return results;
}

export async function explore(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error('Usage: omk explore <query> [--regex]');
    process.exit(1);
  }

  const isRegex = args.includes('--regex');
  // Extract query (everything that isn't a flag)
  const queryParts = args.filter((a) => !a.startsWith('--'));
  const query = queryParts.join(' ');

  if (!query) {
    console.error('Error: Empty search query');
    process.exit(1);
  }

  console.log(`\n🔍 Exploring codebase for: "${query}"\n`);

  const results = searchCodebase(process.cwd(), query, isRegex);

  if (results.length === 0) {
    console.log('No matches found.');
    return;
  }

  // Group by file
  const grouped: Record<string, { lineNum: number; content: string }[]> = {};
  for (const result of results) {
    if (!grouped[result.file]) grouped[result.file] = [];
    grouped[result.file].push(result);
  }

  for (const [file, matches] of Object.entries(grouped)) {
    console.log(`\x1b[36m${file}\x1b[0m`);
    for (const match of matches) {
      console.log(`  \x1b[33m${match.lineNum}\x1b[0m: ${match.content}`);
    }
    console.log('');
  }

  console.log(`Found ${results.length} matches in ${Object.keys(grouped).length} files.`);
}
