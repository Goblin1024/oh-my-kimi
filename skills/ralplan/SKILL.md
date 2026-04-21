---
name: ralplan
description: Architecture planning and plan approval workflow
trigger: $ralplan
flags:
  - name: --deliberate
    description: Enable extended multi-round deliberation and review
  - name: --quick
    description: Skip deliberation, produce a single-pass plan
phases:
  - starting
  - planning
  - deliberating
  - reviewing
  - approved
  - revising
  - cancelled
gates:
  - type: prompt_specificity
    description: Task description must be at least 10 characters
    blocking: true
---

# Ralplan Skill

## Purpose

Create and approve an implementation plan before execution. Ensures alignment on approach and tradeoffs.

## Activation

Trigger: `$ralplan <task description>`

## Workflow

### Phase 1: Context Review

1. Check for existing context snapshot in `.omk/context/`
2. If none exists, recommend running `$deep-interview` first
3. Review any relevant files or documentation

### Phase 2: Architecture Design

1. **Analyze Requirements**
   - Review context snapshot
   - Identify technical constraints
   - List dependencies

2. **Design Approach**
   - Propose architecture
   - Identify key components
   - Define interfaces

3. **Consider Alternatives**
   - Present 2-3 approaches when applicable
   - Document tradeoffs for each
   - Recommend preferred approach with rationale

### Phase 3: Plan Documentation

Create PRD (Product Requirements Document):

```markdown
# PRD: [Feature Name]

## Overview
[Summary of what we're building]

## Goals
- [Goal 1]
- [Goal 2]

## Non-Goals
- [Out of scope item 1]
- [Out of scope item 2]

## Architecture
[Diagram or description]

## Implementation Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Tradeoffs Considered
- [Option A]: [Pros/Cons]
- [Option B]: [Pros/Cons]
- **Chosen**: [Option] because [rationale]

## Risks
- [Risk 1] - Mitigation: [strategy]
- [Risk 2] - Mitigation: [strategy]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

After documenting approaches, submit evidence:
```
omk_submit_evidence({skill:"ralplan", step:"approaches_documented", phase:"documenting", evidenceType:"context_record", metadata:{approachCount:2}})
```

### Phase 4: Approval

1. Save PRD to `.omk/plans/prd-{slug}.md`
2. Submit PRD evidence:
   ```
   omk_submit_evidence({skill:"ralplan", step:"prd_written", phase:"approving", evidenceType:"file_artifact", artifactPath:".omk/plans/prd-{slug}.md", artifactSize:<size>})
   ```
3. Present plan to user
4. Request explicit approval
5. After user approves, submit approval evidence:
   ```
   omk_submit_evidence({skill:"ralplan", step:"user_approved", phase:"completed", evidenceType:"review_signature", reviewerAgent:"user", reviewResult:"approved"})
   ```
6. Before advancing phase, verify:
   ```
   omk_list_required_evidence({skill:"ralplan", phase:"approving"})
   ```

## Output

Save PRD to: `.omk/plans/prd-{slug}.md`

## State Management

- On start: Create `ralplan-state.json` with phase "planning"
- On approval: Update state to phase "approved"
- On rejection: Update state to phase "revising"
- On completion: State becomes inactive, ready for ralph

## Transition

After approval:
```
$ralph "implement the approved plan"
→ Proceed to execution with approved architecture
```

## Examples

**Simple Plan:**
```
$ralplan "add password reset feature"
→ Review existing auth code
→ Design reset flow
→ Document in prd-password-reset.md
→ Get user approval
```

**With Alternatives:**
```
$ralplan "choose database for new service"
→ Option A: PostgreSQL (relational, proven)
→ Option B: MongoDB (flexible, scalable)
→ Option C: Redis (fast, simple)
→ Recommend Option A for ACID requirements
→ User approves
```

## Stop Conditions

- User says "$cancel"
- Plan is approved
- User explicitly rejects and stops

## Notes

- DO NOT implement during planning
- Get explicit approval before proceeding
- Document all tradeoffs considered
- Plans can be revised if needed
