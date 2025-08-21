# Online Multiplayer Architecture for 3D Checkers Pro

## Overview
This document outlines the architecture for implementing real-time online multiplayer functionality.

## Current Implementation Status
✅ **Local Multiplayer**: Two players can play on the same device
🔧 **Rule Options**: Players can customize game rules
📋 **Foundation Ready**: Game logic is modular and ready for networking

## Phase 1: Local Network Play (Quick Implementation)
Simple peer-to-peer connection for players on the same network.

### Technologies:
- **WebRTC**: For peer-to-peer connection
- **Socket.io**: For signaling server
- **LocalStorage**: For temporary user data

### Implementation:
```javascript
// 1. Create simple signaling server (Node.js)
const io = require('socket.io')(3001);
const rooms = {};

io.on('connection', (socket) => {
  socket.on('create-room', (roomCode) => {
    rooms[roomCode] = { host: socket.id, guest: null };
    socket.join(roomCode);
  });
  
  socket.on('join-room', (roomCode) => {
    if (rooms[roomCode] && !rooms[roomCode].guest) {
      rooms[roomCode].guest = socket.id;
      socket.join(roomCode);
      io.to(roomCode).emit('game-start');
    }
  });
  
  socket.on('move', (data) => {
    socket.to(data.room).emit('opponent-move', data.move);
  });
});

// 2. Client-side connection
class OnlineGame {
  constructor() {
    this.socket = io('http://localhost:3001');
    this.roomCode = null;
    this.isHost = false;
  }
  
  createRoom() {
    this.roomCode = Math.random().toString(36).substring(7);
    this.socket.emit('create-room', this.roomCode);
    this.isHost = true;
    return this.roomCode;
  }
  
  joinRoom(code) {
    this.roomCode = code;
    this.socket.emit('join-room', code);
  }
  
  sendMove(move) {
    this.socket.emit('move', {
      room: this.roomCode,
      move: move
    });
  }
}
```

## Phase 2: Internet Play with Authentication

### Technologies:
- **Node.js + Express**: Backend server
- **MongoDB/PostgreSQL**: User data and game history
- **JWT**: Authentication tokens
- **WebSocket**: Real-time communication
- **Redis**: Session management and game state caching

### Architecture:
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client 1  │────▶│              │────▶│   Database   │
└─────────────┘     │   Game       │     └──────────────┘
                    │   Server     │     
┌─────────────┐     │              │     ┌──────────────┐
│   Client 2  │────▶│  WebSocket  │────▶│    Redis     │
└─────────────┘     └──────────────┘     └──────────────┘
```

### User Authentication Flow:
1. **Email Registration**:
```javascript
// Server endpoint
app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Save user with unverified status
  await User.create({
    email,
    username,
    password: hashedPassword,
    verified: false,
    verificationToken
  });
  
  // Send verification email
  await sendVerificationEmail(email, verificationToken);
});

// Email verification
app.get('/verify/:token', async (req, res) => {
  const user = await User.findOne({ 
    verificationToken: req.params.token 
  });
  if (user) {
    user.verified = true;
    await user.save();
  }
});
```

2. **OAuth2 Integration** (Google/Facebook):
```javascript
// Using Passport.js
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      username: profile.displayName,
      verified: true
    });
  }
  return done(null, user);
}));
```

3. **One-Time Password (OTP)**:
```javascript
// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post('/login/otp', async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
  
  await OTP.create({ email, otp, expires });
  await sendOTPEmail(email, otp);
});

app.post('/verify/otp', async (req, res) => {
  const { email, otp } = req.body;
  const validOTP = await OTP.findOne({
    email,
    otp,
    expires: { $gt: Date.now() }
  });
  
  if (validOTP) {
    const token = jwt.sign({ email }, JWT_SECRET);
    res.json({ token });
  }
});
```

## Phase 3: Game Synchronization

### Real-time Move Synchronization:
```javascript
class GameRoom {
  constructor(roomId, player1, player2) {
    this.roomId = roomId;
    this.players = [player1, player2];
    this.gameState = new CheckersGame();
    this.currentTurn = 0; // Index of current player
    this.moveHistory = [];
  }
  
  makeMove(playerId, move) {
    // Validate it's the player's turn
    if (this.players[this.currentTurn].id !== playerId) {
      throw new Error('Not your turn');
    }
    
    // Validate move
    if (!this.gameState.isValidMove(move)) {
      throw new Error('Invalid move');
    }
    
    // Apply move
    this.gameState.makeMove(move);
    this.moveHistory.push({
      player: playerId,
      move: move,
      timestamp: Date.now()
    });
    
    // Switch turn
    this.currentTurn = 1 - this.currentTurn;
    
    // Broadcast to both players
    this.broadcast('move-made', {
      move: move,
      gameState: this.gameState.serialize(),
      nextPlayer: this.players[this.currentTurn].id
    });
  }
  
  handleDisconnect(playerId) {
    // Give 30 seconds to reconnect
    setTimeout(() => {
      if (!this.players.find(p => p.id === playerId).connected) {
        this.endGame('disconnect', playerId);
      }
    }, 30000);
  }
}
```

### Security Considerations:
1. **TLS 1.3**: All connections must use HTTPS/WSS
2. **Move Validation**: Server validates all moves
3. **Rate Limiting**: Prevent spam and DOS attacks
4. **Token Rotation**: JWT tokens expire and refresh
5. **Input Sanitization**: Prevent XSS and injection attacks

## Phase 4: Matchmaking System

```javascript
class Matchmaker {
  constructor() {
    this.waitingPlayers = [];
    this.activeGames = new Map();
  }
  
