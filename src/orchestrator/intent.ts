/**
 * Smart Intent Recognition
 * 
 * Automatically detects user intent from natural language descriptions
 * without requiring explicit skill commands.
 * 
 * Features:
 * - Semantic pattern matching for task types
 * - Complexity assessment for routing decisions
 * - Automatic skill selection based on context
 * - No command memorization required
 */

import { assessComplexity } from '../token/router.js';

export type TaskType = 
  | 'requirement-gathering'
  | 'architecture-design'
  | 'implementation'
  | 'review'
  | 'debugging'
  | 'testing'
  | 'refactoring'
  | 'documentation'
  | 'research'
  | 'deployment'
  | 'analysis'
  | 'optimization';

export interface TaskIntent {
  taskType: TaskType;
  complexity: 'low' | 'medium' | 'high';
  description: string;
  requiresTeam: boolean;
  suggestedSkills: string[];
  estimatedSubtasks: number;
  confidence: number; // 0-1
}

// Semantic patterns for intent detection
const INTENT_PATTERNS: Record<TaskType, RegExp[]> = {
  'requirement-gathering': [
    /(?:clarify|understand|define|gather|collect).{0,30}(?:requirements?|needs?|goals?|scope)/i,
    /(?:what|how).{0,20}(?:want|need|should|require)/i,
    /(?:interview|discuss|explore).{0,20}(?:feature|idea|concept)/i,
  ],
  'architecture-design': [
    /(?:design|architect|plan|structure|layout).{0,30}(?:system|app|module|component|service)/i,
    /(?:how|what).{0,20}(?:architecture|structure|organize|design)/i,
    /(?:create|draft|write).{0,20}(?:PRD|spec|specification|blueprint)/i,
  ],
  'implementation': [
    /(?:implement|build|create|develop|write|code).{0,30}(?:feature|function|class|module|api)/i,
    /(?:add|integrate|setup|configure).{0,20}(?:auth|database|api|ui|test)/i,
    /(?:make|build).{0,15}(?:work|function|run|operate)/i,
  ],
  'review': [
    /(?:review|audit|inspect|check|evaluate).{0,30}(?:code|pr|pull request|implementation|design)/i,
    /(?:look|go).{0,15}(?:over|through).{0,15}(?:code|changes|diff)/i,
    /(?:quality|code review|peer review)/i,
  ],
  'debugging': [
    /(?:fix|debug|troubleshoot|resolve|solve).{0,30}(?:bug|error|issue|problem|crash|fail)/i,
    /(?:not working|broken|failing|throwing|crashing)/i,
    /(?:why|what).{0,20}(?:error|exception|fail|break)/i,
  ],
  'testing': [
    /(?:test|verify|validate|check).{0,30}(?:functionality|behavior|correctness|coverage)/i,
    /(?:write|create|add).{0,20}(?:test|spec|unit test|integration test)/i,
    /(?:ensure|confirm|prove).{0,20}(?:works|correct|pass)/i,
  ],
  'refactoring': [
    /(?:refactor|rewrite|restructure|clean|improve).{0,30}(?:code|class|module|function)/i,
    /(?:reduce|simplify|optimize|clean up).{0,20}(?:complexity|duplication|code)/i,
    /(?:better|cleaner|more maintainable).{0,20}(?:code|structure)/i,
  ],
  'documentation': [
    /(?:document|write|create|update).{0,30}(?:docs?|readme|guide|manual|comment)/i,
    /(?:explain|describe|clarify).{0,20}(?:how|what|why).{0,20}(?:work|function|use)/i,
  ],
  'research': [
    /(?:research|investigate|explore|study|analyze).{0,30}(?:technology|library|framework|approach|solution)/i,
    /(?:find|look for|search).{0,20}(?:best|better|alternative).{0,20}(?:way|method|tool|library)/i,
    /(?:compare|evaluate|assess).{0,20}(?:options|alternatives|solutions)/i,
  ],
  'deployment': [
    /(?:deploy|release|publish|ship|launch).{0,30}(?:app|service|feature|update)/i,
    /(?:setup|configure).{0,20}(?:production|staging|ci\/cd|pipeline)/i,
    /(?:docker|kubernetes|k8s|container)/i,
  ],
  'analysis': [
    /(?:analyze|examine|investigate|study).{0,30}(?:performance|memory|cpu|bottleneck|issue)/i,
    /(?:why|what).{0,20}(?:slow|memory leak|high cpu|performance)/i,
    /(?:profile|benchmark|measure).{0,20}(?:performance|speed|throughput)/i,
  ],
  'optimization': [
    /(?:optimize|improve|enhance|speed up|accelerate).{0,30}(?:performance|speed|memory|efficiency)/i,
    /(?:reduce|minimize|decrease).{0,20}(?:memory|cpu|latency|time|cost)/i,
    /(?:faster|better|more efficient).{0,20}(?:code|query|algorithm)/i,
  ],
};

// Task type to skill mapping
const TASK_TYPE_SKILLS: Record<TaskType, string[]> = {
  'requirement-gathering': ['deep-interview'],
  'architecture-design': ['deep-interview', 'ralplan'],
  'implementation': ['ralph', 'autopilot'],
  'review': ['code-review', 'security-review'],
  'debugging': ['ralph', 'build-fix'],
  'testing': ['tdd', 'ultraqa'],
  'refactoring': ['ai-slop-cleaner', 'ralph'],
  'documentation': ['wiki'],
  'research': ['deepsearch', 'autoresearch'],
  'deployment': ['configure-notifications'],
  'analysis': ['analyze'],
  'optimization': ['ecomode'],
};

