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
const { Pool } = require('pg');

app.use(cors());
app.use(express.static('.'));

// PostgreSQL connection
const pool = new Pool({
    user: process.env.POSTGRESQL_USER || 'pacman',
    host: process.env.POSTGRESQL_HOST || 'postgres',
    database: process.env.POSTGRESQL_DATABASE || 'pacmandb',
    password: process.env.POSTGRESQL_PASSWORD || 'pacman123',
    port: process.env.POSTGRESQL_PORT || 5432
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// In-memory storage for rooms (keep this for multiplayer)
const rooms = {};

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

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
        
        io.to(roomCode).emit('playerJoined', {
            players: rooms[roomCode].players
        });
        
        console.log(`${playerName} joined room ${roomCode}`);
    });

    socket.on('startGame', (roomCode) => {
        if (!rooms[roomCode] || rooms[roomCode].host !== socket.id) {
            socket.emit('error', 'Only host can start game');
            return;
        }

        rooms[roomCode].gameStarted = true;
        io.to(roomCode).emit('gameStarted');
        console.log(`Game started in room ${roomCode}`);
    });

    socket.on('updatePlayer', ({ roomCode, playerState }) => {
        if (!rooms[roomCode]) return;

        const player = rooms[roomCode].players.find(p => p.id === socket.id);
        if (player) {
            Object.assign(player, playerState);
            
            socket.to(roomCode).emit('playerUpdated', {
                playerId: socket.id,
                state: playerState
            });
        }
    });

    socket.on('gameOver', async ({ roomCode, playerName, score }) => {
        await saveScore(playerName, score);
        io.to(roomCode).emit('playerFinished', { playerName, score });
    });

    socket.on('leaveRoom', (roomCode) => {
        leaveRoom(socket, roomCode);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        Object.keys(rooms).forEach(roomCode => {
            leaveRoom(socket, roomCode);
        });
    });

    socket.on('getLeaderboard', async () => {
        const scores = await getTopScores();
        socket.emit('leaderboard', scores);
    });

    socket.on('saveScore', async ({ playerName, score }) => {
        await saveScore(playerName, score);
        const scores = await getTopScores();
        io.emit('leaderboard', scores);
    });
});

function leaveRoom(socket, roomCode) {
    if (!rooms[roomCode]) return;

    rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== socket.id);
    
    if (rooms[roomCode].players.length === 0) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted`);
    } else {
        if (rooms[roomCode].host === socket.id) {
            rooms[roomCode].host = rooms[roomCode].players[0].id;
        }
        
        io.to(roomCode).emit('playerLeft', {
            players: rooms[roomCode].players
        });
    }
    
    socket.leave(roomCode);
}

async function saveScore(playerName, score) {
    try {
        await pool.query(
            'INSERT INTO scores (player_name, score) VALUES ($1, $2)',
            [playerName, score]
        );
        console.log(`Score saved: ${playerName} - ${score}`);
    } catch (err) {
        console.error('Error saving score:', err);
    }
}

async function getTopScores(limit = 10) {
    try {
        const result = await pool.query(
            'SELECT player_name, score, created_at FROM scores ORDER BY score DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    } catch (err) {
        console.error('Error getting scores:', err);
        return [];
    }
}

// API endpoints
app.get('/api/leaderboard', async (req, res) => {
    const scores = await getTopScores();
    res.json(scores);
});

app.get('/api/rooms', (req, res) => {
    const roomList = Object.keys(rooms).map(code => ({
        code,
        players: rooms[code].players.length,
        gameStarted: rooms[code].gameStarted
    }));
    res.json(roomList);
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to play`);
});
