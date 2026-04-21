/**
 * Auto-Progress / Crash Recovery
 *
 * On SessionStart, scans the evidence directory for the given skill
 * and determines the last valid checkpoint. This allows workflows to
 * resume from their last verified state after a crash or session loss.
 */

import { listEvidence } from './evidence.js';
import { getPhaseRequirements } from '../skills/evidence-requirements.js';
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
export function recoverFromCrash(skill: string, cwd?: string): RecoveryResult {
  const allEvidence = listEvidence(skill, cwd);

  if (allEvidence.length === 0) {
    return { recovered: false, phase: 'starting', evidenceCount: 0, missingSteps: [] };
  }

  // Define the canonical phase order for known skills
  const phaseOrder = getCanonicalPhaseOrder(skill);

  let bestPhase = 'starting';
  let missingSteps: string[] = [];

  for (const phase of phaseOrder) {
    const requirements = getPhaseRequirements(skill, phase);
    if (!requirements || requirements.length === 0) {
      bestPhase = phase;
      continue;
    }

    const satisfied = requirements.every((req) => allEvidence.some((e) => e.step === req.step));

    if (satisfied) {
      bestPhase = phase;
      missingSteps = [];
    } else {
      missingSteps = requirements
        .filter((req) => !allEvidence.some((e) => e.step === req.step))
        .map((req) => req.step);
    }
  }

  return {
    recovered: bestPhase !== 'starting',
    phase: bestPhase,
    evidenceCount: allEvidence.length,
    missingSteps,
  };
}

/**
 * Get the canonical phase order for a skill.
 * Falls back to a generic order if the skill is unknown.
 */
function getCanonicalPhaseOrder(skill: string): string[] {
  const known: Record<string, string[]> = {
    ralph: ['starting', 'executing', 'verifying', 'completing', 'completed'],
    ralplan: ['starting', 'planning', 'designing', 'documenting', 'approving', 'completed'],
    'deep-interview': ['starting', 'clarifying', 'completed'],
    team: ['starting', 'team-plan', 'team-prd', 'team-exec', 'team-verify', 'completed'],
    autopilot: ['starting', 'planning', 'execution', 'qa', 'validation', 'complete'],
  };

  return known[skill] ?? ['starting', 'executing', 'verifying', 'completed'];
}

/**
 * Generate a recovery message to inject into the session start overlay.
 */
export function formatRecoveryMessage(result: RecoveryResult): string {
  if (!result.recovered) {
    return '';
  }

  const lines: string[] = [
    '',
    '⚡ CRASH RECOVERY',
    `  Resumed from phase: '${result.phase}'`,
    `  Evidence found: ${result.evidenceCount} item(s)`,
  ];

  if (result.missingSteps.length > 0) {
    lines.push(`  Missing for next phase: ${result.missingSteps.join(', ')}`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Build a recovered SkillState from crash recovery results.
 */
export function buildRecoveredState(skill: string, result: RecoveryResult): SkillState {
  return {
    skill,
    active: true,
    phase: result.phase,
    activated_at: new Date().toISOString(),
  };
}
