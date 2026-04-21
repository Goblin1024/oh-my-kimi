/**
 * Token Audit
 *
 * Integrates budget, router, and pruner to provide session-level
 * token usage auditing, efficiency reporting, and optimization recommendations.
 */
import { TokenBudget } from './budget.js';
import { type AgentConfig } from './router.js';
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
export declare function auditSession(options: AuditOptions): AuditReport;
/**
 * High-level session auditor that tracks budget, routing, and pruning together.
 */
export declare class SessionAuditor {
    private budget;
    private route;
    private evidence;
    constructor(skill: string, prompt: string, flags?: string[]);
    /** Get the routing config */
    getRoute(): AgentConfig;
    /** Get the budget tracker */
    getBudget(): TokenBudget;
    /** Record evidence and track its token cost */
    addEvidence(ev: Evidence): void;
    /** Check if pruning is recommended */
    shouldPrune(): boolean;
    /** Compress all eligible evidence */
    prune(): Evidence[];
    /** Generate audit report */
    audit(): AuditReport;
    /** Get current summary */
    summary(): ReturnType<TokenBudget['getSummary']>;
}
//# sourceMappingURL=audit.d.ts.map