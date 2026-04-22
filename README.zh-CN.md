<div align="center">
<img src="logo/logo.png" width="600" alt="oh-my-kimi Logo">

# 🚀 oh-my-kimi (OMK)

<p align="center">
  <strong><a href="https://moonshotai.github.io/kimi-cli/">Kimi Code CLI</a> 的工作流编排层</strong>
</p>

<p align="center">
  将 Kimi Code CLI 从对话式助手升级为结构化工程平台
</p>

<p align="center">
  <a href="https://github.com/Goblin1024/oh-my-kimi/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/Goblin1024/oh-my-kimi/ci.yml?branch=master&label=CI&logo=github" alt="CI 状态">
  </a>
  <a href="https://www.npmjs.com/package/oh-my-kimi-cli">
    <img src="https://img.shields.io/npm/v/oh-my-kimi-cli.svg" alt="npm 版本">
  </a>
  <a href="https://github.com/Goblin1024/oh-my-kimi/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/oh-my-kimi-cli.svg" alt="许可证">
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

## 🎯 问题所在

[Kimi Code CLI](https://moonshotai.github.io/kimi-cli/) 是一个强大的**通用执行引擎**。它能读代码、执行 Shell 命令、生成子代理、自主规划任务。但当你用它做真正的软件开发时，很快就会遇到阻力：

| 痛点 | 发生了什么 |
|------|-----------|
| **没有结构化流程** | 直接跳到编码，需求没澄清、架构没设计。后期重构成本是初期的 3 倍。 |
| **会话失忆** | 每次启动 `kimi` 都从零开始。昨天审批通过的计划、修到一半的 Bug，全部丢失。 |
| **仅靠提示词自律** | Skill 只是 markdown 文件。AI 应该"自觉遵守"——但往往不遵守。 |
| **虚假完成** | Agent 说"测试通过了"，但实际上根本没运行。会话结束后才发现构建损坏。 |
| **Token 黑盒消耗** | 不知道一次任务花了多少 Token，没有预算护栏，也无法优化。 |
| **没有质量门控** | 写代码的 Agent 同时审批代码。涉及安全的修改无人审查。 |
| **并行混乱** | `Agent()` 能生成工作者，但没有槽位管理、没有工作者间通信、没有统一监控。 |

**OMK 解决了所有这些问题**——不是靠更好的提示词，而是靠一个**代码级工作流引擎**，坐落在你和 Kimi 之间。

---

## ✨ OMK 为 Kimi CLI 带来了什么

| 维度 | 只用 Kimi CLI | **Kimi CLI + OMK** |
|------|--------------|-------------------|
| **开发流程** | 随意对话 | `$deep-interview` → `$ralplan` → `$ralph` 结构化流水线 |
| **状态持久化** | 退出即遗忘 | `.omk/state/` 原子状态；`$ralph "continue"` 断点续传 |
| **约束执行** | "请遵循 Skill"（提示词层面） | 代码级 Gate 在 Kimi 启动前拦截非法激活 |
| **完成验证** | Agent 自行声明"完成" | 需要证据：测试输出、构建日志、Lint 结果、架构师签字 |
| **Token 控制** | 黑盒消耗 | 按技能预算、复杂度路由、实时 HUD 追踪 |
| **质量保证** | 无审查机制 | 交叉验证网络：架构师→评论家、实现→审查员、认证→安全员 |
| **并行执行** | 原始 `Agent()` 调用 | 团队运行时：槽位限制、邮箱通信、心跳监控 |
| **可观测性** | 盲等输出 | 实时 HUD 仪表盘：工作流阶段、工作者状态、Token 消耗速率 |
| **长期记忆** | 无 | 通过 MemPalace 桥接实现 BM25 语义搜索 |
| **智能体角色** | 需手动配置 | 28 种预定义角色，各带 Token 预算、工具限制和步数限制 |

> **一句话总结：** OMK 不替换 Kimi。它将 Kimi 从**会写代码的聊天机器人**升级为**有流程、有证据、有监督的软件工程团队。**

---

## 📦 安装

### 前置要求

- Node.js 20 或更高版本
- 已安装 [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/)

### 安装 OMK

```bash
npm install -g oh-my-kimi-cli
omk setup
```

---

## 🚀 快速开始

```bash
# 启动 Kimi CLI
kimi
```

然后运行三段式流水线：

```bash
# 阶段 1：通过苏格拉底式提问澄清需求
$deep-interview "我想构建一个安全的认证系统"

# 阶段 2：设计架构并获得用户审批
$ralplan "起草认证系统的实现计划"

# 阶段 3：持久化执行直至完全验证
$ralph "实现已批准的计划"
```

---

## 🛠️ 内置技能

| 命令 | 描述 | 最佳使用场景 |
| :--- | :--- | :--- |
| 🕵️‍♂️ `$deep-interview` | 苏格拉底式需求收集 | 需求不清晰或边界需要澄清时 |
| 📐 `$ralplan` | 架构规划与审批 | 编码前需要坚实、经过审查的计划时 |
| 🏃‍♂️ `$ralph` | 持久化循环执行直至完成 | 编写代码、测试并依据计划验证时 |
| 👥 `$team` | 并行多智能体执行 | 任务可拆分为独立子任务时 |
| 🛑 `$cancel` | 优雅中止工作流 | 需要停止当前智能体流程时 |

---

## 🏗️ 核心系统

### 1. 工作流编排

OMK 提供**代码强制的开发流水线**，引导 Kimi 经历与人类团队相同的阶段：

- **`$deep-interview`** — 在编写任何代码前锁定目标、范围、约束和风险
- **`$ralplan`** — 生成架构 PRD，在用户明确批准前阻止执行
- **`$ralph`** — 迭代直至完成，在每个关卡要求机器可验证的证据

状态转换由 `assertValidTransition()` 验证。你不能从 "planning" 直接跳到 "complete" 而不经过验证。

### 2. Gate 与 Flag 验证

Skill 在 YAML frontmatter 中声明约束。OMK 在代码中强制执行，**在 Kimi 收到提示词之前**：

```yaml
gates:
  - type: prompt_specificity      # 拦截模糊提示词
    blocking: true
  - type: has_active_plan         # 无已批准 PRD 时拦截 $ralph
    blocking: true
  - type: no_shortcut_keywords    # 警告 "just"、"simply"、"quickly"
    blocking: false
```

Flag 如 `--deliberate` 或 `--eco` 根据清单验证。未知 Flag 会被拒绝并返回有帮助的错误信息。

### 3. 证据驱动验证

> *"任务在完成验证证明之前不算完成。"*

`$ralph` 在标记完成前需要五类证据：

| 证据类型 | 示例 |
|----------|------|
| `command_output` | `npm test` 退出码 0 |
| `file_artifact` | 生成的源文件 |
| `review_signature` | 架构师子代理审批 |
| `diff_record` | 增删行数 |
| `context_record` | 决策依据 |

如果缺少所需证据，阶段转换会抛出 `TransitionBlockedError`。不再有"应该能跑"——证明它能跑。

### 4. Token 效率系统

按技能会话跟踪、预算和优化 Token 使用：

- **按技能预算**：`deep-interview` 16K，`ralph` 32K，`autopilot` 128K
- **Flag 倍率**：`--eco` 0.25×，`--quick` 0.5×，`--deliberate` 4×
- **复杂度路由**：低复杂度任务（审查、搜索）使用低成本配置；架构工作使用前沿模型
- **证据修剪器**：压缩超过 5KB 的证据以回收 Token
- **HUD 面板**：实时进度条、剩余 Token、效率评分

### 5. 交叉验证网络

> *任何智能体不能批准自己的工作。*

| 规则 | 触发条件 | 要求审查者 |
|------|----------|-----------|
| `architect_output` | 任何架构决策 | `critic` |
| `implementation` | 代码变更 | `test-engineer` 或 `code-reviewer` |
| `security_touch` | 文件路径匹配 `/auth\|password\|token\|secret/` | `security-reviewer` |
| `large_change` | 增删行数 >100 | `architect` |

### 6. 团队运行时

用 `$team N` 启动 N 个并行 Kimi 工作者：

- **Slot 管理器** — 遵守 `~/.kimi/config.toml` 中的 `max_running_tasks`
- **邮箱** — 基于文件的 JSONL 工作者间通信
- **KimiRuntime** — 生成真实 `kimi` 进程，带心跳检测和自动重启（最多 3 次）
- **日志隔离** — 每个工作者写入 `.omk/logs/team/latest/w{N}.log`

### 7. 语义记忆与 HUD

- **BM25 记忆桥接** — 与 MemPalace 集成，实现项目历史的排序语义搜索（未安装时优雅降级）
- **事件驱动 HUD** — `omk hud` 打开实时终端仪表盘，使用 `fs.watch`（100ms 防抖）。实时监控工作流阶段、团队工作者状态和 Token 消耗速率。

### 8. 智能体生态

28 种预定义智能体角色，各带校准的 Token 预算、推理力度和工具限制配置：

| 角色 | 预算 | 工具 | 用途 |
|------|------|------|------|
| `architect` | 128K | 全部 | 系统设计、长期权衡 |
| `executor` | 64K | 读/搜/编/写/执行 | 代码实现 |
| `security-reviewer` | 64K | 读/搜/执行 | 漏洞审计 |
| `style-reviewer` | 8K | 仅读 | 格式与命名规范 |

TOML 配置自动生成，带 `# omk:` 元数据注释，兼容原生 Kimi Agent。

---

## ⚙️ 工作原理

OMK 通过 Kimi 的原生钩子系统集成：

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Kimi CLI   │────▶│ OMK 钩子    │────▶│   状态文件   │
│             │     │ 处理器      │     │   (.omk/)    │
│  $ralph     │     │             │     │              │
│  "..."      │◀────│ 检测 $命令  │◀────│  skill-      │
└─────────────┘     └──────┬──────┘     │  active.json │
                           │            └──────────────┘
                           ▼
                    ┌─────────────┐
                    │  Gate 验证  │
                    │  通过？     │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        ┌──────────┐              ┌──────────┐
        │  拦截    │              │ SKILL.md │
        │ 返回错误 │              │ 注入上下文│
        └──────────┘              └────┬─────┘
                                       │
                                       ▼
                                  ┌──────────┐
                                  │ 交叉验证 │
                                  │ 质量门控 │
                                  └────┬─────┘
                                       │
                                       ▼
                                  ┌──────────┐
                                  │ 证据提交 │
                                  │ MCP 工具 │
                                  └──────────┘
```

1. **钩子拦截** — Kimi `UserPromptSubmit` 事件触发 OMK 处理器
2. **Gate 强制执行** — 代码验证 Flag、提示词特异性和工作流前置条件
3. **状态跟踪** — 原子文件写入保证并发安全的状态持久化
4. **技能注入** — 匹配的 `SKILL.md` 清单加载到 Kimi 上下文
5. **自主执行** — Kimi 遵循结构化工作流，通过 MCP 工具提交证据
6. **交叉验证** — 关键输出在验收前由独立智能体角色审查

---

## 🔧 命令

### CLI 命令

```bash
omk setup              # 安装技能、配置钩子、注册 MCP 服务器
omk doctor             # 健康检查 + 版本完整性 + 处理器 SHA-256 校验
omk update             # 检查 npm  registry 是否有新版本
omk uninstall          # 安全移除钩子（备份 config.toml）和技能
omk hud                # 实时终端仪表盘
omk explore "auth"     # 尊重 .gitignore 的代码库搜索
omk team 3:executor "task"   # 启动 3 个并行工作者
omk mcp state          # 启动状态 MCP 服务器
omk mcp memory         # 启动记忆 MCP 服务器
```

### 工作流命令（在 Kimi CLI 中使用）

```bash
$deep-interview "..."  # 澄清意图和边界
$ralplan "..."         # 创建已批准的实现计划
$ralph "..."           # 持久化执行直至完成
$team "..."            # 并行多智能体执行
$cancel                # 停止活动工作流
```

---

## 📖 文档

- [入门指南](docs/GETTING-STARTED.md) — 安装和基本使用
- [示例](docs/EXAMPLES.md) — 实际使用示例
- [架构深入](docs/ARCHITECTURE.md) — 技术概述
- [工作流手册](docs/WORKFLOW.md) — 完整工作流说明
- [智能体系统](docs/AGENTS.md) — 项目指导系统
- [验证与测试](VERIFICATION.md) — 测试和验证指南
- [贡献指南](CONTRIBUTING.md) — 如何参与贡献

---

## 🤝 参与贡献

我们欢迎贡献！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解指南。

运行本地测试套件：`npm run test:all`

## 👥 团队

| 角色 | 姓名 | GitHub |
|------|------|--------|
| 创建者和负责人 | SpiritPunch | [@Goblin1024](https://github.com/Goblin1024) |

## 🙏 致谢

本项目受到以下优秀作品的启发和构建：

- **[oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)** by Yeachan Heo
- **[oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)** (OMC) — 面向 Claude Code 的开创性多智能体编排层

工作流概念、状态管理模式和技能架构均改编自 oh-my-codex，并针对 Kimi Code CLI 重新设计。此外，本项目的架构和设计理念也深受 oh-my-claudecode (OMC) 的启发，感谢 OMC 项目在智能体工作流编排领域的开创性探索。

## 📄 许可证

MIT © SpiritPunch

---

<p align="center">
  为 Kimi CLI 社区用 ❤️ 制作
</p>
