// Game Configuration
const CELL_SIZE = 30;
const ROWS = 21;
const COLS = 20;
const PACMAN_SPEED = 2;
const GHOST_SPEED = 1.5;

// Game State
let canvas, ctx;
let gameRunning = false;
let score = 0;
let lives = 3;
let playerName = "";
let gameMode = "single"; // "single" or "multiplayer"

// Maze (1=wall, 0=empty, 2=dot, 3=power pellet)
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,3,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,1,1,0,0,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Pac-Man
class PacMan {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.radius = CELL_SIZE / 2 - 2;
        this.mouthAngle = 0;
        this.mouthOpening = true;
    }

    update() {
        // Try to change direction
        const nextX = this.x + this.nextDirection.x * PACMAN_SPEED;
        const nextY = this.y + this.nextDirection.y * PACMAN_SPEED;
        
        if (!this.checkCollision(nextX, nextY)) {
            this.direction = { ...this.nextDirection };
        }

        // Move
        const newX = this.x + this.direction.x * PACMAN_SPEED;
        const newY = this.y + this.direction.y * PACMAN_SPEED;
        
        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }

        // Animate mouth
        if (this.mouthOpening) {
            this.mouthAngle += 2;
            if (this.mouthAngle >= 45) this.mouthOpening = false;
        } else {
            this.mouthAngle -= 2;
            if (this.mouthAngle <= 0) this.mouthOpening = true;
        }

        // Check dot collision
        this.checkDotCollision();
    }

    checkCollision(x, y) {
        const corners = [
            { x: x - this.radius + 5, y: y - this.radius + 5 },
            { x: x + this.radius - 5, y: y - this.radius + 5 },
            { x: x - this.radius + 5, y: y + this.radius - 5 },
            { x: x + this.radius - 5, y: y + this.radius - 5 }
        ];

        for (let corner of corners) {
            const col = Math.floor(corner.x / CELL_SIZE);
            const row = Math.floor(corner.y / CELL_SIZE);
            
            if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                if (maze[row][col] === 1) return true;
            }
        }
        return false;
    }

    checkDotCollision() {
        const col = Math.floor(this.x / CELL_SIZE);
        const row = Math.floor(this.y / CELL_SIZE);
        
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
            if (maze[row][col] === 2) {
                maze[row][col] = 0;
                score += 10;
                updateScore();
            } else if (maze[row][col] === 3) {
                maze[row][col] = 0;
                score += 50;
                updateScore();
            }
        }
    }

    draw() {
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        
        if (this.direction.x === 0 && this.direction.y === 0) {
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        } else {
            let startAngle = 0;
            let endAngle = Math.PI * 2;
            
            // Calculate mouth direction
            if (this.direction.x > 0) { // Right
                startAngle = (this.mouthAngle * Math.PI) / 180;
                endAngle = (360 - this.mouthAngle) * Math.PI / 180;
            } else if (this.direction.x < 0) { // Left
                startAngle = (180 - this.mouthAngle) * Math.PI / 180;
                endAngle = (180 + this.mouthAngle) * Math.PI / 180;
            } else if (this.direction.y < 0) { // Up
                startAngle = (270 - this.mouthAngle) * Math.PI / 180;
                endAngle = (270 + this.mouthAngle) * Math.PI / 180;
            } else if (this.direction.y > 0) { // Down
                startAngle = (90 - this.mouthAngle) * Math.PI / 180;
                endAngle = (90 + this.mouthAngle) * Math.PI / 180;
            }
            
            ctx.arc(this.x, this.y, this.radius, startAngle, endAngle);
            ctx.lineTo(this.x, this.y);
        }
        
        ctx.fill();
    }
}

// Ghost
class Ghost {
    constructor(x, y, color) {
        this.x = x * CELL_SIZE + CELL_SIZE / 2;
        this.y = y * CELL_SIZE + CELL_SIZE / 2;
        this.color = color;
        this.direction = { x: 1, y: 0 };
        this.radius = CELL_SIZE / 2 - 2;
    }

    update() {
        // Simple AI
        if (Math.random() < 0.02) {
            const directions = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ];
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }

        const newX = this.x + this.direction.x * GHOST_SPEED;
        const newY = this.y + this.direction.y * GHOST_SPEED;
        
