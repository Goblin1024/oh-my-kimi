/**
 * Explore Command
 *
 * A read-only command to quickly search the codebase using simple string matching or regex.
 */
export interface ExploreResult {
    file: string;
    lineNum: number;
    content: string;
}
/**
 * Recursively search a directory for a pattern.
 */
export declare function searchCodebase(dir: string, query: string, isRegex?: boolean, baseDir?: string, results?: ExploreResult[]): ExploreResult[];
export declare function explore(args: string[]): Promise<void>;
//# sourceMappingURL=explore.d.ts.map