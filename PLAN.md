# oh-my-kimi v1.0 Architecture Plan: Claude-Level Engineering via Code-Enforced Workflows

> **Vision**: OMK transforms Kimi from a conversational coding assistant into a systematic engineering agent — matching Claude's depth, reliability, and honesty through architecture, not model upgrades.
> **Based on**: `analyse20260420.ini` (30% code-enforcement audit) + `todo.ini` (8-dimension roadmap)

---

## 1. The Vision: Why Claude Engineers Better

Claude (via oh-my-codex) outperforms Kimi on engineering tasks not because of raw IQ, but because of **systematic behavior**:

| Claude Behavior | Why It Works | Kimi Without OMK | Kimi With OMK v1.0 |
|----------------|--------------|------------------|-------------------|
| **Plan-first execution** | Reads codebase, designs solution, then codes | Often jumps straight to editing | `ralplan` + evidence gates force planning before execution |
| **Systematic error handling** | Analyzes root cause, tries alternatives, verifies | May panic or give up after 1 failure | Ralph loop + retry evidence + rollback snapshots |
| **Defensive coding** | Considers edge cases, types, error paths | Often misses null checks, type safety | `security-reviewer` + `test-engineer` cross-validation gates |
| **Test-first discipline** | Runs tests before claiming success | Frequently claims "tests pass" without running | `tests_passed` evidence requires exitCode 0 + command output |
| **Refactoring discipline** | Locks behavior with tests before changing | Breaks things during "cleanup" | Architect approval + diff evidence + build verification |
| **Architectural awareness** | Understands module boundaries, dependencies | Edits files without reading callers | `context_loaded` evidence requires reading dependency graph |
| **Honesty about limits** | Says "I don't know" instead of guessing | Hallucinates solutions confidently | Honesty validator blocks unverified claims |
| **Deep reasoning** | Extended thinking for complex design | Surface-level analysis | Multi-agent consensus (architect → critic → planner) |

**Core Insight**: OMK cannot upgrade Kimi's model, but it can **enforce the systematic behaviors** that make Claude effective. The architecture becomes the "discipline layer" that compensates for Kimi's tendency to shortcut.

---

## 2. The Problem: Why Kimi Takes Shortcuts

### 2.1 Current Architecture Gap (from `analyse20260420.ini`)

Current OMK enforces **~30% of rules in code**. The remaining **~70%** are "document conventions" — LLM reads markdown and "hopes" it follows instructions.

**Specific shortcut patterns Kimi exhibits**:

| Shortcut | Example | Current OMK Response | Needed Response |
|----------|---------|---------------------|----------------|
| **Phantom testing** | "All tests pass" (never ran `npm test`) | None | Block phase transition, demand test output evidence |
| **Skipped planning** | Jumps from `$ralplan` to writing code | None | Block execution phase without PRD evidence |
| **Self-approval** | "This looks good" (no review) | None | Require `architect_approved` evidence from independent agent |
| **One-shot "fix"** | Changes 1 line for architectural debt | None | Require decomposition evidence (≥3 steps for complex tasks) |
| **Unread write** | Modifies file without reading dependencies | None | PreToolUse hook blocks write without prior read evidence |
| **Hidden failures** | Build fails but claims success | None | Honesty validator catches exitCode ≠ 0 |
| **Ignored flags** | `--deliberate` mode does single-pass | Validates flag exists | Validates behavior (≥2 review rounds evidence) |
| **Phantom artifacts** | "PRD written" but file empty/missing | None | File-existence + size + hash validation |

### 2.2 Root Cause: "Doorman Architecture"

```
User → Hook checks keyword → state={phase: "starting"} → LLM reads SKILL.md → LLM does whatever it wants
         ↑___________________________________________↑
              This is the ONLY code-enforced boundary
```

Once activated, Kimi operates in a **black box**. OMK has no visibility into:
- Whether Step 2 was actually performed
- Whether claimed test results are real
- Whether required reviews happened
- Whether files were read before modification

