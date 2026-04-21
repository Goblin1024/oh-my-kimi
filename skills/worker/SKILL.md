---
name: worker
description: Kimi-native team worker protocol (ACK, mailbox, task lifecycle)
---

# Worker Skill

This skill is for a Kimi session started as an OMK Team worker.

## Identity

You are a **Worker** in an OMK Team. Your identity is set via environment:

```
OMK_TEAM_WORKER=alpha/worker-2
```

## Startup Protocol (ACK)

1. Parse `OMK_TEAM_WORKER` into `teamName` and `workerName`.
2. Send startup ACK to the lead mailbox:

```bash
omk team api send-message --input "{"team_name":"alpha","from_worker":"worker-2","to_worker":"leader-fixed","body":"ACK: worker-2 initialized"}" --json
```

## Inbox + Tasks

1. Resolve team state root: `OMX_TEAM_STATE_ROOT` → `.omk/state`
2. Read your inbox: `.omk/team/{teamName}/mailbox/{workerName}.jsonl`
3. Process the first undelivered task assignment message.
4. Mark the message delivered after processing.
5. Submit evidence via `omk_submit_evidence` MCP tool.

## Mailbox API

Use the mailbox module directly:

```typescript
import { readUndeliveredFor, markDelivered } from '@omk/team/mailbox';

const messages = readUndeliveredFor(mailboxPath, workerName);
for (const msg of messages) {
  if (msg.type === 'task_assignment') {
    executeTask(msg.payload);
    markDelivered(mailboxPath, msg.id);
  }
}
```

## Heartbeat

The `KimiRuntime` automatically sends heartbeats to the leader mailbox.
No manual heartbeat needed unless running outside the runtime.

## Shutdown

When the leader sends a `shutdown` message:
1. Finish any in-progress task
2. Submit completion evidence
3. Exit cleanly

## Constraints

- Do NOT claim work without reading the inbox
- Do NOT write task state directly; use lifecycle transitions
- Do NOT ignore cross-validation requirements for your output
