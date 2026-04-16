# Security Policy

## Supported Versions

The following versions of oh-my-kimi are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of oh-my-kimi seriously. If you believe you have found a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

Please **DO NOT** create a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send an email to the maintainers with the following information:

- **Subject**: `[SECURITY] oh-my-kimi vulnerability report`
- **Description**: Clear description of the vulnerability
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Impact**: Assessment of the potential impact
- **Suggested fix**: If you have one (optional)

### 3. Response Timeline

We aim to respond to security reports within:

- **48 hours**: Acknowledgment of receipt
- **7 days**: Initial assessment and response
- **30 days**: Resolution or workaround provided

### 4. Disclosure Policy

Once a vulnerability is confirmed and fixed:

1. We will release a patched version
2. We will publish a security advisory
3. We will credit the reporter (if desired)

## Security Best Practices for Users

### When Using oh-my-kimi

1. **Keep your software updated**: Always use the latest version
2. **Review state files**: Regularly check `.omk/` for unexpected changes
3. **Use trusted skills**: Only use skills from trusted sources
4. **Validate inputs**: Be cautious with workflow commands that process external data

### For Developers

1. **No network access in hooks**: Hooks should not make network requests
2. **State file validation**: Always validate state file contents before processing
3. **Input sanitization**: Sanitize all user inputs in hooks
4. **Minimal permissions**: Run hooks with minimal required permissions

## Known Security Considerations

### Current Limitations

- **Local state only**: State files are stored locally without encryption
- **Hook permissions**: Hooks run with the same permissions as the Kimi CLI process
- **No authentication**: OMK does not implement user authentication

### Safe Usage Guidelines

1. Do not commit `.omk/` directory to version control (it's in `.gitignore` by default)
2. Be cautious when sharing state files between systems
3. Review skill files before using them in sensitive projects

## Security-Related Configuration

### Recommended Settings

```toml
# ~/.kimi/config.toml
[security]
# Ensure hooks are only loaded from trusted paths
hook_paths = ["~/.kimi/skills/omk"]
```

## Acknowledgments

We would like to thank the following individuals who have responsibly disclosed security issues:

*None yet - be the first!*

---

This security policy is adapted from standard open-source security policies and will be updated as the project evolves.
