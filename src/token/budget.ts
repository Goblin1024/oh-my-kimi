/**
 * Token Budget Tracker
 *
 * Tracks token consumption per skill session and enforces budget limits.
 * Provides efficiency scoring to help optimize token usage over time.
 */

export interface BudgetConfig {
  /** Total token budget for this skill session */
  budget: number;
  /** Warning threshold (default: 80% of budget) */
  warningThreshold: number;
  /** Critical threshold (default: 95% of budget) */
  criticalThreshold: number;
}

const DEFAULT_BUDGETS: Record<string, number> = {
  ecomode: 8_000,
  'deep-interview': 16_000,
  plan: 16_000,
  ralplan: 32_000,
  ralph: 32_000,
  team: 64_000,
  autopilot: 128_000,
  ultrawork: 128_000,
};

const FLAG_MULTIPLIERS: Record<string, number> = {
  '--deliberate': 4.0,
  '--quick': 0.5,
  '--eco': 0.25,
  '--verbose': 1.5,
};

/**
 * Determine the default token budget for a skill.
 */
export function getDefaultBudget(skill: string, flags: string[] = []): number {
  const base = DEFAULT_BUDGETS[skill] ?? 32_000;
  let multiplier = 1.0;

  for (const flag of flags) {
    const lower = flag.toLowerCase();
    if (lower in FLAG_MULTIPLIERS) {
      multiplier *= FLAG_MULTIPLIERS[lower];
    }
  }

  return Math.round(base * multiplier);
}

/**
 * Token budget tracker for a single skill session.
 */
export class TokenBudget {
  private skill: string;
  private budget: number;
  private used: number;
  private warningThreshold: number;
  private criticalThreshold: number;
  private startTime: number;

  constructor(skill: string, budget: number) {
    this.skill = skill;
    this.budget = budget;
    this.used = 0;
    this.warningThreshold = Math.round(budget * 0.8);
    this.criticalThreshold = Math.round(budget * 0.95);
    this.startTime = Date.now();
  }

  /**
   * Record token consumption (positive) or reclaim tokens (negative).
   */
  consume(tokens: number): void {
    this.used = Math.max(0, this.used + tokens);
  }

  /**
   * Remaining tokens.
   */
  remaining(): number {
    return Math.max(0, this.budget - this.used);
  }

  /**
   * Whether the budget has been exceeded.
   */
  isExceeded(): boolean {
    return this.used > this.budget;
  }

  /**
   * Check current status against thresholds.
   * Returns: 'ok' | 'warning' | 'critical' | 'exceeded'
   */
  status(): 'ok' | 'warning' | 'critical' | 'exceeded' {
    if (this.isExceeded()) return 'exceeded';
    if (this.used >= this.criticalThreshold) return 'critical';
    if (this.used >= this.warningThreshold) return 'warning';
    return 'ok';
  }

  /**
   * Get efficiency score (0-100).
   * Higher is better. Based on remaining budget ratio and time.
   */
  getEfficiencyScore(): number {
    const remainingRatio = this.remaining() / this.budget;
    const elapsedMin = (Date.now() - this.startTime) / 60000;
    // Favor faster completion with more remaining budget
    const timeBonus = Math.min(1, 10 / Math.max(1, elapsedMin));
    return Math.round(remainingRatio * 100 * timeBonus);
  }

  /**
   * Get a summary object for logging/auditing.
   */
  getSummary(): {
    skill: string;
    budget: number;
    used: number;
    remaining: number;
    status: string;
    efficiency: number;
  } {
    return {
      skill: this.skill,
      budget: this.budget,
      used: this.used,
      remaining: this.remaining(),
      status: this.status(),
      efficiency: this.getEfficiencyScore(),
    };
  }
}
