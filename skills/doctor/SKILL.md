---
name: doctor
description: Diagnose and fix oh-my-kimi installation issues
---

# Doctor Skill

Note: All `~/.kimi/...` paths in this guide respect `KIMI_HOME` when that environment variable is set.

## Canonical skill root

OMX installs skills to `${KIMI_HOME:-~/.codex}/skills/` â€?this is the path current Codex CLI natively loads as its skill root.

`~/.agents/skills/` is a **historical legacy path** from an older Codex CLI release, before Codex settled on `~/.codex` as its home directory. Current Codex CLI and OMX no longer write there.

**In a mixed OMX + plain Codex environment:**
- **Use**: `${KIMI_HOME:-~/.codex}/skills/` (user scope) or `.kimi/skills/` (project scope)
- **Clean up if present**: `~/.agents/skills/` â€?if this still exists alongside the canonical root, Codex's Enable/Disable Skills UI will show duplicate entries for any skill present in both trees
- **Interop rule**: OMX writes only to the canonical path; archive or remove `~/.agents/skills/` once you have confirmed `${KIMI_HOME:-~/.codex}/skills/` is your active root

## Task: Run Installation Diagnostics

You are the OMX Doctor - diagnose and fix installation issues.

### Step 1: Check Plugin Version

```bash
# Get installed version
INSTALLED=$(ls ~/.kimi/plugins/cache/omc/oh-my-kimi/ 2>/dev/null | sort -V | tail -1)
echo "Installed: $INSTALLED"

# Get latest from npm
LATEST=$(npm view oh-my-kimi version 2>/dev/null)
echo "Latest: $LATEST"
```

**Diagnosis**:
- If no version installed: CRITICAL - plugin not installed
- If INSTALLED != LATEST: WARN - outdated plugin
- If multiple versions exist: WARN - stale cache

### Step 2: Check Hook Configuration (config.toml + legacy settings.json)

Check `~/.kimi/config.toml` first (current Codex config), then check legacy `~/.kimi/settings.json` only if it exists.

Look for hook entries pointing to removed scripts like:
- `bash $HOME/.kimi/hooks/keyword-detector.sh`
- `bash $HOME/.kimi/hooks/persistent-mode.sh`
- `bash $HOME/.kimi/hooks/session-start.sh`

**Diagnosis**:
- If found: CRITICAL - legacy hooks causing duplicates

### Step 3: Check for Legacy Bash Hook Scripts

```bash
ls -la ~/.kimi/hooks/*.sh 2>/dev/null
```

**Diagnosis**:
- If `keyword-detector.sh`, `persistent-mode.sh`, `session-start.sh`, or `stop-continuation.sh` exist: WARN - legacy scripts (can cause confusion)

### Step 4: Check AGENTS.md

```bash
# Check if AGENTS.md exists
ls -la ~/.kimi/AGENTS.md 2>/dev/null

# Check for OMX marker
grep -q "oh-my-kimi Multi-Agent System" ~/.kimi/AGENTS.md 2>/dev/null && echo "Has OMX config" || echo "Missing OMX config"
```

**Diagnosis**:
- If missing: CRITICAL - AGENTS.md not configured
- If missing OMX marker: WARN - outdated AGENTS.md

### Step 5: Check for Stale Plugin Cache

```bash
# Count versions in cache
ls ~/.kimi/plugins/cache/omc/oh-my-kimi/ 2>/dev/null | wc -l
```

**Diagnosis**:
- If > 1 version: WARN - multiple cached versions (cleanup recommended)

### Step 6: Check for Legacy Curl-Installed Content

Check for legacy agents, commands, and historical legacy skill roots from older installs/migrations:

```bash
# Check for legacy agents directory
ls -la ~/.kimi/agents/ 2>/dev/null

# Check for legacy commands directory
ls -la ~/.kimi/commands/ 2>/dev/null

# Check canonical current skills directory
ls -la ${KIMI_HOME:-~/.codex}/skills/ 2>/dev/null

# Check historical legacy skill directory
ls -la ~/.agents/skills/ 2>/dev/null
```

