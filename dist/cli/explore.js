/**
 * Explore Command
 *
 * A read-only command to quickly search the codebase using simple string matching or regex.
 */
import { readdirSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
/**
 * Recursively search a directory for a pattern.
 */
export function searchCodebase(dir, query, isRegex = false, baseDir = dir, results = []) {
    // Ignore common large/build directories
    const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.omk', '.kimi'];
    const IGNORE_EXTS = ['.jpg', '.png', '.mp4', '.pdf', '.zip', '.tar', '.gz', '.woff2'];
    const files = readdirSync(dir);
    for (const file of files) {
        if (IGNORE_DIRS.includes(file))
            continue;
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            searchCodebase(fullPath, query, isRegex, baseDir, results);
        }
        else if (stat.isFile()) {
            // Basic extension check to skip binaries
            if (IGNORE_EXTS.some((ext) => file.endsWith(ext)))
                continue;
            try {
                const content = readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');
                let pattern;
                if (isRegex) {
                    pattern = new RegExp(query, 'g');
                }
                else {
                    // Escape string for regex to do case-insensitive match
                    pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                }
                for (let i = 0; i < lines.length; i++) {
                    if (pattern.test(lines[i])) {
                        results.push({
                            file: fullPath.replace(baseDir + (baseDir.endsWith('/') || baseDir.endsWith('\\') ? '' : '/'), ''),
                            lineNum: i + 1,
                            content: lines[i].trim(),
                        });
                        // Reset regex state if global
                        pattern.lastIndex = 0;
                    }
                }
            }
            catch {
                // Skip files that can't be read (e.g. binary files mistaken as text)
            }
        }
    }
    return results;
}
export async function explore(args) {
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
    const grouped = {};
    for (const result of results) {
        if (!grouped[result.file])
            grouped[result.file] = [];
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
//# sourceMappingURL=explore.js.map