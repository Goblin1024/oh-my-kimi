/**
 * Agent Definition Registry
 *
 * Defines the available agents and their metadata for the OMK orchestration layer.
 */
export type AgentComplexity = 'low' | 'standard' | 'high';
export interface AgentDefinition {
    /** Unique identifier for the agent (e.g. 'architect', 'executor') */
    id: string;
    /** Human-readable name */
    name: string;
    /** Brief description of the agent's role and capabilities */
    description: string;
    /** Path to the markdown prompt file relative to prompts/ dir */
    promptFile: string;
    /** Expected complexity level for routing logic */
    complexity: AgentComplexity;
    /** Keywords or tags to help identify when this agent is needed */
    tags: string[];
}
export declare class AgentRegistry {
    private agents;
    constructor();
    /**
     * Register a new agent definition
     */
    register(definition: AgentDefinition): void;
    /**
     * Get an agent by ID
     */
    getAgent(id: string): AgentDefinition | undefined;
    /**
     * List all registered agents
     */
    listAgents(): AgentDefinition[];
    private registerDefaults;
}
export declare const agentRegistry: AgentRegistry;
//# sourceMappingURL=definitions.d.ts.map