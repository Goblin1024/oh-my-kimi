/**
 * MCP State Server
 *
 * Provides tools for reading and writing OMK workflow state via the Model Context Protocol.
 * Enhanced with evidence submission, verification, and phase assertion capabilities.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { getActiveSkill, setActiveSkill, setSkillState } from '../state/manager.js';
import { kimiHome } from '../state/paths.js';
import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { submitEvidence, listEvidence, getEvidenceForSkillPhase } from '../state/evidence.js';
import type { Evidence, EvidenceType } from '../evidence/schema.js';
import { detectShortcuts } from '../evidence/anti-pattern-detector.js';
import { getPhaseRequirements } from '../skills/evidence-requirements.js';
import { pathToFileURL } from 'url';

const server = new Server(
  {
    name: 'omk-state-server',
    version: '0.2.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── Tool Schemas ──

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

const submitEvidenceSchema = z.object({
  skill: z.string().describe('The skill that produced this evidence'),
  step: z.string().describe('Step identifier (e.g. tests_passed, prd_written)'),
  phase: z.string().describe('Phase this evidence unlocks'),
  evidenceType: z
    .string()
    .refine(
      (v) =>
        [
          'command_output',
          'file_artifact',
          'review_signature',
          'diff_record',
          'context_record',
        ].includes(v),
      {
        message: 'Invalid evidence type',
      }
    ),
  command: z.string().optional().describe('Command that was run (for command_output)'),
  output: z.string().optional().describe('Command output (first 10KB)'),
  exitCode: z.number().optional().describe('Exit code (0 for success)'),
  artifactPath: z.string().optional().describe('Path to created artifact (for file_artifact)'),
  artifactHash: z.string().optional().describe('SHA-256 hash of artifact'),
  artifactSize: z.number().optional().describe('Artifact size in bytes'),
  reviewerAgent: z.string().optional().describe('Name of reviewer agent (for review_signature)'),
  reviewResult: z.enum(['approved', 'rejected', 'changes_requested']).optional(),
  filesModified: z
    .array(z.string())
    .optional()
    .describe('List of modified files (for diff_record)'),
  linesAdded: z.number().optional(),
  linesRemoved: z.number().optional(),
  filesRead: z.array(z.string()).optional().describe('List of files read (for context_record)'),
  dependenciesAnalyzed: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Free-form metadata'),
  cwd: z.string().optional().describe('Project root directory'),
});

const listRequiredEvidenceSchema = z.object({
  skill: z.string().describe('The skill name'),
  phase: z.string().describe('The target phase'),
  cwd: z.string().optional().describe('Project root directory'),
});

const verifyEvidenceSchema = z.object({
  skill: z.string().describe('The skill name'),
  claim: z.string().optional().describe('Optional claim text to validate against evidence'),
  cwd: z.string().optional().describe('Project root directory'),
});

const assertPhaseSchema = z.object({
  skill: z.string().describe('The skill name'),
  phase: z.string().describe('The target phase to assert'),
  cwd: z.string().optional().describe('Project root directory'),
});

// ── Tool List ──

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
      {
        name: 'omk_submit_evidence',
        description: 'Submit machine-checkable evidence for a workflow step',
        inputSchema: {
          type: 'object',
          properties: {
            skill: { type: 'string' },
            step: { type: 'string' },
            phase: { type: 'string' },
            evidenceType: {
              type: 'string',
              enum: [
                'command_output',
                'file_artifact',
                'review_signature',
                'diff_record',
                'context_record',
              ],
            },
            command: { type: 'string' },
            output: { type: 'string' },
            exitCode: { type: 'number' },
            artifactPath: { type: 'string' },
            artifactHash: { type: 'string' },
            artifactSize: { type: 'number' },
            reviewerAgent: { type: 'string' },
            reviewResult: { type: 'string', enum: ['approved', 'rejected', 'changes_requested'] },
            filesModified: { type: 'array', items: { type: 'string' } },
            linesAdded: { type: 'number' },
            linesRemoved: { type: 'number' },
            filesRead: { type: 'array', items: { type: 'string' } },
            dependenciesAnalyzed: { type: 'boolean' },
            metadata: { type: 'object' },
            cwd: { type: 'string' },
          },
          required: ['skill', 'step', 'phase', 'evidenceType'],
        },
      },
      {
        name: 'omk_list_required_evidence',
        description: 'List the evidence required to enter a specific phase',
        inputSchema: {
          type: 'object',
          properties: {
            skill: { type: 'string' },
            phase: { type: 'string' },
            cwd: { type: 'string' },
          },
          required: ['skill', 'phase'],
        },
      },
      {
        name: 'omk_verify_evidence',
        description: 'Verify submitted evidence and detect shortcut attempts',
        inputSchema: {
          type: 'object',
          properties: {
            skill: { type: 'string' },
            claim: { type: 'string' },
            cwd: { type: 'string' },
          },
          required: ['skill'],
        },
      },
      {
        name: 'omk_assert_phase',
        description: 'Check if a phase transition is allowed (evidence + transition validation)',
        inputSchema: {
          type: 'object',
          properties: {
            skill: { type: 'string' },
            phase: { type: 'string' },
            cwd: { type: 'string' },
          },
          required: ['skill', 'phase'],
        },
      },
    ],
  };
});

// ── Tool Handlers ──

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
        ...(!args.active ? { completed_at: now } : {}),
      };

      const prevState = getActiveSkill(args.cwd);
      if (prevState && prevState.skill === args.skill && prevState.activated_at) {
        state.activated_at = prevState.activated_at;
      }

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

    if (request.params.name === 'omk_submit_evidence') {
      const args = submitEvidenceSchema.parse(request.params.arguments || {});

      const evidence: Evidence = {
        skill: args.skill,
        step: args.step,
        phase: args.phase,
        submittedAt: new Date().toISOString(),
        submitter: 'kimi-agent',
        evidenceType: args.evidenceType as EvidenceType,
        exitCode: args.exitCode ?? 0,
        ...(args.command !== undefined ? { command: args.command } : {}),
        ...(args.output !== undefined ? { output: args.output } : {}),
        ...(args.artifactPath !== undefined ? { artifactPath: args.artifactPath } : {}),
        ...(args.artifactHash !== undefined ? { artifactHash: args.artifactHash } : {}),
        ...(args.artifactSize !== undefined ? { artifactSize: args.artifactSize } : {}),
        ...(args.reviewerAgent !== undefined ? { reviewerAgent: args.reviewerAgent } : {}),
        ...(args.reviewResult !== undefined ? { reviewResult: args.reviewResult } : {}),
        ...(args.filesModified !== undefined ? { filesModified: args.filesModified } : {}),
        ...(args.linesAdded !== undefined ? { linesAdded: args.linesAdded } : {}),
        ...(args.linesRemoved !== undefined ? { linesRemoved: args.linesRemoved } : {}),
        ...(args.filesRead !== undefined ? { filesRead: args.filesRead } : {}),
        ...(args.dependenciesAnalyzed !== undefined
          ? { dependenciesAnalyzed: args.dependenciesAnalyzed }
          : {}),
        ...(args.metadata !== undefined ? { metadata: args.metadata } : {}),
      };

      submitEvidence(evidence, args.cwd);

      return {
        content: [
          {
            type: 'text',
            text: `Evidence '${args.step}' submitted for skill '${args.skill}' (phase: ${args.phase}).`,
          },
        ],
      };
    }

    if (request.params.name === 'omk_list_required_evidence') {
      const args = listRequiredEvidenceSchema.parse(request.params.arguments || {});
      const requirements = getPhaseRequirements(args.skill, args.phase);

      if (!requirements || requirements.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No evidence requirements for phase '${args.phase}' of skill '${args.skill}'.`,
            },
          ],
        };
      }

      const { evidence, satisfied, missing } = getEvidenceForSkillPhase(
        args.skill,
        args.phase,
        args.cwd
      );

      const lines: string[] = [
        `Evidence requirements for '${args.skill}' → '${args.phase}':`,
        '',
        ...requirements.map((req) => {
          const hasIt = evidence.some((e) => e.step === req.step);
          const status = hasIt ? '✅' : '❌';
          return `${status} ${req.step}: ${req.description}`;
        }),
        '',
        satisfied ? 'All requirements satisfied.' : `Missing: ${missing.join(', ')}`,
      ];

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\n'),
          },
        ],
      };
    }

    if (request.params.name === 'omk_verify_evidence') {
      const args = verifyEvidenceSchema.parse(request.params.arguments || {});
      const evidence = listEvidence(args.skill, args.cwd);

      if (evidence.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No evidence found for skill '${args.skill}'.`,
            },
          ],
        };
      }

      // Run anti-pattern detection
      const shortcuts = detectShortcuts(args.skill, evidence, args.claim);

      const lines: string[] = [
        `Evidence verification for '${args.skill}':`,
        `  Total evidence: ${evidence.length}`,
        '',
      ];

      if (shortcuts.length > 0) {
        lines.push('⚠️ Shortcut attempts detected:');
        for (const s of shortcuts) {
          lines.push(`  [${s.severity.toUpperCase()}] ${s.type}: ${s.description}`);
        }
      } else {
        lines.push('✅ No shortcut patterns detected.');
      }

      lines.push('');
      lines.push('Submitted evidence:');
      for (const ev of evidence.slice(0, 10)) {
        lines.push(`  - ${ev.step} (${ev.evidenceType}) @ ${ev.submittedAt}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: lines.join('\n'),
          },
        ],
      };
    }

    if (request.params.name === 'omk_assert_phase') {
      const args = assertPhaseSchema.parse(request.params.arguments || {});
      const active = getActiveSkill(args.cwd);

      if (!active || active.skill !== args.skill) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ No active workflow for skill '${args.skill}'.`,
            },
          ],
        };
      }

      const { satisfied, missing } = getEvidenceForSkillPhase(args.skill, args.phase, args.cwd);

      if (!satisfied) {
        return {
          content: [
            {
              type: 'text',
              text:
                `❌ Cannot enter phase '${args.phase}'.\n` +
                `Missing evidence:\n` +
                missing.map((m) => `  - ${m}`).join('\n') +
                `\n→ Submit evidence via omk_submit_evidence first.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Phase '${args.phase}' is reachable for skill '${args.skill}'. All evidence requirements satisfied.`,
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

// Auto-start when executed directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runStateServer().catch((error) => {
    console.error('Fatal error in state server:', error);
    process.exit(1);
  });
}
