# Contributing to 3D Checkers Pro

Thank you for your interest in contributing to 3D Checkers Pro! We welcome contributions from everyone.

## 🤝 How to Contribute

### 1. Report Bugs
- Use [GitHub Issues](https://github.com/dorialn68/checkers/issues)
- Describe the bug clearly
- Include steps to reproduce
- Add screenshots if applicable

### 2. Suggest Features
- Open a [Discussion](https://github.com/dorialn68/checkers/discussions)
- Explain the feature and its benefits
- Consider implementation complexity

### 3. Submit Code

#### Setup Development Environment
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/checkers.git
cd checkers

# Add upstream remote
git remote add upstream https://github.com/dorialn68/checkers.git

# Create a branch
git checkout -b feature/your-feature-name
```

#### Make Changes
1. Write clean, readable code
2. Follow existing code style
3. Add comments for complex logic
4. Test thoroughly

#### Submit Pull Request
```bash
# Commit changes
git add .
git commit -m "Add: your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📋 Code Style Guidelines

### JavaScript
- Use ES6+ features
- Use meaningful variable names
- Add JSDoc comments for functions
```javascript
/**
 * Calculate best move using minimax
 * @param {Object} game - Current game state
 * @param {number} depth - Search depth
 * @returns {Object} Best move
 */
function calculateBestMove(game, depth) {
    // Implementation
}
```

### CSS
- Use descriptive class names
- Group related styles
- Add comments for complex styles

### HTML
- Use semantic HTML5 elements
- Maintain proper indentation
- Add accessibility attributes

## 🧪 Testing

Before submitting:
1. Test all game modes
2. Check different browsers
3. Test on mobile devices
4. Verify no console errors

## 📝 Commit Messages

Format: `Type: Description`

Types:
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Update existing feature
- `Refactor:` Code improvement
- `Docs:` Documentation
- `Style:` Formatting changes

Examples:
- `Add: Online multiplayer support`
- `Fix: AI stuck in thinking mode`
- `Update: Improve move animation`

## 🎯 Priority Areas

Current focus areas:
1. **Online Multiplayer**: WebSocket implementation
2. **Mobile App**: React Native version
3. **AI Improvements**: Better evaluation function
4. **Accessibility**: Screen reader support
5. **Internationalization**: Multiple languages

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on what's best for the community

## 🏆 Recognition

Contributors will be:
- Listed in README
- Mentioned in release notes
- Given credit in documentation

## 💬 Questions?

- Open a [Discussion](https://github.com/dorialn68/checkers/discussions)
- Contact [@dorialn68](https://github.com/dorialn68)
- Join our community chat (coming soon)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make 3D Checkers Pro better! 🎮