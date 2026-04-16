# Project Guidance

<!-- OMK: State and workflow guidance for oh-my-kimi -->

## Quick Commands

| Command | Purpose |
|---------|---------|
| `$deep-interview "..."` | Clarify requirements |
| `$ralplan "..."` | Create implementation plan |
| `$ralph "..."` | Execute with persistence |
| `$cancel` | Stop active workflow |

## Workflow

1. **Clarify** → `$deep-interview`
2. **Plan** → `$ralplan`
3. **Execute** → `$ralph`
4. **Complete** → Verification required

## State Location

- Active state: `.omk/state/skill-active.json`
- Plans: `.omk/plans/`
- Context: `.omk/context/`

## Notes

- Always verify before claiming completion
- Use parallel execution when possible
- Escalate blockers, don't guess
