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

Before claiming completion, you MUST submit evidence via MCP tools:

1. **Submit Test Evidence:**
   After running `npm test`, call:
   ```
   omk_submit_evidence({skill:"ralph", step:"tests_passed", phase:"verifying", evidenceType:"command_output", command:"npm test", output:"<test output>", exitCode:0})
   ```

2. **Submit Build Evidence:**
   After running `npm run build`, call:
   ```
   omk_submit_evidence({skill:"ralph", step:"build_passed", phase:"verifying", evidenceType:"command_output", command:"npm run build", output:"<build output>", exitCode:0})
   ```

3. **Submit Lint Evidence:**
   After running `npm run lint`, call:
   ```
   omk_submit_evidence({skill:"ralph", step:"lint_clean", phase:"verifying", evidenceType:"command_output", command:"npm run lint", output:"<lint output>", exitCode:0})
   ```

4. **Submit Type Evidence:**
   After running `tsc --noEmit`, call:
   ```
   omk_submit_evidence({skill:"ralph", step:"types_clean", phase:"verifying", evidenceType:"command_output", command:"tsc --noEmit", output:"<tsc output>", exitCode:0})
   ```

5. **Check Required Evidence:**
   Before advancing phase, verify all evidence is present:
   ```
   omk_list_required_evidence({skill:"ralph", phase:"verifying"})
   ```

6. **TODO Check:**
   - Zero pending items
   - Zero in-progress items

7. **Architect Review:**
   - Delegate to `architect` subagent
   - After approval, submit:
   ```
   omk_submit_evidence({skill:"ralph", step:"architect_approved", phase:"completing", evidenceType:"review_signature", reviewerAgent:"architect", reviewResult:"approved"})
   ```

### Phase 4: Completion

1. Run final verification and submit all evidence
2. Submit diff evidence:
   ```
   omk_submit_evidence({skill:"ralph", step:"diff_recorded", phase:"completing", evidenceType:"diff_record", filesModified:["src/foo.ts"], linesAdded:10, linesRemoved:2})
   ```
3. Call `omk_assert_phase({skill:"ralph", phase:"completed"})` to confirm transition is allowed
4. Update state to "completed"
5. Run `$cancel` to clean up
6. Report success with evidence references

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
