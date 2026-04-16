# AGENTS.md - Project Guidance

This file provides guidance for AI assistants working on the oh-my-kimi project.

## Project Overview

**oh-my-kimi** is a workflow orchestration layer for Kimi Code CLI that brings structured workflows, agent teams, and persistent execution capabilities.

- **Purpose**: Enhance Kimi CLI with workflow management
- **Language**: TypeScript/JavaScript (Node.js 20+)
- **Architecture**: Hook-based integration with state management

## Development Guidelines

### Code Organization

```
src/
├── cli/        # User-facing commands
├── hooks/      # Kimi lifecycle hooks
├── state/      # State persistence
└── utils/      # Shared utilities
```

### Key Principles

1. **Minimal Intrusion**: OMK should enhance, not replace, Kimi CLI
2. **State Durability**: All workflow state persists to `.omk/`
3. **Hook Safety**: Hooks must be fast (<100ms) and reliable
4. **Skill Clarity**: Each skill has a single, well-defined purpose

### When Working on OMK

#### Adding Features

- Prefer extending existing skills over creating new ones
- Always update state schemas when adding new state fields
- Test hook performance with large prompts

#### Fixing Bugs

- Check `.omk/state/` for corrupted state files
- Verify hook output format matches Kimi's expectations
- Test across different Node.js versions

#### Refactoring

- Maintain backward compatibility for state files
- Keep CLI interface stable
- Document any breaking changes in CHANGELOG.md

## Common Tasks

### Adding a New CLI Command

1. Add command handler in `src/cli/`
2. Register in `src/cli/index.ts`
3. Update `--help` output
4. Add tests

### Modifying Hook Behavior

1. Update `src/hooks/handler.ts`
2. Ensure JSON output format is correct
3. Test with `scripts/test-hook.js`
4. Update documentation

### Adding State Management

1. Define interface in `src/state/manager.ts`
2. Add path constant in `src/state/paths.ts`
3. Implement read/write methods
4. Add validation

## Testing Strategy

### Unit Tests

```bash
npm run test:all
```

### Manual Testing

```bash
# Test hook directly
echo '{"hook_event_name":"UserPromptSubmit","prompt":"$ralph test"}' | node dist/hooks/handler.js

# Test CLI
omk doctor
```

### Integration Testing

1. Run `omk setup` in a test project
2. Execute each workflow command
3. Verify state files are created correctly
4. Test cancellation and resume

## Documentation Standards

### Code Comments

```typescript
/**
 * Brief description of what this function does.
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws When/what errors are thrown
 */
```

### Skill Documentation (SKILL.md)

- Start with frontmatter (name, description)
- Include clear workflow phases
- Provide examples of good usage
- Document state transitions

## Dependencies

### Runtime Dependencies

- `@iarna/toml`: TOML parsing for config files
- `yaml`: YAML parsing for skill metadata

### Dev Dependencies

- `typescript`: Type checking and compilation
- `@types/node`: Node.js type definitions

### Adding Dependencies

1. Evaluate if necessary
2. Check license compatibility (MIT preferred)
3. Add to package.json
4. Update README.md if user-facing

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Build and verify
5. Create GitHub release
6. Publish to npm

See [PUBLISH.md](../PUBLISH.md) for detailed instructions.

## Troubleshooting Guide

### Hook Not Triggering

- Check `~/.kimi/config.toml` for hook configuration
- Verify hook script path is correct
- Check file permissions

### State Corruption

- Look for malformed JSON in `.omk/state/`
- Check for concurrent write conflicts
- Verify atomic write operations

### CLI Command Fails

- Run `omk doctor` to check installation
- Verify Node.js version (>=20)
- Check global npm permissions

## Best Practices

1. **Always handle errors gracefully** in hooks
2. **Write state atomically** to prevent corruption
3. **Keep hooks stateless** - read from files, don't cache
4. **Validate all inputs** before processing
5. **Log important events** for debugging
6. **Test edge cases** like empty inputs or special characters

## Resources

- [Kimi CLI Documentation](https://moonshotai.github.io/kimi-cli/)
- [Original oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)
- [Project README](../README.md)

---

This file is used by Kimi when working on oh-my-kimi. Keep it updated as the project evolves.
