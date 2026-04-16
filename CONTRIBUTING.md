# Contributing to oh-my-kimi

Thank you for your interest in contributing to oh-my-kimi!

This project is maintained by **哈尔滨工业大学, SpiritPunch** and is inspired by [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex).

## Development Setup

```bash
git clone https://github.com/SpiritPunch/oh-my-kimi.git
cd oh-my-kimi
npm install
npm run build
```

## Development Workflow

```bash
# Watch mode for development
npm run dev

# Run tests
npm run test:all

# Verify installation
npm run verify
```

## Project Structure

```
oh-my-kimi/
├── src/           # TypeScript source
├── skills/        # Skill definitions (SKILL.md files)
├── scripts/       # Verification and test scripts
├── docs/          # Documentation
└── templates/     # Project templates
```

## Adding a New Skill

1. Create `skills/<skill-name>/SKILL.md`
2. Add keyword to `src/hooks/handler.ts`
3. Test with `npm run test:hook`
4. Update documentation

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:all`
5. Submit a pull request

## Code Style

- TypeScript with strict mode
- ES modules
- No trailing semicolons
- 2-space indentation

## Testing

All changes must include:
- Verification that `npm run test:all` passes
- Manual testing of affected features
- Documentation updates if needed

## Questions?

Open an issue on GitHub.

---

## Acknowledgments

This project builds upon the workflow architecture from [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) by Yeachan Heo.
