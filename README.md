# 3D Checkers Pro - AI-Powered Chess Game

A professional 3D checkers game with AI opponent, move suggestions, and LLM-powered analysis. Built with Three.js for stunning 3D graphics and featuring multiple game modes.

![3D Checkers Pro](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Platform](https://img.shields.io/badge/Platform-Web-orange)

## 🎮 Live Demo

Play the game at: [https://[your-username].github.io/checkers/](https://[your-username].github.io/checkers/)

## ✨ Features

### Game Modes
- **Person vs Person (PvP)**: Classic two-player mode
- **Person vs Computer (PvC)**: Play against AI with 4 difficulty levels
- **Agent Helper Mode**: Real-time AI suggestions highlight best moves

### 3D Graphics
- Beautiful 3D board and pieces using Three.js
- Multiple camera angles (Top, Side, 3D Perspective)
- Auto-rotate feature for cinematic viewing
- Smooth piece animations
- Visual move indicators and hints

### AI Features
- **Smart AI Opponent**: Minimax algorithm with alpha-beta pruning
- **Difficulty Levels**: Easy, Medium, Hard, Expert
- **Move Suggestions**: Get hints for best moves
- **LLM Integration**: Connect to various AI providers for advanced analysis
  - Local AI (offline)
  - OpenAI GPT-3.5
  - Claude Haiku (Anthropic)
  - Groq (Fast & Free)

### User Experience
- Intuitive mouse controls
- Move history tracking
- Undo functionality
- Mandatory jump enforcement
- King promotion animations
- Real-time game status updates

## 🚀 Quick Start

### Play Online
1. Visit the [live demo](https://daloni68.github.io/checkers/)
2. Select your game mode
3. Start playing!

### Run Locally
1. Clone the repository:
```bash
git clone https://github.com/[your-username]/checkers.git
cd checkers
```

2. Open `index.html` in a modern web browser
   - Or use a local server: `python -m http.server 8000`
   - Navigate to `http://localhost:8000`

## 🎯 How to Play

### Basic Rules
- **Movement**: Pieces move diagonally forward one square
- **Capturing**: Jump over opponent pieces (mandatory when possible)
- **Kings**: Pieces become kings at the opposite end, can move backward
- **Winning**: Capture all opponent pieces or block all moves

### Controls
- Click a piece to select it
- Click a highlighted square to move
- Drag to rotate the 3D board
- Scroll to zoom in/out

## 🤖 AI Integration

### Using the AI Assistant
1. Select an AI provider from the dropdown
2. Enter API key if required (not needed for local AI or Groq)
3. Click "Analyze Board" for move suggestions
4. Chat with the AI for strategic advice

### API Keys
- **OpenAI**: Get from [platform.openai.com](https://platform.openai.com)
- **Anthropic**: Get from [console.anthropic.com](https://console.anthropic.com)
- **Groq**: Get free key from [console.groq.com](https://console.groq.com)

### Cost Estimates
- Local AI: Free
- Groq: Free
- OpenAI GPT-3.5: ~$0.001 per analysis
- Claude Haiku: ~$0.0005 per analysis

## 📱 Deployment

### GitHub Pages
1. Fork this repository
2. Enable GitHub Pages in Settings > Pages
3. Select source: Deploy from branch (main)
4. Your game will be live at `https://[username].github.io/checkers/`

### Custom Domain
1. Add a `CNAME` file with your domain
2. Configure DNS settings with your provider
3. Enable HTTPS in GitHub Pages settings

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js
- **AI Engine**: Custom minimax with alpha-beta pruning
- **LLM Integration**: OpenAI, Anthropic, Groq APIs
- **Deployment**: GitHub Pages

## 📊 Performance

- Instant local AI analysis
- Sub-second move calculations
- 60 FPS 3D rendering
- Responsive design for all devices
- Optimized for modern browsers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 Share on LinkedIn

Love the game? Share it with your network!

```
🎮 Check out this amazing 3D Checkers game I've been playing!

Features:
✅ Stunning 3D graphics
✅ AI opponent with multiple difficulties  
✅ LLM-powered move analysis
✅ Multiple game modes
✅ Free to play online

Try it here: [your-game-url]

#GameDev #AI #WebDevelopment #Checkers #ThreeJS
```

## 👨‍💻 Author

Created with passion for the classic game of checkers and modern web technologies.

## 🙏 Acknowledgments

- Three.js team for the amazing 3D library
- Chess programming wiki for AI algorithms
- The checkers community for rules and strategies

---

**Play Now**: [https://[your-username].github.io/checkers/](https://[your-username].github.io/checkers/)

Made with ❤️ using HTML5, Three.js, and AI
