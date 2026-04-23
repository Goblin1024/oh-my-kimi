/**
 * Smart HUD Status Bar
 * 
 * Real-time visibility into engine internals.
 */

import { getActiveSkill, SkillState } from '../state/manager.js';
import { getPersistenceStatus } from '../orchestrator/persistence.js';
import { getSchedulerStatus } from '../team/scheduler.js';
import { getLearningStats } from '../learning/extractor.js';
import { logger } from '../utils/logger.js';

export interface SmartBarConfig {
  showTeamStatus: boolean;
  showTokenUsage: boolean;
  showLearning: boolean;
  showCostOptimization: boolean;
  refreshInterval: number;
}

const DEFAULT_CONFIG: SmartBarConfig = {
  showTeamStatus: true,
  showTokenUsage: true,
  showLearning: true,
  showCostOptimization: true,
  refreshInterval: 1000,
};

export interface EngineStatus {
  workflow: {
    active: boolean;
    skill: string;
    phase: string;
    progress: number;
    mode: string;
  };
  team: {
    activeWorkers: number;
    totalWorkers: number;
    scheduleStatus: string;
  };
  tokens: {
    used: number;
    total: number;
    efficiency: number;
    savings: number;
  };
  learning: {
    patternsLearned: number;
    patternsReused: number;
    suggestions: string[];
  };
  cost: {
    estimatedSavings: number;
    optimizationApplied: boolean;
    currentMode: string;
  };
}

type ExtendedState = SkillState & {
  mode?: string;
  complexity?: string;
};

export function getEngineStatus(cwd: string): EngineStatus {
  const active = getActiveSkill(cwd);
  const persistenceStatus = getPersistenceStatus(cwd);
  
  const isActive = persistenceStatus !== 'Idle';
  const skill = active?.skill || '';
  const phase = active?.phase || '';
  const extState = active as ExtendedState;
  const mode = extState?.mode || 'single';
  
  const progress = isActive ? parseProgress(persistenceStatus) : 0;
  
  const teamStatus = getTeamStatus(cwd);
  const tokenStatus = getTokenStatus(cwd, active);
  const learningStats = getLearningStats(cwd);
  const costStatus = getCostStatus(cwd, active);
  
  return {
    workflow: {
      active: isActive,
      skill,
      phase,
      progress,
      mode,
    },
    team: teamStatus,
    tokens: tokenStatus,
    learning: {
      patternsLearned: learningStats.patternsLearned,
      patternsReused: learningStats.patternsReused,
      suggestions: getLearningSuggestions(cwd, active),
    },
    cost: costStatus,
  };
}

function parseProgress(status: string): number {
  const match = status.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : 0;
}

function getTeamStatus(cwd: string): EngineStatus['team'] {
  return {
    activeWorkers: 0,
    totalWorkers: 0,
    scheduleStatus: getSchedulerStatus(),
  };
}

function getTokenStatus(cwd: string, active: SkillState | null): EngineStatus['tokens'] {
  if (!active || !active.active) {
    return {
      used: 0,
      total: 32000,
      efficiency: 100,
      savings: 0,
    };
  }
  
  const progress = parseProgress(getPersistenceStatus(cwd));
  const total = 32000;
  const used = Math.floor(total * (progress / 100));
  
  return {
    used,
    total,
    efficiency: Math.max(0, 100 - (used / total) * 50),
    savings: 0,
  };
}

function getCostStatus(cwd: string, active: SkillState | null): EngineStatus['cost'] {
  if (!active || !active.active) {
    return {
      estimatedSavings: 0,
      optimizationApplied: false,
      currentMode: 'standard',
    };
  }
  
  const extState = active as ExtendedState;
  const complexity = extState.complexity || 'medium';
  const optimizationApplied = complexity !== 'high';
  
  return {
    estimatedSavings: optimizationApplied ? 35 : 0,
    optimizationApplied,
    currentMode: optimizationApplied ? 'eco' : 'standard',
  };
}

function getLearningSuggestions(cwd: string, active: SkillState | null): string[] {
  const suggestions: string[] = [];
  
  if (active?.phase === 'debugging') {
    suggestions.push('Try running tests with --verbose flag');
  }
  
  if (active?.phase === 'implementing') {
    suggestions.push('Consider using existing utility functions');
  }
  
  return suggestions;
}

