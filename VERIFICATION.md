# OMK Verification Checklist

This document describes how to verify that oh-my-kimi is working correctly.

## Automated Verification

### 1. Setup Verification

```bash
node scripts/verify-setup.js
```

Expected output:
- 11 checks passed
- 0 checks failed
- "✅ All checks passed! OMK is ready to use."

### 2. Hook Handler Testing

```bash
node scripts/test-hook.js
```

Expected output:
- 5 tests completed
- All JSON outputs are valid
- Skills correctly detected:
  - `$deep-interview` → skill: "deep-interview"
  - `$ralph` → skill: "ralph"
  - `$cancel` → skill: "cancel"

### 3. Doctor Check

```bash
node bin/omk.js doctor
```

Expected output:
- ✓ Kimi CLI
- ✓ OMK Skills Directory
- ✓ All skills (deep-interview, ralplan, ralph, cancel)
- ✓ Kimi Hooks

## Manual Verification

### 1. Setup Command

```bash
node bin/omk.js setup
```

Verify:
- All 7 steps show "✓ Success"
- Final verification shows "3/3 checks passed"
- No error messages

### 2. Check Installed Files

```bash
ls ~/.kimi/skills/omk/
```

Should contain:
- handler.js
- session-start.js
- stop.js
- deep-interview/SKILL.md
- ralplan/SKILL.md
- ralph/SKILL.md
- cancel/SKILL.md

### 3. Check Kimi Config

```bash
cat ~/.kimi/config.toml | grep -A 3 "hooks"
```

Should contain:
```toml
[[hooks]]
event = "UserPromptSubmit"
command = "node ~/.kimi/skills/omk/handler.js"
matcher = "\\$[a-z-]+"
```

### 4. State File Creation

After running test-hook.js:

```bash
ls .omk/state/
```

Should contain:
- skill-active.json
- deep-interview-state.json (created by test)
- ralph-state.json (created by test, then cancelled)

### 5. State File Content

```bash
cat .omk/state/skill-active.json
```

Should show:
```json
{
  "skill": "ralph",
  "active": false,
  "phase": "cancelled",
  ...
}
```

## End-to-End Test in Kimi CLI

1. Launch Kimi CLI:
   ```bash
   kimi
   ```

2. Test deep-interview:
   ```
   $deep-interview "I want to build a todo app"
   ```
   Expected: Kimi starts asking clarifying questions

3. Check state was created:
   ```bash
   cat .omk/state/deep-interview-state.json
   ```

4. Cancel workflow:
   ```
   $cancel
   ```
   Expected: "Cancelled deep-interview workflow"

## Troubleshooting

### Hook handler not found

```bash
# Re-run setup
node bin/omk.js setup

# Verify handler exists
ls ~/.kimi/skills/omk/handler.js
```

### Skills not detected

```bash
# Check skills directory
ls ~/.kimi/skills/omk/

# Re-run setup
node bin/omk.js setup
```

### Hooks not triggering

```bash
# Check Kimi config
cat ~/.kimi/config.toml

# Look for [[hooks]] sections
# Should have UserPromptSubmit, SessionStart, Stop
```

## Verification Summary

✅ **Setup**: 7/7 steps passing
✅ **Files**: All hooks and skills installed
✅ **Config**: Kimi config updated
✅ **Hooks**: Handler returns valid JSON
✅ **State**: Files created correctly
✅ **Integration**: Ready for Kimi CLI

## Continuous Verification

Add to package.json scripts:

```json
{
  "scripts": {
    "verify": "node scripts/verify-setup.js",
    "test:hook": "node scripts/test-hook.js",
    "test:all": "npm run verify && npm run test:hook"
  }
}
```

Run before each release:
```bash
npm run test:all
```
