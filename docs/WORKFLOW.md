# oh-my-kimi 工作流手册

> 本文档描述 OMK 项目的全部工作流：从需求到交付的完整路径、各技能的运转逻辑、状态机流转规则，以及扩展指南。

---

## 目录

- [总览](#总览)
- [核心工作流：三段式开发链](#核心工作流三段式开发链)
  - [Stage 1 — `$deep-interview` 需求访谈](#stage-1--deep-interview-需求访谈)
  - [Stage 2 — `$ralplan` 架构规划](#stage-2--ralplan-架构规划)
  - [Stage 3 — `$ralph` 持久执行](#stage-3--ralph-持久执行)
- [辅助工作流](#辅助工作流)
  - [`$analyze` 深度分析](#analyze-深度分析)
  - [`$code-review` 代码审查](#code-review-代码审查)
  - [`$build-fix` 构建修复](#build-fix-构建修复)
  - [`$plan` 轻量规划](#plan-轻量规划)
  - [`$note` 笔记记录](#note-笔记记录)
  - [`$team` 多智能体协作](#team-多智能体协作)
  - [`$cancel` 中断取消](#cancel-中断取消)
- [状态机](#状态机)
- [钩子协议](#钩子协议)
- [文件系统约定](#文件系统约定)
- [工作流扩展指南](#工作流扩展指南)

---

## 总览

OMK 以 **Kimi CLI 的 Hook 机制**为基础，在用户提示词提交时拦截 `$命令`，激活对应的 Skill 并注入结构化上下文，从而让 Kimi 遵循预定工作流自主完成任务。

```
用户输入 $command
      │
      ▼
 OMK Hook (handler.js)
      │  检测关键词
      ▼
 KeywordRegistry
      │  命中技能
      ▼
 State Manager         ←→  .omk/state/
      │  写入激活状态
      ▼
 SKILL.md 注入 Kimi 上下文
      │
      ▼
 Kimi 按工作流执行
```

---

## 核心工作流：三段式开发链

这是 OMK 的**规范开发路径**，适用于任何有一定复杂度的功能开发。

```
$deep-interview  ──▶  $ralplan  ──▶  $ralph
   [需求澄清]         [架构规划]      [执行交付]
```

---

### Stage 1 — `$deep-interview` 需求访谈

**目标**：在写任何一行代码之前，确保需求是清晰的、边界是对齐的。

**触发**：
```
$deep-interview "我想做一个用户认证系统"
```

**工作流**：

```
Phase 1: Intent Clarification（意图澄清）
  ├── 目标是什么？成功标准？
  ├── 终端用户是谁？
  └── 关键约束条件？

Phase 2: Deep Dive（深度追问）
  ├── 技术限制？现有依赖？
  ├── 不在范围内的是什么？
  └── 潜在风险？

Phase 3: Synthesis（综合输出）
  └── 输出 Context Snapshot
      保存至 .omk/context/{slug}-{timestamp}.md
```

**输出产物**：

```markdown
## Context Snapshot

**Task**: 用户认证系统
**Goal**: 支持邮箱+密码登录，含找回密码
**Scope**:
  - In: 注册、登录、找回密码
  - Out: OAuth 三方登录、多因素认证
**Constraints**: Node.js 20+，不依赖外部 Auth 服务
**Risks**: Token 安全性，暴力破解防护
**Next Steps**: $ralplan 进行架构设计
```

**状态**：
| 时机 | phase |
|------|-------|
| 启动 | `intent-first` |
| 完成 | `complete` |

**衔接**：完成后推荐直接执行 `$ralplan`。

---

### Stage 2 — `$ralplan` 架构规划

**目标**：在编码前输出一份经用户审批的 PRD，确保技术方案对齐。

**触发**：
```
$ralplan "实现已澄清的认证系统"
```

**工作流**：

```
Phase 1: Context Review（上下文回顾）
  ├── 读取 .omk/context/ 中的 Snapshot
  └── 若无 Snapshot → 建议先运行 $deep-interview

Phase 2: Architecture Design（架构设计）
  ├── 分析需求与约束
  ├── 设计技术方案
  ├── 提出 2~3 个备选方案
  └── 给出推荐方案 + 权衡说明

Phase 3: Plan Documentation（文档化）
  └── 生成 PRD，保存至 .omk/plans/prd-{slug}.md

Phase 4: Approval（用户审批）
  ├── 呈现计划，等待明确批准
  ├── 记录修改请求
  └── 标记计划为 approved
```

**PRD 模板**：

```markdown
# PRD: [功能名称]

## Overview
[简述]

## Goals
- [目标 1]

## Non-Goals
- [排除项]

## Architecture
[架构图或描述]

## Implementation Plan
1. [步骤 1]
2. [步骤 2]

## Tradeoffs Considered
- **Option A**: [优劣]
- **Option B**: [优劣]
- **Chosen**: Option A，因为 [理由]

## Risks
- [风险] - 缓解策略: [策略]

## Success Criteria
- [ ] 标准 1
- [ ] 标准 2
```

**状态**：
| 时机 | phase |
|------|-------|
| 启动 | `planning` |
| 用户批准 | `approved` |
| 用户要修改 | `revising` |
| 完成 | inactive，移交 ralph |

**衔接**：审批通过后执行 `$ralph "实现已批准的计划"`。

---

### Stage 3 — `$ralph` 持久执行

**目标**：持续迭代直到任务完成并经过验证——Ralph 永不放弃。

**触发**：
```
$ralph "实现认证系统"
# 或中断后恢复
$ralph "continue"
```

**工作流**：

```
Phase 1: Context Loading（上下文加载）
  ├── 读取 .omk/plans/ 中已批准的 PRD
  ├── 读取 .omk/context/ 中的 Snapshot
  └── 识别已完成项 vs 剩余项

Phase 2: Execution Loop（执行循环）
  while not complete:
    ├── 评估当前进度
    ├── 并发委派独立任务给子 Agent
    ├── 后台运行长耗时操作
    ├── 收集结果并验证
    └── 更新 TODO 列表

Phase 3: Verification（强制验证）
  ├── npm test        → 全部通过
  ├── npm run build   → 编译成功
  ├── tsc --noEmit    → 无类型错误
  ├── npm run lint    → 无 lint 错误
  ├── TODO list       → 零待办
  └── Architect 子 Agent 审查 → 明确批准

Phase 4: Completion（完成收尾）
  ├── 最终验证通过
  ├── 更新 state → complete
  ├── 执行 $cancel 清理状态
  └── 输出完成报告（含证据）
```

**执行原则**：

| 原则 | 说明 |
|------|------|
| 并发优先 | 独立任务同时委派，不串行等待 |
| 证据驱动 | 不说"应该能跑"，必须跑通证明 |
| 零妥协 | 完成完整任务，不缩减范围 |
| 新鲜验证 | 重新运行检查，不信任旧结果 |
| 上报阻塞 | 遇到根本性阻塞立即上报用户 |

**状态**：
| 时机 | phase |
|------|-------|
| 启动 | `executing`, iteration: 1 |
| 每次迭代 | 更新 iteration 计数 |
| 验证阶段 | `verifying` |
| 修复阶段 | `fixing` |
| 完成 | `complete`, active: false |

**完成检查清单**：
- [ ] 所有需求已满足
- [ ] 测试全部通过（新鲜运行）
- [ ] 构建成功（新鲜运行）
- [ ] 无类型错误
- [ ] 无 lint 错误
- [ ] TODO 列表清空
- [ ] Architect 子 Agent 审查通过
- [ ] 状态文件已清理

---

## 辅助工作流

### `$analyze` 深度分析

**适用场景**：调查 Bug、分析瓶颈、理解陌生代码库。

**角色**：Explorer + Debugger

```
1. 语义搜索 + 文件系统定位相关上下文
2. 追踪控制流和数据流
3. 识别模式、瓶颈或问题根因
4. 输出详细分析报告
5. 提出修复建议或架构改进方向
```

---

### `$code-review` 代码审查

**适用场景**：提交前的代码质量把关。

**角色**：Code Reviewer + Security Reviewer

```
1. 检查近期 diff 或指定代码
2. 评估：正确性 / 可读性 / 性能 / 最佳实践
3. 识别安全漏洞
4. 输出结构化审查报告（含可操作建议）
5. 提供改进代码片段示例
```

---

### `$build-fix` 构建修复

**适用场景**：编译失败、类型错误、lint 报错。

**角色**：Debugger + Executor

```
1. 运行构建命令，获取错误列表
2. 定位根因
3. 修改代码修复错误
4. 重新构建验证
5. 如仍失败，重复步骤 2~4
6. 构建通过后，输出变更摘要
```

---

### `$plan` 轻量规划

**适用场景**：不需要完整三段式流程的快速规划。

**角色**：Planner + Architect

- 快速起草任务分解
- 适合已有明确需求、只需整理执行顺序的场景

---

### `$note` 笔记记录

**适用场景**：在会话中记录重要决策、上下文、临时备忘。

- 将内容持久化到 `.omk/context/`
- 可供后续技能读取

---

### `$team` 多智能体协作

**适用场景**：任务复杂度超出单 Agent 能力，需要多角色并发工作。

**角色池**：

| 角色 | 职责 |
|------|------|
| Architect | 技术决策与系统设计 |
| Planner | 任务分解与优先级 |
| Executor | 代码实现 |
| Code Reviewer | 质量把关 |
| QA Tester | 测试覆盖 |
| Debugger | 问题定位 |
| Security Reviewer | 安全审查 |
| Writer | 文档编写 |
| Verifier | 最终验证 |
| Explorer | 代码库探索 |

---

### `$cancel` 中断取消

**适用场景**：随时优雅地中断当前工作流。

```
1. 检测 $cancel 关键词（最高优先级）
2. 保存当前进度快照
3. 将 active 置为 false
4. 输出取消确认
```

> `$cancel` 的关键词优先级高于其他所有技能，确保随时可以中断。

---

## 状态机

### 全局状态流转

```
           ┌─────────────────────────────────────┐
           │              Idle                   │
           └───────┬────────────────────────┬────┘
                   │ $deep-interview         │ $ralph / $ralplan (直接进入)
                   ▼                         ▼
           ┌───────────────┐         ┌───────────────┐
           │ deep-interview│──────▶  │    ralplan    │
           │  (澄清需求)   │         │  (架构规划)   │
           └───────────────┘         └───────┬───────┘
                   │ $cancel                  │ approved
                   ▼                          ▼
           ┌───────────────┐         ┌───────────────┐
           │   Cancelled   │◀────────│    ralph      │
           └───────────────┘ $cancel │  (持久执行)   │
                                     └───────┬───────┘
                                             │ complete
                                             ▼
                                     ┌───────────────┐
                                     │   Complete    │
                                     └───────────────┘
```

### `skill-active.json` Schema

```typescript
interface SkillState {
  skill: string;         // "deep-interview" | "ralplan" | "ralph" | ...
  active: boolean;       // true = 运行中
  phase: string;         // 各技能定义的阶段标识
  activated_at: string;  // ISO 时间戳
  updated_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  session_id?: string;
}
```

---

## 钩子协议

### 输入（Kimi → Hook）

```json
{
  "hook_event_name": "UserPromptSubmit",
  "prompt": "$ralph 修复登录 bug",
  "cwd": "/project/path",
  "session_id": "abc123"
}
```

### 输出（Hook → Kimi）

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

### 支持的 Hook 事件

| 事件 | 作用 |
|------|------|
| `UserPromptSubmit` | 检测 `$命令`，激活技能 |
| `SessionStart` | 恢复进行中的工作流，提示用户 |
| `Stop` | 拦截退出，若有未完成工作流则阻止 |

---

## 文件系统约定

```
.omk/                          # 项目本地状态根目录
├── state/
│   ├── skill-active.json      # 当前激活的技能状态
│   ├── deep-interview-state.json
│   ├── ralplan-state.json
│   └── ralph-state.json
├── plans/
│   └── prd-{slug}.md          # 经审批的 PRD 文档
└── context/
    └── {slug}-{timestamp}.md  # Context Snapshot

~/.kimi/skills/omk/            # 全局技能目录（omk setup 安装）
    handler.js                 # Hook 入口
    skills/                    # SKILL.md 文件集合
```

> `.omk/` 应加入 `.gitignore`，状态文件属于本地会话数据。

---

## 工作流扩展指南

### 添加新技能

1. 创建目录和文件：
   ```
   skills/my-skill/SKILL.md
   ```

2. 在 `SKILL.md` 中定义工作流：
   ```markdown
   ---
   name: my-skill
   description: 一句话描述
   ---
   # My Skill
   ## Workflow
   1. ...
   ```

3. 在 `src/hooks/keyword-registry.ts` 注册关键词：
   ```typescript
   registry.register({
     id: 'my-skill',
     keywords: ['$my-skill', 'my trigger phrase'],
     priority: 50,
   });
   ```

4. 编写测试并验证：
   ```bash
   npm run test:all
   ```

### 关键词优先级规则

| 优先级 | 用途 |
|--------|------|
| 100 | `$cancel`（最高，不可被覆盖）|
| 显式 `$name` | 精确命令（高于隐式匹配）|
| 50~80 | 一般技能 |
| < 50 | 低优先级隐式触发 |

---

*文档版本：v0.1.0 · 最后更新：2026-04-19*