export function renderSmartBar(status: EngineStatus): string {
  const lines: string[] = [];
  
  lines.push('╔══════════════════════════════════════════════════════════════════╗');
  lines.push('║  OMK Smart Engine                                                 ║');
  lines.push('╠══════════════════════════════════════════════════════════════════╣');
  
  if (status.workflow.active) {
    const progressBar = renderProgressBar(status.workflow.progress, 30);
    lines.push(`║  Workflow: ${status.workflow.skill.padEnd(15)} ${status.workflow.phase.padEnd(15)} ${progressBar}  ║`);
    lines.push(`║  Mode: ${status.workflow.mode.padEnd(53)}║`);
  } else {
    lines.push(`║  Workflow: Idle                                                  ║`);
  }
  
  lines.push('╠══════════════════════════════════════════════════════════════════╣');
  
  if (status.team.totalWorkers > 0 || status.workflow.mode === 'team') {
    lines.push(`║  Team: ${status.team.activeWorkers}/${status.team.totalWorkers} active workers${''.padEnd(36)}║`);
    lines.push(`║  Schedule: ${status.team.scheduleStatus.padEnd(52)}║`);
    lines.push('╠══════════════════════════════════════════════════════════════════╣');
  }
  
  const tokenPercent = Math.floor((status.tokens.used / status.tokens.total) * 100);
  const tokenBar = renderProgressBar(tokenPercent, 20);
  lines.push(`║  Tokens: ${tokenBar} ${status.tokens.used.toLocaleString().padStart(6)}/${status.tokens.total.toLocaleString()}  ║`);
  lines.push(`║  Efficiency: ${status.tokens.efficiency.toFixed(1)}%${''.padEnd(51)}║`);
  
  if (status.tokens.savings > 0) {
    lines.push(`║  Savings: ${status.tokens.savings.toLocaleString()} tokens saved${''.padEnd(35)}║`);
  }
  
  lines.push('╠══════════════════════════════════════════════════════════════════╣');
  
  if (status.cost.optimizationApplied) {
    lines.push(`║  Cost Opt: ${status.cost.currentMode} mode (-${status.cost.estimatedSavings}% estimated)${''.padEnd(20)}║`);
  }
  
  if (status.learning.patternsLearned > 0 || status.learning.suggestions.length > 0) {
    lines.push('╠══════════════════════════════════════════════════════════════════╣');
    lines.push(`║  Patterns: ${status.learning.patternsLearned} learned, ${status.learning.patternsReused} reused${''.padEnd(28)}║`);
    
    for (const suggestion of status.learning.suggestions.slice(0, 2)) {
      lines.push(`║  ${suggestion.substring(0, 60).padEnd(60)}║`);
    }
  }
  
  lines.push('╚══════════════════════════════════════════════════════════════════╝');
  
  return lines.join('\n');
}

function renderProgressBar(percent: number, width: number): string {
  const filled = Math.floor((percent / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percent}%`;
}

export function getCompactStatus(cwd: string): string {
  const status = getEngineStatus(cwd);
  
  if (!status.workflow.active) {
    return '';
  }
  
  const parts: string[] = [];
  parts.push(`[${status.workflow.skill}:${status.workflow.phase}]`);
  parts.push(`${status.workflow.progress}%`);
  
  if (status.workflow.mode === 'team') {
    parts.push(`[${status.team.activeWorkers}W]`);
  }
  
  parts.push(`[${status.tokens.used}/${status.tokens.total}T]`);
  
  if (status.cost.optimizationApplied) {
    parts.push(`[ECO]`);
  }
  
  return parts.join(' ');
}

export function startSmartHUD(cwd: string, config: Partial<SmartBarConfig> = {}): () => void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  logger.info('smart-bar', 'Starting smart HUD');
  
  const status = getEngineStatus(cwd);
  console.log(renderSmartBar(status));
  
  const interval = setInterval(() => {
    const currentStatus = getEngineStatus(cwd);
    console.clear();
    console.log(renderSmartBar(currentStatus));
  }, fullConfig.refreshInterval);
  
  return () => {
    clearInterval(interval);
    logger.info('smart-bar', 'Smart HUD stopped');
  };
}
