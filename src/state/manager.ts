/**
 * State management operations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { skillActivePath, skillStatePath } from './paths.js';

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
  [key: string]: any;
}

/**
 * Read state from JSON file
 */
export function readState<T = any>(filePath: string): T | null {
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
export function writeState(filePath: string, state: any): void {
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
 * Set active skill
 */
export function setActiveSkill(state: SkillState, projectRoot?: string): void {
  writeState(skillActivePath(projectRoot), state);
}

/**
 * Get skill-specific state
 */
export function getSkillState(skill: string, projectRoot?: string): SkillState | null {
  return readState<SkillState>(skillStatePath(skill, projectRoot));
}

/**
 * Set skill-specific state
 */
export function setSkillState(skill: string, state: SkillState, projectRoot?: string): void {
  writeState(skillStatePath(skill, projectRoot), state);
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
export function cancelWorkflow(reason: string = 'User requested', projectRoot?: string): SkillState | null {
  const active = getActiveSkill(projectRoot);
  if (!active?.active) return null;

  const cancelled: SkillState = {
    ...active,
    active: false,
    phase: 'cancelled',
    cancelled_at: new Date().toISOString(),
    reason
  };

  setActiveSkill(cancelled, projectRoot);
  setSkillState(active.skill, cancelled, projectRoot);

  return cancelled;
}
