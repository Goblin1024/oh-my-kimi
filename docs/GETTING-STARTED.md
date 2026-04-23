<div align="center">
<img src="../logo/omk-character-spark-initiative.jpg" width="400" alt="oh-my-kimi Logo">
</div>

# Getting Started with oh-my-kimi

Quick start guide for oh-my-kimi (OMK) workflow orchestration.

## Installation

### Prerequisites

- Node.js 20 or higher
- Kimi Code CLI installed

### Install OMK

```bash
npm install -g oh-my-kimi-cli
```

### Setup

```bash
omk setup
```

This will:
1. Install OMK skills to `~/.kimi/skills/omk/`
2. Configure hooks in `~/.kimi/config.toml`
3. Verify installation

### Verify Installation

```bash
omk doctor
```

## Basic Usage

### 1. Launch Kimi CLI

```bash
kimi
```

### 2. Natural Language (Recommended)

Simply describe what you need. OMK's Smart Auto-Orchestrator will detect your intent and activate the appropriate workflow:

#### Requirement Gathering

```
"I want to build a todo app with categories and reminders"
```

OMK detects: **requirement-gathering** → Activates `$deep-interview`

Kimi will ask clarifying questions and create a context snapshot.

#### Architecture Design

```
"Design the database schema and API for a user authentication system"
```

OMK detects: **architecture-design** → Activates `$ralplan`

Kimi will design architecture and create a PRD.

#### Implementation

```
"Build the approved authentication system with JWT tokens and bcrypt"
```

OMK detects: **implementation** → Activates `$ralph`

Kimi will execute until complete with verification.

#### Complex Tasks (Auto Team Mode)

```
"Build a full-stack e-commerce app with React frontend, Node.js backend, and PostgreSQL database"
```

OMK detects: **implementation** + high complexity → Activates `$team` mode with multiple agents

#### Bug Fix

```
"Fix the login bug where users can't authenticate with special characters in passwords"
```

OMK detects: **debugging** → Activates `$ralph`

#### Code Review

```
"Review the authentication module for security vulnerabilities"
```

OMK detects: **review** → Activates `$code-review` + `$security-review`

### 3. Explicit Commands (Optional)

For precise control, you can still use explicit skill commands:

```
$deep-interview "I want to build a todo app"
$ralplan "implement user authentication"
$ralph "build the approved auth system"
$cancel                    # Stop active workflow
```

## Workflow Examples

### Example 1: New Feature (Natural Language)

```
"Add dark mode to the app with system preference detection and toggle"
```

OMK auto-detects → `$deep-interview` → `$ralplan` → `$ralph`

### Example 2: Bug Fix (Natural Language)

```
"Fix the login bug where authentication fails for users with special characters"
```

OMK auto-detects → `$ralph` (debugging mode)

### Example 3: Full Project (Natural Language)

```
"Build a complete URL shortener service with REST API, React dashboard, and analytics"
```

OMK auto-detects → `$team` mode with 4 parallel agents

### Example 4: Explicit Pipeline

```
$deep-interview "Add dark mode to the app"
$ralplan "implement dark mode"
$ralph "build the dark mode feature"
```

## Understanding State

OMK tracks workflow state in `.omk/state/`:

- `skill-active.json` - Currently active workflow
- `deep-interview-state.json` - Interview progress
- `ralplan-state.json` - Planning state
- `ralph-state.json` - Execution iterations

## Best Practices

1. **Always clarify before planning**
2. **Verify before completing**
3. **Use `$cancel` if stuck**
4. **Review state files**

## Troubleshooting

### Command not recognized

```bash
omk setup
```

### Hook not triggering

```bash
node scripts/test-hook.js
```

## Next Steps

- Try the examples
- Read the Skills documentation
- Check Architecture guide
