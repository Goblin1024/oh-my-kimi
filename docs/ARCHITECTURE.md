# OMK Architecture

Technical overview of oh-my-kimi.

## System Overview

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────┐
│   Kimi CLI      │────▶│  OMK Hooks  │────▶│  State Files │
│                 │     │             │     │  (.omk/)     │
│  User types:    │     │  Detects    │     │              │
│  $ralph "..."   │     │  $commands  │     │  skill-      │
│                 │◀────│             │◀────│  active.json │
└─────────────────┘     └─────────────┘     └──────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  Skills     │
                        │  (SKILL.md) │
                        └─────────────┘
```

## Components

### 1. CLI (`src/cli/`)

**Purpose**: User-facing commands

**Files**:
- `index.ts` - Command router
- `setup.ts` - Installation
- `doctor.ts` - Health checks

**Commands**:
- `omk setup` - Install OMK
- `omk doctor` - Check health

### 2. Hooks (`src/hooks/`)

**Purpose**: Process Kimi lifecycle events

**Events**:
- `UserPromptSubmit` - Detect $commands
- `SessionStart` - Resume workflows
- `Stop` - Block incomplete work

**Output**: JSON with `hookSpecificOutput`

### 3. State (`src/state/`)

**Purpose**: Persist workflow state

**Files**:
- `paths.ts` - File path utilities
- `manager.ts` - Read/write operations

**Structure**:
```
.omk/
├── state/
│   ├── skill-active.json
│   ├── deep-interview-state.json
│   ├── ralplan-state.json
│   └── ralph-state.json
├── plans/
│   └── prd-*.md
└── context/
    └── *.md
```

### 4. Skills (`skills/`)

**Purpose**: Guide Kimi through workflows

**Each skill**:
- `SKILL.md` - Workflow definition
- Activation trigger
- State management rules

## Data Flow

### Activation Flow

```
1. User types: $deep-interview "idea"
   ↓
2. Kimi calls hook with UserPromptSubmit event
   ↓
3. Hook detects "$deep-interview"
   ↓
4. Hook writes state:
   {
     "skill": "deep-interview",
     "active": true,
     "phase": "starting"
   }
   ↓
5. Hook returns JSON to Kimi
   ↓
6. Kimi reads skill SKILL.md
   ↓
7. Kimi follows workflow
```

### State Transitions

```
Idle → deep-interview → ralplan → ralph → Complete
         ↓                ↓          ↓
       Cancel           Cancel     Cancel
```

## Hook Protocol

### Input (from Kimi)

```json
{
  "hook_event_name": "UserPromptSubmit",
  "prompt": "$ralph fix bug",
  "cwd": "/project/path",
  "session_id": "abc123"
}
```

### Output (to Kimi)

```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "skill": "ralph",
    "activated": true,
    "message": "OMK: ralph workflow activated"
  }
}
```

## State Schema

### skill-active.json

```typescript
interface SkillState {
  skill: string;           // "deep-interview" | "ralplan" | "ralph" | "cancel"
  active: boolean;         // true when running
  phase: string;          // "starting" | "executing" | "verifying" | "complete"
  activated_at: string;   // ISO timestamp
  updated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  session_id?: string;
}
```

## Kimi Integration

### Hooks Configuration

Added to `~/.kimi/config.toml`:

```toml
[[hooks]]
event = "UserPromptSubmit"
command = "node ~/.kimi/skills/omk/handler.js"
matcher = "\\$[a-z-]+"
```

### Skill Discovery

Kimi automatically discovers skills in:
- `~/.kimi/skills/`
- `.kimi/skills/`

## Security

- Hooks only read/write to `.omk/` directory
- No network access in hooks
- State files are local only
- Skills are read-only markdown

## Extensibility

### Adding New Skills

1. Create `skills/new-skill/SKILL.md`
2. Add keyword to `handler.ts`
3. Define state transitions
4. Test with `test-hook.js`

### Custom Hooks

Modify `~/.kimi/config.toml`:

```toml
[[hooks]]
event = "PostToolUse"
command = "node ~/.kimi/skills/omk/custom-hook.js"
matcher = "WriteFile"
```

## Testing

### Hook Testing

```bash
node scripts/test-hook.js
```

### Verification

```bash
npm run verify
```

### Manual Testing

```bash
echo '{"hook_event_name":"UserPromptSubmit","prompt":"$ralph test","cwd":"."}' | node ~/.kimi/skills/omk/handler.js
```

## Performance

- Hook execution: < 100ms
- State file I/O: < 10ms
- No background processes
- Minimal memory footprint

## Limitations

- Requires Node.js 20+
- Kimi CLI must be installed
- State is local (no cloud sync)
- No built-in team coordination (use Kimi's Agent tool)

---

## Acknowledgments

This architecture is inspired by [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) by Yeachan Heo.
The workflow patterns, state management concepts, and hook-based integration are adapted from the original project.
