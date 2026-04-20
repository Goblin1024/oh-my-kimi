/**
 * State management operations
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { skillActivePath, skillStatePath } from './paths.js';
import { assertValidTransition } from './workflow-transition.js';

export interface SkillState {
  skill: string;
  active: boolean;
  phase: string;
  activated_at: string;
  updated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  session_id?: string;
  iteration?: number;
  reason?: string;
}

/**
 * Read state from JSON file
 */
export function readState<T extends SkillState = SkillState>(filePath: string): T | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write state to JSON file
 */
export function writeState(filePath: string, state: SkillState): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(state, null, 2));
}

/**
 * Get active skill state
 */
export function getActiveSkill(projectRoot?: string): SkillState | null {
  return readState<SkillState>(skillActivePath(projectRoot));
}

/**
 * Save the active skill state globally.
 */
export function setActiveSkill(state: SkillState, cwd?: string): void {
  const filePath = skillActivePath(cwd);

  // If a previous state exists, validate the transition
  const previousState = readState(filePath);
  if (previousState && previousState.skill === state.skill) {
    assertValidTransition(state.skill, previousState.phase, state.phase);
  }

  writeState(filePath, state);
}

/**
 * Retrieve skill-specific persistent state.
 */
export function getSkillState(skill: string, projectRoot?: string): SkillState | null {
  return readState<SkillState>(skillStatePath(skill, projectRoot));
}

/**
 * Save skill-specific persistent state.
 */
export function setSkillState(skill: string, state: SkillState, cwd?: string): void {
  const filePath = skillStatePath(skill, cwd);

  // Validate transition
  const previousState = readState(filePath);
  if (previousState) {
    assertValidTransition(skill, previousState.phase, state.phase);
  }

  writeState(filePath, state);
}

/**
 * Check if a workflow is active
 */
export function isWorkflowActive(projectRoot?: string): boolean {
  const active = getActiveSkill(projectRoot);
  return active?.active === true;
}

/**
 * Cancel active workflow
 */
export function cancelWorkflow(
  reason: string = 'User requested',
  projectRoot?: string
): SkillState | null {
  const active = getActiveSkill(projectRoot);
  if (!active?.active) return null;

  const cancelled: SkillState = {
    ...active,
    active: false,
    phase: 'cancelled',
    cancelled_at: new Date().toISOString(),
    reason,
  };

  setActiveSkill(cancelled, projectRoot);
  setSkillState(active.skill, cancelled, projectRoot);

  return cancelled;
}
