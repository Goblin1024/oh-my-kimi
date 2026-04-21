/**
 * Token State Persistence
 *
 * Saves and loads token budget snapshots to/from disk so the HUD and
 * other tools can observe token usage without recalculating from evidence.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { omkStateDir } from '../state/paths.js';

export interface TokenStateSnapshot {
  skill: string;
  budget: number;
  used: number;
  remaining: number;
  status: string;
  efficiency: number;
  route: {
    reasoningEffort: string;
    maxTokens: number;
    maxSteps: number;
  };
  timestamp: string;
}

function tokenStatePath(skill: string, cwd?: string): string {
  const dir = omkStateDir(cwd);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, `token-${skill}.json`);
}

/**
 * Save a token state snapshot to disk.
 */
export function saveTokenState(snapshot: TokenStateSnapshot, cwd?: string): void {
  const path = tokenStatePath(snapshot.skill, cwd);
  writeFileSync(path, JSON.stringify(snapshot, null, 2), 'utf-8');
}

/**
 * Load the most recent token state snapshot for a skill.
 */
export function loadTokenState(skill: string, cwd?: string): TokenStateSnapshot | null {
  const path = tokenStatePath(skill, cwd);
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    return raw as TokenStateSnapshot;
  } catch {
    return null;
  }
}

/**
 * Delete a token state snapshot.
 */
export function clearTokenState(skill: string, cwd?: string): void {
  const path = tokenStatePath(skill, cwd);
  if (existsSync(path)) {
    unlinkSync(path);
  }
}
