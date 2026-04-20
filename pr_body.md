## Summary

This PR brings OMK from a "glue layer" to a production-grade workflow orchestration engine with **code-level enforcement**, **concurrent-safe state management**, and **structured observability**.

---

## What's New

### 1. Concurrent-Safe State Management
- src/state/atomic.ts - writeAtomic() (temp+rename) + withFileLock() (spin-lock with stale detection)
- src/team/state.ts - updateWorkerState() now serializes concurrent worker exit events

### 2. Skill Manifest Parser & Code-Enforced Validation
- src/skills/parser.ts - Parses YAML frontmatter from SKILL.md at runtime (name, trigger, flags, phases, gates)
- src/skills/validator.ts - Code-enforced gates: prompt_specificity, has_active_plan, workflow_not_active, custom
- src/hooks/keyword-registry.ts - Dynamically discovers skills from bundled skills/ directory

### 3. Per-Skill Workflow State Machine
- src/state/workflow-transition.ts - Supports per-skill custom phases loaded from manifests, with linear transition graph enforcement

### 4. Team Runtime with Worker Logging
- src/team/runtime.ts - Worker stdout/stderr piped to .omk/logs/team/latest/{workerId}.log
- src/cli/team-logs.ts - New omk team logs [workerId] command

### 5. BM25 Semantic Memory
- src/utils/bm25.ts - Pure-JS BM25 implementation for ranked relevance search
- src/mcp/memory-server.ts - Memory query now uses BM25 scoring + 90-day retention cleanup

### 6. Event-Driven HUD
- src/hud/index.ts - Uses s.watch with 100ms debounce instead of 2s polling
- Adds **Team Status** panel alongside Workflow Status

### 7. Structured Observability
- src/utils/logger.ts - Structured logs to .omk/logs/system.log
- src/utils/audit.ts - Hook execution audit (JSONL, daily rotation, 5MB cap)
- src/hooks/handler.ts - Every invocation records event, skill, duration, success/failure

### 8. CLI Lifecycle Management
- src/cli/uninstall.ts - Safely removes hooks and skills
- src/cli/update.ts - Checks npm registry for newer versions
- src/cli/doctor.ts - Dynamic skill scan + handler SHA-256 integrity verification
- src/cli/setup.ts - Dynamic skill discovery + integrity hash (version + SHA-256)
- src/cli/explore.ts - Uses git ls-files respecting .gitignore + ReDoS protection

---

## Test Results

122 tests passing across 50 suites. New suites: parser, validator, atomic, BM25.

---

## Architecture Limitation (Documented)

This PR enforces rules at the **activation gate** (~30% of SKILL.md rules). The remaining ~70% (workflow step order, artifact verification, quality gates during execution) still rely on LLM self-discipline due to Kimi CLI's free-form Agent architecture.

See the linked issue for a deep-dive audit and proposed "evidence-based workflow engine" roadmap.

---

## Checklist

- [x] 
pm run build passes
- [x] 
pm run test:all passes (122/122)
- [x] README updated with new features
- [x] New files have appropriate tests