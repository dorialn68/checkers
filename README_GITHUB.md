# 🎮 3D Checkers Pro - Open Source AI-Powered Checkers Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/Demo-Live-green.svg)](https://dorialn68.github.io/checkers/)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](CONTRIBUTING.md)
[![LinkedIn](https://img.shields.io/badge/Share-LinkedIn-blue.svg)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/dorialn68/checkers)

A professional 3D checkers game with AI opponent, move suggestions, and LLM-powered analysis. Built with Three.js for stunning 3D graphics and featuring multiple game modes.

![Game Screenshot](https://via.placeholder.com/800x400.png?text=3D+Checkers+Pro+Screenshot)

## ✨ Features

- 🎮 **Multiple Game Modes**: PvP, PvC, Agent Helper
- 🎨 **3D Graphics**: Beautiful board with multiple camera angles
- 🤖 **Smart AI**: 4 difficulty levels with minimax algorithm
- 💬 **AI Assistant**: Get move suggestions and strategy tips
- ⚙️ **Custom Rules**: Toggle backward capture, flying kings
- 🌐 **No Installation**: Runs directly in browser
- 📱 **Responsive**: Works on desktop and mobile

## 🚀 Quick Start

### Option 1: Play Online (Easiest)
Visit: [https://dorialn68.github.io/checkers/](https://dorialn68.github.io/checkers/)

### Option 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/dorialn68/checkers.git
cd checkers

# Open in browser
open index.html

# Or use a local server
python -m http.server 8000
# Visit http://localhost:8000
```

### Option 3: Run with Docker
```bash
# Build and run the Docker container
docker build -t 3d-checkers .
docker run -p 8080:80 3d-checkers
# Visit http://localhost:8080
```

### Option 4: Download Binary (Windows/Mac/Linux)
Download the latest release from [Releases](https://github.com/dorialn68/checkers/releases)

## 🐳 Docker Deployment

### Using Docker Compose
```bash
docker-compose up
```

### Manual Docker Build
```bash
# Build the image
docker build -t dorialn68/3d-checkers:latest .

# Run the container
docker run -d \
  --name checkers \
  -p 8080:80 \
  dorialn68/3d-checkers:latest
```

### Pull from Docker Hub
```bash
docker pull dorialn68/3d-checkers:latest
docker run -p 8080:80 dorialn68/3d-checkers:latest
```

## 📦 Installation Methods

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dorialn68/checkers)

### Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/dorialn68/checkers)

### Deploy to Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/dorialn68/checkers)

## 🛠️ Development Setup

```bash
# Clone repository
git clone https://github.com/dorialn68/checkers.git
cd checkers

# Install dependencies (optional - for development tools)
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🎯 How to Play

1. **Select Game Mode**: Choose PvP, PvC, or Agent Helper
2. **Make Moves**: Click piece, then click destination
3. **Use Features**:
   - 🎥 Rotate board with mouse
   - 💡 Click "Show Hint" for suggestions
   - 🤖 Use AI Assistant for strategy
   - ⚙️ Toggle rules in settings

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Ways to Contribute:
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests
- 📖 Improve documentation
- 🌍 Add translations

## 📊 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js, WebGL
- **AI Engine**: Minimax with Alpha-Beta Pruning
- **Deployment**: Docker, GitHub Pages
- **Optional**: Node.js for multiplayer (coming soon)

## 🔒 Security

- ✅ No data collection
- ✅ Runs entirely in browser
- ✅ Optional API keys stored locally
- ✅ Open source and auditable

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Team & Credits

- **Created by**: [@dorialn68](https://github.com/dorialn68)
- **AI Assistant**: Claude (Anthropic)
- **3D Library**: Three.js team
- **Contributors**: [See all](https://github.com/dorialn68/checkers/graphs/contributors)

## 📈 Roadmap

- [x] Core game implementation
- [x] 3D graphics
- [x] AI opponent
- [x] Rule customization
- [ ] Online multiplayer
- [ ] Tournament system
- [ ] Mobile app
- [ ] Voice commands

## 💬 Support & Community

- **Issues**: [GitHub Issues](https://github.com/dorialn68/checkers/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dorialn68/checkers/discussions)
- **LinkedIn**: [Share & Connect](https://www.linkedin.com/in/dorialn68)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=dorialn68/checkers&type=Date)](https://star-history.com/#dorialn68/checkers&Date)

---

**Made with ❤️ by the open source community**

[⭐ Star this repo](https://github.com/dorialn68/checkers) | [🐛 Report Bug](https://github.com/dorialn68/checkers/issues) | [💡 Request Feature](https://github.com/dorialn68/checkers/issues)