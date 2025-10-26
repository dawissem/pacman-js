// Multiplayer functionality using WebSocket (Socket.io simulation with localStorage)
// For real multiplayer, you'd need a backend server with Socket.io

let currentRoom = null;
let playersInRoom = [];
let isHost = false;

function showMultiplayerMenu() {
    playerName = document.getElementById('playerName').value.trim() || 'Player';
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('multiplayerMenu').classList.add('active');
}

function showMainMenu() {
    document.getElementById('multiplayerMenu').classList.remove('active');
    document.getElementById('roomLobby').classList.remove('active');
    document.getElementById('menuScreen').style.display = 'block';
    currentRoom = null;
}

function createRoom() {
    // Generate 6-character room code
    currentRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    isHost = true;
    
    // Store room in localStorage (simulated backend)
    const room = {
        code: currentRoom,
        host: playerName,
        players: [playerName],
        created: Date.now()
    };
    
    localStorage.setItem(`room_${currentRoom}`, JSON.stringify(room));
    
    showRoomLobby();
}

function joinRoom() {
    const code = document.getElementById('joinRoomCode').value.trim().toUpperCase();
    
    if (!code) {
        alert('Please enter a room code');
        return;
    }
    
    const roomData = localStorage.getItem(`room_${code}`);
    
    if (!roomData) {
        alert('Room not found!');
        return;
    }
    
    currentRoom = code;
    const room = JSON.parse(roomData);
    
    if (!room.players.includes(playerName)) {
        room.players.push(playerName);
        localStorage.setItem(`room_${code}`, JSON.stringify(room));
    }
    
    isHost = false;
    showRoomLobby();
}

function showRoomLobby() {
    document.getElementById('multiplayerMenu').classList.remove('active');
    document.getElementById('roomLobby').classList.add('active');
    document.getElementById('roomCode').textContent = currentRoom;
    
    updatePlayerList();
    
    // Poll for updates every second
    setInterval(updatePlayerList, 1000);
}

function updatePlayerList() {
    if (!currentRoom) return;
    
    const roomData = localStorage.getItem(`room_${currentRoom}`);
    if (!roomData) return;
    
    const room = JSON.parse(roomData);
    playersInRoom = room.players;
    
    const list = document.getElementById('playerList');
    list.innerHTML = '<h3>Players:</h3>' + 
        room.players.map((p, i) => `
            <div style="padding: 5px; ${p === playerName ? 'color: #0f0;' : ''}">
                ${i + 1}. ${p} ${p === room.host ? '(Host)' : ''}
            </div>
        `).join('');
}

function leaveRoom() {
    if (currentRoom) {
        const roomData = localStorage.getItem(`room_${currentRoom}`);
        if (roomData) {
            const room = JSON.parse(roomData);
            room.players = room.players.filter(p => p !== playerName);
            
            if (room.players.length === 0) {
                localStorage.removeItem(`room_${currentRoom}`);
            } else {
                localStorage.setItem(`room_${currentRoom}`, JSON.stringify(room));
            }
        }
    }
    
    showMainMenu();
}

function startMultiplayerGame() {
    if (!isHost) {
        alert('Only the host can start the game!');
        return;
    }
    
    gameMode = 'multiplayer';
    document.getElementById('roomLobby').classList.remove('active');
    startGame();
}

// Multiplayer game sync (simplified - in real app, use WebSocket)
function syncMultiplayerState() {
    if (gameMode !== 'multiplayer' || !currentRoom) return;
    
    const gameState = {
        playerName: playerName,
        pacmanX: pacman.x,
        pacmanY: pacman.y,
        score: score,
        lives: lives,
        timestamp: Date.now()
    };
    
    localStorage.setItem(`game_${currentRoom}_${playerName}`, JSON.stringify(gameState));
}

// For real multiplayer, you would:
// 1. Set up a Node.js server with Socket.io
// 2. Connect clients via WebSocket
// 3. Sync game state in real-time
// 4. Handle multiple pac-mans in same maze
// 5. Implement collision detection between players

/* 
REAL MULTIPLAYER SETUP (requires backend):

Backend (server.js):
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const rooms = {};

io.on('connection', (socket) => {
    socket.on('createRoom', (playerName) => {
        const roomCode = generateCode();
        rooms[roomCode] = { players: [{ id: socket.id, name: playerName }] };
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });
    
    socket.on('joinRoom', (roomCode, playerName) => {
        if (rooms[roomCode]) {
            rooms[roomCode].players.push({ id: socket.id, name: playerName });
            socket.join(roomCode);
            io.to(roomCode).emit('playerJoined', rooms[roomCode].players);
        }
    });
    
    socket.on('gameState', (roomCode, state) => {
        socket.to(roomCode).emit('updateGame', state);
    });
});

server.listen(3000);

Frontend (connect to server):
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.emit('createRoom', playerName);
socket.on('roomCreated', (code) => {
    currentRoom = code;
});
*/
