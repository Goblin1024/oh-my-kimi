---
name: cancel
description: Stop active workflow and clean up state
---

# Cancel Skill

## Purpose

Stop the current OMK workflow and clean up state.

## Activation

Trigger: `$cancel` or user says "stop", "abort"

## Actions

1. **Read Current State**
   - Check `skill-active.json` for active workflow
   - Identify which skill is running

2. **Update State**
   - Set `active: false`
   - Set `phase: "cancelled"`
   - Add `cancelled_at` timestamp
   - Add cancellation reason

3. **Clean Up**
   - Clear TODO list if appropriate
   - Archive current state for reference
   - Release any locks

4. **Confirm**
   - Report which workflow was cancelled
   - Confirm clean completion

## State Changes

### Before
```json
{
  "skill": "ralph",
  "active": true,
  "phase": "executing"
}
```

### After
```json
{
  "skill": "ralph",
  "active": false,
  "phase": "cancelled",
  "cancelled_at": "2026-04-16T12:00:00Z",
  "reason": "User requested cancellation"
}
```

## Examples

**Cancel Active Workflow:**
```
[User] $cancel
[OMK] Cancelled ralph workflow (was in executing phase)
[OMK] State cleaned up. Ready for new workflow.
```

**Cancel During Deep Interview:**
```
[User] $cancel
[OMK] Cancelled deep-interview workflow
[OMK] Context snapshot saved to .omk/context/interview-2026-04-16.md
[OMK] You can resume later or start fresh.
```

**Nothing Active:**
```
[User] $cancel
[OMK] No active workflow to cancel.
```

## Notes

- Cancellation is immediate
- State is preserved for reference (not deleted)
- Always confirm what was cancelled
- Safe to call multiple times (idempotent)
