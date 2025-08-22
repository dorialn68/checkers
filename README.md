# 🎮 3D Checkers Pro - Advanced AI-Powered Game

[![Live Demo](https://img.shields.io/badge/Play-Live%20Demo-green)](https://dorialn68.github.io/checkers/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/dorialn68/checkers)

A professional 3D checkers game with advanced AI, multiple play modes, and comprehensive learning features. Built with pure JavaScript and Three.js for an immersive gaming experience.

## 🎯 Play Now

**🎮 [Play the Game Live](https://dorialn68.github.io/checkers/)**

## ✨ Features

### Game Modes
- **🤖 Player vs Computer (PvC)** - Play against AI with 4 difficulty levels
- **👥 Player vs Player (PvP)** - Local multiplayer on the same device
- **💡 Agent Helper Mode** - Get real-time AI suggestions for best moves

### AI & Intelligence
- **Minimax Algorithm** with alpha-beta pruning
- **4 Difficulty Levels**: Easy, Medium, Hard, Expert
- **Move Efficiency Scoring** - Each move rated 0-100%
- **Built-in AI Assistant** - No API key required
- **LLM Integration** - Support for OpenAI, Claude, and Groq APIs
- **Smart Move Suggestions** - Top 3 moves with explanations

### 3D Graphics & Controls
- **Full 3D Board** with realistic lighting and shadows
- **Multiple Camera Angles**: Top, Side, Perspective, Auto-rotate
- **Customizable Visuals**:
  - Piece colors and shininess
  - Board reflection
  - Light brightness and saturation
- **Smooth Animations** for piece movements
- **Visual Feedback** for valid moves and mandatory jumps

### Game Rules & Customization
- **Toggleable Rules**:
  - Backward Capture - Regular pieces can capture backwards
  - Flying Kings - Kings move like chess bishops
  - Mandatory Capture - Must jump when possible
- **Player Color Selection** - Choose to play as Red or Black
- **Multi-level Undo** - Undo up to 10 moves with piece restoration
- **Move History** with algebraic notation

### Analytics & Learning
- **Game Analytics Dashboard**:
  - Move efficiency graphs
  - Piece advantage timeline
  - Time per move analysis
  - Capture progression
- **Key Moments Detection**:
  - First blood
  - King promotions
  - Turning points
  - Brilliant moves (90%+ efficiency)
- **Integrated Playback System**:
  - Review games move-by-move on main board
  - Variable playback speed (0.5x-4x)
  - Timeline navigation with golden progress bar
  - Beautiful gradient controls
- **Auto-save** - Last 10 games saved automatically

### Debug & Development Tools
- **Advanced Bug Capture**:
  - Click-and-drag screenshot tool
  - Automatic issue detection
  - Logical error identification
  - JSON export for debugging
- **Move Validator**:
  - Detects AI stuck states only
  - Auto-fixes AI bugs
  - Doesn't interrupt human thinking time
- **Board State Analysis** - Export complete game state with issue detection

## 🚀 Getting Started

### Play Online
Visit: [https://dorialn68.github.io/checkers/](https://dorialn68.github.io/checkers/)

### Run Locally
```bash
git clone https://github.com/dorialn68/checkers.git
cd checkers
# Open index.html in your browser (no server required)
```

### Deploy Your Own
1. Fork this repository
2. Enable GitHub Pages in Settings → Pages
3. Select "Deploy from branch" (main)
4. Your game will be at: `https://[username].github.io/checkers/`

## 🎮 How to Play

### Basic Controls
- **Click** a piece to select it
- **Click** a highlighted square to move
- **Mouse Drag** to rotate the 3D board
- **Scroll** to zoom in/out

### Board Coordinates
- Columns: A-H (left to right)
- Rows: 1-8 (bottom to top from Red's perspective)
- Move notation: "B6 → C5" (with → for moves, x for captures)

### Special Features
- **Playback Mode**: Click "🎮 Playback" to review your game
- **Bug Capture**: Click "📷 Capture Bug" then drag to select problem area
- **Analytics**: Click "📊 Analytics" for detailed game statistics

## 🔐 Security & Privacy

### API Keys
**⚠️ Security Notice**: 
- API keys are stored **only in your browser's local storage**
- Keys are **never sent to any server** except the AI provider's API
- GitHub Pages uses **HTTPS by default** for secure transmission
- For maximum security, use the **built-in AI** (no API needed)

### Data Storage
- All game data is stored locally in your browser
- No personal data is collected or transmitted
- Analytics are computed client-side only
- Auto-saved games remain on your device

## 📈 Latest Updates (Version 2.0)

### Major Features Added
- ✅ **Integrated Playback** - Review games directly on main board
- ✅ **Enhanced Undo System** - Multi-level undo with captured piece restoration
- ✅ **Advanced Bug Capture** - Area selection tool with automatic issue detection
- ✅ **Game Analytics** - Comprehensive statistics and performance graphs
- ✅ **Auto-save System** - Automatic game saving to browser storage
- ✅ **Customizable Rules** - Toggle backward capture, flying kings, mandatory jumps
- ✅ **Visual Customization** - Adjust piece colors, shininess, board reflection

### Bug Fixes
- ✅ Fixed mandatory jump enforcement
- ✅ Fixed AI role flipping issue
- ✅ Fixed scoring display (now shows captures)
- ✅ Fixed move validator alerts for human players
- ✅ Fixed AI stuck states with auto-recovery
- ✅ Fixed multi-jump sequences
- ✅ Fixed king promotion tracking

## 🛠️ Technical Stack

- **Frontend**: Pure JavaScript (ES6+)
- **3D Graphics**: Three.js
- **AI Engine**: Custom minimax implementation
- **Styling**: Custom CSS with responsive design
- **Deployment**: GitHub Pages
- **No Backend Required**: Fully client-side application

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file.

**You are FREE to:**
- ✅ Use commercially
- ✅ Modify and customize
- ✅ Distribute
- ✅ Use privately
- **No limitations or commercial restrictions apply**

## 🤝 Contributing

Contributions are welcome! 
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/dorialn68/checkers/issues)
- Check existing issues for solutions

## 🎯 Roadmap

- [ ] Online multiplayer via WebRTC
- [ ] Tournament mode
- [ ] More board themes
- [ ] Mobile app versions
- [ ] Opening book database
- [ ] Endgame tablebase
- [ ] Voice commands
- [ ] Twitch integration

## 💬 Share on LinkedIn

```
🎮 Check out this amazing 3D Checkers game with AI!

Features:
✅ Stunning 3D graphics with Three.js
✅ AI opponent with 4 difficulty levels
✅ Game analytics & playback system
✅ Integrated bug capture tools
✅ 100% free & open source (MIT License)

Play now: https://dorialn68.github.io/checkers/

#GameDev #AI #WebDevelopment #Checkers #ThreeJS #OpenSource
```

---

**Enjoy the game!** 🎮 If you like this project, please give it a ⭐ on [GitHub](https://github.com/dorialn68/checkers)!

Made with ❤️ using HTML5, Three.js, and AI