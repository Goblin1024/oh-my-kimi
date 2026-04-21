---
name: ecomode
description: Token-efficient execution modifier with budget-aware routing
trigger: $ecomode
flags:
  - name: --eco
    description: Aggressive cost optimization (25% budget)
  - name: --quick
    description: Fast execution with reduced depth (50% budget)
  - name: --strict
    description: Block non-essential tool use (read/search only)
phases:
  - starting
  - routing
  - executing
  - verifying
  - completing
gates:
  - type: prompt_specificity
    description: Prompt must reference a specific task or feature
    blocking: true
  - type: flag_semantic_check
    description: Flags should match task complexity
    blocking: false
  - type: no_shortcut_keywords
    description: Avoid minimising language that leads to shallow solutions
    blocking: false
---

# Ecomode Skill

**Token-efficient execution modifier.** This is a **MODIFIER**, not a standalone execution mode.

Ecomode integrates with the OMK Token Efficiency System to minimize token consumption while maintaining output quality.

## What Ecomode Does

1. **Budget-aware routing**: Automatically routes tasks to the lowest viable agent tier
2. **Context pruning**: Compresses large evidence outputs when approaching budget limits
3. **Tool restriction**: Limits agent tool access to essential operations only
4. **Token audit**: Reports efficiency scores and optimization recommendations

## Budget Tiers

| Flag | Budget Multiplier | Use Case |
|------|-------------------|----------|
| (none) | 100% | Standard execution |
| `--quick` | 50% | Fast turnaround, reduced depth |
| `--eco` | 25% | Maximum cost optimization |

## Routing Rules

Ecomode uses the OMK `routeTask()` system to select the optimal agent configuration:

| Task Signal | Route | reasoning_effort | maxTokens | Tools |
|-------------|-------|------------------|-----------|-------|
| `review`/`explain`/`find` | LOW | low | 8K | read, search |
| `implement`/`refactor`/`test` | MEDIUM | medium | 32K | all |
| `design`/`architect`/`migrate` | HIGH | high | 128K | all |

**ALWAYS prefer lower tiers. Only escalate when the task genuinely requires it.**

## Execution Flow

```
starting ──► routing ──► executing ──► verifying ──► completing
                │            │            │
                ▼            ▼            ▼
          routeTask()   trackBudget()  pruneContext()
          selectAgent   consume tokens reclaim tokens
```

## Evidence Requirements

### routing phase
- `budget_calculated` — Token budget computed with flag multipliers
- `route_selected` — Agent config chosen via complexity assessment

### executing phase
- `context_pruned` — Large evidence compressed if >70% budget used
- `tools_restricted` — Non-essential tools blocked (with `--strict`)

### verifying phase
- `tests_passed` — npm test exited 0 (if code changes)
- `budget_report` — Efficiency score ≥ 60 (faster + more remaining = better)

### completing phase
- `audit_report` — Full token audit with recommendations

## Combining Ecomode with Other Modes

| Combination | Effect |
|-------------|--------|
| `eco ralph` | Ralph loop with cost-optimized agents |
| `eco ultrawork` | Parallel execution with budget caps |
| `eco autopilot` | Full autonomous with token monitoring |

## State Management

Use `omk_write_state` MCP tools for ecomode lifecycle state.

- **On activation**:
  `omk_write_state({skill: "ecomode", phase: "starting", active: true})`
- **On deactivation/completion**:
  `omk_write_state({skill: "ecomode", phase: "completing", active: false})`
- **On cancellation**:
  Run `$cancel` to clear active state

## Token Savings Tips

1. **Batch similar tasks** to one agent instead of spawning many
2. **Use LOW-tier routing** for file discovery and simple changes
3. **Enable `--strict`** to block write/execute tools for read-only analysis
4. **Prune evidence** when context exceeds 70% of budget
5. **Prefer `--eco`** over `--quick` for truly simple tasks
