<div align="center">

# 🚀 oh-my-kimi (OMK)

<p align="center">
  <strong>Workflow orchestration layer for <a href="https://moonshotai.github.io/kimi-cli/">Kimi Code CLI</a></strong>
</p>

<p align="center">
  Bring structured workflows, agent teams, and persistent execution to your Kimi CLI sessions
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/oh-my-kimi">
    <img src="https://img.shields.io/npm/v/oh-my-kimi.svg" alt="npm version">
  </a>
  <a href="https://github.com/Goblin1024/oh-my-kimi/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/oh-my-kimi.svg" alt="license">
  </a>
  <a href="https://github.com/Goblin1024/oh-my-kimi">
    <img src="https://img.shields.io/github/stars/Goblin1024/oh-my-kimi?style=social" alt="GitHub stars">
  </a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#commands">Commands</a> •
  <a href="./README.zh-CN.md">中文</a>
</p>

</div>

---

## ✨ What is OMK?

**oh-my-kimi** is a workflow orchestration layer that enhances [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/) with structured workflows, intelligent state management, and reusable skills.

It keeps Kimi as the execution engine and makes it easier to:

- **Start stronger** — Begin every session with better context and guidance
- **Follow consistent workflows** — From clarification to completion with `$deep-interview` → `$ralplan` → `$ralph`
- **Invoke canonical skills** — Use predefined workflows with simple `$command` syntax
- **Maintain project state** — Keep plans, logs, and context in `.omk/`

## 🎯 Features

| Workflow | Description | Use When |
|----------|-------------|----------|
| `$deep-interview` | Socratic requirements gathering | Requirements are unclear or boundaries are vague |
| `$ralplan` | Architecture planning and approval | You need a structured implementation plan |
| `$ralph` | Persistence loop to completion | Executing approved plans with verification |
| `$cancel` | Stop active workflow | Need to abort current workflow |

## 📦 Installation

### Prerequisites

- Node.js 20 or higher
- [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/) installed

### Install OMK

```bash
npm install -g oh-my-kimi
omk setup
```

### Self-Check & Quality Assurance

OMK includes built-in code quality tools:

```bash
npm run check      # Full self-check: format + lint + build + test
npm run format     # Auto-format code with Prettier
npm run lint       # Lint with ESLint
npm run build      # Compile TypeScript
npm run test:all   # Run tests
```

## 🚀 Quick Start

```bash
# Launch Kimi CLI
kimi

# Use workflow commands
$deep-interview "I need a feature"
$ralplan "implement authentication"
$ralph "build the approved system"
```

### The Canonical Workflow

```bash
# 1. Clarify requirements when unclear
$deep-interview "clarify the authentication requirements"

# 2. Create and approve implementation plan
$ralplan "design the auth system with tradeoffs"

# 3. Execute with persistence
$ralph "implement the approved auth system"
```

## 📖 Documentation

- [Getting Started](docs/GETTING-STARTED.md) — Installation and basic usage
- [Examples](docs/EXAMPLES.md) — Real-world usage examples
- [Architecture](docs/ARCHITECTURE.md) — Technical overview
- [AGENTS.md](docs/AGENTS.md) — Project guidance system
- [Verification](VERIFICATION.md) — Testing and verification guide
- [Contributing](CONTRIBUTING.md) — How to contribute

## 🔧 Commands

### CLI Commands

```bash
omk setup      # Install OMK skills and hooks
omk doctor     # Check installation health
omk --version  # Show version
omk --help     # Show help
```

### Workflow Commands (in Kimi CLI)

```
$deep-interview "..."  # Clarify intent and boundaries
$ralplan "..."         # Create approved implementation plan
$ralph "..."           # Persistent execution to completion
$cancel                # Stop active workflow
```

## 🏗️ How It Works

OMK uses Kimi's native hooks system:

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Kimi CLI   │────▶│  OMK Hooks  │────▶│  State Files │
│             │     │             │     │   (.omk/)    │
│  $ralph     │     │  Detects    │     │              │
│  "..."      │◀────│  $commands  │◀────│  skill-      │
└─────────────┘     └─────────────┘     │  active.json │
                                        │              │
                                        ▼              │
                                 ┌─────────────┐       │
                                 │   Skills    │       │
                                 │ (SKILL.md)  │       │
                                 └─────────────┘       │
                                                └──────┘
```

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

## ✅ Verification

Run the test suite to verify installation:

```bash
npm run test:all
```

Expected output:
- 11/11 installation checks passing
- 5/5 hook tests passing

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 👥 Team

| Role | Name | GitHub |
|------|------|--------|
| Creator & Lead | SpiritPunch | @Goblin1024 |

## 🙏 Acknowledgments

This project is inspired by and built upon the excellent work of:

- **[oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)** by Yeachan Heo

The workflow concepts, state management patterns, and skill architecture are adapted from oh-my-codex, reimagined for Kimi Code CLI.

## 🌐 Translations

- [English](./README.md) (default)
- [简体中文](./README.zh-CN.md)

## 📄 License

MIT © SpiritPunch

---

<p align="center">
  Made with ❤️ for the Kimi CLI community
</p>
