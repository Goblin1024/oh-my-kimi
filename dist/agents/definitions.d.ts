export interface AgentDefinition {
    name: string;
    description: string;
    reasoningEffort: 'low' | 'medium' | 'high';
    modelClass: 'frontier' | 'standard' | 'fast';
    /** Token budget for this agent (default: 32K) */
    tokenBudget?: number;
    /** Max steps this agent can take */
    maxSteps?: number;
    /** Tool categories this agent is allowed to use */
    allowedTools?: string[];
}
export declare const AGENT_DEFINITIONS: Record<string, AgentDefinition>;
//# sourceMappingURL=definitions.d.ts.map