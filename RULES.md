# AI Agent Rules

> Universal rules governing the behavior of all AI agents in this project.
> These rules apply to every role, every skill, and every workflow stage.
> When a specific skill or role directive conflicts with these rules, these rules take precedence.

---

## Part 1 鈥?Core Principles

### R-01 路 Understand Before Acting

Before writing a single line of code, the agent **must** be able to answer:

- What problem is being solved?
- What does "done" look like?
- What must NOT be touched?

If any answer is unclear, ask. Do not assume. Do not infer from thin air.

### R-02 路 Evidence Over Opinion

All claims must be backed by evidence:

| Claim | Required Evidence |
|-------|-------------------|
| "The tests pass" | Fresh test run output |
| "The build succeeds" | Fresh build output |
| "This is the root cause" | Stack trace or code inspection |
| "This approach is better" | Concrete trade-off comparison |

Never say "this should work." Prove it works.

### R-03 路 Minimum Footprint

Do the least amount of change necessary to achieve the goal.

- Do NOT refactor code that is not related to the task.
- Do NOT add features that were not requested.
- Do NOT rename symbols without explicit instruction.
- Do NOT delete files unless the task explicitly requires it.

### R-04 路 Reversibility First

Prefer reversible actions over irreversible ones.

- Favor creating new files over overwriting existing ones when uncertain.
- Favor additive changes over deletions.
- When a destructive action is required, state it explicitly before executing.

### R-05 路 Fail Loudly, Not Silently

Never swallow errors or hide failures.

- If a command fails, report the exact error output.
- If a task cannot be completed, say so clearly with the reason.
- If a blocker is encountered, escalate immediately 鈥?do not guess around it.

---

## Part 2 鈥?Code Quality

### R-10 路 Follow the Project's Existing Style

Read the code before writing code. Match the conventions already present:

- Indentation, quote style, semicolons
- Naming conventions (camelCase, PascalCase, etc.)
- File organization patterns
- Import ordering

A linter passing is the minimum bar, not the quality bar.

### R-11 路 Names Must Communicate Intent

```typescript
// Bad
const d = new Date();
const fn = (x: number) => x * 1.1;

// Good
const createdAt = new Date();
const applyTaxRate = (price: number) => price * TAX_MULTIPLIER;
```

Variable, function, and class names must convey **what** they represent or **what** they do, not **how** they are implemented.

### R-12 路 Functions Do One Thing

A function that does two things is two functions waiting to be extracted.

- Maximum cognitive complexity: keep it low enough to read without scrolling.
- If a function needs a comment to explain what it does, consider renaming or splitting it.
- Side effects must be explicit and documented.

### R-13 路 Handle Errors Explicitly

```typescript
// Bad 鈥?silent failure
try {
  await doSomething();
} catch (_) {}

// Good 鈥?explicit handling
try {
  await doSomething();
} catch (err) {
  logger.error('doSomething failed', { err, context });
  throw new OperationError('doSomething failed', { cause: err });
}
```

Every `catch` block must either handle the error, log it, or re-throw it. Empty catch blocks are forbidden.

### R-14 路 No Magic Numbers or Strings

```typescript
// Bad
if (status === 3) { ... }
setTimeout(fn, 86400000);

// Good
const STATUS_COMPLETE = 3;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
```

All literal values with non-obvious meaning must be named constants.

### R-15 路 Dead Code Is Deleted, Not Commented Out

Commented-out code is noise. Version control exists for history.

```typescript
// Bad
// const oldImplementation = () => { ... };

// Good
// (deleted 鈥?see git history if needed)
```

---

## Part 3 鈥?Testing

### R-20 路 Tests Are Not Optional

Every non-trivial change requires tests. "I'll add tests later" is not acceptable.

- New features 鈫?unit tests + integration tests
- Bug fixes 鈫?regression test that fails before the fix, passes after
- Refactors 鈫?existing tests must continue to pass

### R-21 路 Tests Must Be Meaningful

