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
export class KeywordRegistry {
  private entries: KeywordEntry[] = [];

  /**
   * Register a new keyword entry.
   * Entries with duplicate IDs will replace the previous entry.
   */
  register(entry: KeywordEntry): void {
    // Remove existing entry with same id
    this.entries = this.entries.filter((e) => e.id !== entry.id);
    this.entries.push(entry);
    // Sort by priority descending for detection order
    this.entries.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Detect the best-matching keyword in the given prompt.
   *
   * Rules:
   * 1. Explicit `$name` invocations (e.g. "$ralph") have +100 priority boost
   * 2. Among matches, highest priority wins
   * 3. Case-insensitive matching
   */
  detect(prompt: string): KeywordEntry | null {
    const normalizedPrompt = prompt;
    let bestMatch: KeywordEntry | null = null;
    let bestPriority = -Infinity;

    for (const entry of this.entries) {
      for (const pattern of entry.patterns) {
        if (pattern.test(normalizedPrompt)) {
          // Check if this is an explicit $name invocation for priority boost
          const explicitPattern = new RegExp(`\\$${entry.skill}\\b`, 'i');
          const isExplicit = explicitPattern.test(normalizedPrompt);
          const effectivePriority = isExplicit ? entry.priority + 100 : entry.priority;

          if (effectivePriority > bestPriority) {
            bestPriority = effectivePriority;
            bestMatch = entry;
          }
          break; // Only need one pattern to match per entry
        }
      }
    }

    return bestMatch;
  }

  /**
   * List all registered keyword entries, sorted by priority (descending).
   */
  listAll(): KeywordEntry[] {
    return [...this.entries];
  }

  /**
   * Get a specific entry by ID.
   */
  get(id: string): KeywordEntry | undefined {
    return this.entries.find((e) => e.id === id);
  }

  /**
   * Remove a keyword entry by ID.
   */
  unregister(id: string): boolean {
    const before = this.entries.length;
    this.entries = this.entries.filter((e) => e.id !== id);
    return this.entries.length < before;
  }
}

import { loadSkillManifest } from '../skills/parser.js';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getPackageRoot(): string {
  return join(__dirname, '..', '..');
}

function scanBundledSkills(): Array<{ name: string; trigger?: string; description: string }> {
  const skillsDir = join(getPackageRoot(), 'skills');
  if (!existsSync(skillsDir)) return [];

  const results: Array<{ name: string; trigger?: string; description: string }> = [];
  for (const entry of readdirSync(skillsDir)) {
    const skillDir = join(skillsDir, entry);
    if (!statSync(skillDir).isDirectory()) continue;
    const manifest = loadSkillManifest(entry);
    if (manifest) {
      results.push({
        name: manifest.name,
        trigger: manifest.trigger,
        description: manifest.description,
      });
    }
  }
  return results;
}

/**
 * Create and return the default keyword registry with built-in OMK keywords.
 *
 * First registers the full hardcoded keyword set (including implicit patterns)
 * for guaranteed backwards compatibility, then dynamically discovers any
 * additional skills from the bundled skills/ directory and appends them.
 */
export function createDefaultRegistry(): KeywordRegistry {
  const registry = new KeywordRegistry();

  // Core controls that should always exist
  registry.register({
    id: 'cancel',
    patterns: [/\$cancel/i, /\babort\b/i],
    skill: 'cancel',
    priority: 50, // Higher priority so $cancel always wins
    description: 'Cancel active workflow',
  });

  // Hardcoded fallback entries with full implicit pattern coverage
  const fallbackSkills: KeywordEntry[] = [
    {
      id: 'deep-interview',
      patterns: [
        /\$deep-interview/i,
        /\bdeep interview\b/i,
        /\binterview me\b/i,
        /\bdon't assume\b/i,
      ],
      skill: 'deep-interview',
      priority: 10,
      description: 'Socratic requirements gathering through deep questioning',
    },
    {
      id: 'ralplan',
      patterns: [/\$ralplan/i, /\bconsensus plan\b/i],
      skill: 'ralplan',
      priority: 10,
      description: 'Architecture planning with structured deliberation and approval',
    },
    {
      id: 'ralph',
      patterns: [/\$ralph/i, /\bdon't stop\b/i, /\bmust complete\b/i, /\bkeep going\b/i],
      skill: 'ralph',
      priority: 10,
      description: 'Persistent completion loop with verification',
    },
    {
      id: 'team',
      patterns: [/\$team/i],
      skill: 'team',
      priority: 10,
      description: 'Launch parallel subagent team execution',
    },
    {
      id: 'plan',
      patterns: [/\$plan/i, /\bplan this\b/i, /\bplan the\b/i, /\blet's plan\b/i],
      skill: 'plan',
      priority: 5,
      description: 'Start planning workflow',
    },
    {
      id: 'analyze',
      patterns: [/\$analyze/i, /\binvestigate\b/i],
      skill: 'analyze',
      priority: 5,
      description: 'Run deep analysis on code or problem',
    },
    {
      id: 'build-fix',
      patterns: [/\$build-fix/i, /\bfix build\b/i, /\btype errors\b/i],
      skill: 'build-fix',
      priority: 5,
      description: 'Fix build/compilation errors',
    },
    {
      id: 'code-review',
      patterns: [/\$code-review/i, /\breview code\b/i, /\bcode review\b/i],
      skill: 'code-review',
      priority: 5,
      description: 'Run structured code review',
    },
    {
      id: 'help',
      patterns: [/\$help/i],
      skill: 'help',
      priority: 5,
      description: 'Show available skills and help',
    },
    {
      id: 'note',
      patterns: [/\$note/i],
      skill: 'note',
      priority: 5,
      description: 'Save a session note',
    },
  ];

  for (const entry of fallbackSkills) {
    registry.register(entry);
  }

  // Dynamically discover any additional skills not in the hardcoded set
  try {
    const discovered = scanBundledSkills();
    for (const skill of discovered) {
      if (registry.get(skill.name)) continue; // Already known
      const triggerPattern = skill.trigger
        ? new RegExp(`\\${skill.trigger}\\b`, 'i')
        : new RegExp(`\\$${skill.name}\\b`, 'i');
      registry.register({
        id: skill.name,
        patterns: [triggerPattern],
        skill: skill.name,
        priority: 5,
        description: skill.description,
      });
    }
  } catch {
    // Ignore dynamic discovery failures — hardcoded set is sufficient
  }

  return registry;
}