---

## 3. Core Architecture: Evidence-Based Workflow Engine (EBWE)

### 3.1 The Three-Layer Enforcement Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: Activation Gates (existing — prevents bad starts)                  │
│ • Keyword validation, flag check, prompt length, gate predicates            │
│ • Enforced at UserPromptSubmit hook                                         │
│ • Coverage: ~15% of rules → 100% code-enforced                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: Evidence-Locked Phase Transitions (new — prevents skipped steps)   │
│ • Every phase advance requires machine-checkable evidence                   │
│ • Evidence schema: command_output | file_artifact | review_signature        │
│ • Enforced via MCP omk_write_state + assertStepPrerequisites()              │
│ • Coverage: ~55% of rules → 100% code-enforced                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: Continuous Honesty Validation (new — prevents false claims)        │
│ • AI claims are pattern-matched against submitted evidence                  │
│ • Unverified claims trigger blocking responses                              │
│ • Cross-validation rules require independent agent approval                 │
│ • Coverage: ~30% of rules → 100% code-enforced                              │
└─────────────────────────────────────────────────────────────────────────────┘
                              TARGET: ~85% code-enforced
```

### 3.2 Evidence Schema: Machine-Checkable by Design

```typescript
// src/evidence/schema.ts

interface Evidence {
  skill: string;
  step: string;              // e.g., "tests_passed", "prd_written", "context_loaded"
  phase: string;             // Phase this evidence unlocks
  submittedAt: string;
  submitter: string;

  evidenceType: 'command_output' | 'file_artifact' | 'review_signature' | 'diff_record' | 'context_record';

  // ── command_output: AI must have RUN the command ──
  command?: string;
  output?: string;           // First 10KB of stdout/stderr
  exitCode: number;          // MUST be 0 for success claims
  cwd?: string;

  // ── file_artifact: AI must have CREATED the file ──
  artifactPath?: string;
  artifactHash?: string;     // SHA-256
  artifactSize?: number;     // > 0 (catches empty files)

  // ── review_signature: AI must have DELEGATED review ──
  reviewerAgent?: string;
  reviewResult?: 'approved' | 'rejected' | 'changes_requested';
  reviewEvidencePath?: string;

  // ── diff_record: AI must show WHAT changed ──
  filesModified?: string[];
  linesAdded?: number;
  linesRemoved?: number;

  // ── context_record: AI must prove it READ before writing ──
  filesRead?: string[];      // List of files read in this phase
  dependenciesAnalyzed?: boolean;
}
```

**Storage**:
```
.omk/evidence/{skill}/{timestamp}-{step}.json
```

### 3.3 Phase Transition with Evidence Lock

```typescript
// src/state/workflow-transition.ts

function assertValidTransition(skill, fromPhase, toPhase, evidenceDir) {
  // Layer 1: Phase name legality (existing)
  if (!isLegalPhaseName(skill, toPhase)) throw new PhaseNameError(...);

  // Layer 2: Evidence lock (NEW)
  const required = SKILL_EVIDENCE_REQUIREMENTS[skill]?.[toPhase];
  if (required) {
    for (const req of required) {
      const evidence = findEvidence(evidenceDir, skill, req.step);
      if (!evidence) {
        throw new TransitionBlockedError(
          `🚫 BLOCKED: Cannot enter '${toPhase}'.\n` +
          `Missing evidence: '${req.step}' (${req.description})\n` +
          `→ Submit via: omk_submit_evidence({skill:"${skill}", step:"${req.step}", ...})`
        );
      }
      if (req.validator) {
        const result = req.validator(evidence);
        if (!result.valid) {
          throw new TransitionBlockedError(
            `🚫 BLOCKED: Evidence for '${req.step}' failed validation.\n` +
            `Reason: ${result.reason}\n` +
            `→ Re-run the step and submit corrected evidence.`
          );
        }
      }
    }
  }
}
```

### 3.4 Per-Skill Evidence Requirements

```typescript
// src/skills/evidence-requirements.ts

