/**
 * Token Audit
 *
 * Integrates budget, router, and pruner to provide session-level
 * token usage auditing, efficiency reporting, and optimization recommendations.
 */

import { TokenBudget, getDefaultBudget } from './budget.js';
import { routeTask, explainRoute, type AgentConfig } from './router.js';
import {
  shouldPrune,
  compressEvidence,
  estimateTokens,
  getPruningRecommendations,
} from './pruner.js';
import type { Evidence } from '../evidence/schema.js';

export interface AuditOptions {
  skill: string;
  prompt: string;
  flags?: string[];
  evidence?: Evidence[];
}

export interface AuditReport {
  skill: string;
  route: AgentConfig;
  routeExplanation: string;
  budget: {
    default: number;
    adjusted: number;
    threshold: number;
  };
  evidence: {
    totalCount: number;
    totalTokenEstimate: number;
    prunableCount: number;
    recommendedPrunes: Array<{
      step: string;
      currentSize: number;
      savings: number;
    }>;
  };
  recommendations: string[];
}

/**
 * Generate a comprehensive token audit report for a session.
 */
export function auditSession(options: AuditOptions): AuditReport {
  const { skill, prompt, flags = [], evidence = [] } = options;

  // Route the task
  const route = routeTask(prompt);
  const routeExplanation = explainRoute(prompt, route);

  // Budget analysis
  const defaultBudget = getDefaultBudget(skill, flags);
  const adjustedBudget = Math.min(route.maxTokens, defaultBudget);
  const threshold = Math.round(adjustedBudget * 0.7);

  // Evidence analysis
  const evidenceTokens = evidence.reduce((sum, ev) => sum + estimateTokens(ev.output ?? ''), 0);

  const prunableEvidence = evidence.filter((ev) => ev.output && ev.output.length > 5000);

  const pruningRecs = getPruningRecommendations(evidence, evidenceTokens, adjustedBudget)
    .filter((r) => r.recommended)
    .map((r) => ({ step: r.step, currentSize: r.currentSize, savings: r.savings }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (evidenceTokens > threshold) {
    recommendations.push(
      `Evidence context (${evidenceTokens} tokens) exceeds 70% of budget (${threshold}). Consider pruning ${prunableEvidence.length} large evidence items.`
    );
  }

  if (route.maxTokens > adjustedBudget) {
    recommendations.push(
      `Route suggests ${route.maxTokens} tokens but skill default is ${defaultBudget}. Budget capped at ${adjustedBudget}.`
    );
  }

  if (pruningRecs.length > 0) {
    const totalSavings = pruningRecs.reduce((s, r) => s + r.savings, 0);
    recommendations.push(
      `Pruning ${pruningRecs.length} evidence items could save ~${totalSavings} tokens.`
    );
  }

  if (route.reasoningEffort === 'high' && adjustedBudget < 64_000) {
    recommendations.push(
      `High reasoning effort with low budget (${adjustedBudget}). Consider using --deliberate flag or a higher-budget skill.`
    );
  }

  return {
    skill,
    route,
    routeExplanation,
    budget: {
      default: defaultBudget,
      adjusted: adjustedBudget,
      threshold,
    },
    evidence: {
      totalCount: evidence.length,
      totalTokenEstimate: evidenceTokens,
      prunableCount: prunableEvidence.length,
      recommendedPrunes: pruningRecs,
    },
    recommendations,
  };
}

/**
 * High-level session auditor that tracks budget, routing, and pruning together.
 */
export class SessionAuditor {
  private budget: TokenBudget;
  private route: AgentConfig;
  private evidence: Evidence[] = [];

  constructor(skill: string, prompt: string, flags: string[] = []) {
    const defaultBudget = getDefaultBudget(skill, flags);
    this.route = routeTask(prompt);
    const actualBudget = Math.min(this.route.maxTokens, defaultBudget);
    this.budget = new TokenBudget(skill, actualBudget);
  }

  /** Get the routing config */
  getRoute(): AgentConfig {
    return this.route;
  }

  /** Get the budget tracker */
  getBudget(): TokenBudget {
    return this.budget;
  }

  /** Record evidence and track its token cost */
  addEvidence(ev: Evidence): void {
    const tokens = estimateTokens(ev.output ?? '');
    this.budget.consume(tokens);
    this.evidence.push(ev);
  }

  /** Check if pruning is recommended */
  shouldPrune(): boolean {
    return shouldPrune(this.budget.getSummary().used, this.budget.getSummary().budget);
  }

  /** Compress all eligible evidence */
  prune(): Evidence[] {
    this.evidence = this.evidence.map((ev) => {
      const compressed = compressEvidence(ev);
      if (compressed !== ev) {
        const saved = estimateTokens(ev.output ?? '') - estimateTokens(compressed.output ?? '');
        this.budget.consume(-saved); // Reclaim tokens
      }
      return compressed;
    });
    return this.evidence;
  }

  /** Generate audit report */
  audit(): AuditReport {
    return auditSession({
      skill: this.budget.getSummary().skill,
      prompt: '',
      evidence: this.evidence,
    });
  }

  /** Get current summary */
  summary(): ReturnType<TokenBudget['getSummary']> {
    return this.budget.getSummary();
  }
}
