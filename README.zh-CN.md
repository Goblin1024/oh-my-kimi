<div align="center">
<img src="logo/omk-character-spark-initiative.jpg" width="600" alt="oh-my-kimi Logo">

# 🚀 oh-my-kimi (OMK)

<p align="center">
  <strong><a href="https://moonshotai.github.io/kimi-cli/">Kimi Code CLI</a> 的工作流编排层</strong>
</p>

<p align="center">
  为你的 Kimi CLI 会话带来结构化工作流、智能体团队和持久化执行能力
</p>

<p align="center">
  <a href="https://github.com/Goblin1024/oh-my-kimi/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/Goblin1024/oh-my-kimi/ci.yml?branch=main&label=CI&logo=github" alt="CI 状态">
  </a>
  <a href="https://www.npmjs.com/package/oh-my-kimi">
    <img src="https://img.shields.io/npm/v/oh-my-kimi.svg" alt="npm 版本">
  </a>
  <a href="https://github.com/Goblin1024/oh-my-kimi/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/oh-my-kimi.svg" alt="许可证">
  </a>
  <a href="https://github.com/Goblin1024/oh-my-kimi">
    <img src="https://img.shields.io/github/stars/Goblin1024/oh-my-kimi?style=social" alt="GitHub 星标">
  </a>
</p>

<p align="center">
  <a href="#安装">安装</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#文档">文档</a> •
  <a href="#命令">命令</a> •
  <a href="./README.md">English</a>
</p>

</div>

---

## ✨ OMK 是什么？

**oh-my-kimi** 是一个工作流编排层，它通过结构化工作流、智能状态管理和可复用技能来增强 [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/)。

它保持 Kimi 作为执行引擎，同时让开发更加便捷：

- **更强的开始** — 每次会话都以更好的上下文和指导开始
- **遵循一致的工作流** — 从需求澄清到完成，使用 `$deep-interview` → `$ralplan` → `$ralph`
- **调用标准技能** — 使用简单的 `$command` 语法调用预定义工作流
- **维护项目状态** — 在 `.omk/` 中保存计划、日志和上下文

## 🎯 功能特性

| 工作流 | 描述 | 使用场景 |
|--------|------|----------|
| `$deep-interview` | 苏格拉底式需求收集 | 需求不清晰或边界模糊时 |
| `$ralplan` | 架构规划和审批 | 需要结构化的实现计划时 |
| `$ralph` | 持久化循环执行直至完成 | 执行已批准的计划并验证 |
| `$cancel` | 停止活动工作流 | 需要中止当前工作流时 |

## 📦 安装

### 前置要求

- Node.js 20 或更高版本
- 已安装 [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/)

### 安装 OMK

```bash
npm install -g oh-my-kimi
omk setup
```

## 🚀 快速开始

```bash
# 启动 Kimi CLI
kimi

# 使用工作流命令
$deep-interview "我需要一个功能"
$ralplan "实现用户认证"
$ralph "构建已批准的系统"
```

### 标准工作流

```bash
# 1. 需求不明确时进行澄清
$deep-interview "澄清认证系统的需求"

# 2. 创建并审批实现计划
$ralplan "设计包含权衡的认证系统"

# 3. 持久化执行直至完成
$ralph "实现已批准的认证系统"
```

## 📖 文档

- [入门指南](docs/GETTING-STARTED.md) — 安装和基本使用
- [示例](docs/EXAMPLES.md) — 实际使用示例
- [架构](docs/ARCHITECTURE.md) — 技术概述
- [AGENTS.md](docs/AGENTS.md) — 项目指导系统
- [验证](VERIFICATION.md) — 测试和验证指南
- [贡献指南](CONTRIBUTING.md) — 如何参与贡献

## 🔧 命令

### CLI 命令

```bash
omk setup      # 安装 OMK 技能和钩子
omk doctor     # 检查安装健康状态
omk --version  # 显示版本
omk --help     # 显示帮助
```

### 工作流命令（在 Kimi CLI 中使用）

```
$deep-interview "..."  # 澄清意图和边界
$ralplan "..."         # 创建已批准的实现计划
$ralph "..."           # 持久化执行直至完成
$cancel                # 停止活动工作流
```

## 🏗️ 工作原理

OMK 使用 Kimi 的原生钩子系统：

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Kimi CLI   │────▶│  OMK 钩子   │────▶│   状态文件   │
│             │     │             │     │   (.omk/)    │
│  $ralph     │     │  检测       │     │              │
│  "..."      │◀────│  $命令      │◀────│  skill-      │
└─────────────┘     └─────────────┘     │  active.json │
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │    技能     │
                                        │ (SKILL.md)  │
                                        └─────────────┘
```

1. **关键字检测**: 钩子检测 `$command` 模式
2. **状态管理**: 工作流在 `.omk/state/` 中跟踪状态
3. **技能激活**: Kimi 读取相应的 SKILL.md
4. **工作流执行**: Kimi 遵循指导的工作流

## 📁 项目结构

```
.omk/
├── state/
│   └── skill-active.json    # 当前工作流状态
├── plans/
│   └── prd-*.md            # 已批准的计划
└── context/
    └── *.md                # 上下文快照
```

## ✅ 验证

运行测试套件以验证安装：

```bash
npm run test:all
```

预期输出：
- 11/11 安装检查通过
- 5/5 钩子测试通过

## 💡 使用场景

### 场景 1: 开发新功能

```bash
$deep-interview "添加暗黑模式"
$ralplan "实现暗黑模式"
$ralph "构建暗黑模式功能"
```

### 场景 2: 修复 Bug

```bash
$deep-interview "登录出现 500 错误"
$ralph "修复登录认证错误"
```

### 场景 3: 代码重构

```bash
$deep-interview "认证代码很乱难以维护"
$ralplan "重构认证模块"
$ralph "实现认证重构"
```

## 🤝 参与贡献

我们欢迎贡献！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

## 👥 团队

| 角色 | 姓名 | GitHub |
|------|------|--------|
| 创建者和负责人 | SpiritPunch | @Goblin1024 |

## 🙏 致谢

本项目受到以下优秀作品的启发和构建：

- **[oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)** by Yeachan Heo

工作流概念、状态管理模式和技能架构均改编自 oh-my-codex，并针对 Kimi Code CLI 重新设计。

## 🌐 语言

- [English](./README.md) (默认)
- [简体中文](./README.zh-CN.md)

## 📄 许可证

MIT © 哈尔滨工业大学, SpiritPunch

---

<p align="center">
  为 Kimi CLI 社区用 ❤️ 制作
</p>
