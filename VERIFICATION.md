# Verification Guide - oh-my-kimi

This guide describes how to verify that oh-my-kimi (OMK) is installed and working correctly.

## üöÄ Quick Verification

Run all tests with one command:

```bash
npm run test:all
```

Expected output:
```
‚ú?All verification checks passed
‚ú?All hook tests passed
```

## üìã Detailed Verification Steps

### 1. Automated Verification

#### Setup Verification

```bash
node scripts/verify-setup.js
```

**Expected output:**
- 11 checks passed
- 0 checks failed
- "‚ú?All checks passed! OMK is ready to use."

#### Hook Handler Testing

```bash
node scripts/test-hook.js
```

**Expected output:**
- 5 tests completed
- All JSON outputs are valid
- Skills correctly detected:
  - `$deep-interview` ‚Ü?skill: "deep-interview"
  - `$ralph` ‚Ü?skill: "ralph"
  - `$cancel` ‚Ü?skill: "cancel"

#### Doctor Check

```bash
omk doctor
```

**Expected output:**
```
üîç Running OMK Doctor...

Installation Status:
  ‚ú?Kimi CLI
  ‚ú?OMK Skills Directory
  ‚ú?Skills (deep-interview, ralplan, ralph, cancel)
  ‚ú?Kimi Hooks

OMK State:
  ‚ú?State directory exists
  ‚ú?Plans directory exists
  ‚ú?Context directory exists

‚ú?All checks passed!
```

### 2. Manual Verification

#### Setup Command

```bash
omk setup
```

**Verify:**
- All 7 steps show "‚ú?Success"
- Final verification shows "3/3 checks passed"
- No error messages

#### Check Installed Files

**macOS/Linux:**
```bash
ls ~/.kimi/skills/omk/
```

**Windows:**
```powershell
Get-ChildItem $env:USERPROFILE\.kimi\skills\omk\
```

**Should contain:**
- `handler.js` - Main hook handler
- `session-start.js` - Session start hook
- `stop.js` - Stop hook
- `deep-interview/SKILL.md`
- `ralplan/SKILL.md`
- `ralph/SKILL.md`
- `cancel/SKILL.md`

#### Check Kimi Config

**macOS/Linux:**
```bash
cat ~/.kimi/config.toml | grep -A 3 "hooks"
```

**Windows:**
```powershell
Get-Content $env:USERPROFILE\.kimi\config.toml | Select-String -Pattern "hooks" -Context 0,3
```

**Should contain:**
```toml
[[hooks]]
event = "UserPromptSubmit"
command = "node ~/.kimi/skills/omk/handler.js"
matcher = "\\$[a-z-]+"
```

### 3. State File Verification

After running test-hook.js:

```bash
ls .omk/state/
```

**Should contain:**
- `skill-active.json` - Current workflow state
- `deep-interview-state.json` - Deep interview progress
- `ralph-state.json` - Ralph execution state

Check state file content:

```bash
cat .omk/state/skill-active.json
```

**Should show valid JSON:**
```json
{
  "skill": "cancel",
  "active": false,
  "phase": "cancelled",
  "activated_at": "2026-04-16T...",
  "updated_at": "2026-04-16T..."
}
```

### 4. End-to-End Test in Kimi CLI

1. **Launch Kimi CLI:**
   ```bash
   kimi
   ```

2. **Test deep-interview:**
   ```
   $deep-interview "I want to build a todo app"
   ```
   **Expected:** Kimi starts asking clarifying questions

3. **Check state was created:**
   ```bash
   cat .omk/state/deep-interview-state.json
   ```

4. **Cancel workflow:**
   ```
   $cancel
   ```
   **Expected:** Workflow is cancelled, state updated

5. **Test ralplan:**
   ```
   $ralplan "design a simple todo app"
   ```
   **Expected:** Kimi creates a PRD document

## üîß Troubleshooting

### Hook Handler Not Found

```bash
# Re-run setup
omk setup

# Verify handler exists
ls ~/.kimi/skills/omk/handler.js
```

### Skills Not Detected

```bash
# Check skills directory
ls ~/.kimi/skills/omk/

# Re-run setup
omk setup
```

### Hooks Not Triggering

```bash
# Check Kimi config
cat ~/.kimi/config.toml

# Look for [[hooks]] sections
# Should have UserPromptSubmit, SessionStart, Stop
```

### State Files Not Created

```bash
# Check state directory exists
mkdir -p .omk/state

# Check permissions
ls -la .omk/
```

### Invalid JSON Output

```bash
# Test hook directly
echo '{"hook_event_name":"UserPromptSubmit","prompt":"$ralph test","cwd":"."}' | node ~/.kimi/skills/omk/handler.js

# Validate JSON output
echo '{"hook_event_name":"UserPromptSubmit","prompt":"$ralph test","cwd":"."}' | node ~/.kimi/skills/omk/handler.js | python3 -m json.tool
```

## ‚ú?Verification Checklist

Before considering OMK fully verified:

- [ ] **Setup**: All 7/7 steps passing
- [ ] **Files**: All hooks and skills installed
- [ ] **Config**: Kimi config updated with hooks
- [ ] **Hooks**: Handler returns valid JSON
- [ ] **State**: Files created correctly in `.omk/`
- [ ] **Integration**: Commands work in Kimi CLI
- [ ] **Cancellation**: `$cancel` works correctly

## üîÑ Continuous Verification

Add to your workflow:

```bash
# Before commits
npm run verify

# Before releases
npm run test:all
```

### CI/CD Integration

See `.github/workflows/ci.yml` for automated testing configuration.

## üìä Expected Performance

| Operation | Expected Time |
|-----------|---------------|
| Hook execution | < 100ms |
| State file I/O | < 10ms |
| Full verification | < 5s |
| Complete test suite | < 10s |

## üêõ Reporting Issues

If verification fails:

1. Check the [Troubleshooting](#troubleshooting) section
2. Run `omk doctor` for diagnostics
3. Open an issue with:
   - Your OS and Node.js version
   - Output of `omk doctor`
   - Error messages (if any)
   - Steps to reproduce

---

For more help, see [README.md](README.md) or open an issue on GitHub.
