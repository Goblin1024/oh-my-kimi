# Project Log (Project Fingerprint)

This file acts as the project's unique fingerprint and a continuous log of improvements and changes made to ensure quality, stability, and cognitive tracking.

## Identified Defects and Shortcomings (Date: 2026-04-17)

1. **Missing Linter**: The `package.json` has a placeholder for `lint` but no actual linter (e.g., ESLint) is configured.
2. **Missing Formatter**: The `package.json` has a placeholder for `format` but no formatter (e.g., Prettier) is configured.
3. **Missing Dependency**: The `clean` script uses `rimraf` which is not installed as a dependency.
4. **Lack of Unit Testing Framework**: There are custom scripts for testing (`verify-setup.js`, `test-hook.js`), but no standard unit test framework (like Vitest or Jest) is established.
5. **No Consolidated Self-Check**: The project lacks a single command to perform a comprehensive self-check (lint, format, type-check, test).

## Improvement Plan

1. **Establish Project Log**: Create `PROJECT_LOG.md` (this file) to record all future actions.
2. **Add Linter & Formatter**: Install ESLint and Prettier, configure them, and update `package.json` scripts.
3. **Fix Dependencies**: Install `rimraf` to make the `clean` script functional.
4. **Introduce Self-Check Mechanism**: Add a `check` script in `package.json` that aggregates building, linting, formatting check, and existing tests.
5. **Log Every Step**: Forcefully write every completed improvement step into this `PROJECT_LOG.md`.

---

## Change Log

### [2026-04-17] Step 1: Initialize Project Log
- **Action**: Created `PROJECT_LOG.md`.
- **Reason**: To act as a project fingerprint and track all subsequent improvements.

### [2026-04-17] Step 3: Implement Project Self-Check & Setup Tools
- **Action**: Configured Prettier (`.prettierrc`) and ESLint (`eslint.config.js`), and updated `package.json` scripts (`lint`, `format`, `check`).
- **Reason**: To introduce standard linting, formatting, and a single `check` command to catch defects and verify project integrity automatically.

### [2026-04-17] Step 3: Implement Project Self-Check & Setup Tools

- **Action**: Configured Prettier and ESLint, updated package.json scripts.

- **Reason**: To introduce standard linting, formatting, and a single check command.

### [2026-04-17] Step 4: Finalize Self-Check and Verification

- **Action**: Ran `npm run check` successfully. It verified formatting, linting, compilation, and executed the hook tests.

- **Reason**: To prove the newly introduced self-check mechanism catches errors, fixes formatting, and keeps the project healthy. Project fingerprint is now established and active.

### [2026-04-17] Step 5: Upload to GitHub

- **Action**: Pushed the current state of the project to the master branch of Goblin1024/oh-my-kimi.git.

- **Reason**: To deliver the improvements and ensure the project fingerprint is synchronized with the remote repository.

### [2026-04-20] Investigation: omk setup vs omk doctor Path Mismatch

- **Observation**: After running `npm install -g oh-my-kimi` and `omk setup`, `omk doctor` reported:
  - `[!!] Prompts: prompts directory not found`
  - `[!!] Skills: 1 skills (expected >= 22)`
- **Root Cause Analysis**:
  1. The globally installed npm package (`wang-h/oh-my-kimi`, v0.11.15) has a systematic path inconsistency:
     - `omk setup` installs assets to `~/.kimi/` (using `PRIMARY_PROVIDER_HOME_DIRNAME = ".kimi"`).
     - `omk doctor` checks `~/.codex/` (hard-coded legacy path in `resolveDoctorPaths`).
  2. In `project` scope the mismatch is between `./.kimi/` (setup) and `./.codex/` (doctor).
  3. In `user` scope the mismatch is between `~/.kimi/` (setup) and `~/.codex/` (doctor via `legacyCodexHome()`).
  3. The current repository (`Goblin1024/oh-my-kimi`, v0.5.0) does **not** contain this bug because its `src/cli/doctor.ts` lacks the scope logic entirely.
