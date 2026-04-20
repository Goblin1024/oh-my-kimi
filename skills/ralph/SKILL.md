---
name: ralph
description: Persistence loop until task completion with verification
trigger: $ralph
flags:
  - name: --prd
    description: Reference an approved PRD file for guidance
  - name: --verbose
    description: Print detailed progress at each iteration
phases:
  - starting
  - executing
  - verifying
  - fixing
  - completing
  - cancelled
gates:
  - type: prompt_specificity
    description: Task description must be at least 10 characters
    blocking: true
---

# Ralph Skill

## Purpose

Guaranteed task completion through persistent iteration and mandatory verification.

## Activation

Trigger: `$ralph <task>` or `$ralph "continue"`

## Core Principle

**The task is not complete until verification proves it.**

## Workflow

### Phase 1: Context Loading

1. Check for approved plan in `.omk/plans/`
2. Load context snapshot from `.omk/context/`
3. Review current state
4. Identify what's already done vs. remaining

### Phase 2: Execution Loop

```
while not complete:
  1. Assess progress
  2. Delegate parallel tasks using Agent tool
  3. Run long operations in background
  4. Verify results
  5. Update TODO list
```

### Phase 3: Verification (Mandatory)

Before claiming completion:

1. **Fresh Evidence Required:**
   - Run tests: `npm test` → All pass
   - Run build: `npm run build` → Success
   - Check types: `tsc --noEmit` → No errors
   - Run lint: `npm run lint` → Clean

2. **TODO Check:**
   - Zero pending items
   - Zero in-progress items

3. **Architect Review:**
   - Delegate to `architect` subagent
   - Get explicit approval

### Phase 4: Completion

1. Run final verification
2. Update state to "complete"
3. Run `$cancel` to clean up
4. Report success with evidence

## Execution Policy

- **Parallel First**: Delegate independent tasks simultaneously
- **Background for Long Ops**: Use `run_in_background: true` for builds/tests
- **Evidence Required**: No "should work" - prove it works
- **No Scope Reduction**: Complete the full task, not a subset
- **Fresh Verification**: Re-run checks, don't trust old results

## State Management

- On start: Create `ralph-state.json` with phase "executing", iteration: 1
- Each iteration: Update iteration count, progress
- On verification: Phase "verifying"
- On fix: Phase "fixing"
- On complete: Phase "complete", active: false

## Progress Tracking

Use TODO list to track:
```
[ ] Task 1
[ ] Task 2
[x] Task 3 (completed)
```

## Subagent Delegation

Use Kimi's Agent tool:

```
Agent(description="Implement auth module", prompt="...")
Agent(description="Write tests", prompt="...", run_in_background=true)
Agent(description="Review code", prompt="...")
```

## Examples

**Basic Execution:**
```
$ralph "implement user login"
→ Load approved plan
→ Delegate implementation to coder subagent
→ Delegate tests to test-engineer subagent
→ Collect results
→ Run verification
→ Report completion
```

**Resume After Interruption:**
```
$ralph "continue"
→ Read current state
→ Identify incomplete tasks
→ Continue from where we left off
→ Complete and verify
```

**With PRD:**
```
$ralph --prd "build the authentication system"
→ Check for prd-authentication.md
→ Follow the approved plan
→ Verify each milestone
→ Complete when all user stories pass
```

## Stop Conditions

- Task is complete with verification
- User says "$cancel"
- Fundamental blocker (external service down, missing credentials)
- Same error recurs 3+ times (escalate to user)

## Completion Checklist

- [ ] All requirements met
- [ ] Tests pass (fresh run)
- [ ] Build succeeds (fresh run)
- [ ] No type errors
- [ ] No lint errors
- [ ] TODO list empty
- [ ] Architect verification passed
- [ ] State cleaned up

## Notes

- Ralph NEVER gives up until complete or explicitly cancelled
- Verification is mandatory, not optional
- Use parallel execution for speed
- Keep user informed of progress
- Escalate blockers, don't guess
