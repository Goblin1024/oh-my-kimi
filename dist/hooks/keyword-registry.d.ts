/**
 * Keyword Registry — Extensible keyword detection for OMK hooks
 *
 * Replaces the hardcoded KEYWORDS map in handler.ts with a registrable,
 * priority-based keyword detection system.
 */
export interface KeywordEntry {
    /** Unique identifier for this keyword entry */
    id: string;
    /** Regex patterns that trigger this keyword (tested in order, first match wins) */
    patterns: RegExp[];
    /** The skill name to activate */
    skill: string;
    /** Higher priority wins when multiple keywords match (default: 0) */
    priority: number;
    /** Human-readable description */
    description: string;
}
/**
 * Registry that manages keyword entries and performs priority-based detection.
 */
export declare class KeywordRegistry {
    private entries;
    /**
     * Register a new keyword entry.
     * Entries with duplicate IDs will replace the previous entry.
     */
    register(entry: KeywordEntry): void;
    /**
     * Detect the best-matching keyword in the given prompt.
     *
     * Rules:
     * 1. Explicit `$name` invocations (e.g. "$ralph") have +100 priority boost
     * 2. Among matches, highest priority wins
     * 3. Case-insensitive matching
     */
    detect(prompt: string): KeywordEntry | null;
    /**
     * List all registered keyword entries, sorted by priority (descending).
     */
    listAll(): KeywordEntry[];
    /**
     * Get a specific entry by ID.
     */
    get(id: string): KeywordEntry | undefined;
    /**
     * Remove a keyword entry by ID.
     */
    unregister(id: string): boolean;
}
/**
 * Create and return the default keyword registry with built-in OMK keywords.
 *
 * First registers the full hardcoded keyword set (including implicit patterns)
 * for guaranteed backwards compatibility, then dynamically discovers any
 * additional skills from the bundled skills/ directory and appends them.
 */
export declare function createDefaultRegistry(): KeywordRegistry;
//# sourceMappingURL=keyword-registry.d.ts.map