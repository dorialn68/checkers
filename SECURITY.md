# Security Policy

## 🔒 Security Features

### Client-Side Security
- ✅ **No Data Collection**: Game runs entirely in browser
- ✅ **No Cookies**: No tracking or personal data storage
- ✅ **API Keys**: Optional and stored locally only
- ✅ **Open Source**: Full code transparency

### API Key Protection (When Used)
```javascript
// API keys are never sent to our servers
// Keys are stored in browser localStorage
// Optional encryption available (see documentation)
```

## 🛡️ Reporting Security Vulnerabilities

### How to Report
1. **DO NOT** create a public issue
2. Email: security@[your-email].com
3. Or use GitHub's private vulnerability reporting

### What to Include
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## ✅ Security Best Practices

### For Users
- Only enter API keys on the official site
- Use unique API keys for this application
- Regularly rotate API keys
- Don't share game URLs with API keys in them

### For Contributors
- Never commit API keys or secrets
- Sanitize all user inputs
- Use HTTPS for all external requests
- Follow OWASP guidelines

## 🔍 Security Auditing

The codebase is regularly reviewed for:
- XSS vulnerabilities
- Injection attacks
- Dependency vulnerabilities
- Exposed secrets

## 📋 Security Checklist

- [x] No server-side code (purely client-side)
- [x] No database connections
- [x] No user authentication required
- [x] Optional API keys stored locally
- [x] Content Security Policy headers
- [x] Input validation for game moves
- [x] Safe JSON parsing
- [x] No eval() or Function() usage

## 🚨 Known Security Considerations

### API Keys
- API keys for LLM services are stored in plain text in localStorage
- Users should use restricted API keys with limited permissions
- Future update will add encryption option

### Third-Party Libraries
- Three.js: Regularly updated
- No other external dependencies in production

## 📅 Security Updates

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024 | Initial security review |

## 🤝 Responsible Disclosure

We appreciate security researchers who:
- Give us reasonable time to fix issues
- Don't exploit vulnerabilities maliciously
- Help us improve our security

## 📧 Contact

Security concerns: security@[your-email].com
General issues: Use GitHub Issues

---

Last updated: August 2024