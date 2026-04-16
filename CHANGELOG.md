# Changelog

All notable changes to oh-my-kimi will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-16

### Added
- Initial release of oh-my-kimi
- CLI commands: `setup`, `doctor`, `--version`, `--help`
- Workflow skills:
  - `$deep-interview` - Socratic requirements gathering
  - `$ralplan` - Architecture planning and approval
  - `$ralph` - Persistence loop to completion
  - `$cancel` - Stop active workflow
- Kimi hooks integration:
  - `UserPromptSubmit` - Detect workflow commands
  - `SessionStart` - Resume active workflows
  - `Stop` - Block incomplete work
- State management in `.omk/state/`
- Comprehensive verification scripts
- Documentation and examples

### Features
- Automatic skill activation via keyword detection
- Workflow state persistence across sessions
- Verification and testing tools
- Clean architecture with minimal dependencies

[0.1.0]: https://github.com/Yeachan-Heo/oh-my-kimi/releases/tag/v0.1.0
