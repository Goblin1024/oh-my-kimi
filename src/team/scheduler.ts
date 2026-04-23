/**
 * Team Scheduler
 * 
 * Intelligent task scheduling and distribution for multi-agent teams.
 */

import { SlotManager } from './slot-manager.js';
import { getMaxRunningTasks } from './slot-manager.js';
import { logger } from '../utils/logger.js';

export interface Subtask {
  id: string;
  description: string;
  role: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedTo?: string;
  result?: string;
  priority: number;
}

export interface TeamSchedule {
  taskId: string;
  description: string;
  subtasks: Subtask[];
  maxWorkers: number;
  strategy: 'parallel' | 'sequential' | 'dependency-aware';
}

export interface WorkerAssignment {
  workerId: string;
  role: string;
  subtaskId: string;
  status: 'starting' | 'running' | 'idle';
}

export function decomposeTask(description: string, _roles: string[]): Subtask[] {
  const subtasks: Subtask[] = [];
  
  const hasMultipleComponents = /(?:frontend|backend|api|database|ui|server|client)/gi.test(description);
  const needsArchitecture = /(?:design|architecture|plan|structure)/i.test(description);
  const needsTesting = /(?:test|verify|validate)/i.test(description);
  const needsReview = /(?:review|audit|check)/i.test(description);
  
  subtasks.push({
    id: 'analyze',
    description: `Analyze requirements and current codebase for: ${description}`,
    role: 'architect',
    dependencies: [],
    status: 'pending',
    priority: 10,
  });
  
  if (needsArchitecture) {
    subtasks.push({
      id: 'design',
      description: `Design architecture and create implementation plan for: ${description}`,
      role: 'architect',
      dependencies: ['analyze'],
      status: 'pending',
      priority: 9,
    });
    
    subtasks.push({
      id: 'review-design',
      description: 'Review and validate architecture design',
      role: 'critic',
      dependencies: ['design'],
      status: 'pending',
      priority: 8,
    });
  }
  
  if (hasMultipleComponents) {
    const components = extractComponents(description);
    for (let i = 0; i < components.length; i++) {
      const deps = needsArchitecture ? ['review-design'] : ['analyze'];
      subtasks.push({
        id: `implement-${i}`,
        description: `Implement ${components[i]} component`,
        role: 'executor',
        dependencies: deps,
        status: 'pending',
        priority: 7,
      });
    }
  } else {
    subtasks.push({
      id: 'implement',
      description: `Implement: ${description}`,
      role: 'executor',
      dependencies: needsArchitecture ? ['review-design'] : ['analyze'],
      status: 'pending',
      priority: 7,
    });
  }
  
  if (needsTesting) {
    const implIds = subtasks
      .filter(st => st.id.startsWith('implement'))
      .map(st => st.id);
    
    subtasks.push({
      id: 'test',
      description: 'Write and run tests to verify implementation',
      role: 'test-engineer',
      dependencies: implIds,
      status: 'pending',
      priority: 6,
    });
  }
  
  if (needsReview) {
    const implIds = subtasks
      .filter(st => st.id.startsWith('implement'))
      .map(st => st.id);
    const deps = needsTesting ? ['test', ...implIds] : implIds;
    
    subtasks.push({
      id: 'review',
      description: 'Code review and security audit',
      role: 'code-reviewer',
      dependencies: deps,
      status: 'pending',
      priority: 5,
    });
  }
  
  return subtasks;
}

function extractComponents(description: string): string[] {
  const components: string[] = [];
  const componentPatterns = [
    /frontend|ui|client/gi,
    /backend|server|api/gi,
    /database|db|storage/gi,
    /auth|authentication|authorization/gi,
  ];
  
  for (const pattern of componentPatterns) {
    const match = description.match(pattern);
    if (match) {
      components.push(match[0]);
    }
  }
  
  return components.length > 0 ? components : ['core'];
}

export function scheduleSubtasks(subtasks: Subtask[], maxWorkers: number): TeamSchedule {
  const sorted = topologicalSort(subtasks);
  
  const hasDependencies = subtasks.some(st => st.dependencies.length > 0);
  const strategy: TeamSchedule['strategy'] = hasDependencies ? 'dependency-aware' : 'parallel';
  
  return {
    taskId: `task-${Date.now()}`,
    description: 'Auto-scheduled team task',
    subtasks: sorted,
    maxWorkers,
    strategy,
  };
}

