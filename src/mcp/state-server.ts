/**
 * MCP State Server
 *
 * Provides tools for reading and writing OMK workflow state via the Model Context Protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { getActiveSkill, setActiveSkill, setSkillState } from '../state/manager.js';
import { kimiHome } from '../state/paths.js';
import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

const server = new Server(
  {
    name: 'omk-state-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
const readStateSchema = z.object({
  cwd: z
    .string()
    .optional()
    .describe('Project root directory (defaults to current working directory)'),
});

const writeStateSchema = z.object({
  skill: z.string().describe('The name of the skill (e.g. ralph, ralplan)'),
  active: z.boolean().describe('Whether the skill is currently active'),
  phase: z
    .string()
    .describe(
      'The current phase of the workflow (e.g. starting, planning, executing, verifying, completed, cancelled)'
    ),
  cwd: z.string().optional().describe('Project root directory'),
  reason: z
    .string()
    .optional()
    .describe('Optional reason for the state change (especially for cancellations)'),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'omk_read_state',
        description: 'Read the currently active OMK workflow state',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: { type: 'string', description: 'Project root directory' },
          },
        },
      },
      {
        name: 'omk_write_state',
        description: 'Update the active OMK workflow state and validate phase transitions',
        inputSchema: {
          type: 'object',
          properties: {
            skill: { type: 'string' },
            active: { type: 'boolean' },
            phase: { type: 'string' },
            cwd: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['skill', 'active', 'phase'],
        },
      },
      {
        name: 'omk_list_skills',
        description: 'List all available OMK skills installed in the current environment',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === 'omk_read_state') {
      const args = readStateSchema.parse(request.params.arguments || {});
      const state = getActiveSkill(args.cwd);
      return {
        content: [
          {
            type: 'text',
            text: state ? JSON.stringify(state, null, 2) : 'No active workflow state found.',
          },
        ],
      };
    }

    if (request.params.name === 'omk_write_state') {
      const args = writeStateSchema.parse(request.params.arguments || {});
      const now = new Date().toISOString();
      const state = {
        skill: args.skill,
        active: args.active,
        phase: args.phase,
        activated_at: now,
        ...(args.reason ? { reason: args.reason } : {}),
        ...(!args.active ? { completed_at: now } : {}), // Note: in real scenarios you'd keep activated_at from previous state
      };

      // Try to fetch previous state to preserve activated_at
      const prevState = getActiveSkill(args.cwd);
      if (prevState && prevState.skill === args.skill && prevState.activated_at) {
        state.activated_at = prevState.activated_at;
      }

      // Validates transition implicitly
      setActiveSkill(state, args.cwd);
      setSkillState(args.skill, state, args.cwd);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated state to phase '${args.phase}' for skill '${args.skill}'.`,
          },
        ],
      };
    }

    if (request.params.name === 'omk_list_skills') {
      const skillsDir = join(kimiHome(), 'skills', 'omk');
      let skills: string[] = [];
      if (existsSync(skillsDir)) {
        skills = readdirSync(skillsDir).filter((f) => statSync(join(skillsDir, f)).isDirectory());
      }
      return {
        content: [
          {
            type: 'text',
            text: skills.length > 0 ? `Available skills: ${skills.join(', ')}` : 'No skills found.',
          },
        ],
      };
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

export async function runStateServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OMK State MCP Server running on stdio');
}
