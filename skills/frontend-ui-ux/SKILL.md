---
name: frontend-ui-ux
description: Designer-developer for UI/UX work
---

# Frontend UI/UX Command

Routes to the designer agent or Gemini MCP for frontend work.

## Usage

```
/frontend-ui-ux <design task>
```

## Routing

### Preferred: MCP Direct
Before first MCP tool use, call `ToolSearch("mcp")` to discover deferred MCP tools.
Use `mcp__g__ask_gemini` with `agent_role: "designer"` for design tasks.
If ToolSearch finds no MCP tools, use the Codex agent fallback below.

### Fallback: Codex Agent
```
delegate(role="designer", tier="STANDARD", task="{{ARGUMENTS}}")
```

## Capabilities
- Component design and implementation
- Responsive layouts
- Design system consistency
- Accessibility compliance

Task: {{ARGUMENTS}}
