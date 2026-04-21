# Contributing to oh-my-kimi

Thank you for your interest in contributing to oh-my-kimi! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Adding New Skills](#adding-new-skills)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- Git
- [Kimi Code CLI](https://moonshotai.github.io/kimi-cli/) (for testing)

### Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/oh-my-kimi.git
cd oh-my-kimi

# Add upstream remote
git remote add upstream https://github.com/Goblin1024/oh-my-kimi.git
```

## 🛠�?How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Goblin1024/oh-my-kimi/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and discussions
2. Open a new issue with the `enhancement` label
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternatives you've considered

### Contributing Code

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. Make your changes
3. Test thoroughly
4. Commit with a clear message
5. Push to your fork
6. Open a Pull Request

## 💻 Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm run test:all

# Verify setup
npm run verify
```

## 📁 Project Structure

```
oh-my-kimi/
├── bin/              # CLI entry points
├── src/              # Source code
�?  ├── cli/          # CLI commands
�?  ├── hooks/        # Kimi hook handlers
�?  ├── state/        # State management
�?  └── utils/        # Utility functions
├── skills/           # Skill definitions
�?  ├── deep-interview/
�?  ├── ralplan/
�?  ├── ralph/
�?  └── cancel/
├── templates/        # Project templates
├── scripts/          # Utility scripts
├── docs/             # Documentation
└── dist/             # Compiled output (generated)
```

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode checks
- Add type annotations for function parameters and returns
- Use interfaces for object shapes

### Code Style

```typescript
// Use meaningful variable names
const isWorkflowActive = true;  // Good
const flag = true;              // Avoid

// Use async/await over callbacks
async function loadState(): Promise<State> {
  const data = await readFile(path);
  return JSON.parse(data);
}

// Prefer const/let over var
const MAX_RETRIES = 3;
let currentAttempt = 0;

// Use early returns to reduce nesting
function processCommand(input: string): Result {
  if (!input) {
    return { error: 'Empty input' };
  }
  // Process valid input
}
```

### Error Handling

```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof SpecificError) {
    // Handle specific error
  } else {
    // Log and rethrow or handle generically
    console.error('Unexpected error:', error);
    throw error;
  }
}
```

## 💬 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.

### Examples

```
feat(skills): add new code-review skill

fix(hooks): resolve state corruption on rapid commands

docs(readme): add installation troubleshooting section

refactor(state): simplify state manager interface

test(cli): add tests for doctor command
```

## 🔀 Pull Request Process

1. **Update documentation** if your changes affect usage
2. **Add tests** for new functionality
3. **Ensure all tests pass**:
   ```bash
   npm run test:all
   ```
4. **Update CHANGELOG.md** with your changes
5. **Link related issues** in the PR description
6. **Request review** from maintainers

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated and passing
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or clearly documented)

## 🎯 Adding New Skills

To add a new skill to OMK:

1. **Create skill directory**:
   ```bash
   mkdir skills/your-skill
   ```

2. **Create SKILL.md**:
   ```markdown
   ---
   name: your-skill
   description: Brief description of what this skill does
   ---
   
   # Your Skill
   
   ## Purpose
   
   Explain what this skill accomplishes.
   
   ## Activation
   
   Trigger: `$your-skill <parameters>`
   
   ## Workflow
   
   ### Phase 1: Something
   
   1. Step one
   2. Step two
   
   ## State Management
   
   - On start: Create state file
   - On completion: Update state
   ```

3. **Add keyword to handler** (`src/hooks/handler.ts`):
   ```typescript
   const SKILL_KEYWORDS = {
     // ... existing skills
     'your-skill': 'your-skill',
   };
   ```

4. **Add state management** (if needed):
   - Update `src/state/manager.ts`
   - Define state interfaces

5. **Test your skill**:
   ```bash
   npm run build
   node scripts/test-hook.js
   ```

6. **Document your skill**:
   - Update README.md
   - Add to docs/EXAMPLES.md
   - Update CHANGELOG.md

## 🌍 Internationalization

When adding features:

- Keep user-facing strings in SKILL.md files
- Consider how features work across languages
- Document any locale-specific behavior

## 📞 Getting Help

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar problems

## 🙏 Recognition

Contributors will be:

- Listed in the README.md contributors section
- Mentioned in release notes for significant contributions
- Added to the project's contributor graph

---

Thank you for contributing to oh-my-kimi! 🎉
