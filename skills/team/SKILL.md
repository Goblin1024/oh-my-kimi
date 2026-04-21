---
name: team
description: Parallel agent execution via Kimi-native multi-worker runtime
trigger: $team
flags:
  - name: --count
    description: Number of workers to spawn (default: 2)
phases:
  - starting
  - dispatching
  - monitoring
  - consolidating
  - completing
gates:
  - type: prompt_specificity
    description: Task must describe parallelizable work
    blocking: true
  - type: proper_decomposition
    description: Task should indicate sub-tasks for parallel execution
    blocking: false
---

# Team Skill

Coordinate multiple Kimi agents to execute work in parallel.

## Role
You are the **Team Lead**. You break tasks into sub-tasks, dispatch them to workers via the mailbox system, and consolidate results.

## Prerequisites

- Kimi CLI configured with `max_running_tasks` (default: 4)
- Worker agents available in `~/.kimi/agents/`

## Workflow

1. **Analyze** the task and determine parallelization strategy.
2. **Check slots** via `SlotManager.available()` before spawning workers.
3. **Dispatch** sub-tasks to worker mailboxes (`team/mailbox/{worker}.jsonl`).
4. **Monitor** worker heartbeats and state via `KimiRuntime`.
5. **Consolidate** results when all workers complete.

## Slot Management

```typescript
import { SlotManager } from '@omk/team/slot-manager';

const slots = new SlotManager(); // reads ~/.kimi/config.toml
if (slots.acquire()) {
  spawnWorker(task);
}
```

## Worker Spawning

```typescript
import { KimiRuntime } from '@omk/team/kimi-runtime';

const worker = new KimiRuntime({
  agentFile: '~/.kimi/agents/executor.toml',
  sessionId: 'worker-1',
  logDir: '.omk/logs/team',
  mailboxPath: '.omk/team/alpha/mailbox/worker-1.jsonl',
});

worker.start(subTaskPrompt);
worker.onExit((state) => {
  console.log(`Worker exited: ${state.status}`);
});
```

## Mailbox Dispatch

```typescript
import { sendTextMessage } from '@omk/team/mailbox';

sendTextMessage(
  '.omk/team/alpha/mailbox/worker-1.jsonl',
  'leader',
  'worker-1',
  'Implement the auth module per PRD section 3'
);
```

## Cross-Validation

Before consolidating, run cross-validation on worker outputs:

```typescript
import { checkCrossValidation } from '@omk/validation/cross-validation';

const results = checkCrossValidation(evidence, changedFiles);
const blocking = results.filter(r => r.triggered && !r.satisfied);
```

## State Management

- **Active team state**: `.omk/state/team-active.json`
- **Worker logs**: `.omk/logs/team/latest/{worker}.log`
- **Mailboxes**: `.omk/team/{id}/mailbox/{worker}.jsonl`
