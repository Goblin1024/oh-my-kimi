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

### 2. Use Workflow Commands

#### Deep Interview - Clarify Requirements

```
$deep-interview "I want to build a todo app"
```

Kimi will ask clarifying questions and create a context snapshot.

#### Ralplan - Create Implementation Plan

```
$ralplan "implement user authentication"
```

Kimi will design architecture and create a PRD.

#### Ralph - Execute with Persistence

```
$ralph "build the approved auth system"
```

Kimi will execute until complete with verification.

#### Cancel - Stop Workflow

```
$cancel
```

Stops the active workflow.

## Workflow Examples

### Example 1: New Feature

```
$deep-interview "Add dark mode to the app"
$ralplan "implement dark mode"
$ralph "build the dark mode feature"
```

### Example 2: Bug Fix

```
$deep-interview "Fix the login bug"
$ralph "fix login authentication bug"
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
