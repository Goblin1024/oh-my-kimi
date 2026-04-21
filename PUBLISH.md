# Publish Guide - oh-my-kimi

Guide for publishing oh-my-kimi to GitHub and npm.

## 📋 Pre-Publish Checklist

Before publishing, ensure:

- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with new version
- [ ] All tests passing (`npm run test:all`)
- [ ] Build successful (`npm run build`)
- [ ] README.md and README.zh-CN.md are up to date
- [ ] No uncommitted changes (`git status`)

## 🚀 Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `oh-my-kimi`
3. Description: `Workflow orchestration layer for Kimi Code CLI - Bring structured workflows to your Kimi CLI sessions`
4. Set to **Public**
5. **DO NOT** initialize with README (we already have one)
6. Add topics: `kimi`, `kimi-cli`, `workflow`, `ai`, `productivity`, `cli`, `developer-tools`
7. Click "Create repository"

### Option B: Using GitHub CLI

```bash
gh repo create oh-my-kimi \
  --public \
  --description "Workflow orchestration layer for Kimi Code CLI" \
  --source=. \
  --remote=origin
```

## 📤 Step 2: Push Code to GitHub

```bash
# Ensure you're in the project directory
cd d:\keti\omx\oh-my-kimi

# Check current remotes
git remote -v

# Add remote if not exists (replace with your actual GitHub username)
git remote add origin https://github.com/Goblin1024/oh-my-kimi.git

# Push to main branch
git branch -M main
git push -u origin main

# Or push to master if that's your default
git push -u origin master
```

## �?Step 3: Verify Repository

Check that all files are on GitHub:
- https://github.com/Goblin1024/oh-my-kimi

Should see:
- [ ] `bin/` - CLI entry point
- [ ] `dist/` - Compiled TypeScript
- [ ] `docs/` - Documentation files
- [ ] `scripts/` - Utility scripts
- [ ] `skills/` - Skill definitions
- [ ] `src/` - Source code
- [ ] `templates/` - Project templates
- [ ] All markdown files (README.md, README.zh-CN.md, etc.)

## 🏷�?Step 4: Create GitHub Release

1. Go to https://github.com/Goblin1024/oh-my-kimi/releases/new
2. Choose a tag: `v0.1.0` (create new tag)
3. Target: `main` or `master` branch
4. Release title: `oh-my-kimi v0.1.0`
5. Description template:

```markdown
## What's New

### �?Features
- Initial release of oh-my-kimi (OMK)
- Workflow skills: `$deep-interview`, `$ralplan`, `$ralph`, `$cancel`
- CLI commands: `omk setup`, `omk doctor`
- Kimi hooks integration

### 📦 Installation
\`\`\`bash
npm install -g oh-my-kimi-cli
omk setup
\`\`\`

### 🚀 Quick Start
\`\`\`bash
kimi
$deep-interview "your idea"
\`\`\`

See [README.md](README.md) for full documentation.
```

6. Check "Set as the latest release"
7. Click "Publish release"

## 📦 Step 5: Publish to npm

### Login to npm

```bash
npm login
# Enter your npm username, password, and email
```

### Test Package Contents

```bash
# See what will be published
npm pack --dry-run

# Or create a tarball to inspect
npm pack
ls -la *.tgz
```

### Publish

```bash
# Publish (will run prepublishOnly automatically)
npm publish

# For scoped packages (@username/package), use:
npm publish --access public
```

### Verify npm Publication

```bash
# Check package info
npm view oh-my-kimi

# Check specific fields
npm view oh-my-kimi version
npm view oh-my-kimi readme
```

## 🔍 Post-Publish Verification

### GitHub

- [ ] Repository visible at https://github.com/Goblin1024/oh-my-kimi
- [ ] All files pushed correctly
- [ ] GitHub Release created at https://github.com/Goblin1024/oh-my-kimi/releases
- [ ] Topics added to repository

### npm

- [ ] Package visible at https://www.npmjs.com/package/oh-my-kimi
- [ ] README rendered correctly
- [ ] License displayed correctly
- [ ] Keywords searchable

### Installation Test

```bash
# Install globally
npm install -g oh-my-kimi-cli

# Test CLI
omk --version
omk --help
omk doctor
```

## 🔄 Version Bumping

When releasing a new version:

```bash
# Update version in package.json manually or use:
npm version patch   # 0.1.0 -> 0.1.1
npm version minor   # 0.1.0 -> 0.2.0
npm version major   # 0.1.0 -> 1.0.0

# Then commit, tag, and push
git add package.json package-lock.json
git commit -m "chore: bump version to x.x.x"
git push

# Create new GitHub release
# Publish to npm
npm publish
```

## 🐛 Troubleshooting

### Git Push Fails

```bash
# Check remote configuration
git remote -v

# Remove and re-add remote
git remote remove origin
git remote add origin https://github.com/Goblin1024/oh-my-kimi.git
git push -u origin main
```

### npm Publish Fails

```bash
# Check if package name is available
npm view oh-my-kimi

# If version already exists
npm version patch
npm publish

# Check npm status
npm whoami

# If 2FA issues
npm profile enable-2fa auth-only
```

### Authentication Issues

**GitHub:**
```bash
# Use personal access token
git remote add origin https://TOKEN@github.com/Goblin1024/oh-my-kimi.git
```

**npm:**
```bash
# Re-login
npm logout
npm login

# Check npm config
npm config list
```

## 📣 Post-Publish Tasks

After successful publish:

1. **Share the project:**
   - Twitter/X, Reddit, Discord, etc.
   - Kimi CLI community channels

2. **Update GitHub repository:**
   - Add topics: `kimi`, `kimi-cli`, `workflow`, `ai`, `productivity`
   - Update description with npm link
   - Add website URL if available

3. **Add badge to README:**
   ```markdown
   [![npm version](https://badge.fury.io/js/oh-my-kimi.svg)](https://www.npmjs.com/package/oh-my-kimi)
   ```

4. **Create discussions/enable issues** for community feedback

## 📚 Related Links

- [GitHub Repository](https://github.com/Goblin1024/oh-my-kimi)
- [npm Package](https://www.npmjs.com/package/oh-my-kimi)
- [Kimi CLI Documentation](https://moonshotai.github.io/kimi-cli/)
- [Original Inspiration: oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex)
