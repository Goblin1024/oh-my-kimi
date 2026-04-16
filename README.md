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

## Verification

### Run All Tests

```bash
npm run test:all
```

### Individual Checks

```bash
# Verify installation
npm run verify

# Test hook handler
npm run test:hook

# Check installation health
omk doctor
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run setup locally
npm run setup
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

## Verification Checklist

After installation, verify:

- [ ] `omk setup` completes with 7/7 steps passing
- [ ] `omk doctor` shows all checks passing
- [ ] `npm run verify` shows 11/11 checks passing
- [ ] `npm run test:hook` shows 5/5 tests passing
- [ ] Hook handler returns valid JSON
- [ ] State files created in `.omk/state/`

See [VERIFICATION.md](VERIFICATION.md) for detailed testing guide.

## License

MIT
