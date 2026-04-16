# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Improved project documentation with bilingual README (English and Chinese)
- Enhanced package.json with more metadata and keywords
- Added comprehensive project badges

## [0.1.0] - 2026-04-16

### Added
- Initial release of oh-my-kimi (OMK) - Workflow orchestration for Kimi Code CLI
- CLI commands: `setup`, `doctor`, `--version`, `--help`
- Core workflow skills:
  - `$deep-interview` - Socratic requirements gathering through structured questioning
  - `$ralplan` - Architecture planning and approval with PRD generation
  - `$ralph` - Persistence loop to completion with verification
  - `$cancel` - Stop active workflow gracefully
- Kimi hooks integration:
  - `UserPromptSubmit` - Detect workflow commands
  - `SessionStart` - Resume active workflows
  - `Stop` - Block incomplete work
- State management system in `.omk/state/`
- Comprehensive verification scripts
- Documentation: Getting Started, Examples, Architecture guides
- MIT License

### Security
- Hooks only read/write to `.omk/` directory
- No network access in hooks
- State files are local only

[Unreleased]: https://github.com/Goblin1024/oh-my-kimi/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Goblin1024/oh-my-kimi/releases/tag/v0.1.0
