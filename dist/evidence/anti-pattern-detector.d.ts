/**
 * Anti-Pattern Detector
 *
 * Detects common shortcut patterns in AI behavior.
 * These patterns indicate the AI is trying to skip steps or make unverified claims.
 */
import type { Evidence } from './schema.js';
export interface ShortcutAttempt {
    type: string;
    description: string;
    severity: 'warning' | 'error';
}
export declare function detectShortcuts(skill: string, evidence: Evidence[], claim?: string): ShortcutAttempt[];
//# sourceMappingURL=anti-pattern-detector.d.ts.map