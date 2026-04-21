/**
 * MemPalace Bridge
 *
 * Bridges OMK (Node.js/TypeScript) to MemPalace (Python-based local-first AI
 * memory system). Spawns the `mempalace` CLI and handles stdio, result parsing,
 * and graceful fallbacks when MemPalace is not installed.
 */
export interface CommandResult {
    /** Raw stdout from the CLI */
    stdout: string;
    /** Raw stderr from the CLI */
    stderr: string;
    /** Process exit code (null if process was killed) */
    exitCode: number | null;
    /** Whether the command executed successfully */
    success: boolean;
}
export interface SearchResult {
    wing: string;
    room: string;
    source: string;
    similarity: number;
    text: string;
}
export interface StatusResult {
    totalDrawers: number;
    wings: Array<{
        name: string;
        rooms: Array<{
            name: string;
            drawers: number;
        }>;
    }>;
}
/** Alias for StatusResult used by the standalone convenience API. */
export type PalaceStatus = StatusResult;
export interface MemPalaceBridge {
    /** Is the `mempalace` CLI available in PATH? */
    available: boolean;
    /** Resolved absolute path to the palace directory */
    palacePath: string;
    /** Initialize a project directory as a palace wing */
    init(projectPath: string, options?: InitOptions): Promise<CommandResult>;
    /** Mine files from a directory into the palace */
    mine(projectPath: string, options?: MineOptions): Promise<CommandResult>;
    /** Search the palace */
    search(query: string, options?: SearchOptions): Promise<CommandResult & {
        results?: SearchResult[];
    }>;
    /** Load L0+L1 wake-up context */
    wakeUp(options?: WakeUpOptions): Promise<CommandResult>;
    /** Show palace status */
    status(options?: StatusOptions): Promise<CommandResult & {
        status?: StatusResult;
    }>;
}
export interface InitOptions {
    yes?: boolean;
    lang?: string;
}
export interface MineOptions {
    mode?: 'projects' | 'convos';
    wing?: string;
    agent?: string;
    limit?: number;
    dryRun?: boolean;
    noGitignore?: boolean;
    includeIgnored?: string[];
    extract?: 'exchange' | 'general';
}
export interface SearchOptions {
    wing?: string;
    room?: string;
    results?: number;
}
export interface WakeUpOptions {
    wing?: string;
}
export interface StatusOptions {
}
/**
 * Read the cached palace path for a project.
 * Falls back to `<projectRoot>/.mempalace` if no cache exists.
 */
export declare function getPalacePath(projectRoot?: string): string;
/**
 * Cache a palace path for the current project.
 * The path is stored relative to the project root when possible.
 */
export declare function setPalacePath(palacePath: string, projectRoot?: string): void;
/**
 * Detect whether `mempalace` is available in PATH.
 * The result is cached for the lifetime of the process.
 */
export declare function isMemPalaceAvailable(): Promise<boolean>;
/** Clear the availability cache (useful for testing). */
export declare function clearAvailabilityCache(): void;
/**
 * Parse `mempalace search` stdout into structured results.
 *
 * Example output:
 *   ============================================================
 *     Results for: "why graphql"
 *   ============================================================
 *
 *     [1] my_app / src
 *         Source: app.ts
 *         Match:  0.823
 *
 *         import { graphql } from ...
 *
 *     ──────────────────────────────────────────────────────────
 */
export declare function parseSearchOutput(stdout: string): SearchResult[];
/**
 * Parse `mempalace status` stdout into structured results.
 *
 * Example output:
 *   ========================================================
 *     MemPalace Status — 42 drawers
 *   ========================================================
 *
 *     WING: my_app
 *       ROOM: src                 30 drawers
 *       ROOM: tests               12 drawers
 *
 *   ========================================================
 */
export declare function parseStatusOutput(stdout: string): StatusResult | undefined;
/**
 * Parse `mempalace wake-up` stdout, returning only the L0+L1 context text.
 *
 * Example output:
 *   Wake-up text (~123 tokens):
 *   ==================================================
 *   <L0 + L1 text here>
 */
export declare function parseWakeUpOutput(stdout: string): string;
/**
 * Create a MemPalace bridge for the given project root.
 *
 * If `mempalace` is not installed, the returned bridge still exposes the same
 * API but every command resolves to a `CommandResult` with `success: false`
 * and a helpful `stderr` message.
 */
export declare function createBridge(projectRoot?: string): Promise<MemPalaceBridge>;
/**
 * Search MemPalace for semantically similar content.
 *
 * @param query - Search query string
 * @param options - Optional filters (wing, room, limit)
 * @returns Array of search results; empty if MemPalace is unavailable
 */
export declare function searchMemPalace(query: string, options?: {
    wing?: string;
    room?: string;
    limit?: number;
}): Promise<SearchResult[]>;
/**
 * Add verbatim content to MemPalace as a new drawer.
 *
 * Uses the MemPalace Python API via a temporary wrapper script because the
 * CLI does not expose a direct "add" command.
 *
 * @param content - Verbatim text to store
 * @param metadata - Wing, room, and optional tags
 */
export declare function addToMemPalace(content: string, metadata: {
    wing: string;
    room: string;
    tags?: string[];
}): Promise<void>;
/**
 * Get the current MemPalace status.
 *
 * @returns Structured palace status; empty status if MemPalace is unavailable
 */
export declare function getMemPalaceStatus(): Promise<PalaceStatus>;
/**
 * Load L0 + L1 wake-up context from MemPalace.
 *
 * @returns Wake-up text (identity + essential story); empty string if unavailable
 */
export declare function wakeUpMemPalace(): Promise<string>;
//# sourceMappingURL=bridge.d.ts.map