export const SKILL_EVIDENCE_REQUIREMENTS = {
  ralph: {
    executing: [
      { step: 'context_loaded', description: 'Read project context and dependencies', validator: validateContextEvidence }
    ],
    verifying: [
      { step: 'tests_passed', description: 'npm test exited 0', validator: e => e.exitCode === 0 && e.command?.includes('test') },
      { step: 'build_passed', description: 'npm run build exited 0', validator: e => e.exitCode === 0 },
      { step: 'lint_clean', description: 'npm run lint exited 0', validator: e => e.exitCode === 0 },
      { step: 'types_clean', description: 'tsc --noEmit exited 0', validator: e => e.exitCode === 0 },
    ],
    completing: [
      { step: 'architect_approved', description: 'Independent architect review passed', validator: validateReviewEvidence },
      { step: 'todo_cleared', description: 'Zero pending TODO items', validator: validateTodoEvidence },
      { step: 'diff_recorded', description: 'All changes documented with diff', validator: validateDiffEvidence },
    ]
  },

  ralplan: {
    designing: [
      { step: 'context_reviewed', description: 'Context analyzed and documented', validator: validateContextEvidence }
    ],
    documenting: [
      { step: 'approaches_documented', description: '≥2 approaches with tradeoffs', validator: e => e.approachCount >= 2 },
    ],
    approving: [
      { step: 'prd_written', description: 'PRD > 500 bytes in .omk/plans/prd-*.md', validator: validatePrdEvidence },
    ],
    completed: [
      { step: 'user_approved', description: 'Explicit user approval recorded', validator: validateUserApproval },
    ]
  },

  'deep-interview': {
    clarifying: [
      { step: 'questions_asked', description: '≥3 clarifying questions', validator: e => e.questionCount >= 3 },
    ],
    completed: [
      { step: 'spec_written', description: 'Specification document written', validator: validateSpecEvidence },
    ]
  }
};
```

---

## 4. Anti-Shortcut Engine: Four Pillars

### 4.1 Pillar 1: Chain-of-Evidence (CoE)

**Principle**: *Every claim must have machine-checkable proof.*

**How it prevents shortcuts**:
- AI says "tests pass" → System checks `exitCode === 0` + `command.includes('test')`
- AI says "PRD written" → System checks file exists, size > 500 bytes, hash matches
- AI says "review complete" → System checks reviewerAgent evidence exists
- AI says "fixed" → System checks `filesModified` array is non-empty with real paths

### 4.2 Pillar 2: Mandatory Checkpoint Gates

**Principle**: *Cannot proceed to step N+1 until step N's evidence is verified.*

**Implementation**: Phase transitions are blocked by `assertStepPrerequisites()` (see §3.3).

### 4.3 Pillar 3: Honesty Contract + Claim Validation

**Principle**: *Unverified claims are rejected automatically.*

**Honesty Overlay** (injected into every active session):

```markdown
<!-- OMK:HONESTY:START — ENFORCED BY CODE -->
## Engineering Discipline Contract

You are operating under a **verifiable execution protocol**. The following rules are enforced by code:

### Rule 1: Claims Require Evidence
- "Tests pass" → You MUST have run `npm test` and submitted output with exitCode 0.
- "Build succeeds" → You MUST have run `npm run build` and submitted output with exitCode 0.
- "File created" → You MUST submit the file path and SHA-256 hash.
- "Review complete" → You MUST submit the reviewer agent's approval evidence.

### Rule 2: Unverified Claims Are Rejected
If you claim X without evidence, the system will:
1. BLOCK your phase transition
2. REQUIRE evidence submission
3. LOG the unverified claim

### Rule 3: Distinguish Verified from Assumed
- ✅ "I verified tests pass (evidence: tests_passed, exitCode 0)"
- ❌ "Tests pass" (BLOCKED without evidence)
- ✅ "I created .omk/plans/prd.md (SHA-256: abc123, size: 2.4KB)"
- ❌ "PRD is done" (BLOCKED without evidence)

