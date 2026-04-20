---
name: deep-interview
description: Socratic requirements gathering through structured questioning
trigger: $deep-interview
phases:
  - starting
  - intent-first
  - deep-dive
  - synthesis
  - complete
  - cancelled
---

# Deep Interview Skill

## Purpose

Conduct a Socratic interview to clarify user intent, boundaries, and non-goals before implementation.

## Activation

Trigger: `$deep-interview <topic>`

## Workflow

### Phase 1: Intent Clarification (intent-first)

1. **Understand the Goal**
   - What problem are you trying to solve?
   - What does success look like?
   - Who is the end user?

2. **Define Scope**
   - What is explicitly in scope?
   - What is explicitly out of scope?
   - What are the constraints (time, tech, resources)?

3. **Identify Constraints**
   - Technical limitations
   - Business requirements
   - Integration points

### Phase 2: Deep Dive

Ask follow-up questions until you have:
- Clear problem statement
- Defined success criteria
- Known constraints
- Identified risks

### Phase 3: Synthesis

Summarize findings in a context snapshot:

```markdown
## Context Snapshot

**Task**: [Brief description]
**Goal**: [What success looks like]
**Scope**: 
  - In: [What's included]
  - Out: [What's excluded]
**Constraints**: [Limitations]
**Risks**: [Potential issues]
**Next Steps**: [Recommended action]
```

## Output

Save snapshot to: `.omk/context/{slug}-{timestamp}.md`

## State Management

- On start: Create `deep-interview-state.json` with phase "intent-first"
- On completion: Update state to phase "complete"
- On handoff: Transition to ralplan if user approves

## Examples

**Good Usage:**
```
$deep-interview "I want to add user authentication"
→ Ask about auth methods (OAuth, password, SSO?)
→ Ask about user types
→ Ask about security requirements
→ Output context snapshot
```

**Transition:**
```
$deep-interview completed
$ralplan "implement the approved auth system"
→ Proceed to planning with clarified requirements
```

## Stop Conditions

- User says "stop", "cancel", or "$cancel"
- Requirements are sufficiently clarified
- User explicitly asks to proceed to planning

## Notes

- This is NOT implementation - only clarification
- Do not write code during deep-interview
- Focus on understanding, not solving
- The goal is a shared understanding, not a specification