// Keywords indicating multi-agent work
const TEAM_INDICATORS = [
  /(?:team|multiple|several|parallel|concurrent|distributed)/i,
  /(?:break|split|divide).{0,20}(?:into|to).{0,20}(?:parts|tasks|pieces|subtasks)/i,
  /(?:workers?|agents?|roles?)/i,
  /(?:simultaneously|together|at the same time)/i,
  /(?:complex|large|big|huge|massive).{0,20}(?:project|task|feature|system)/i,
  /(?:architecture|design).{0,20}(?:and|then|followed by).{0,20}(?:implement|build|develop)/i,
  /(?:frontend|backend|api|database|ui).{0,20}(?:and|&|\+).{0,20}(?:frontend|backend|api|database|ui)/i,
];

/**
 * Detect intent from natural language description
 */
const MIN_CONFIDENCE_THRESHOLD = 0.5;

export function detectIntent(description: string): TaskIntent | null {
  // Detect task type
  let bestType: TaskType = 'implementation';
  let bestScore = 0;
  
  for (const [type, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(description)) {
        score += 1;
        // Boost score for multiple matches
        const matches = description.match(pattern);
        if (matches && matches.length > 1) {
          score += 0.5;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type as TaskType;
    }
  }
  
  // Assess complexity
  const complexity = assessComplexity(description);
  
  // Determine if team is needed
  const teamScore = TEAM_INDICATORS.reduce((score, pattern) => {
    return score + (pattern.test(description) ? 1 : 0);
  }, 0);
  
  // High complexity tasks or explicit team mentions require team
  const requiresTeam = complexity === 'high' || teamScore >= 2;
  
  // Estimate subtasks
  let estimatedSubtasks = 1;
  if (complexity === 'high') estimatedSubtasks = 4;
  else if (complexity === 'medium') estimatedSubtasks = 2;
  if (teamScore > 0) estimatedSubtasks += teamScore;
  
  // Calculate confidence
  const confidence = Math.min(0.3 + bestScore * 0.2 + (teamScore > 0 ? 0.2 : 0), 0.95);
  
  // If confidence is too low, this is likely not a task description
  if (confidence < MIN_CONFIDENCE_THRESHOLD) {
    return null;
  }
  
  return {
    taskType: bestType,
    complexity,
    description,
    requiresTeam,
    suggestedSkills: TASK_TYPE_SKILLS[bestType],
    estimatedSubtasks,
    confidence,
  };
}

/**
 * Check if the prompt is a natural language task description
 * (not an explicit skill command like $ralph)
 */
export function isNaturalLanguageTask(prompt: string): boolean {
  // If it starts with $, it's an explicit command
  if (prompt.trim().startsWith('$')) {
    return false;
  }
  
  // If it matches any skill command pattern, it's not natural language
  const skillCommandPattern = /^\$[a-z-]+/;
  if (skillCommandPattern.test(prompt.trim())) {
    return false;
  }
  
  // Otherwise, treat it as natural language
  return true;
}

/**
 * Generate a structured plan from detected intent
 */
export function generatePlan(intent: TaskIntent): string {
  const steps: string[] = [];
  
  if (intent.requiresTeam) {
    steps.push(`Team orchestration: ${intent.estimatedSubtasks} parallel workers`);
  }
  
  switch (intent.taskType) {
    case 'requirement-gathering':
      steps.push('Phase 1: Deep interview to clarify requirements');
      steps.push('Phase 2: Document findings and get approval');
      break;
      
    case 'architecture-design':
      steps.push('Phase 1: Interview to gather requirements');
      steps.push('Phase 2: Draft architecture PRD');
      steps.push('Phase 3: Review and approval');
      break;
      
    case 'implementation':
      steps.push('Phase 1: Review existing code and plan');
      steps.push('Phase 2: Implement core functionality');
      steps.push('Phase 3: Write tests and verify');
      break;
      
    case 'review':
      steps.push('Phase 1: Analyze code for issues');
      steps.push('Phase 2: Check security and best practices');
      steps.push('Phase 3: Provide recommendations');
      break;
      
    case 'debugging':
      steps.push('Phase 1: Reproduce and diagnose the issue');
      steps.push('Phase 2: Implement fix');
      steps.push('Phase 3: Verify fix with tests');
      break;
      
    default:
      steps.push('Phase 1: Analyze and plan');
      steps.push('Phase 2: Execute with verification');
      steps.push('Phase 3: Review and finalize');
  }
  
  return steps.join('\n');
}

/**
 * Get suggested agent roles for the task
 */
export function getSuggestedRoles(intent: TaskIntent): string[] {
  const roles: string[] = [];
  
  switch (intent.taskType) {
    case 'architecture-design':
      roles.push('architect');
      roles.push('critic');
      break;
      
    case 'implementation':
      roles.push('executor');
      if (intent.complexity === 'high') {
        roles.push('test-engineer');
        roles.push('code-reviewer');
      }
      break;
      
    case 'review':
      roles.push('code-reviewer');
      roles.push('security-reviewer');
      break;
      
    case 'debugging':
      roles.push('debugger');
      roles.push('test-engineer');
      break;
      
    case 'testing':
      roles.push('test-engineer');
      roles.push('executor');
      break;
      
    default:
      roles.push('executor');
      if (intent.complexity !== 'low') {
        roles.push('reviewer');
      }
  }
  
  return roles;
}