### Rule 4: No Shortcuts
The following are detected and blocked:
- Skipping verification steps
- Claiming success without running commands
- Self-approving work requiring independent review
- Checking completion boxes without evidence
- Modifying files without reading them first

### Rule 5: When Uncertain, State It
- "I have not run tests yet" → ACCEPTABLE
- "Tests probably pass" → NOT ACCEPTABLE (run them)
- "I need more information" → ACCEPTABLE
- "This is done" (without evidence) → NOT ACCEPTABLE
<!-- OMK:HONESTY:END -->
```

**Honesty Validator** (`src/evidence/honesty-validator.ts`):

```typescript
function validateClaim(claim: string, evidence: Evidence[]): ValidationResult {
  // Pattern: "all tests pass"
  if (/test.*pass|pass.*test/i.test(claim)) {
    const ev = evidence.find(e => e.step === 'tests_passed');
    if (!ev) return { valid: false, reason: 'Claimed tests pass but no test evidence submitted' };
    if (ev.exitCode !== 0) return { valid: false, reason: `Tests exited with code ${ev.exitCode}` };
  }

  // Pattern: "build successful"
  if (/build.*success|success.*build/i.test(claim)) {
    const ev = evidence.find(e => e.step === 'build_passed');
    if (!ev) return { valid: false, reason: 'Claimed build success but no build evidence submitted' };
    if (ev.exitCode !== 0) return { valid: false, reason: `Build exited with code ${ev.exitCode}` };
  }

  // Pattern: "file created" / "saved to"
  const fileMatch = claim.match(/saved to|created|wrote.*?to\s+(\S+)/i);
  if (fileMatch) {
    const path = fileMatch[1];
    if (!existsSync(path)) return { valid: false, reason: `Claimed file ${path} does not exist` };
  }

  // Pattern: "reviewed by architect"
  if (/architect.*review|review.*architect/i.test(claim)) {
    const ev = evidence.find(e => e.step === 'architect_approved');
    if (!ev) return { valid: false, reason: 'Claimed architect review but no review evidence' };
    if (ev.reviewResult !== 'approved') return { valid: false, reason: `Architect review: ${ev.reviewResult}` };
  }

  return { valid: true };
}
```

### 4.4 Pillar 4: Cross-Validation Network

**Principle**: *No agent approves its own work. Critical steps require independent verification.*

```typescript
// src/validation/cross-validation.ts

const CROSS_VALIDATION_RULES = {
  'architect_output': {
    requiresReviewBy: ['critic'],
    minReviewerCount: 1,
    evidenceStep: 'architect_approved'
  },
  'implementation': {
    requiresReviewBy: ['test-engineer', 'code-reviewer'],
    minReviewerCount: 1,
    evidenceStep: 'code_reviewed'
  },
  'security_touch': {
    requiresReviewBy: ['security-reviewer'],
    minReviewerCount: 1,
    evidenceStep: 'security_approved',
    trigger: (files) => files.some(f => /auth|password|token|secret|encrypt/i.test(f))
  },
  'large_change': {
    requiresReviewBy: ['architect'],
    minReviewerCount: 1,
    evidenceStep: 'architect_approved',
    trigger: (ev) => (ev.linesAdded + ev.linesRemoved) > 100
  }
};
```

**Review Delegation Protocol**:
1. System detects cross-validation trigger
2. Writes review task to mailbox
3. Spawns review agent (`kimi --agent-file {reviewer}.toml`)
4. Original agent **blocked** until review evidence submitted

---

## 5. Reliability & Stability Architecture

### 5.1 Reliability Mechanisms

| Mechanism | Purpose | Implementation |
|-----------|---------|---------------|
| **Evidence replay** | Crash recovery | `auto-progress.ts` reads evidence dir on SessionStart |
| **State snapshots** | Rollback capability | `.omk/state/snapshots/{skill}-{phase}-{timestamp}.json` |
| **Retry with backoff** | Handle transient failures | `max_retries_per_step=3`, exponential backoff |
| **Graceful degradation** | Slot exhaustion | Queue tasks when `max_running_tasks` reached |
| **Timeout enforcement** | Prevent infinite hangs | Per-step timeout; stale detection via heartbeat |
| **Atomic state writes** | Prevent corruption | `writeAtomic` + `withFileLock` for all state operations |

### 5.2 Stability Mechanisms

| Mechanism | Purpose | Implementation |
|-----------|---------|---------------|
| **Worker isolation** | Crash containment | Separate `kimi --session` processes per worker |
| **Resource caps** | Prevent runaway | Per-agent `max_steps` in TOML; per-skill max duration |
| **Deadlock detection** | Detect circular waits | Monitor evidence timestamps; alert if stuck > timeout |
| **Fail-open hooks** | Never break Kimi | Return `{}` on error, but log warning to user |
| **Config versioning** | Safe upgrades | `.omk/config-version.json` + migration scripts |

### 5.3 Honesty Metrics (Auto-Tracked)

```typescript
// src/evidence/metrics.ts

