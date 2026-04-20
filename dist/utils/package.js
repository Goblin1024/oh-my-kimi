import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
export function getPackageRoot() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const candidate = join(__dirname, '..', '..');
        if (existsSync(join(candidate, 'package.json'))) {
            return candidate;
        }
        const candidate2 = join(__dirname, '..');
        if (existsSync(join(candidate2, 'package.json'))) {
            return candidate2;
        }
    }
    catch {
        // fall through to cwd fallback
    }
    return process.cwd();
}
//# sourceMappingURL=package.js.map