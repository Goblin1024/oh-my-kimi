/**
 * Agent TOML Generator
 *
 * Generates Kimi Code CLI agent specification TOML files from
 * `AgentDefinition` records. Keeps agent configs in sync with the
 * OMK agent registry.
 *
 * Kimi Agent TOML schema (supported fields):
 *   name              - agent identifier
 *   description       - short description
 *   [model]
 *   reasoning_effort  - "low" | "medium" | "high"
 *   [prompt]
 *   system            - system prompt (markdown)
 *
 * OMK extensions (stored as comments for forward compatibility):
 *   # omk:tokenBudget  - max tokens for this agent
 *   # omk:maxSteps     - max steps per turn
 *   # omk:allowedTools - permitted tool categories
 *   # omk:modelClass   - frontier | standard | fast
 */
import { type AgentDefinition } from './definitions.js';
/**
 * Generate a system prompt for an agent based on its definition.
 */
export declare function generateSystemPrompt(def: AgentDefinition): string;
/**
 * Generate a TOML string for a single agent definition.
 */
export declare function generateAgentTOML(def: AgentDefinition): string;
/**
 * Generate TOML strings for all registered agents.
 */
export declare function generateAllAgentTOMLs(): Record<string, string>;
/**
 * Write all agent TOML files to a target directory.
 *
 * @param targetDir - e.g., ~/.kimi/agents
 * @returns Array of written file paths
 */
export declare function writeAgentTOMLs(targetDir: string): string[];
/**
 * Get a summary of what would be written without actually writing.
 */
export declare function previewAgentTOMLs(): Array<{
    name: string;
    reasoningEffort: string;
    tokenBudget: number;
    maxSteps: number;
    tools: string;
}>;
//# sourceMappingURL=toml-generator.d.ts.map