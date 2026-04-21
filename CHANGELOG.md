# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-04-21

### Fixed
- **CI**: Fixed `ENOTEMPTY` error on Windows CI during `kimi-runtime` test cleanup — added async `afterEach` delay and `rmSync` retry options (`src/team/__tests__/kimi-runtime.test.ts`)
- **CI**: Increased mock process wait time in `kimi-runtime` test to prevent `onExit` timeout on Windows Node 22 runner
- **Merge conflict**: Restored `AgentDefinition` fields (`tokenBudget`, `maxSteps`, `allowedTools`) lost during `feat/v1.0-evidence-engine` → `master` merge (`src/agents/definitions.ts`)

## [1.0.0] - 2026-04-21

### Added

#### Evidence-Based Workflow Engine (M1)
- **Evidence persistence** with atomic writes (`src/state/evidence.ts`)
- **Evidence-locked phase transitions** — `TransitionBlockedError` blocks phase advance without required evidence (`src/state/workflow-transition.ts`)
- **MCP State Server** with 8 tools including 4 evidence tools:
  - `omk_submit_evidence` — machine-checkable evidence submission
  - `omk_list_required_evidence` — list missing evidence for current phase
  - `omk_verify_evidence` — verify evidence integrity
  - `omk_assert_phase` — validate phase transitions with evidence gate
- **Auto-registration** of 3 MCP servers to `~/.kimi/mcp.json` (`src/cli/setup.ts`)
- **Hook integration** — `SessionStart` injects honesty overlay; `Stop` bypasses evidence lock via direct `writeState`
- **Evidence schema** — 5 evidence types: `command_output`, `file_artifact`, `review_signature`, `diff_record`, `context_record`

#### Token Efficiency System (M2)
- **TokenBudget tracker** with warning/critical/exceeded thresholds (`src/token/budget.ts`)
  - Flag multipliers: `--eco` (25%), `--quick` (50%), `--deliberate` (400%)
- **Complexity router** — assesses prompt complexity and routes to low/medium/high configs (`src/token/router.ts`)
- **Evidence pruner** — compresses evidence >5KB, token estimation (~4 chars/token), pruning recommendations (`src/token/pruner.ts`)
- **SessionAuditor** — unifies budget + route + pruning; reclaims tokens after prune (`src/token/audit.ts`)
- **Token state persistence** — snapshot save/load/clear for HUD display (`src/token/persistence.ts`)
- **4 semantic gates** (all non-blocking warnings):
  - `no_shortcut_keywords` — detects "just", "simply", "quickly", "hack"
  - `has_verification_plan` — requires test/verify/validate keywords
  - `proper_decomposition` — complex tasks need step markers
  - `flag_semantic_check` — warns on mismatched flags (e.g. `--deliberate` on simple tasks)
- **Agent TOML generator** — batch generates Kimi Agent TOML from `AgentDefinition` with OMK metadata comments (`src/agents/toml-generator.ts`)
- **27 agent definitions** with token budgets, max steps, and allowed tool restrictions (`src/agents/definitions.ts`)
- **Token budget HUD panel** — progress bars, remaining tokens, efficiency score (`src/hud/index.ts`, `src/hud/render.ts`)

#### Cross-Validation + Team Runtime (M3)
- **Cross-validation rules** requiring independent agent review (`src/validation/cross-validation.ts`):
  - `architect_output` — requires critic review
  - `implementation` — requires test-engineer or code-reviewer
  - `security_touch` — triggers on auth/password/token/secret/encrypt files
  - `large_change` — triggers on >100 line changes
- **Review delegator** — manages pending reviews, finds reviewers, checks completion (`src/validation/review-delegator.ts`)
- **Slot manager** — parses `max_running_tasks` from `~/.kimi/config.toml` (default 4), enforces concurrency limit (`src/team/slot-manager.ts`)
- **File-based JSONL mailbox** — atomic append inter-worker communication (`src/team/mailbox.ts`)
  - `appendMessage`, `readMessages`, `readUndeliveredFor`, `markDelivered`, `sendTextMessage`
- **KimiRuntime** — spawns real `kimi` child processes with heartbeat monitoring and auto-restart (max 3 restarts) (`src/team/kimi-runtime.ts`)

#### Testing
- Test suite grew from **144** (M1) → **222** (M2) → **271** (M3) tests across 105 suites
- All new modules have dedicated test coverage

### Changed
- **Skills updated** with concrete evidence requirements (e.g. `ralph` requires `tests_passed`, `ralplan` requires `prd_written`)
- **Skills** (`skills/ecomode/SKILL.md`) rewritten with phases, flags, gates, and evidence requirements

### Fixed
- ESM compatibility in test files (removed `require()` usage)
- Windows path separator assertions in mailbox tests
- Async cleanup race condition in kimi-runtime tests

## [0.1.0] - 2026-04-16

### Added
- Initial release of oh-my-kimi (OMK) - Workflow orchestration for Kimi Code CLI
- CLI commands: `setup`, `doctor`, `--version`, `--help`
- Core workflow skills:
  - `$deep-interview` - Socratic requirements gathering through structured questioning
  - `$ralplan` - Architecture planning and approval with PRD generation
  - `$ralph` - Persistence loop to completion with verification
  - `$cancel` - Stop active workflow gracefully
- Kimi hooks integration:
  - `UserPromptSubmit` - Detect workflow commands
  - `SessionStart` - Resume active workflows
  - `Stop` - Block incomplete work
- State management system in `.omk/state/`
- Comprehensive verification scripts
- Documentation: Getting Started, Examples, Architecture guides
- MIT License

### Security
- Hooks only read/write to `.omk/` directory
- No network access in hooks
- State files are local only

[Unreleased]: https://github.com/Goblin1024/oh-my-kimi/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/Goblin1024/oh-my-kimi/releases/tag/v1.0.1
[1.0.0]: https://github.com/Goblin1024/oh-my-kimi/releases/tag/v1.0.0
[0.1.0]: https://github.com/Goblin1024/oh-my-kimi/releases/tag/v0.1.0
