/**
 * MCP Memory Server
 *
 * Provides tools for persisting and querying cross-session project memory via the Model Context Protocol.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { omkContextDir } from '../state/paths.js';
import { searchBM25 } from '../utils/bm25.js';
const server = new Server({
    name: 'omk-memory-server',
    version: '0.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
function getMemoryPath(cwd) {
    const dir = omkContextDir(cwd);
    mkdirSync(dir, { recursive: true });
    return join(dir, 'project-memory.json');
}
const MEMORY_RETENTION_DAYS = 90;
function loadMemory(cwd) {
    const filePath = getMemoryPath(cwd);
    if (existsSync(filePath)) {
        try {
            const memory = JSON.parse(readFileSync(filePath, 'utf-8'));
            // Expire entries older than retention window
            const cutoff = Date.now() - MEMORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
            const originalCount = memory.entries.length;
            memory.entries = memory.entries.filter((e) => new Date(e.timestamp).getTime() > cutoff);
            if (memory.entries.length < originalCount) {
                // Persist the filtered list so we don't re-process dead entries
                saveMemory(memory, cwd);
            }
            return memory;
        }
        catch {
            // Return empty if invalid
        }
    }
    return { entries: [] };
}
function saveMemory(memory, cwd) {
    const filePath = getMemoryPath(cwd);
    writeFileSync(filePath, JSON.stringify(memory, null, 2));
}
// Define tool schemas
const storeMemorySchema = z.object({
    content: z.string().describe('The information to remember'),
    tags: z
        .array(z.string())
        .optional()
        .describe('Optional tags for categorization (e.g. architecture, bug, convention)'),
    cwd: z.string().optional().describe('Project root directory'),
});
const queryMemorySchema = z.object({
    query: z.string().describe('Keyword or phrase to search for in memory'),
    cwd: z.string().optional().describe('Project root directory'),
});
const listMemorySchema = z.object({
    tag: z.string().optional().describe('Filter by specific tag'),
    cwd: z.string().optional().describe('Project root directory'),
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'omk_memory_store',
                description: 'Store a piece of information in the project memory for cross-session persistence',
                inputSchema: {
                    type: 'object',
                    properties: {
                        content: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        cwd: { type: 'string' },
                    },
                    required: ['content'],
                },
            },
            {
                name: 'omk_memory_query',
                description: 'Search for relevant information in the project memory',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        cwd: { type: 'string' },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'omk_memory_list',
                description: 'List recent project memory entries, optionally filtered by tag',
                inputSchema: {
                    type: 'object',
                    properties: {
                        tag: { type: 'string' },
                        cwd: { type: 'string' },
                    },
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        if (request.params.name === 'omk_memory_store') {
            const args = storeMemorySchema.parse(request.params.arguments || {});
            const memory = loadMemory(args.cwd);
            const entry = {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toISOString(),
                content: args.content,
                tags: args.tags || [],
            };
            memory.entries.push(entry);
            saveMemory(memory, args.cwd);
            return {
                content: [{ type: 'text', text: `Successfully stored memory entry [${entry.id}]` }],
            };
        }
        if (request.params.name === 'omk_memory_query') {
            const args = queryMemorySchema.parse(request.params.arguments || {});
            const memory = loadMemory(args.cwd);
            const docs = memory.entries.map((e) => ({
                id: e.id,
                // Combine tags and content for searching
                content: [...e.tags, e.content].join(' '),
            }));
            const topMatches = searchBM25(docs, args.query, 10);
            if (topMatches.length === 0) {
                return {
                    content: [{ type: 'text', text: `No memory entries found matching '${args.query}'.` }],
                };
            }
            // Map back to full entries and format
            const results = topMatches.map((match) => {
                const entry = memory.entries.find((e) => e.id === match.id);
                return `[${entry.id}] (${entry.timestamp}) [Tags: ${entry.tags.join(', ')}] (Score: ${match.score.toFixed(2)})\n${entry.content}`;
            });
            return { content: [{ type: 'text', text: results.join('\n\n') }] };
        }
        if (request.params.name === 'omk_memory_list') {
            const args = listMemorySchema.parse(request.params.arguments || {});
            const memory = loadMemory(args.cwd);
            let results = memory.entries;
            if (args.tag) {
                const tag = args.tag.toLowerCase();
                results = results.filter((e) => e.tags.some((t) => t.toLowerCase() === tag));
            }
            // Sort newest first
            results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            if (results.length === 0) {
                return { content: [{ type: 'text', text: 'No memory entries found.' }] };
            }
            const formatted = results
                .map((e) => `[${e.id}] (${e.timestamp}) [Tags: ${e.tags.join(', ')}]\n${e.content}`)
                .join('\n\n');
            return { content: [{ type: 'text', text: formatted }] };
        }
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
    catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
});
export async function runMemoryServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('OMK Memory MCP Server running on stdio');
}
//# sourceMappingURL=memory-server.js.map