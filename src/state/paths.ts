/**
 * State file path utilities
 */

import { join } from 'path';
import { homedir } from 'os';

/** Get Kimi home directory */
export function kimiHome(): string {
  return process.env.KIMI_HOME || join(homedir(), '.kimi');
}

/** Get OMK skills directory */
export function omkSkillsDir(): string {
  return join(kimiHome(), 'skills', 'omk');
}

/** Get project OMK state directory */
export function omkStateDir(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'state');
}

/** Get project OMK plans directory */
export function omkPlansDir(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'plans');
}

/** Get project OMK context directory */
export function omkContextDir(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'context');
}

/** Get skill-active state file path */
export function skillActivePath(projectRoot?: string): string {
  return join(omkStateDir(projectRoot), 'skill-active.json');
}

/** Get specific skill state file path */
export function skillStatePath(skill: string, projectRoot?: string): string {
  return join(omkStateDir(projectRoot), `${skill}-state.json`);
}
