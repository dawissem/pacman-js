const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const cors = require('cors');

app.use(cors());
app.use(express.static('.'));

// In-memory storage (use MongoDB/PostgreSQL for production)
const rooms = {};
const scores = [];

// Generate random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Create room
    socket.on('createRoom', (playerName) => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            host: socket.id,
            players: [{
                id: socket.id,
                name: playerName,
                x: 270,
                y: 450,
                score: 0,
                lives: 3
            }],
            gameStarted: false
        };
        
        socket.join(roomCode);
        socket.emit('roomCreated', { roomCode, players: rooms[roomCode].players });
        console.log(`Room ${roomCode} created by ${playerName}`);
    });

    // Join room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        if (!rooms[roomCode]) {
            socket.emit('error', 'Room not found');
            return;
        }

        if (rooms[roomCode].gameStarted) {
            socket.emit('error', 'Game already started');
            return;
        }

        const player = {
            id: socket.id,
            name: playerName,
            x: 300,
            y: 450,
            score: 0,
            lives: 3
        };

        rooms[roomCode].players.push(player);
        socket.join(roomCode);
        
        // Notify all players in room
        io.to(roomCode).emit('playerJoined', {
            players: rooms[roomCode].players
        });
        
        console.log(`${playerName} joined room ${roomCode}`);
    });

    // Start game
    socket.on('startGame', (roomCode) => {
        if (!rooms[roomCode] || rooms[roomCode].host !== socket.id) {
            socket.emit('error', 'Only host can start game');
            return;
        }

        rooms[roomCode].gameStarted = true;
        io.to(roomCode).emit('gameStarted');
        console.log(`Game started in room ${roomCode}`);
    });

    // Update player state
    socket.on('updatePlayer', ({ roomCode, playerState }) => {
        if (!rooms[roomCode]) return;

        const player = rooms[roomCode].players.find(p => p.id === socket.id);
        if (player) {
            Object.assign(player, playerState);
            
            // Broadcast to other players
            socket.to(roomCode).emit('playerUpdated', {
                playerId: socket.id,
                state: playerState
            });
        }
    });

    // Game over
    socket.on('gameOver', ({ roomCode, playerName, score }) => {
        saveScore(playerName, score);
        io.to(roomCode).emit('playerFinished', { playerName, score });
    });

    // Leave room
    socket.on('leaveRoom', (roomCode) => {
        leaveRoom(socket, roomCode);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        // Remove from all rooms
        Object.keys(rooms).forEach(roomCode => {
            leaveRoom(socket, roomCode);
        });
    });

    // Get leaderboard
    socket.on('getLeaderboard', () => {
        socket.emit('leaderboard', getTopScores());
    });

    // Save score
    socket.on('saveScore', ({ playerName, score }) => {
        saveScore(playerName, score);
        io.emit('leaderboard', getTopScores());
    });
});

function leaveRoom(socket, roomCode) {
    if (!rooms[roomCode]) return;

    rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== socket.id);
    
    if (rooms[roomCode].players.length === 0) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted`);
    } else {
        // If host left, assign new host
        if (rooms[roomCode].host === socket.id) {
            rooms[roomCode].host = rooms[roomCode].players[0].id;
        }
        
        io.to(roomCode).emit('playerLeft', {
            players: rooms[roomCode].players
        });
    }
    
    socket.leave(roomCode);
}

function saveScore(playerName, score) {
    scores.push({
        name: playerName,
        score: score,
        date: new Date()
    });
    
    scores.sort((a, b) => b.score - a.score);
    
    // Keep top 100
    if (scores.length > 100) {
        scores.length = 100;
    }
}

function getTopScores(limit = 10) {
    return scores.slice(0, limit);
}

// API endpoints
app.get('/api/leaderboard', (req, res) => {
    res.json(getTopScores());
});

app.get('/api/rooms', (req, res) => {
    const roomList = Object.keys(rooms).map(code => ({
        code,
        players: rooms[code].players.length,
        gameStarted: rooms[code].gameStarted
    }));
    res.json(roomList);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to play`);
});
