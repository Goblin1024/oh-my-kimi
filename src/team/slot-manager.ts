/**
 * Slot Manager
 *
 * Reads Kimi CLI config to determine max concurrent tasks,
 * then enforces slot limits for team worker spawning.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const DEFAULT_MAX_TASKS = 4;
const KIMI_CONFIG_PATH = join(homedir(), '.kimi', 'config.toml');

/**
 * Parse max_running_tasks from Kimi config.toml.
 * Falls back to DEFAULT_MAX_TASKS if file missing or key not found.
 */
export function getMaxRunningTasks(configPath?: string): number {
  const path = configPath ?? KIMI_CONFIG_PATH;
  if (!existsSync(path)) return DEFAULT_MAX_TASKS;

  try {
    const content = readFileSync(path, 'utf-8');
    const match = content.match(/max_running_tasks\s*=\s*(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      return Number.isFinite(val) && val > 0 ? val : DEFAULT_MAX_TASKS;
    }
  } catch {
    // ignore read/parse errors
  }

  return DEFAULT_MAX_TASKS;
}

/**
 * Manages a pool of execution slots.
 */
export class SlotManager {
  private maxSlots: number;
  private usedSlots: number;

  constructor(maxSlots?: number) {
    this.maxSlots = maxSlots ?? getMaxRunningTasks();
    this.usedSlots = 0;
  }

  /** Current number of available slots */
  available(): number {
    return Math.max(0, this.maxSlots - this.usedSlots);
  }

  /** Total slot capacity */
  capacity(): number {
    return this.maxSlots;
  }

  /** Currently used slots */
  used(): number {
    return this.usedSlots;
  }

  /** Try to acquire a slot. Returns true on success. */
  acquire(): boolean {
    if (this.usedSlots < this.maxSlots) {
      this.usedSlots++;
      return true;
    }
    return false;
  }

  /** Release a previously acquired slot. */
  release(): void {
    this.usedSlots = Math.max(0, this.usedSlots - 1);
  }

  /** Check if any slots are free without acquiring */
  hasAvailability(): boolean {
    return this.usedSlots < this.maxSlots;
  }

  /** Reset to zero used slots */
  reset(): void {
    this.usedSlots = 0;
  }
}
