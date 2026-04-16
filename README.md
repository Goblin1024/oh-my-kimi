# oh-my-kimi (OMK)

<p align="center">
  <strong>Workflow orchestration layer for <a href="https://moonshotai.github.io/kimi-cli/">Kimi Code CLI</a></strong>
</p>

<p align="center">
  Bring structured workflows (<code>$deep-interview</code>, <code>$ralplan</code>, <code>$ralph</code>) to your Kimi CLI sessions
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#acknowledgments">Acknowledgments</a>
</p>

---

## ✨ Features

| Workflow | Description |
|----------|-------------|
| `$deep-interview` | Socratic requirements gathering |
| `$ralplan` | Architecture planning and approval |
| `$ralph` | Persistence loop to completion |
| `$cancel` | Stop active workflow |

## 📦 Installation

```bash
npm install -g oh-my-kimi
omk setup
```

### Prerequisites

- Node.js 20 or higher
- [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/) installed

## 🚀 Quick Start

```bash
# Launch Kimi CLI
kimi

# Use workflow commands
$deep-interview "I need a feature"
$ralplan "implement authentication"
$ralph "build the approved system"
```

## 📖 Documentation

- [Getting Started](docs/GETTING-STARTED.md) - Installation and basic usage
- [Examples](docs/EXAMPLES.md) - Real-world usage examples
- [Architecture](docs/ARCHITECTURE.md) - Technical overview
- [Verification](VERIFICATION.md) - Testing and verification guide

## 🔧 Commands

```bash
omk setup      # Install OMK skills and hooks
omk doctor     # Check installation health
omk --version  # Show version
omk --help     # Show help
```

## ✅ Verification

Run the test suite to verify installation:

```bash
npm run test:all
```

Expected output:
- 11/11 installation checks passing
- 5/5 hook tests passing

## 🏗️ How It Works

OMK uses Kimi's native hooks system:

1. **Keyword Detection**: Hooks detect `$command` patterns
2. **State Management**: Workflows track state in `.omk/state/`
3. **Skill Activation**: Kimi reads corresponding SKILL.md
4. **Workflow Execution**: Kimi follows guided workflow

## 📁 Project Structure

```
.omk/
├── state/
│   └── skill-active.json    # Current workflow state
├── plans/
│   └── prd-*.md            # Approved plans
└── context/
    └── *.md                # Context snapshots
```

## 🤝 Acknowledgments

This project is inspired by and built upon the excellent work of:

- **[oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)** by Yeachan Heo

The workflow concepts, state management patterns, and skill architecture are adapted from oh-my-codex, reimagined for Kimi Code CLI.

## 👨‍💻 Author

**哈尔滨工业大学** - **SpiritPunch**

## 📄 License

MIT © 哈尔滨工业大学, SpiritPunch
