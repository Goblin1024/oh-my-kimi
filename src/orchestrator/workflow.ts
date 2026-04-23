/**
 * Workflow Orchestrator
 * 
 * Automatically selects and manages workflows based on detected intent.
 */

import { detectIntent, isNaturalLanguageTask, TaskIntent, getSuggestedRoles, generatePlan } from './intent.js';
import { routeTask, AgentConfig } from '../token/router.js';
import { getDefaultBudget, TokenBudget } from '../token/budget.js';
import { setActiveSkill, setSkillState, getActiveSkill, SkillState } from '../state/manager.js';
import { submitEvidence } from '../state/evidence.js';
import { logger } from '../utils/logger.js';

export interface WorkflowConfig {
  skill: string;
  mode: 'single' | 'team';
  roles: string[];
  agentConfig: AgentConfig;
  budget: TokenBudget;
  plan: string;
  autoProgress: boolean;
}

export interface OrchestratorResult {
  skill: string;
  mode: 'single' | 'team';
  message: string;
  config: WorkflowConfig;
}

type ExtendedState = SkillState & {
  mode?: string;
  roles?: string[];
  budget?: Record<string, unknown>;
};

/**
 * Orchestrate workflow from natural language or explicit command
 */
export function orchestrate(prompt: string, cwd: string): OrchestratorResult | null {
  // Check if explicit command
  if (!isNaturalLanguageTask(prompt)) {
    const skillMatch = prompt.match(/^\$([a-z-]+)/);
    const skill = skillMatch ? skillMatch[1] : 'ralph';
    const description = prompt.replace(/^\$[a-z-]+\s*/, '');
    
    return orchestrateExplicit(skill, description, cwd);
  }
  
  return orchestrateNaturalLanguage(prompt, cwd);
}

/**
 * Orchestrate from natural language description
 */
function orchestrateNaturalLanguage(description: string, cwd: string): OrchestratorResult | null {
  const intent = detectIntent(description);
  
  if (!intent) {
    return null;
  }
  
  logger.info('orchestrator', `Detected intent: ${intent.taskType}`, {
    complexity: intent.complexity,
    requiresTeam: intent.requiresTeam,
    confidence: intent.confidence,
  });
  
  const primarySkill = intent.suggestedSkills[0] || 'ralph';
  const mode: 'single' | 'team' = intent.requiresTeam ? 'team' : 'single';
  const roles = mode === 'team' ? getSuggestedRoles(intent) : ['executor'];
  
  const agentConfig = routeTask(description);
  const defaultBudget = getDefaultBudget(primarySkill);
  const budget = new TokenBudget(primarySkill, defaultBudget);
  const plan = generatePlan(intent);
  
  const config: WorkflowConfig = {
    skill: primarySkill,
    mode,
    roles,
    agentConfig,
    budget,
    plan,
    autoProgress: true,
  };
  
  initializeWorkflow(config, cwd);
  
  const message = buildOrchestratorMessage(intent, config);
  
  return {
    skill: primarySkill,
    mode,
    message,
    config,
  };
}

/**
 * Orchestrate from explicit skill command
 */
function orchestrateExplicit(skill: string, description: string, cwd: string): OrchestratorResult {
  const agentConfig = routeTask(description);
  const defaultBudget = getDefaultBudget(skill);
  const budget = new TokenBudget(skill, defaultBudget);
  
  const mode: 'single' | 'team' = skill === 'team' ? 'team' : 'single';
  const roles = mode === 'team' ? ['executor', 'reviewer'] : ['executor'];
  
  const config: WorkflowConfig = {
    skill,
    mode,
    roles,
    agentConfig,
    budget,
    plan: `Execute ${skill} workflow`,
    autoProgress: true,
  };
  
  initializeWorkflow(config, cwd);
  
  return {
    skill,
    mode,
    message: `OMK: ${skill} workflow activated`,
    config,
  };
}

/**
 * Initialize workflow state
 */
function initializeWorkflow(config: WorkflowConfig, cwd: string): void {
  const state: ExtendedState = {
    skill: config.skill,
    active: true,
    phase: 'starting',
    activated_at: new Date().toISOString(),
    mode: config.mode,
    roles: config.roles,
  };
  
  setActiveSkill(state, cwd);
  setSkillState(config.skill, state, cwd);
  
  submitEvidence({
    skill: config.skill,
    step: 'workflow_initialized',
    phase: 'starting',
    submittedAt: new Date().toISOString(),
    submitter: 'orchestrator',
    evidenceType: 'context_record',
    exitCode: 0,
    metadata: {
      mode: config.mode,
      roles: config.roles,
      plan: config.plan,
    },
  }, cwd);
  
  logger.info('orchestrator', `Workflow initialized: ${config.skill} (${config.mode})`, {
    roles: config.roles,
  });
}

/**
 * Build user-facing orchestrator message
 */
function buildOrchestratorMessage(intent: TaskIntent, config: WorkflowConfig): string {
  const lines: string[] = [];
  
  lines.push(`🎯 OMK Auto-Orchestrator`);
  lines.push(`   Detected: ${intent.taskType} (${intent.complexity} complexity)`);
  lines.push(`   Confidence: ${Math.round(intent.confidence * 100)}%`);
  lines.push('');
  
  if (config.mode === 'team') {
    lines.push(`👥 Team Mode: ${config.roles.length} agents`);
    lines.push(`   Roles: ${config.roles.join(', ')}`);
    lines.push(`   Estimated subtasks: ${intent.estimatedSubtasks}`);
  } else {
    lines.push(`🤖 Single Agent Mode`);
    lines.push(`   Role: ${config.roles[0]}`);
  }
  lines.push('');
  
  lines.push(`📋 Execution Plan:`);
  lines.push(config.plan);
  lines.push('');
  
  const summary = config.budget.getSummary();
  lines.push(`💰 Budget: ${summary.budget.toLocaleString()} tokens`);
  lines.push(`   Config: ${config.agentConfig.reasoningEffort} reasoning, ${config.agentConfig.maxTokens.toLocaleString()} max tokens`);
  lines.push('');
  
  lines.push(`🚀 Activating ${config.skill} workflow...`);
  
  return lines.join('\n');
}

/**
 * Check if active workflow needs team escalation
 */
export function shouldEscalateToTeam(cwd: string): boolean {
  const active = getActiveSkill(cwd);
  if (!active || !active.active) {
    return false;
  }
  
  const activatedAt = active.activated_at ? new Date(active.activated_at).getTime() : 0;
  const duration = Date.now() - activatedAt;
  
  if (duration > 10 * 60 * 1000) {
    return true;
  }
  
  return false;
}

/**
 * Get current workflow status summary
 */
export function getWorkflowStatus(cwd: string): string {
  const active = getActiveSkill(cwd);
  if (!active || !active.active) {
    return 'No active workflow';
  }
  
  const extState = active as ExtendedState;
  const lines: string[] = [];
  lines.push(`Workflow: ${active.skill}`);
  lines.push(`Phase: ${active.phase}`);
  lines.push(`Started: ${active.activated_at}`);
  
  if (extState.mode) {
    lines.push(`Mode: ${extState.mode}`);
  }
  
  if (extState.roles) {
    lines.push(`Agents: ${extState.roles.join(', ')}`);
  }
  
  return lines.join('\n');
}