        if (!this.checkCollision(newX, newY)) {
            this.x = newX;
            this.y = newY;
        } else {
            const directions = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ];
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }
    }

    checkCollision(x, y) {
        const corners = [
            { x: x - this.radius + 5, y: y - this.radius + 5 },
            { x: x + this.radius - 5, y: y - this.radius + 5 },
            { x: x - this.radius + 5, y: y + this.radius - 5 },
            { x: x + this.radius - 5, y: y + this.radius - 5 }
        ];

        for (let corner of corners) {
            const col = Math.floor(corner.x / CELL_SIZE);
            const row = Math.floor(corner.y / CELL_SIZE);
            
            if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                if (maze[row][col] === 1) return true;
            }
        }
        return false;
    }

    draw() {
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 6, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 6, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 6, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 6, this.y - 6, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game Objects
let pacman;
let ghosts = [];

// Initialize
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    loadLeaderboard();
    
    document.addEventListener('keydown', handleKeyPress);
}

function startSinglePlayer() {
    playerName = document.getElementById('playerName').value.trim() || 'Player';
    gameMode = 'single';
    startGame();
}

function startGame() {
    document.getElementById('menuScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('displayName').textContent = playerName;
    
    // Reset game
    score = 0;
    lives = 3;
    updateScore();
    updateLives();
    
    // Reset maze
    resetMaze();
    
    // Create game objects
    pacman = new PacMan(9 * CELL_SIZE + CELL_SIZE / 2, 15 * CELL_SIZE + CELL_SIZE / 2);
    ghosts = [
        new Ghost(9, 9, '#FF0000'),
        new Ghost(10, 9, '#FFC0CB'),
        new Ghost(9, 10, '#00FFFF'),
        new Ghost(10, 10, '#FFA500')
    ];
    
    gameRunning = true;
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Update
    pacman.update();
    ghosts.forEach(ghost => ghost.update());
    
    // Check ghost collision
    if (checkGhostCollision()) {
        lives--;
        updateLives();
        
        if (lives <= 0) {
            gameOver();
            return;
        } else {
            // Reset positions
            pacman.x = 9 * CELL_SIZE + CELL_SIZE / 2;
            pacman.y = 15 * CELL_SIZE + CELL_SIZE / 2;
            pacman.direction = { x: 0, y: 0 };
        }
    }
    
    // Draw
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMaze();
    pacman.draw();
    ghosts.forEach(ghost => ghost.draw());
    
    requestAnimationFrame(gameLoop);
}

function drawMaze() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            
            if (maze[row][col] === 1) {
                ctx.fillStyle = '#0000FF';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            } else if (maze[row][col] === 2) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (maze[row][col] === 3) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function resetMaze() {
    const originalMaze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
        [1,3,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
        [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
        [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
        [1,1,1,1,2,1,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
        [1,1,1,1,2,1,0,1,1,0,0,1,1,0,1,2,1,1,1,1],
        [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
        [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
        [1,1,1,1,2,1,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
        [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
        [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
        [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
        [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            maze[i][j] = originalMaze[i][j];
        }
    }
}

function checkGhostCollision() {
    for (let ghost of ghosts) {
        const distance = Math.sqrt(
            Math.pow(pacman.x - ghost.x, 2) + 
            Math.pow(pacman.y - ghost.y, 2)
        );
        if (distance < (pacman.radius + ghost.radius) * 0.8) {
            return true;
        }
    }
    return false;
}

function handleKeyPress(e) {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            pacman.nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            pacman.nextDirection = { x: 1, y: 0 };
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            pacman.nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            pacman.nextDirection = { x: 0, y: 1 };
            break;
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateLives() {
    document.getElementById('lives').textContent = lives;
}

function gameOver() {
    gameRunning = false;
    saveScore(playerName, score);
    alert(`Game Over! Final Score: ${score}`);
    backToMenu();
}

function restartGame() {
    startGame();
}

function backToMenu() {
    gameRunning = false;
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('menuScreen').style.display = 'block';
    loadLeaderboard();
}

// Local Storage for scores
function saveScore(name, scoreValue) {
    let scores = JSON.parse(localStorage.getItem('pacmanScores') || '[]');
    scores.push({ name, score: scoreValue, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10); // Keep top 10
    localStorage.setItem('pacmanScores', JSON.stringify(scores));
    loadLeaderboard();
}

function loadLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('pacmanScores') || '[]');
    const list = document.getElementById('leaderboardList');
    
    if (scores.length === 0) {
        list.innerHTML = '<div style="color: #888;">No scores yet!</div>';
        return;
    }
    
    list.innerHTML = scores.map((entry, index) => `
        <div class="leaderboard-entry">
            <span class="rank">#${index + 1}</span>
            <span>${entry.name}</span>
            <span>${entry.score}</span>
        </div>
    `).join('');
}

// Initialize on load
window.onload = init;