interface EngineeringQualityReport {
  skill: string;
  sessionId: string;
  evidenceSubmissionRate: number;    // Submitted / Required
  evidenceValidationRate: number;    // Passed / Submitted
  claimAccuracy: number;             // Claims with evidence / Total claims
  unverifiedClaims: string[];        // Flagged claims
  stepsCompleted: number;
  stepsSkipped: number;
  reviewRounds: number;              // For --deliberate mode tracking
  shortcutAttempts: ShortcutAttempt[];
}
```

Written to `.omk/audit/quality-{skill}-{date}.json`.

---

## 6. Kimi-Native Parallel Execution

### 6.1 Problem
- `OMK_MOCK_TEAM=1` by default (mock-kimi.js)
- No IPC between workers
- No awareness of Kimi `max_running_tasks=4`

### 6.2 Design: Background-Task-Aware Runtime

```
OMK Leader (foreground)
    │
    ├──spawns──► Worker 1: kimi --agent-file role1.toml --session w1
    ├──spawns──► Worker 2: kimi --agent-file role2.toml --session w2
    ├──spawns──► Worker 3: kimi --agent-file role3.toml --session w3
    └──spawns──► Worker 4: kimi --agent-file role4.toml --session w4
                      │
                      └──── Mailbox (.omk/team/{id}/mailbox/) ◄────┘
```

**New Components**:
- `src/team/slot-manager.ts`: Parse `max_running_tasks` from Kimi config, enforce slot limits
- `src/team/mailbox.ts`: File-based JSONL mailbox with atomic append
- `src/team/kimi-runtime.ts`: Spawn real `kimi` processes, heartbeat monitoring, auto-restart

---

## 7. MCP Server Trinity + Auto-Registration

### 7.1 Problem
- `state-server.ts` and `memory-server.ts` exist but are NOT registered in `~/.kimi/mcp.json`
- No trace/audit server
- `handler.ts` bypasses `setActiveSkill` validation

### 7.2 Three MCP Servers

1. **`omk-state-server`** (enhance)
   - `omk_submit_evidence`
   - `omk_list_required_evidence`
   - `omk_verify_evidence`
   - `omk_assert_phase`

2. **`omk-memory-server`** (enhance)
   - `omk_memory_forget`
   - `omk_memory_summarize`
   - Project isolation via `project_id`
   - 30-day retention (down from 90)

3. **`omk-trace-server`** (new)
   - `omk_trace_log`
   - `omk_trace_query`
   - `omk_trace_summary`

**Auto-Registration**: `omk setup` reads existing `~/.kimi/mcp.json`, merges OMK servers.

---

## 8. Semantic Gate System

### 8.1 Enhanced Gates

| Gate | Rule | When Applied |
|------|------|-------------|
| `prompt_specificity` | ≥30 chars + noun phrase + action verb | Activation |
| `no_shortcut_keywords` | Blocklist: just, simply, quickly, hack, workaround, band-aid | Activation + transitions |
| `has_verification_plan` | Must mention test/verify/validate/ensure/confirm/lint/build | Activation (execution skills) |
| `has_decomposition` | Complex tasks need step markers | Activation (tasks > 100 chars) |
| `has_active_plan` | `.omk/plans/` must exist | Activation (planning skills) |
| `workflow_not_active` | No duplicate workflows | Activation |
| `flag_semantic` | `--deliberate` requires ≥2 review evidence; `--quick` ≤3 phases | Phase transitions |

---

## 9. Agent TOML Enhancement

```toml
name = "architect"
description = "..."

