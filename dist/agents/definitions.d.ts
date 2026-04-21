export interface AgentDefinition {
    name: string;
    description: string;
    reasoningEffort: 'low' | 'medium' | 'high';
    modelClass: 'frontier' | 'standard' | 'fast';
}
export declare const AGENT_DEFINITIONS: Record<string, AgentDefinition>;
//# sourceMappingURL=definitions.d.ts.map