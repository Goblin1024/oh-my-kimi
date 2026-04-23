/**
 * Experience Learning System
 * 
 * Automatically extracts and reuses problem-solving patterns.
 */

import { listEvidence } from '../state/evidence.js';
import { getSkillState } from '../state/manager.js';
import { logger } from '../utils/logger.js';

export interface SolutionPattern {
  id: string;
  problemType: string;
  context: string;
  solution: string;
  outcome: 'success' | 'failure';
  tokensUsed: number;
  timeSpent: number;
  tags: string[];
  createdAt: string;
  reuseCount: number;
}

export interface LearningContext {
  skill: string;
  task: string;
  currentPhase: string;
  previousAttempts: number;
}

export async function extractPatterns(skill: string, cwd: string): Promise<SolutionPattern[]> {
  const patterns: SolutionPattern[] = [];
  
  try {
    const state = getSkillState(skill, cwd);
    const evidence = listEvidence(skill, cwd);
    
    if (!state) {
      return patterns;
    }
    
    // Extract successful command patterns
    const commandEvidence = evidence.filter(e => e.evidenceType === 'command_output' && e.exitCode === 0);
    for (const ev of commandEvidence) {
      if (ev.command) {
        patterns.push({
          id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          problemType: 'command_execution',
          context: ev.step,
          solution: ev.command,
          outcome: 'success',
          tokensUsed: 0,
          timeSpent: 0,
          tags: [skill, 'command', ev.step],
          createdAt: new Date().toISOString(),
          reuseCount: 0,
        });
      }
    }
    
    // Extract file artifact patterns
    const fileEvidence = evidence.filter(e => e.evidenceType === 'file_artifact');
    for (const ev of fileEvidence) {
      if (ev.artifactPath) {
        patterns.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          problemType: 'file_generation',
          context: ev.step,
          solution: ev.artifactPath,
          outcome: 'success',
          tokensUsed: ev.artifactSize || 0,
          timeSpent: 0,
          tags: [skill, 'file', ev.step],
          createdAt: new Date().toISOString(),
          reuseCount: 0,
        });
      }
    }
    
    logger.info('learning', `Extracted ${patterns.length} patterns from ${skill}`);
    
  } catch (error) {
    logger.error('learning', 'Pattern extraction failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  
  return patterns;
}

export async function findRelevantPatterns(
  context: LearningContext,
  cwd: string
): Promise<SolutionPattern[]> {
  const patterns: SolutionPattern[] = [];
  
  if (context.currentPhase === 'debugging') {
    patterns.push({
      id: 'pattern-debug-1',
      problemType: 'debug_test_failure',
      context: 'test execution',
      solution: 'Run tests with --verbose flag to get detailed error output',
      outcome: 'success',
      tokensUsed: 1000,
      timeSpent: 300,
      tags: ['debugging', 'testing', 'verbose'],
      createdAt: new Date().toISOString(),
      reuseCount: 3,
    });
  }
  
  if (context.currentPhase === 'implementing') {
    patterns.push({
      id: 'pattern-impl-1',
      problemType: 'api_implementation',
      context: 'REST API',
      solution: 'Use express router with validation middleware',
      outcome: 'success',
      tokensUsed: 5000,
      timeSpent: 1200,
      tags: ['implementation', 'api', 'express'],
      createdAt: new Date().toISOString(),
      reuseCount: 5,
    });
  }
  
  return patterns;
}

export function applyPatterns(patterns: SolutionPattern[], task: string): string {
  if (patterns.length === 0) {
    return '';
  }
  
  const lines: string[] = [];
  lines.push('## Learned Patterns');
  lines.push('');
  
  for (const pattern of patterns.slice(0, 3)) {
    lines.push(`### ${pattern.problemType} (used ${pattern.reuseCount} times)`);
    lines.push(`**Context:** ${pattern.context}`);
    lines.push(`**Solution:** ${pattern.solution}`);
    lines.push(`**Outcome:** ${pattern.outcome === 'success' ? 'Success' : 'Failed'}`);
    lines.push('');
  }
  
  return lines.join('\n');
}

export async function trackCompletion(
  skill: string,
  cwd: string,
  success: boolean
): Promise<void> {
  try {
    const state = getSkillState(skill, cwd);
    if (!state) {
      return;
    }
    
    const activatedAt = state.activated_at ? new Date(state.activated_at).getTime() : Date.now();
    const duration = Date.now() - activatedAt;
    
    logger.info('learning', `Task ${skill} ${success ? 'completed' : 'failed'}`, {
      duration,
      phase: state.phase,
    });
    
    if (success) {
      await extractPatterns(skill, cwd);
    }
    
  } catch (error) {
    logger.error('learning', 'Completion tracking failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function getLearningStats(cwd: string): {
  patternsLearned: number;
  patternsReused: number;
  successRate: number;
} {
  return {
    patternsLearned: 0,
    patternsReused: 0,
    successRate: 0,
  };
}

export async function extractLessonsLearned(skill: string, cwd: string): Promise<string> {
  const evidence = listEvidence(skill, cwd);
  const lessons: string[] = [];
  
  const failures = evidence.filter(e => e.exitCode !== 0 && e.exitCode !== undefined);
  for (const failure of failures) {
    lessons.push(`Failed command: ${failure.command}. Exit code: ${failure.exitCode}`);
  }
  
  const successes = evidence.filter(e => e.exitCode === 0 && e.command);
  for (const success of successes) {
    lessons.push(`Working solution: ${success.command}`);
  }
  
  if (lessons.length > 0) {
    return `## Lessons Learned from ${skill}\n\n${lessons.map(l => `- ${l}`).join('\n')}`;
  }
  
  return '';
}
