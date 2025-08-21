# GitHub MCP Setup for Claude Desktop

## The GitHub MCP server is already installed!

### Configure Claude Desktop:

1. **Find your Claude Desktop config file:**
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **Add this configuration:**

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": [
        "C:\\Users\\doria\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-github\\dist\\index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_TOKEN"
      }
    }
  }
}
```

3. **Get a GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens/new
   - Name: "Claude Desktop MCP"
   - Expiration: 90 days (or your preference)
   - Select scopes:
     ✅ repo (Full control of private repositories)
     ✅ workflow (Update GitHub Action workflows)
     ✅ write:packages (Upload packages to GitHub Package Registry)
   - Click "Generate token"
   - Copy the token (starts with `ghp_`)

4. **Replace YOUR_GITHUB_TOKEN** with your actual token

5. **Restart Claude Desktop**

## Once configured, you can use commands like:

- Create repository: `mcp_github_create_repository`
- Push files: `mcp_github_push_files`
- Create issues: `mcp_github_create_issue`
- Manage PRs: `mcp_github_create_pull_request`

## Alternative: Use GitHub CLI (simpler)

If MCP setup is complex, we can use GitHub CLI instead:

```bash
# Install GitHub CLI
winget install --id GitHub.cli

# Or download from: https://cli.github.com/

# Authenticate
gh auth login

# Create repo and push
gh repo create checkers --public --source=. --remote=origin --push
```