- **Executed Workaround (Plan A)**:
  1. Removed `C:\Users\23755\.omk\setup-scope.json` to clear persisted `project` scope.
  2. Ran `omk setup --scope user` (assets confirmed in `~/.kimi/`).
  3. Set environment variable `CODEX_HOME=C:\Users\23755\.kimi` so `omk doctor` resolves the legacy path to the same `~/.kimi` directory.
  4. Verified: `omk doctor` now passes with 9 OK, 3 warnings, 0 failures.
- **Recommended Fix for Upstream**:
  - Unify `doctor.js` path resolution to use `providerHome()` / `PRIMARY_PROVIDER_HOME_DIRNAME` instead of `legacyCodexHome()` / hard-coded `.codex`.

---

## Milestone Tracker: v0.5.0 → v1.0.0

### [2026-04-21] Milestone 1: Evidence System Closed Loop ✅
- **Goal**: Enforce machine-checkable evidence before phase transitions
- **Deliverables**:
  - `src/state/evidence.ts` — Evidence persistence with atomic writes
  - `src/state/workflow-transition.ts` — `TransitionBlockedError`, evidence lock via `assertStepPrerequisites()`
  - `src/mcp/state-server.ts` — 8 tools including 4 evidence tools
  - `src/cli/setup.ts` — Auto-registers 3 MCP servers to `~/.kimi/mcp.json`
  - `src/hooks/handler.ts` — SessionStart injects honesty overlay; Stop bypasses evidence lock
- **Tests**: 144 tests passing

### [2026-04-21] Milestone 2: Token Efficiency System ✅
- **Goal**: Optimize token usage with budgets, routing, pruning, and semantic gates
- **Deliverables**:
  - `src/token/budget.ts` — `TokenBudget` with thresholds + flag multipliers
  - `src/token/router.ts` — Complexity assessment → low/medium/high routing
  - `src/token/pruner.ts` — Evidence compression, token estimation
  - `src/token/audit.ts` — `SessionAuditor` unifying budget + route + pruning
  - `src/token/persistence.ts` — Token state snapshots for HUD
  - `src/skills/gate-definitions.ts` — 4 semantic gates (all non-blocking)
  - `src/agents/toml-generator.ts` + `definitions.ts` — 27 agents with budgets/steps/tools
  - `src/hud/index.ts` + `render.ts` — Token budget panel
- **Tests**: 222 tests passing

### [2026-04-21] Milestone 3: Cross-Validation + Team Runtime ✅
- **Goal**: Independent agent review and Kimi-native multi-agent execution
- **Deliverables**:
  - `src/validation/cross-validation.ts` — 4 cross-validation rules with trigger evaluation
  - `src/validation/review-delegator.ts` — `ReviewDelegator` for managing pending reviews
  - `src/team/slot-manager.ts` — Parses `max_running_tasks` from Kimi config, `SlotManager`
  - `src/team/mailbox.ts` — File-based JSONL mailbox for inter-worker communication
  - `src/team/kimi-runtime.ts` — `KimiRuntime` spawning real `kimi` processes with heartbeat
- **Tests**: 271 tests passing, 105 suites, 0 failures
- **Fixes applied**:
  - ESM compatibility in mailbox tests
  - Windows path assertions
  - Async cleanup race condition in kimi-runtime tests
  - `hasBlockingValidations` empty-evidence test semantics

### [2026-04-21] Milestone 4: Final Integration & Release Prep ✅
- **Goal**: Document, version-bump, and release v1.0.0
- **Actions Completed**:
  - Updated `CHANGELOG.md` with M1-M3 detailed release notes
  - Updated `PROJECT_LOG.md` with milestone tracker (this section)
  - Bumped `package.json` version: `0.5.0` → `1.0.0`
  - Updated `README.md` + `README.zh-CN.md` with new architecture features (Evidence Engine, Token Efficiency, Cross-Validation, Team Runtime, 27 Agents)
  - Fixed 11 ESLint unused-var errors across 9 files (0 errors, 4 `any` warnings remaining)
  - Ran `npm run check` successfully:
    - Format: ✅ Pass
    - Lint: ✅ Pass (0 errors)
    - Build: ✅ Pass
    - Tests: ✅ 271 pass, 105 suites, 0 fail
- **Status**: v1.0.0 release ready
