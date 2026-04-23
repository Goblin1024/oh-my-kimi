/**
 * MCP Trace Server
 *
 * Provides tools for logging and querying execution traces via the Model Context Protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import { omkContextDir } from '../state/paths.js';
import { pathToFileURL } from 'url';

const server = new Server(
  {
    name: 'omk-trace-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

interface TraceEntry {
  id: string;
  timestamp: string;
  skill: string;
  phase: string;
  event: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

interface ExecutionTrace {
  entries: TraceEntry[];
}

function getTracePath(cwd?: string): string {
  const dir = omkContextDir(cwd);
  mkdirSync(dir, { recursive: true });
  return join(dir, 'execution-trace.jsonl');
}

function loadTrace(cwd?: string): ExecutionTrace {
  const filePath = getTracePath(cwd);
  if (existsSync(filePath)) {
    try {
      const lines = readFileSync(filePath, 'utf-8')
        .split('\n')
        .filter((line) => line.trim());
      const entries: TraceEntry[] = [];
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line));
        } catch {
          // Skip invalid lines
        }
      }
      return { entries };
    } catch {
      return { entries: [] };
    }
  }
  return { entries: [] };
}

function appendTrace(entry: TraceEntry, cwd?: string): void {
  const filePath = getTracePath(cwd);
  appendFileSync(filePath, JSON.stringify(entry) + '\n');
}

// ── Tool Schemas ──

const logTraceSchema = z.object({
  skill: z.string().describe('The skill name (e.g. ralph, ralplan)'),
  phase: z.string().describe('Current workflow phase'),
  event: z.string().describe('Event description'),
  details: z.string().optional().describe('Additional details'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Optional metadata'),
  cwd: z.string().optional().describe('Project root directory'),
});

const queryTraceSchema = z.object({
  skill: z.string().optional().describe('Filter by skill name'),
  phase: z.string().optional().describe('Filter by phase'),
  limit: z.number().optional().describe('Maximum entries to return (default 50)'),
  cwd: z.string().optional().describe('Project root directory'),
});

// ── Tool Handlers ──

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'omk_trace_log',
        description: 'Log an execution trace entry',
        inputSchema: {
          type: 'object',
          properties: {
            skill: { type: 'string', description: 'The skill name' },
            phase: { type: 'string', description: 'Current workflow phase' },
            event: { type: 'string', description: 'Event description' },
            details: { type: 'string', description: 'Additional details' },
            metadata: { type: 'object', description: 'Optional metadata' },
            cwd: { type: 'string', description: 'Project root directory' },
          },
          required: ['skill', 'phase', 'event'],
        },
      },
      {
        name: 'omk_trace_query',
        description: 'Query execution trace entries',
        inputSchema: {
          type: 'object',
          properties: {
            skill: { type: 'string', description: 'Filter by skill name' },
            phase: { type: 'string', description: 'Filter by phase' },
            limit: { type: 'number', description: 'Maximum entries to return' },
            cwd: { type: 'string', description: 'Project root directory' },
          },
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === 'omk_trace_log') {
      const args = logTraceSchema.parse(request.params.arguments || {});

      const entry: TraceEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        skill: args.skill,
        phase: args.phase,
        event: args.event,
        details: args.details,
        metadata: args.metadata,
      };

      appendTrace(entry, args.cwd);

      return {
        content: [{ type: 'text', text: `Trace logged [${entry.id}]` }],
      };
    }

    if (request.params.name === 'omk_trace_query') {
      const args = queryTraceSchema.parse(request.params.arguments || {});
      const trace = loadTrace(args.cwd);

      let results = trace.entries;
      if (args.skill) {
        results = results.filter((e) => e.skill === args.skill);
      }
      if (args.phase) {
        results = results.filter((e) => e.phase === args.phase);
      }

      // Sort newest first
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const limit = args.limit || 50;
      results = results.slice(0, limit);

      if (results.length === 0) {
        return { content: [{ type: 'text', text: 'No trace entries found.' }] };
      }

      const formatted = results
        .map(
          (e) =>
            `[${e.id}] (${e.timestamp}) [${e.skill}:${e.phase}] ${e.event}${e.details ? '\n  ' + e.details : ''}`
        )
        .join('\n\n');
      return { content: [{ type: 'text', text: formatted }] };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  } catch (error) {
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

export async function runTraceServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OMK Trace MCP Server running on stdio');
}

// Auto-start when executed directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTraceServer().catch((error) => {
    console.error('Fatal error in trace server:', error);
    process.exit(1);
  });
}
