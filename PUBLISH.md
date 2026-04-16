# Publish Guide - oh-my-kimi

Guide for publishing oh-my-kimi to GitHub and npm.

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `oh-my-kimi`
3. Description: `Workflow orchestration layer for Kimi Code CLI`
4. Set to Public
5. DO NOT initialize with README (we already have one)
6. Click "Create repository"

### Option B: Using GitHub CLI (if installed)

```bash
gh repo create oh-my-kimi --public --description "Workflow orchestration layer for Kimi Code CLI" --source=. --remote=origin
```

## Step 2: Push Code to GitHub

After creating the repository:

```bash
cd d:\keti\omx\oh-my-kimi

# Add remote (replace with your actual GitHub username)
git remote add origin https://github.com/Yeachan-Heo/oh-my-kimi.git

# Push code
git push -u origin master
```

## Step 3: Verify Repository

Check that all files are on GitHub:
- https://github.com/Yeachan-Heo/oh-my-kimi

Should see:
- bin/
- dist/
- docs/
- scripts/
- skills/
- src/
- templates/
- All markdown files

## Step 4: Create GitHub Release

1. Go to https://github.com/Yeachan-Heo/oh-my-kimi/releases/new
2. Tag version: `v0.1.0`
3. Release title: `oh-my-kimi v0.1.0`
4. Description:
```markdown
## Initial Release

First release of oh-my-kimi (OMK) - Workflow orchestration for Kimi Code CLI.

### Features
- `$deep-interview` - Socratic requirements gathering
- `$ralplan` - Architecture planning and approval  
- `$ralph` - Persistence loop to completion
- `$cancel` - Stop active workflow

### Installation
```bash
npm install -g oh-my-kimi
omk setup
```

### Quick Start
```bash
kimi
$deep-interview "your idea"
```

See [README.md](README.md) for full documentation.
```

5. Click "Publish release"

## Step 5: Publish to npm

```bash
# Ensure you're logged in to npm
npm login

# Test what will be published
npm pack

# Publish (will run prepublishOnly automatically)
npm publish
```

## Verification Checklist

After publishing:

- [ ] GitHub repository visible at https://github.com/Yeachan-Heo/oh-my-kimi
- [ ] All files pushed to GitHub
- [ ] GitHub Release created at v0.1.0
- [ ] npm package published (https://www.npmjs.com/package/oh-my-kimi)
- [ ] Can install globally: `npm install -g oh-my-kimi`
- [ ] Setup works: `omk setup`
- [ ] Doctor works: `omk doctor`

## Troubleshooting

### Git push fails
```bash
# Check remote
git remote -v

# Remove and re-add if needed
git remote remove origin
git remote add origin https://github.com/Yeachan-Heo/oh-my-kimi.git
git push -u origin master
```

### npm publish fails
```bash
# Check if package name is available
npm view oh-my-kimi

# If version already exists, bump version in package.json
npm version patch  # or minor/major
npm publish
```

### Authentication issues
```bash
# GitHub - use token if needed
git remote add origin https://TOKEN@github.com/Yeachan-Heo/oh-my-kimi.git

# npm - re-login
npm login
```

## Post-Publish

After successful publish:

1. Share the project!
2. Add topics to GitHub repo: kimi, kimi-cli, workflow, ai, productivity
3. Update repo description with link to npm
4. Consider adding a badge to README:

```markdown
[![npm version](https://badge.fury.io/js/oh-my-kimi.svg)](https://www.npmjs.com/package/oh-my-kimi)
```