[model]
reasoning_effort = "high"
model = "kimi-code/kimi-for-coding"

[prompt]
system = """..."""

[tools]
read_only = true
write = false
code_execution = false
search = true
shell = false

[omk]
routing_role = "leader"
posture = "deep-worker"
can_delegate = true
max_steps = 50
requires_verification = true
```

**Fallback**: If Kimi ignores `[tools]`/`[omk]`, inject constraints via prompt overlay.

---

## 10. Implementation Phases

### Phase 0: Foundation Fixes (Week 1)
- Fix `handler.ts`: use `writeAtomic` + `withFileLock` + `setActiveSkill` (no bypass)
- Fix `handleStop`: use validated state transition
- Remove `scripts/mock-kimi.js`
- Clean ALL Codex references from skills
- New: `src/hooks/honesty-overlay.ts`
- Update `AGENTS.md`

### Phase 1: Evidence System Core (Week 2-3)
- New: `src/skills/evidence-requirements.ts`
- New: `src/state/evidence.ts`
- New: `src/evidence/honesty-validator.ts`
- New: `src/evidence/anti-pattern-detector.ts`
- New: `src/evidence/metrics.ts`
- New: `.omk/evidence/` directory in setup
- Enhance: `src/mcp/state-server.ts` (submit/list/verify evidence)
- Enhance: `src/state/workflow-transition.ts` (evidence lock)
- Update SKILL.mds with evidence instructions

### Phase 2: Semantic Gates + Anti-Patterns (Week 4)
- New: `src/skills/gate-definitions.ts`
- Enhance: `src/skills/validator.ts` (shortcut keywords, verification plan, decomposition, flag semantic)
- New: Anti-pattern detector (phantom tests, unread writes, hidden failures)
- Dynamic gate loading from parsed skills

### Phase 3: Cross-Validation + Team Runtime (Week 5-6)
- New: `src/validation/cross-validation.ts`
- New: `src/validation/review-delegator.ts`
- New: `src/team/slot-manager.ts`
- New: `src/team/mailbox.ts`
- New: `src/team/kimi-runtime.ts`
- Update: `skills/team/SKILL.md`, `skills/worker/SKILL.md`

### Phase 4: MCP Trinity + Auto-Registration (Week 7)
- New: `src/mcp/trace-server.ts`
- Enhance: `src/mcp/memory-server.ts`
- Update: `src/cli/setup.ts` (MCP auto-register)
- Update: `src/cli/doctor.ts` (MCP verify)

### Phase 5: Autopilot + Agent TOML + CLI DX (Week 8)
- New: `src/state/auto-progress.ts`
- Update: `src/hooks/handler.ts` (auto-progress)
- Update: `src/agents/definitions.ts` (extended schema)
- Update: `src/cli/setup.ts` (richer TOML)
- New: `src/cli/uninstall.ts`
- New: `src/cli/update.ts`

### Phase 6: Observability + HUD + Security (Week 9)
- Update: `src/utils/logger.ts` (universal structured logging)
- Update: `src/hud/` (event-driven, evidence panels, quality score)
- Security: hook hash verification, ReDoS guard

---

## 11. File Inventory

### New Files
```
src/skills/evidence-requirements.ts
src/state/evidence.ts
src/evidence/schema.ts
src/evidence/honesty-validator.ts
src/evidence/anti-pattern-detector.ts
src/evidence/metrics.ts
src/validation/cross-validation.ts
src/validation/review-delegator.ts
src/hooks/honesty-overlay.ts
src/team/kimi-runtime.ts
src/team/slot-manager.ts
src/team/mailbox.ts
src/mcp/trace-server.ts
src/state/auto-progress.ts
src/cli/uninstall.ts
src/cli/update.ts
src/config/migrations/
```

### Modified Files
```
src/hooks/handler.ts
src/hooks/agents-overlay.ts
src/skills/validator.ts
src/skills/parser.ts
src/state/workflow-transition.ts
src/state/manager.ts
src/mcp/state-server.ts
src/mcp/memory-server.ts
src/team/runtime.ts
src/team/state.ts
src/cli/team.ts
src/cli/setup.ts
src/cli/doctor.ts
src/cli/explore.ts
src/agents/definitions.ts
src/catalog/schema.ts
src/utils/audit.ts
src/utils/logger.ts
```

### Deleted Files
```
scripts/mock-kimi.js
```

### Skill Content Updates
```
skills/ralph/SKILL.md
skills/ralplan/SKILL.md
skills/autopilot/SKILL.md
skills/team/SKILL.md
skills/worker/SKILL.md
skills/deep-interview/SKILL.md
skills/doctor/SKILL.md
skills/hud/SKILL.md
AGENTS.md
```

---

## 12. Testing Strategy

### Anti-Shortcut Tests
1. Fake test claim → verify blocked
2. Phantom PRD → verify blocked
3. Skipped review → verify blocked
4. Shortcut language → verify gate blocks
5. Ignored `--deliberate` → verify phase blocked
6. One-line fix for complex task → verify decomposition gate blocks
7. Hidden build failure → verify honesty validator catches
8. Unread write → verify PreToolUse blocks

### Reliability Tests
1. Crash recovery → verify resumes from last evidence
2. Concurrent evidence writes → verify no corruption
3. Stale worker → verify auto-restart
4. Timeout → verify auto-fail

### Quality Metric Tests
1. Evidence submission rate > 95%
2. Claim accuracy > 90%
3. Zero unverified completion claims

---

## 13. Success Criteria

### Anti-Shortcut
- [ ] AI cannot claim "tests pass" without test output evidence
- [ ] AI cannot enter "verifying" without build/test/lint/type evidence
- [ ] AI cannot enter "completing" without review evidence
- [ ] AI cannot self-approve work requiring independent review
- [ ] `--deliberate` requires ≥2 review evidence files
- [ ] Shortcut keywords block activation or warn

### Reliability & Stability
- [ ] Session crash recovers to last valid evidence checkpoint
- [ ] 4 parallel workers submit evidence without races
- [ ] Stale workers auto-detected and restarted within 15s
- [ ] All state writes use atomic rename + file lock

### Honesty
- [ ] Evidence submission rate > 95% for multi-phase skills
- [ ] Claim accuracy > 90%
- [ ] Zero unverified completion claims in audit log

### Claude-Level Engineering
- [ ] Plan-first execution enforced (no coding before PRD evidence)
- [ ] Systematic error handling (retry + rollback + evidence)
- [ ] Defensive coding (security-reviewer + test-engineer gates)
- [ ] Test-first discipline (test evidence mandatory)
- [ ] Refactoring discipline (architect approval + diff evidence)
- [ ] Architectural awareness (context loading + dependency analysis evidence)

### General
- [ ] `omk setup` registers 3 MCP servers
- [ ] `omk doctor` passes all checks
- [ ] All 119 existing tests pass
- [ ] New module coverage > 80%
- [ ] Build passes, lint clean, prettier clean
- [ ] Zero `.codex` hardcoding
- [ ] **Code-enforcement rate: ~85%** (up from ~30%)
