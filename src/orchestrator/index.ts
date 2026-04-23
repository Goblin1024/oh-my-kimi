/**
 * Orchestrator Module
 * 
 * Smart workflow orchestration with natural language support.
 */

export { detectIntent, isNaturalLanguageTask, generatePlan, getSuggestedRoles } from './intent.js';
export type { TaskIntent } from './intent.js';

export { orchestrate, shouldEscalateToTeam, getWorkflowStatus } from './workflow.js';
export type { WorkflowConfig, OrchestratorResult } from './workflow.js';

export {
  initializePersistence,
  ensureExecution,
  requireContinuation,
  getContinuationStatus,
  waitForCompletion,
  getPersistenceStatus,
} from './persistence.js';
export type { PersistenceConfig, ExecutionProgress } from './persistence.js';