**Diagnosis**:
- If `~/.kimi/agents/` exists with oh-my-kimi-related files: WARN - legacy agents (now provided by plugin)
- If `~/.kimi/commands/` exists with oh-my-kimi-related files: WARN - legacy commands (now provided by plugin)
- If `${KIMI_HOME:-~/.codex}/skills/` exists with OMX skills: OK - canonical current user skill root
- If `~/.agents/skills/` exists: WARN - historical legacy skill root that can overlap with `${KIMI_HOME:-~/.codex}/skills/` and cause duplicate Enable/Disable Skills entries

Look for files like:
- `architect.md`, `researcher.md`, `explore.md`, `executor.md`, etc. in agents/
- `ultrawork.md`, `deepsearch.md`, etc. in commands/
- Any oh-my-kimi-related `.md` files in skills/

---

## Report Format

After running all checks, output a report:

```
## OMX Doctor Report

### Summary
[HEALTHY / ISSUES FOUND]

### Checks

| Check | Status | Details |
|-------|--------|---------|
| Plugin Version | OK/WARN/CRITICAL | ... |
| Hook Config (config.toml / legacy settings.json) | OK/CRITICAL | ... |
| Legacy Scripts (~/.kimi/hooks/) | OK/WARN | ... |
| AGENTS.md | OK/WARN/CRITICAL | ... |
| Plugin Cache | OK/WARN | ... |
| Legacy Agents (~/.kimi/agents/) | OK/WARN | ... |
| Legacy Commands (~/.kimi/commands/) | OK/WARN | ... |
| Skills (${KIMI_HOME:-~/.codex}/skills) | OK/WARN | ... |
| Legacy Skill Root (~/.agents/skills) | OK/WARN | ... |

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommended Fixes
[List fixes based on issues]
```

---

## Auto-Fix (if user confirms)

If issues found, ask user: "Would you like me to fix these issues automatically?"

If yes, apply fixes:

### Fix: Legacy Hooks in legacy settings.json
If `~/.kimi/settings.json` exists, remove the legacy `"hooks"` section (keep other settings intact).

### Fix: Legacy Bash Scripts
```bash
rm -f ~/.kimi/hooks/keyword-detector.sh
rm -f ~/.kimi/hooks/persistent-mode.sh
rm -f ~/.kimi/hooks/session-start.sh
rm -f ~/.kimi/hooks/stop-continuation.sh
```

### Fix: Outdated Plugin
```bash
rm -rf ~/.kimi/plugins/cache/omc/oh-my-kimi
echo "Plugin cache cleared. Restart Codex CLI to fetch latest version."
```

### Fix: Stale Cache (multiple versions)
```bash
# Keep only latest version
cd ~/.kimi/plugins/cache/omc/oh-my-kimi/
ls | sort -V | head -n -1 | xargs rm -rf
```

### Fix: Missing/Outdated AGENTS.md
Fetch latest from GitHub and write to `~/.kimi/AGENTS.md`:
```
WebFetch(url: "https://raw.githubusercontent.com/Yeachan-Heo/oh-my-kimi/main/docs/AGENTS.md", prompt: "Return the complete raw markdown content exactly as-is")
```

### Fix: Legacy Curl-Installed Content

Remove legacy agents/commands plus the historical `~/.agents/skills` tree if it overlaps with the canonical `${KIMI_HOME:-~/.codex}/skills` install:

```bash
# Backup first (optional - ask user)
# mv ~/.kimi/agents ~/.kimi/agents.bak
# mv ~/.kimi/commands ~/.kimi/commands.bak
# mv ~/.agents/skills ~/.agents/skills.bak

# Or remove directly
rm -rf ~/.kimi/agents
rm -rf ~/.kimi/commands
rm -rf ~/.agents/skills
```

**Note**: Only remove if these contain oh-my-kimi-related files. If user has custom agents/commands/skills, warn them and ask before removing.

---

## Post-Fix

After applying fixes, inform user:
> Fixes applied. **Restart Codex CLI** for changes to take effect.
