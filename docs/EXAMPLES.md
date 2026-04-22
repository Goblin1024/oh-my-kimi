# OMK Examples

Real-world usage examples for oh-my-kimi.

## Example 1: Building a Todo App

### Step 1: Clarify Requirements

```
$deep-interview "I want to build a todo app"
```

Kimi asks:
- What platforms? (Web, mobile, desktop?)
- Single user or multi-user?
- Data persistence? (Local storage, database?)
- Features needed? (Categories, deadlines, sharing?)

**Output**: `.omk/context/todo-app-2026-04-16.md`

```markdown
## Context Snapshot

**Task**: Build todo app
**Goal**: Simple task management for personal use
**Scope**:
  - In: CRUD, categories, deadlines
  - Out: Sharing, collaboration
**Constraints**: Web app, local storage, single user
```

### Step 2: Create Plan

```
$ralplan "build todo web app"
```

Kimi creates:

```markdown
# PRD: Todo App

## Architecture
- React + TypeScript frontend
- LocalStorage for persistence
- Component structure: App, TaskList, TaskItem, AddTask

## Implementation Plan
1. Set up project structure
2. Create data models
3. Build UI components
4. Add CRUD operations
5. Style with CSS

## Success Criteria
- [ ] Can add tasks
- [ ] Can mark complete
- [ ] Can delete tasks
- [ ] Data persists on refresh
```

### Step 3: Execute

```
$ralph "implement the todo app"
```

Kimi:
1. Creates React project
2. Implements components
3. Adds persistence
4. Runs verification
5. Reports completion

## Example 2: Fixing a Bug

### Step 1: Clarify

```
$deep-interview "Login fails with 500 error"
```

Kimi investigates:
- When does it happen?
- What error message?
- Which users affected?

### Step 2: Execute

```
$ralph "fix the 500 error in login"
```

Kimi:
1. Finds the bug in auth code
2. Fixes the error handling
3. Tests the fix
4. Verifies no regression

## Example 3: API Integration

### Step 1: Plan

```
$ralplan "integrate Stripe payment API"
```

Kimi designs:
- API client structure
- Error handling
- Webhook processing
- Testing strategy

### Step 2: Execute

```
$ralph "implement Stripe integration"
```

## Example 4: Code Refactoring

### Step 1: Clarify

```
$deep-interview "The auth code is messy and hard to maintain"
```

### Step 2: Plan

```
$ralplan "refactor auth module"
```

### Step 3: Execute

```
$ralph "implement auth refactoring"
```

## Example 5: Documentation

```
$deep-interview "Document the API endpoints"
$ralph "write comprehensive API documentation"
```

## Tips for Each Example

### New Features
- Always use full workflow: interview → plan → execute
- Don't skip planning for large features

### Bug Fixes
- Deep interview helps find root cause
- Ralph ensures complete fix with tests

### Refactoring
- Plan first to avoid breaking changes
- Ralph handles incremental refactoring

### Documentation
- Can often skip ralplan
- Ralph iterates until docs are complete