```typescript
// Bad 鈥?tests implementation details
expect(obj._internalCache.size).toBe(1);

// Bad 鈥?tests nothing useful
expect(true).toBe(true);

// Good 鈥?tests observable behavior
expect(registry.get('ralph')?.name).toBe('ralph');
expect(() => registry.get('unknown')).not.toThrow();
```

Test what the code **does**, not how it is built internally.

### R-22 路 Tests Must Be Isolated

- Each test must be independent and self-contained.
- Tests must not depend on execution order.
- Shared state must be reset in `beforeEach` / `afterEach`.
- External dependencies (filesystem, network, clock) must be mocked.

### R-23 路 Test Coverage Is a Signal, Not a Goal

100% coverage with trivial tests is worthless. Focus on:

1. **Critical paths** 鈥?the code that matters most when it breaks
2. **Edge cases** 鈥?null inputs, empty arrays, boundary values
3. **Error paths** 鈥?what happens when things go wrong

### R-24 路 Verification Is Always Fresh

Never trust cached test results. Before claiming a task is done:

```bash
npm run build     # Must succeed
npm test          # Must pass 鈥?run fresh
npm run lint      # Must be clean
```

---

## Part 4 鈥?Communication

### R-30 路 Be Concise, Not Verbose

Responses must be proportional to the task complexity:

- Simple question 鈫?direct answer, no preamble
- Code change 鈫?what changed and why, not line-by-line narration
- Error report 鈫?error + root cause + fix, not a story

Avoid filler phrases: "Certainly!", "Great question!", "As an AI language model..."

### R-31 路 Structure Complex Outputs

When delivering complex information, use structure:

```markdown
## What changed
- [specific change 1]
- [specific change 2]

## Why
[concise rationale]

## Verification
[evidence: test output, build output]
```

Do not dump walls of text. Humans scan before they read.

### R-32 路 State Assumptions Explicitly

When making an assumption, say so:

> "Assuming you want to keep the existing API shape unchanged..."
> "Assuming Node.js 20+ is the minimum target..."

This allows the user to correct the assumption before work is wasted.

### R-33 路 Report Progress on Long Tasks

For tasks that span multiple steps, provide progress updates:

```
[1/4] Context loaded from .omk/context/
[2/4] Implementing auth module...
[3/4] Writing tests...
[4/4] Running verification...
```

Never go silent for more than one major step.

### R-34 路 Escalate Blockers Immediately

If the same error occurs 3 times with different fixes, stop and escalate:

> "I have attempted 3 different approaches and all fail with the same error. 
> Here is the error and what I've tried. I need your input to proceed."

Do not loop indefinitely. Escalation is not failure 鈥?it is correct behavior.

---

## Part 5 鈥?Safety and Boundaries

### R-40 路 Read Before Write

Before modifying any file, read its current content. Never overwrite a file based on assumptions about what it contains.

### R-41 路 Declare Destructive Operations

Before executing any irreversible action, declare it:

> "This will permanently delete `src/legacy/`. Proceeding."

Actions considered destructive:
- Deleting files or directories
- Overwriting configuration files
- Running `DROP TABLE` or equivalent
- Resetting git history
- Publishing to npm or any registry

### R-42 路 Scope Containment

Stay within the defined scope. If the task requires touching something outside the agreed scope:

1. Stop.
2. Report what you found.
3. Ask for explicit permission to expand scope.

Never silently expand the scope to "make things cleaner."

### R-43 路 No Credentials in Code

Never write secrets, tokens, passwords, or API keys directly in source files.

- Use environment variables: `process.env.API_KEY`
- Reference `.env.example` for required variable names
- If a secret is found in existing code, flag it 鈥?do not propagate it

### R-44 路 Validate All External Input

Any data crossing a trust boundary must be validated before use:

- CLI arguments
- Environment variables
- File contents
- API responses
- Hook input from Kimi

Assume external input is malformed until proven otherwise.

---

## Part 6 鈥?Workflow and Process

### R-50 路 Follow the Canonical Workflow

For feature development, follow the three-stage chain:

```
$deep-interview 鈫?$ralplan 鈫?$ralph
```

Skipping stages is allowed only when:
- The task is a trivial bug fix (< 30 min estimated)
- An approved PRD already exists
- The user explicitly waives a stage

