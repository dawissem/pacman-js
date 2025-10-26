# Pac-Man Multiplayer - JavaScript Version

A multiplayer Pac-Man game with real-time gameplay and leaderboard.

## Features

- Single Player mode
- Multiplayer mode (room-based)
- Real-time leaderboard
- Score persistence
- Responsive controls (Arrow keys or WASD)

## Quick Start (Local)

1. Open `index.html` in your browser
2. Enter your name
3. Choose Single Player or Multiplayer

**Note:** Local version uses localStorage. For real multiplayer, run the server.

## Run with Multiplayer Server

### Install Dependencies
```bash
cd web-version
npm install
```

### Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

### Development Mode (auto-restart)
```bash
npm run dev
```

## Deploy with Podman

### Build Container
```bash
podman build -t pacman-multiplayer .
```

### Run Container
```bash
podman run -d -p 3000:3000 --name pacman pacman-multiplayer
```

Open `http://localhost:3000`

### Stop Container
```bash
podman stop pacman
podman rm pacman
```

## Deploy to Cloud

### Option 1: GitHub Pages (Static Only)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pacman.git
git push -u origin main
```

Enable GitHub Pages in repo settings.

### Option 2: Heroku (With Backend)
```bash
heroku create pacman-multiplayer
git push heroku main
heroku open
```

### Option 3: Railway.app
1. Connect GitHub repo
2. Deploy automatically
3. Get public URL

### Option 4: Docker Hub + OpenShift
```bash
# Build and push
podman build -t YOUR_USERNAME/pacman-multiplayer .
podman push YOUR_USERNAME/pacman-multiplayer

# Deploy to OpenShift
oc new-app YOUR_USERNAME/pacman-multiplayer
oc expose svc/pacman-multiplayer
```

## Game Controls

- **Arrow Keys** or **WASD**: Move Pac-Man
- **Space**: Restart after Game Over

## Multiplayer

1. One player creates a room
2. Share the 6-digit room code
3. Other players join with the code
4. Host starts the game
5. All players see each other's scores

## File Structure

```
web-version/
├── index.html          # Main game page
├── game.js             # Game logic
├── multiplayer.js      # Multiplayer logic
├── server.js           # Backend server
├── package.json        # Dependencies
├── Dockerfile          # Container config
└── README.md           # This file
```

## API Endpoints

- `GET /api/leaderboard` - Get top scores
- `GET /api/rooms` - List active rooms

## WebSocket Events

**Client → Server:**
- `createRoom` - Create new room
- `joinRoom` - Join existing room
- `startGame` - Start game (host only)
- `updatePlayer` - Send player state
- `gameOver` - Game finished
- `saveScore` - Save score to leaderboard

**Server → Client:**
- `roomCreated` - Room created successfully
- `playerJoined` - New player joined
- `gameStarted` - Game has started
- `playerUpdated` - Player state changed
- `playerLeft` - Player left room
- `leaderboard` - Updated leaderboard

## Environment Variables

Create `.env` file:
```
PORT=3000
NODE_ENV=production
```

## Database (Optional)

For production, replace in-memory storage with:

**MongoDB:**
```javascript
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
```

**PostgreSQL:**
```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

## Troubleshooting

**Multiplayer not working?**
- Check server is running
- Verify port 3000 is not blocked
- Check browser console for errors

**Game lag?**
- Reduce update frequency
- Check network connection
- Close other apps

## Production Tips

1. Use environment variables for config
2. Add database for score persistence
3. Implement authentication
4. Add rate limiting
5. Use HTTPS
6. Add error logging (Sentry)
7. Enable compression
8. Add health check endpoint

## Next Steps

- Add power pellet effect (ghosts become blue/edible)
- Add more maze layouts
- Implement ghost AI that chases player
- Add sound effects
- Add mobile touch controls
- Add chat in multiplayer
- Add spectator mode
- Tournament bracket system

Enjoy!
