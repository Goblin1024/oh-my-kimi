/**
 * Agent Definition Registry
 *
 * Defines the available agents and their metadata for the OMK orchestration layer.
 */
export class AgentRegistry {
    agents = new Map();
    constructor() {
        this.registerDefaults();
    }
    /**
     * Register a new agent definition
     */
    register(definition) {
        this.agents.set(definition.id, definition);
    }
    /**
     * Get an agent by ID
     */
    getAgent(id) {
        return this.agents.get(id);
    }
    /**
     * List all registered agents
     */
    listAgents() {
        return Array.from(this.agents.values());
    }
    registerDefaults() {
        const defaultAgents = [
            {
                id: 'architect',
                name: 'Architect',
                description: 'System architect responsible for high-level design and technical foundations',
                promptFile: 'architect.md',
                complexity: 'high',
                tags: ['design', 'architecture', 'system', 'foundation'],
            },
            {
                id: 'executor',
                name: 'Executor',
                description: 'Senior engineer focused on writing high-quality, production-ready code',
                promptFile: 'executor.md',
                complexity: 'standard',
                tags: ['code', 'implement', 'feature', 'build'],
            },
            {
                id: 'debugger',
                name: 'Debugger',
                description: 'Specialist in root-cause analysis and resolving complex software defects',
                promptFile: 'debugger.md',
                complexity: 'high',
                tags: ['bug', 'fix', 'error', 'stacktrace', 'issue'],
            },
            {
                id: 'code-reviewer',
                name: 'Code Reviewer',
                description: 'Meticulous reviewer focusing on code quality, performance, and best practices',
                promptFile: 'code-reviewer.md',
                complexity: 'standard',
                tags: ['review', 'quality', 'lint', 'performance'],
            },
            {
                id: 'qa-tester',
                name: 'QA Tester',
                description: 'Quality assurance engineer focused on test coverage and edge cases',
                promptFile: 'qa-tester.md',
                complexity: 'standard',
                tags: ['test', 'unit-test', 'integration', 'e2e', 'coverage'],
            },
            {
                id: 'security-reviewer',
                name: 'Security Reviewer',
                description: 'Security engineer focused on vulnerability analysis and secure coding',
                promptFile: 'security-reviewer.md',
                complexity: 'high',
                tags: ['security', 'vulnerability', 'owasp', 'exploit', 'auth'],
            },
            {
                id: 'planner',
                name: 'Planner',
                description: 'Project planner that breaks down complex goals into sequential tasks',
                promptFile: 'planner.md',
                complexity: 'standard',
                tags: ['plan', 'breakdown', 'tasks', 'roadmap'],
            },
            {
                id: 'explorer',
                name: 'Explorer',
                description: 'Investigative agent adept at navigating large, unfamiliar codebases',
                promptFile: 'explorer.md',
                complexity: 'low',
                tags: ['search', 'find', 'navigate', 'discover'],
            },
            {
                id: 'writer',
                name: 'Writer',
                description: 'Technical writer for clear, concise documentation and comments',
                promptFile: 'writer.md',
                complexity: 'low',
                tags: ['docs', 'readme', 'comments', 'documentation'],
            },
            {
                id: 'verifier',
                name: 'Verifier',
                description: 'Objective gatekeeper that validates executed work against requirements',
                promptFile: 'verifier.md',
                complexity: 'standard',
                tags: ['verify', 'validate', 'check', 'done'],
            },
        ];
        for (const agent of defaultAgents) {
            this.register(agent);
        }
    }
}
// Export a singleton instance for global use
export const agentRegistry = new AgentRegistry();
//# sourceMappingURL=definitions.js.map