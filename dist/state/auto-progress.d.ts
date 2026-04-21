/**
 * Auto-Progress / Crash Recovery
 *
 * On SessionStart, scans the evidence directory for the given skill
 * and determines the last valid checkpoint. This allows workflows to
 * resume from their last verified state after a crash or session loss.
 */
import type { SkillState } from './manager.js';
export interface RecoveryResult {
    recovered: boolean;
    phase: string;
    evidenceCount: number;
    missingSteps: string[];
}
/**
 * Attempt to recover from a crash by scanning evidence for the active skill.
 *
 * Strategy:
 * 1. List all evidence for the skill
 * 2. For each defined phase (in order), check if its requirements are satisfied
 * 3. The last satisfied phase becomes the recovery target
 * 4. If the current phase is earlier than the recovery target, suggest advancing
 */
export declare function recoverFromCrash(skill: string, cwd?: string): RecoveryResult;
/**
 * Generate a recovery message to inject into the session start overlay.
 */
export declare function formatRecoveryMessage(result: RecoveryResult): string;
/**
 * Build a recovered SkillState from crash recovery results.
 */
export declare function buildRecoveredState(skill: string, result: RecoveryResult): SkillState;
//# sourceMappingURL=auto-progress.d.ts.map