### R-51 路 Plans Must Be Approved Before Execution

Do not begin implementation until the user has explicitly approved the plan.

"Looks good" counts. Silence does not count.

### R-52 路 State Must Be Kept Current

After every significant action, update the relevant state file in `.omk/state/`.

State files are the single source of truth for workflow progress. Stale state leads to lost context.

### R-53 路 Resume From State, Not Memory

When a session starts, always read `.omk/state/skill-active.json` first.

Do not rely on conversational memory to determine workflow status. Files are durable; context windows are not.

### R-54 路 One Active Workflow at a Time

Only one skill can be `active: true` at any moment.

Before activating a new workflow, check if one is already running. If so:
- Either `$cancel` the existing one
- Or ask the user which takes priority

---

## Part 7 鈥?Tool Usage

### R-60 路 Prefer Parallel Execution

When tasks are independent, execute them in parallel:

```
// Good 鈥?parallel
Agent("Implement module A", ...)
Agent("Write tests for module A", ..., run_in_background=true)

// Avoid 鈥?needlessly sequential
await implementModuleA();
await writeTests();
```

### R-61 路 Use the Right Tool

| Task | Right Tool |
|------|------------|
| Read a file | Read tool |
| Search code | Grep / Glob tool |
| Run build/tests | Bash tool |
| Explore codebase | Task (explore agent) |
| Write/edit files | Write / Edit tool |

Do not use Bash to read files. Do not use Grep to run commands.

### R-62 路 Verify Tool Output Before Acting On It

Tool output can be stale, truncated, or wrong. Always sanity-check:

- Does the file content match expectations?
- Does the grep result actually contain the pattern?
- Did the command exit with code 0?

### R-63 路 Never Guess Missing Parameters

If a tool call requires a parameter that is unknown:

1. Try to infer it from context (reading related files).
2. If it cannot be inferred, ask the user.
3. Never use a placeholder value like `"TODO"` or `"unknown"`.

---

## Part 8 鈥?Definition of Done

A task is **Done** when ALL of the following are true:

```
[ ] All stated requirements are met 鈥?verified, not assumed
[ ] All tests pass (fresh run, not cached)
[ ] Build succeeds (fresh run)
[ ] No type errors (tsc --noEmit)
[ ] No lint errors (npm run lint)
[ ] No dead code introduced
[ ] No commented-out code left behind
[ ] State files updated to reflect completion
[ ] User has been informed with a concise summary and evidence
```

If any item is unchecked, the task is not done.

---

## Quick Reference

| Rule | One-liner |
|------|-----------|
| R-01 | Understand before acting |
| R-02 | Evidence over opinion |
| R-03 | Minimum footprint |
| R-04 | Reversibility first |
| R-05 | Fail loudly, not silently |
| R-10 | Follow existing style |
| R-11 | Names communicate intent |
| R-12 | Functions do one thing |
| R-13 | Handle errors explicitly |
| R-14 | No magic numbers |
| R-15 | Delete dead code, never comment it out |
| R-20 | Tests are not optional |
| R-21 | Tests must be meaningful |
| R-22 | Tests must be isolated |
| R-23 | Coverage is a signal, not a goal |
| R-24 | Verification is always fresh |
| R-30 | Be concise, not verbose |
| R-31 | Structure complex outputs |
| R-32 | State assumptions explicitly |
| R-33 | Report progress on long tasks |
| R-34 | Escalate blockers immediately |
| R-40 | Read before write |
| R-41 | Declare destructive operations |
| R-42 | Scope containment |
| R-43 | No credentials in code |
| R-44 | Validate all external input |
| R-50 | Follow the canonical workflow |
| R-51 | Plans must be approved before execution |
| R-52 | State must be kept current |
| R-53 | Resume from state, not memory |
| R-54 | One active workflow at a time |
| R-60 | Prefer parallel execution |
| R-61 | Use the right tool |
| R-62 | Verify tool output before acting |
| R-63 | Never guess missing parameters |

---

*Rules version: 1.0.0 路 Project: oh-my-kimi*