  addPlayer(player) {
    // Find compatible opponent
    const opponent = this.findMatch(player);
    
    if (opponent) {
      // Create game room
      const roomId = this.createRoom(player, opponent);
      
      // Notify both players
      player.socket.emit('match-found', { roomId, opponent: opponent.profile });
      opponent.socket.emit('match-found', { roomId, opponent: player.profile });
      
      // Remove from waiting list
      this.waitingPlayers = this.waitingPlayers.filter(
        p => p.id !== opponent.id
      );
    } else {
      // Add to waiting list
      this.waitingPlayers.push(player);
    }
  }
  
  findMatch(player) {
    // Match based on skill level, preferences, etc.
    return this.waitingPlayers.find(p => 
      Math.abs(p.rating - player.rating) < 200 &&
      p.preferredRules === player.preferredRules
    );
  }
}
```

## Phase 5: Additional Features

### 1. Spectator Mode
```javascript
class SpectatorSystem {
  allowSpectator(gameRoom, spectatorId) {
    gameRoom.spectators.push(spectatorId);
    // Send current game state
    this.sendGameState(spectatorId, gameRoom.gameState);
  }
  
  broadcastToSpectators(gameRoom, event, data) {
    gameRoom.spectators.forEach(spectatorId => {
      io.to(spectatorId).emit(event, data);
    });
  }
}
```

### 2. Game Recording & Replay
```javascript
class GameRecorder {
  saveGame(gameRoom) {
    return GameHistory.create({
      players: gameRoom.players.map(p => p.id),
      moves: gameRoom.moveHistory,
      result: gameRoom.result,
      duration: gameRoom.endTime - gameRoom.startTime,
      rules: gameRoom.gameState.rules
    });
  }
  
  replayGame(gameId) {
    const game = await GameHistory.findById(gameId);
    return {
      moves: game.moves,
      rules: game.rules,
      players: game.players
    };
  }
}
```

### 3. Chat System
```javascript
class GameChat {
  constructor(roomId) {
    this.roomId = roomId;
    this.messages = [];
    this.filters = ['profanity', 'spam'];
  }
  
  sendMessage(playerId, message) {
    // Filter message
    const filtered = this.filterMessage(message);
    
    const chatMessage = {
      id: uuid(),
      playerId,
      message: filtered,
      timestamp: Date.now()
    };
    
    this.messages.push(chatMessage);
    this.broadcast('chat-message', chatMessage);
  }
}
```

## Implementation Timeline

### Week 1-2: Local Network Play
- [ ] Set up Socket.io server
- [ ] Implement room creation/joining
- [ ] Add move synchronization
- [ ] Test on local network

### Week 3-4: User System
- [ ] Database setup (MongoDB/PostgreSQL)
- [ ] User registration/login
- [ ] Email verification
- [ ] OAuth2 integration

### Week 5-6: Game Server
- [ ] WebSocket game server
- [ ] Move validation
- [ ] Disconnect handling
- [ ] Game state persistence

### Week 7-8: Matchmaking
- [ ] Rating system
- [ ] Matchmaking algorithm
- [ ] Game history
- [ ] Leaderboards

### Week 9-10: Polish
- [ ] Spectator mode
- [ ] Chat system
- [ ] Replay system
- [ ] Performance optimization

## Deployment

### Option 1: Heroku (Quick Start)
```bash
# Deploy server
heroku create checkers-server
git push heroku main
heroku addons:create heroku-postgresql:hobby-dev
```

### Option 2: AWS (Scalable)
- EC2 for game servers
- RDS for database
- ElastiCache for Redis
- CloudFront for CDN
- Route 53 for DNS

### Option 3: Containerized (Docker)
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Cost Estimates

### Small Scale (< 1000 users)
- Heroku: $7-50/month
- AWS: $20-100/month
- DigitalOcean: $10-40/month

### Medium Scale (1000-10000 users)
- AWS: $100-500/month
- Google Cloud: $150-400/month
- Azure: $120-450/month

### Large Scale (> 10000 users)
- Custom infrastructure: $500-2000/month
- Load balancers, multiple servers
- CDN for global distribution

## Security Checklist
- [ ] HTTPS/WSS everywhere
- [ ] Input validation
- [ ] Rate limiting
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secure password storage (bcrypt)
- [ ] JWT token expiration
- [ ] DDoS protection (Cloudflare)

## Testing Strategy
1. **Unit Tests**: Game logic, move validation
2. **Integration Tests**: API endpoints, database
3. **Load Testing**: Concurrent games simulation
4. **Security Testing**: Penetration testing
5. **User Testing**: Beta release with feedback

## Future Enhancements
- Mobile apps (React Native)
- AI opponents in multiplayer
- Tournaments and events
- Virtual currency and cosmetics
- Friends list and private games
- Voice chat integration
- Streaming integration (Twitch)

---

This architecture provides a clear path from local play to global multiplayer, with security and scalability in mind.