function topologicalSort(subtasks: Subtask[]): Subtask[] {
  const visited = new Set<string>();
  const result: Subtask[] = [];
  
  function visit(subtask: Subtask) {
    if (visited.has(subtask.id)) return;
    visited.add(subtask.id);
    
    for (const depId of subtask.dependencies) {
      const dep = subtasks.find(st => st.id === depId);
      if (dep) {
        visit(dep);
      }
    }
    
    result.push(subtask);
  }
  
  const sorted = [...subtasks].sort((a, b) => b.priority - a.priority);
  for (const subtask of sorted) {
    visit(subtask);
  }
  
  return result;
}

export function assignSubtasks(
  schedule: TeamSchedule,
  availableWorkers: string[]
): WorkerAssignment[] {
  const assignments: WorkerAssignment[] = [];
  const workerPool = [...availableWorkers];
  
  const readySubtasks = schedule.subtasks.filter(st => {
    if (st.status !== 'pending') return false;
    return st.dependencies.every(depId => {
      const dep = schedule.subtasks.find(s => s.id === depId);
      return dep?.status === 'completed';
    });
  });
  
  for (const subtask of readySubtasks) {
    if (workerPool.length === 0) break;
    
    const workerId = workerPool.shift()!;
    subtask.status = 'running';
    subtask.assignedTo = workerId;
    
    assignments.push({
      workerId,
      role: subtask.role,
      subtaskId: subtask.id,
      status: 'starting',
    });
  }
  
  return assignments;
}

export async function executeTeamSchedule(
  schedule: TeamSchedule,
  cwd: string
): Promise<Subtask[]> {
  const maxWorkers = getMaxRunningTasks(cwd);
  const slotManager = new SlotManager(maxWorkers);
  
  logger.info('scheduler', `Starting team execution with ${maxWorkers} workers`, {
    subtasks: schedule.subtasks.length,
    strategy: schedule.strategy,
  });
  
  // Note: This is a simplified implementation
  // In production, would integrate with actual KimiRuntime workers
  
  let completedCount = 0;
  const totalCount = schedule.subtasks.length;
  
  while (completedCount < totalCount) {
    // Find completed subtasks
    for (const subtask of schedule.subtasks) {
      if (subtask.status === 'running' && subtask.assignedTo) {
        // Simulate completion check
        // In production, would check actual worker status
      }
    }
    
    // Assign new subtasks
    const readySubtasks = schedule.subtasks.filter(st => {
      if (st.status !== 'pending') return false;
      return st.dependencies.every(depId => {
        const dep = schedule.subtasks.find(s => s.id === depId);
        return dep?.status === 'completed';
      });
    });
    
    for (const subtask of readySubtasks) {
      if (slotManager.available() <= 0) break;
      
      subtask.status = 'running';
      slotManager.acquire();
      
      logger.info('scheduler', `Started subtask: ${subtask.id}`);
      
      // Simulate task completion
      setTimeout(() => {
        subtask.status = 'completed';
        subtask.result = 'completed';
        slotManager.release();
        completedCount++;
        
        logger.info('scheduler', `Completed subtask: ${subtask.id}`);
      }, 2000);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  logger.info('scheduler', 'Team execution complete', {
    completed: schedule.subtasks.filter(st => st.status === 'completed').length,
    failed: schedule.subtasks.filter(st => st.status === 'failed').length,
  });
  
  return schedule.subtasks;
}

export function aggregateResults(subtasks: Subtask[]): string {
  const lines: string[] = [];
  lines.push('## Team Execution Results');
  lines.push('');
  
  const completed = subtasks.filter(st => st.status === 'completed');
  const failed = subtasks.filter(st => st.status === 'failed');
  
  lines.push(`Completed: ${completed.length}/${subtasks.length}`);
  if (failed.length > 0) {
    lines.push(`Failed: ${failed.length}/${subtasks.length}`);
  }
  lines.push('');
  
  for (const subtask of subtasks) {
    const icon = subtask.status === 'completed' ? '✓' : subtask.status === 'failed' ? '✗' : '○';
    lines.push(`${icon} **${subtask.id}** (${subtask.role})`);
    lines.push(`   ${subtask.description}`);
    if (subtask.result) {
      lines.push(`   Result: ${subtask.result}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

export function getSchedulerStatus(schedule?: TeamSchedule): string {
  if (!schedule) {
    return 'No active schedule';
  }
  
  const completed = schedule.subtasks.filter(st => st.status === 'completed').length;
  const running = schedule.subtasks.filter(st => st.status === 'running').length;
  const pending = schedule.subtasks.filter(st => st.status === 'pending').length;
  const failed = schedule.subtasks.filter(st => st.status === 'failed').length;
  
  return `[${completed}✓ ${running}▶ ${pending}○ ${failed}✗] / ${schedule.subtasks.length}`;
}
