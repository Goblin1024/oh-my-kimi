/**
 * Persistence Engine
 * 
 * Ensures tasks execute to completion with automatic recovery and retry.
 */

import { getActiveSkill, getSkillState, setSkillState, setActiveSkill, SkillState } from '../state/manager.js';
import { listEvidence } from '../state/evidence.js';
import { recoverFromCrash } from '../state/auto-progress.js';
import { logger } from '../utils/logger.js';

export interface PersistenceConfig {
  maxRetries: number;
  retryDelayMs: number;
  autoRecover: boolean;
  confirmCompletion: boolean;
}

const DEFAULT_CONFIG: PersistenceConfig = {
  maxRetries: 3,
  retryDelayMs: 5000,
  autoRecover: true,
  confirmCompletion: true,
};

export interface ExecutionProgress {
  skill: string;
  phase: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  attempts: number;
  lastError?: string;
  startedAt: string;
}

// Extended state with persistence fields
type ExtendedState = SkillState & {
  attempts?: number;
  error?: string;
  recovered_at?: string;
  recovery_count?: number;
  requires_continuation?: boolean;
  continuation_requested_at?: string;
  retried_at?: string;
  mode?: string;
};

/**
 * Initialize persistence engine with recovery
 */
export function initializePersistence(cwd: string, config: Partial<PersistenceConfig> = {}): void {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (fullConfig.autoRecover) {
    attemptRecovery(cwd);
  }
  
  logger.info('persistence', 'Persistence engine initialized', {
    autoRecover: fullConfig.autoRecover,
    maxRetries: fullConfig.maxRetries,
  });
}

/**
 * Attempt to recover from crash
 */
function attemptRecovery(cwd: string): boolean {
  try {
    const active = getActiveSkill(cwd);
    if (!active || !active.active) {
      return false;
    }
    
    const recovered = recoverFromCrash(active.skill, cwd);
    if (recovered && recovered.recovered) {
      logger.info('persistence', `Recovered workflow: ${active.skill} at phase ${recovered.phase}`);
      
      const existing = getSkillState(active.skill, cwd) || active;
      const recoveryCount = (existing as ExtendedState).recovery_count || 0;
      
      const state: ExtendedState = {
        ...existing,
        phase: recovered.phase,
        recovered_at: new Date().toISOString(),
        recovery_count: recoveryCount + 1,
      };
      
      setActiveSkill(state, cwd);
      setSkillState(active.skill, state, cwd);
      
      return true;
    }
  } catch (error) {
    logger.error('persistence', 'Recovery failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  
  return false;
}

/**
 * Ensure workflow continues execution
 */
export async function ensureExecution(
  skill: string,
  cwd: string,
  config: Partial<PersistenceConfig> = {}
): Promise<ExecutionProgress> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const state = getSkillState(skill, cwd);
  
  if (!state) {
    throw new Error(`No state found for skill: ${skill}`);
  }
  
  const extState = state as ExtendedState;
  
  const progress: ExecutionProgress = {
    skill,
    phase: state.phase,
    status: 'running',
    progress: calculateProgress(state.phase),
    attempts: extState.attempts || 1,
    startedAt: state.activated_at || new Date().toISOString(),
  };
  
  // Check if phase has required evidence
  const evidence = listEvidence(skill, cwd);
  const hasCompletionEvidence = evidence.some(e => e.step === 'completion_verified');
  
  // Check if workflow is complete
  if (state.phase === 'completed') {
    progress.status = 'completed';
    progress.progress = 100;
    
    if (fullConfig.confirmCompletion && !hasCompletionEvidence) {
      logger.warn('persistence', 'Workflow marked complete but no verification evidence found');
      progress.status = 'running';
      progress.progress = 95;
    }
    
    return progress;
  }
  
  // Check for failures and retry
  if (state.phase === 'failed' || extState.error) {
    if (progress.attempts < fullConfig.maxRetries) {
      logger.info('persistence', `Retrying ${skill} (attempt ${progress.attempts + 1}/${fullConfig.maxRetries})`);
      
      const retryState: ExtendedState = {
        ...state,
        phase: getPreviousPhase(state.phase),
        attempts: progress.attempts + 1,
        error: undefined,
        retried_at: new Date().toISOString(),
      };
      
      setSkillState(skill, retryState, cwd);
      
      progress.status = 'running';
      progress.attempts = retryState.attempts || 1;
    } else {
      progress.status = 'failed';
      progress.lastError = extState.error || 'Max retries exceeded';
    }
  }
  
  return progress;
}

/**
 * Calculate progress percentage based on phase
 */
function calculateProgress(phase: string): number {
  const phaseProgress: Record<string, number> = {
    'starting': 5,
    'planning': 20,
    'designing': 35,
    'executing': 50,
    'implementing': 65,
    'testing': 80,
    'reviewing': 90,
    'verifying': 95,
    'completed': 100,
    'failed': 0,
  };
  
  return phaseProgress[phase] || 0;
}

/**
 * Get previous phase for retry
 */
function getPreviousPhase(currentPhase: string): string {
  const phases = ['starting', 'planning', 'designing', 'executing', 'implementing', 'testing', 'reviewing', 'verifying', 'completed'];
  const index = phases.indexOf(currentPhase);
  
  if (index > 0) {
    return phases[index - 1];
  }
  
  return 'starting';
}

/**
 * Mark workflow as requiring continuation
 */
export function requireContinuation(skill: string, cwd: string): void {
  const state = getSkillState(skill, cwd);
  if (state) {
    const extState: ExtendedState = {
      ...state,
      requires_continuation: true,
      continuation_requested_at: new Date().toISOString(),
    };
    setSkillState(skill, extState, cwd);
    
    logger.info('persistence', `Continuation required for ${skill}`);
  }
}

/**
 * Check if any workflow requires continuation
 */
export function getContinuationStatus(cwd: string): { skill: string; phase: string; progress: number } | null {
  const active = getActiveSkill(cwd);
  if (!active || !active.active) {
    return null;
  }
  
  const extState = active as ExtendedState;
  if (extState.requires_continuation) {
    return {
      skill: active.skill,
      phase: active.phase,
      progress: calculateProgress(active.phase),
    };
  }
  
  return null;
}

/**
 * Wait for workflow completion with polling
 */
export async function waitForCompletion(
  skill: string,
  cwd: string,
  timeoutMs: number = 30 * 60 * 1000
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 5000;
  
  logger.info('persistence', `Waiting for ${skill} completion (timeout: ${timeoutMs}ms)`);
  
  while (Date.now() - startTime < timeoutMs) {
    const progress = await ensureExecution(skill, cwd);
    
    if (progress.status === 'completed') {
      logger.info('persistence', `${skill} completed successfully`);
      return true;
    }
    
    if (progress.status === 'failed') {
      logger.error('persistence', `${skill} failed: ${progress.lastError}`);
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  logger.warn('persistence', `Timeout waiting for ${skill} completion`);
  return false;
}

/**
 * Get persistence status for HUD
 */
export function getPersistenceStatus(cwd: string): string {
  const active = getActiveSkill(cwd);
  if (!active || !active.active) {
    return 'Idle';
  }
  
  const progress = calculateProgress(active.phase);
  const status = active.phase === 'completed' ? '✓' : active.phase === 'failed' ? '✗' : '▶';
  
  return `${status} ${active.skill}: ${active.phase} (${progress}%)`;
}
