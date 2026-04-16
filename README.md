# oh-my-kimi (OMK)

Workflow orchestration layer for [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/).

Bring structured workflows (`$deep-interview`, `$ralplan`, `$ralph`) to your Kimi CLI sessions.

## Installation

```bash
npm install -g oh-my-kimi
omk setup
```

## Quick Start

```bash
# Launch Kimi CLI
kimi

# Use workflow commands
$deep-interview "I need a feature"
$ralplan "implement authentication"
$ralph "build the approved system"
```

## Workflow Commands

| Command | Description |
|---------|-------------|
| `$deep-interview` | Socratic requirements gathering |
| `$ralplan` | Architecture planning and approval |
| `$ralph` | Persistence loop to completion |
| `$cancel` | Stop active workflow |

## How It Works

OMK uses Kimi's native hooks system:

1. **Keyword Detection**: Hooks detect `$command` patterns
2. **State Management**: Workflows track state in `.omk/state/`
3. **Skill Activation**: Kimi reads corresponding SKILL.md
4. **Workflow Execution**: Kimi follows guided workflow

## Project Structure

```
.omk/
├── state/
│   └── skill-active.json    # Current workflow state
├── plans/
│   └── prd-*.md            # Approved plans
└── context/
    └── *.md                # Context snapshots
```

## Requirements

- Node.js 20+
- Kimi Code CLI installed

## Commands

```bash
omk setup      # Install OMK skills and hooks
omk doctor     # Check installation
omk --version  # Show version
omk --help     # Show help
```

## License

MIT
