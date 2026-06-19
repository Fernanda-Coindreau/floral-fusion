// ========================================
// ANIMAL FOREST - MERGE GAME
// A cozy, whimsical physics-based merge game
// ========================================

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set initial canvas size
let canvasWidth = 600;
let canvasHeight = 700;

// Function to resize canvas based on container
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = 600;
    const maxHeight = 700;
    const aspectRatio = maxHeight / maxWidth;
    
    // Get container width
    const containerWidth = container.clientWidth - 40; // Account for padding
    
    // Calculate new dimensions
    if (containerWidth < maxWidth) {
        canvasWidth = containerWidth;
        canvasHeight = containerWidth * aspectRatio;
    } else {
        canvasWidth = maxWidth;
        canvasHeight = maxHeight;
    }
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Update game constants based on new size
    const scale = canvasWidth / 600;
    updateGameScale(scale);
}

// Update game constants when canvas is resized
function updateGameScale(scale) {
    // This will be called after canvas resize
    // Game constants will be recalculated in init()
}

// Call resize on load and orientation change
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

// Initial resize
resizeCanvas();

// Detect if user is on mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// Mobile size adjustment factor
const mobileSizeMultiplier = isMobile ? 0.75 : 1.0; // 25% smaller on mobile

// Game state
const gameState = {
    score: 0,
    level: 1,
    animals: [],
    nextAnimal: null,
    droppingAnimal: null,
    isGameOver: false,
    particles: [],
    unicornsCreated: 0,
    unicornsNeeded: 1,
    difficulty: 'easy', // easy, medium, hard
    soundEnabled: true,
    lastAnimalLevel: null,  // Track last spawned animal level
    secondLastAnimalLevel: null  // Track second-to-last spawned animal level
};

// Sound effects (using Web Audio API)
const sounds = {
    drop: null,
    merge: null,
    levelUp: null,
    gameOver: null
};

// Initialize sound effects
function initSounds() {
    // Create simple beep sounds using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    sounds.playDrop = () => {
        if (!gameState.soundEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 200;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    sounds.playMerge = () => {
        if (!gameState.soundEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };
    
    sounds.playLevelUp = () => {
        if (!gameState.soundEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
    
    sounds.playGameOver = () => {
        if (!gameState.soundEnabled) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    };
}

// Creature definitions - 10 levels of adorable evolution!
// Base sizes (will be adjusted for mobile)
const creaturesBase = [
    { level: 1, emoji: '🐌', name: 'Snail', baseSize: 20 },
    { level: 2, emoji: '🦋', name: 'Butterfly', baseSize: 25 },
    { level: 3, emoji: '🐰', name: 'Bunny', baseSize: 30 },
    { level: 4, emoji: '🐱', name: 'Kitty', baseSize: 35 },
    { level: 5, emoji: '🐶', name: 'Puppy', baseSize: 40 },
    { level: 6, emoji: '🦊', name: 'Fox', baseSize: 45 },
    { level: 7, emoji: '🐻', name: 'Bear', baseSize: 50 },
    { level: 8, emoji: '🦁', name: 'Lion', baseSize: 55 },
    { level: 9, emoji: '🐯', name: 'Tiger', baseSize: 60 },
    { level: 10, emoji: '🦄', name: 'Unicorn', baseSize: 65 }
];

// Apply mobile size adjustment
const creatures = creaturesBase.map(creature => ({
    ...creature,
    size: Math.round(creature.baseSize * mobileSizeMultiplier)
}));

// Physics constants (adjusted by difficulty)
let GRAVITY = 0.8;
let SPAWN_DELAY = 0;
const BOUNCE_DAMPING = 0.3;
const FLOOR_Y = canvas.height - 50;
const WALL_LEFT = 100;
const WALL_RIGHT = canvas.width - 100;

// Difficulty settings
const difficultySettings = {
    easy: {
        gravity: 0.6,
        spawnLevels: [1, 2],
        spawnWeights: [0.80, 0.20],
        dropSpeed: 1.0
    },
    medium: {
        gravity: 0.8,
        spawnLevels: [1, 2, 3],
        spawnWeights: [0.60, 0.30, 0.10],
        dropSpeed: 1.2
    },
    hard: {
        gravity: 1.0,
        spawnLevels: [1, 2, 3, 4],
        spawnWeights: [0.50, 0.30, 0.15, 0.05],
        dropSpeed: 1.5
    }
};

// ========================================
// INITIALIZATION
// ========================================

function init() {
    gameState.score = 0;
    gameState.level = 1;
    gameState.animals = [];
    gameState.isGameOver = false;
    gameState.particles = [];
    gameState.unicornsCreated = 0;
    gameState.unicornsNeeded = 1;
    gameState.nextAnimal = generateRandomAnimal();
    
    updateUI();
    hideGameOverModal();
    gameLoop();
}

// Generate a random animal (weighted towards lower levels, gets harder with game level)
// Prevents more than 2 consecutive animals of the same type
function generateRandomAnimal() {
    let level;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
        const rand = Math.random();
        
        // Difficulty increases with game level
        // Level 1-2: Only spawn level 1-2 animals
        // Level 3-4: Spawn level 1-3 animals
        // Level 5+: Spawn level 1-4 animals
        
        if (gameState.level <= 2) {
            if (rand < 0.75) level = 1;
            else level = 2;
        } else if (gameState.level <= 4) {
            if (rand < 0.60) level = 1;
            else if (rand < 0.90) level = 2;
            else level = 3;
        } else {
            if (rand < 0.50) level = 1;
            else if (rand < 0.75) level = 2;
            else if (rand < 0.92) level = 3;
            else level = 4;
        }
        
        attempts++;
        
        // If we've tried too many times, just accept any level
        if (attempts >= maxAttempts) break;
        
    } while (level === gameState.lastAnimalLevel && level === gameState.secondLastAnimalLevel);
    
    // Update history
    gameState.secondLastAnimalLevel = gameState.lastAnimalLevel;
    gameState.lastAnimalLevel = level;
    
    const creature = creatures[level - 1];
    return {
        level: level,
        emoji: creature.emoji,
        size: creature.size,
        x: canvas.width / 2,
        y: 80,
        vx: 0,
        vy: 0,
        isPreview: true
    };
}

// ========================================
// GAME LOOP
// ========================================

function gameLoop() {
    if (gameState.isGameOver) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw forest background
    drawForest();
    
    // Update and draw particles
    updateParticles();
    
    // Update physics for dropping animal
    if (gameState.droppingAnimal) {
        updateDroppingAnimal();
    }
    
    // Apply physics to all settled animals
    applyPhysicsToAllAnimals();
    
    // Draw all settled animals
    gameState.animals.forEach(animal => {
        drawAnimal(animal);
    });
    
    // Draw dropping animal
    if (gameState.droppingAnimal) {
        drawAnimal(gameState.droppingAnimal);
    }
    
    // Draw next animal preview
    if (gameState.nextAnimal) {
        drawNextAnimalPreview();
    }
    
    requestAnimationFrame(gameLoop);
}

// ========================================
// DRAWING FUNCTIONS
// ========================================

function drawForest() {
    // Sky gradient (already in CSS, but add some details)
    
    // Draw trees on the sides
    drawTree(30, FLOOR_Y - 150, 40, 150);
    drawTree(canvas.width - 70, FLOOR_Y - 180, 50, 180);
    
    // Draw mushrooms
    drawMushroom(80, FLOOR_Y - 20, 15);
    drawMushroom(canvas.width - 100, FLOOR_Y - 25, 18);
    
    // Draw flowers
    drawFlower(120, FLOOR_Y - 10, '#FFB6D9');
    drawFlower(canvas.width - 140, FLOOR_Y - 10, '#D4A5FF');
    drawFlower(200, FLOOR_Y - 8, '#FFC9DE');
    
    // Forest floor
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, FLOOR_Y, canvas.width, 50);
    
    // Grass on floor
    ctx.fillStyle = '#7FB069';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i, FLOOR_Y, 10, 5);
    }
}

function drawTree(x, y, width, height) {
    // Tree trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - width/4, y, width/2, height);
    
    // Tree foliage (simple circles)
    ctx.fillStyle = '#7FB069';
    ctx.beginPath();
    ctx.arc(x, y - 20, width * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#A8D5BA';
    ctx.beginPath();
    ctx.arc(x - 15, y - 10, width * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + 15, y - 10, width * 0.6, 0, Math.PI * 2);
    ctx.fill();
}

function drawMushroom(x, y, size) {
    // Mushroom stem
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(x - size/3, y, size * 0.6, size);
    
    // Mushroom cap
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // White spots
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 5, y - 3, 3, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawFlower(x, y, color) {
    // Flower petals
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const petalX = x + Math.cos(angle) * 6;
        const petalY = y + Math.sin(angle) * 6;
        ctx.beginPath();
        ctx.arc(petalX, petalY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Flower center
    ctx.fillStyle = '#FFF5B4';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawAnimal(animal) {
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(animal.x, animal.y + animal.size + 5, animal.size * 0.8, animal.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw white background circle to make emoji more visible
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(animal.x, animal.y, animal.size + 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw glow effect for preview
    if (animal.isPreview) {
        ctx.shadowColor = '#FFB6D9';
        ctx.shadowBlur = 20;
    }
    
    // Draw the emoji with text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.font = `${animal.size * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(animal.emoji, animal.x, animal.y);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function drawNextAnimalPreview() {
    const preview = gameState.nextAnimal;
    
    // Gentle floating animation
    const floatOffset = Math.sin(Date.now() / 500) * 5;
    preview.y = 80 + floatOffset;
    
    drawAnimal(preview);
    
    // Draw arrow
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('↓', preview.x, preview.y + 40);
}

// ========================================
// PHYSICS & COLLISION
// ========================================

function updateDroppingAnimal() {
    const animal = gameState.droppingAnimal;
    
    // Apply gravity
    animal.vy += GRAVITY;
    animal.y += animal.vy;
    animal.x += animal.vx;
    
    // Wall collision
    if (animal.x - animal.size < WALL_LEFT) {
        animal.x = WALL_LEFT + animal.size;
        animal.vx *= -BOUNCE_DAMPING;
    }
    if (animal.x + animal.size > WALL_RIGHT) {
        animal.x = WALL_RIGHT - animal.size;
        animal.vx *= -BOUNCE_DAMPING;
    }
    
    // Floor collision
    if (animal.y + animal.size >= FLOOR_Y) {
        animal.y = FLOOR_Y - animal.size;
        animal.vy = 0;
        animal.vx = 0;
        settleAnimal(animal);
        return;
    }
    
    // Check collision with other animals
    for (let other of gameState.animals) {
        const dx = animal.x - other.x;
        const dy = animal.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if animals are touching
        if (distance < (animal.size + other.size + 10)) {
            // Check if they're the same level - merge immediately!
            if (animal.level === other.level && animal.level < 10) {
                // Stop the animal at current position
                animal.vy = 0;
                animal.vx = 0;
                animal.isPreview = false;
                
                // Perform merge immediately
                const mergeX = (animal.x + other.x) / 2;
                const mergeY = (animal.y + other.y) / 2;
                
                // Remove the other animal
                gameState.animals = gameState.animals.filter(a => a !== other);
                
                // Create merged animal
                const newLevel = animal.level + 1;
                const creature = creatures[newLevel - 1];
                const mergedAnimal = {
                    level: newLevel,
                    emoji: creature.emoji,
                    size: creature.size,
                    x: mergeX,
                    y: mergeY,
                    vx: 0,
                    vy: 0,
                    isPreview: false
                };
                
                gameState.animals.push(mergedAnimal);
                
                // Add score
                const points = animal.level * 10;
                gameState.score += points;
                updateUI();
                
                // Play merge sound
                playMergeSound();
                
                // Create sparkles
                createSparkles(mergeX, mergeY);
                
                // Clear dropping animal
                gameState.droppingAnimal = null;
                
                // Generate next animal
                gameState.nextAnimal = generateRandomAnimal();
                
                // Check for chain merges
                setTimeout(() => checkMerges(mergedAnimal), 200);
                
                return;
            } else {
                // Different levels - just stack them
                const angle = Math.atan2(animal.y - other.y, animal.x - other.x);
                animal.x = other.x + Math.cos(angle) * (animal.size + other.size);
                animal.y = other.y + Math.sin(angle) * (animal.size + other.size);
                
                // Stop the animal
                animal.vy = 0;
                animal.vx = 0;
                
                settleAnimal(animal);
                return;
            }
        }
    }
}

function checkCollision(a1, a2) {
    const dx = a1.x - a2.x;
    const dy = a1.y - a2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // More generous collision detection for merging
    return distance < (a1.size + a2.size + 10);
}

function settleAnimal(animal) {
    animal.isPreview = false;
    animal.vy = 0;
    animal.vx = 0;
    
    // Check for immediate merge BEFORE adding to array
    let merged = false;
    for (let i = 0; i < gameState.animals.length; i++) {
        const other = gameState.animals[i];
        
        // Check if same level and touching
        if (other.level === animal.level && checkCollision(animal, other)) {
            // Can't merge unicorns (max level)
            if (animal.level >= 10) continue;
            
            // MERGE immediately!
            performMerge(animal, other, i);
            merged = true;
            break;
        }
    }
    
    // Only add to array if it didn't merge
    if (!merged) {
        gameState.animals.push(animal);
        
        // After adding, check if it can merge with any neighbors
        setTimeout(() => {
            checkAllMerges();
        }, 100);
    }
    
    gameState.droppingAnimal = null;
    
    // Generate next animal
    gameState.nextAnimal = generateRandomAnimal();
    
    // Check game over
    checkGameOver();
}

// Apply continuous physics to all animals (Tetris-style)
function applyPhysicsToAllAnimals() {
    // Apply gravity to all animals - they always fall until supported
    gameState.animals.forEach(animal => {
        // Apply gravity
        animal.vy += GRAVITY;
        animal.y += animal.vy;
        animal.x += animal.vx;
        
        // Floor collision
        if (animal.y + animal.size >= FLOOR_Y) {
            animal.y = FLOOR_Y - animal.size;
            animal.vy = 0;
        }
        
        // Wall collision
        if (animal.x - animal.size < WALL_LEFT) {
            animal.x = WALL_LEFT + animal.size;
            animal.vx = 0;
        }
        if (animal.x + animal.size > WALL_RIGHT) {
            animal.x = WALL_RIGHT - animal.size;
            animal.vx = 0;
        }
        
        // Damping
        animal.vx *= 0.9;
        animal.vy *= 0.95;
    });
    
    // Resolve collisions - animals must always be touching (Tetris-style)
    for (let i = 0; i < gameState.animals.length; i++) {
        for (let j = i + 1; j < gameState.animals.length; j++) {
            const a1 = gameState.animals[i];
            const a2 = gameState.animals[j];
            
            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = a1.size + a2.size;
            
            // If overlapping, push them apart so they're just touching
            if (distance < minDist && distance > 0) {
                const overlap = minDist - distance;
                const angle = Math.atan2(dy, dx);
                
                // Push them apart to exactly touch
                const pushX = Math.cos(angle) * overlap * 0.5;
                const pushY = Math.sin(angle) * overlap * 0.5;
                
                a1.x -= pushX;
                a1.y -= pushY;
                a2.x += pushX;
                a2.y += pushY;
                
                // Stop vertical movement when stacked
                if (Math.abs(dy) > Math.abs(dx)) {
                    // Vertical stack - stop falling
                    if (a1.y < a2.y) {
                        a1.vy = 0;
                    } else {
                        a2.vy = 0;
                    }
                }
            }
        }
    }
    
    // Check for merges every frame
    checkAllMerges();
}

// ========================================
// MERGE LOGIC
// ========================================

function checkAllMerges() {
    // Check all animals for possible merges
    for (let i = 0; i < gameState.animals.length; i++) {
        for (let j = i + 1; j < gameState.animals.length; j++) {
            const animal1 = gameState.animals[i];
            const animal2 = gameState.animals[j];
            
            // Check if same level and touching
            if (animal1.level === animal2.level && checkCollision(animal1, animal2)) {
                // Can't merge unicorns (max level)
                if (animal1.level >= 10) continue;
                
                // MERGE!
                performMerge(animal1, animal2, j);
                return; // Only one merge at a time, then recheck
            }
        }
    }
}

function checkMerges(newAnimal) {
    for (let i = 0; i < gameState.animals.length; i++) {
        const other = gameState.animals[i];
        
        // Skip self
        if (other === newAnimal) continue;
        
        // Check if same level and touching
        if (other.level === newAnimal.level && checkCollision(newAnimal, other)) {
            // Can't merge unicorns (max level)
            if (newAnimal.level >= 10) continue;
            
            // MERGE!
            performMerge(newAnimal, other, i);
            return; // Only one merge at a time
        }
    }
}

function performMerge(animal1, animal2, otherIndex) {
    // Calculate merge position (midpoint)
    const mergeX = (animal1.x + animal2.x) / 2;
    const mergeY = (animal1.y + animal2.y) / 2;
    
    // Remove both animals from the array
    gameState.animals = gameState.animals.filter(a => a !== animal1 && a !== animal2);
    
    // Create new higher-level animal
    const newLevel = animal1.level + 1;
    const creature = creatures[newLevel - 1];
    const mergedAnimal = {
        level: newLevel,
        emoji: creature.emoji,
        size: creature.size,
        x: mergeX,
        y: mergeY,
        vx: 0,
        vy: 0,
        isPreview: false
    };
    
    mergedAnimal.settled = false; // New merged animal needs to settle
    gameState.animals.push(mergedAnimal);
    
    // Add score
    const points = animal1.level * 10;
    gameState.score += points;
    updateUI();
    
    // Play merge sound effect
    playMergeSound();
    
    // Create sparkle particles
    createSparkles(mergeX, mergeY);
    
    // Check if unicorn was created!
    if (newLevel === 10) {
        gameState.unicornsCreated++;
        updateUI();
        
        // Check if level goal is reached
        if (gameState.unicornsCreated >= gameState.unicornsNeeded) {
            setTimeout(() => {
                showLevelCompleteModal();
            }, 1000);
        }
    }
}

function showLevelCompleteModal() {
    const modal = document.getElementById('gameOverModal');
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <h2>🦄 LEVEL ${gameState.level} COMPLETE! 🦄</h2>
        <p class="final-score">You created ${gameState.unicornsCreated} Unicorn${gameState.unicornsCreated > 1 ? 's' : ''}!</p>
        <p class="highest-creature">Score: ${gameState.score}</p>
        <button id="nextLevelBtn" class="restart-btn">✨ Next Level</button>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        // Move to next level
        gameState.level++;
        gameState.unicornsCreated = 0;
        gameState.unicornsNeeded = gameState.level; // Level 2 needs 2 unicorns, etc.
        
        // Clear animals
        gameState.animals = [];
        gameState.droppingAnimal = null;
        gameState.nextAnimal = generateRandomAnimal();
        gameState.isGameOver = false;
        
        updateUI();
        modal.classList.add('hidden');
        
        // Restore original modal content for game over
        modalContent.innerHTML = `
            <h2>🌸 Game Over! 🌸</h2>
            <p class="final-score">Final Score: <span id="finalScore">0</span></p>
            <p class="highest-creature">Highest Creature: <span id="highestCreature">🐰</span></p>
            <button id="restartBtn" class="restart-btn">🔄 Play Again</button>
        `;
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            init();
        });
    });
}

// ========================================
// PARTICLES
// ========================================

function createSparkles(x, y) {
    for (let i = 0; i < 15; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: ['#FFB6D9', '#D4A5FF', '#FFC9DE', '#FFF5B4'][Math.floor(Math.random() * 4)]
        });
    }
}

function updateParticles() {
    gameState.particles = gameState.particles.filter(p => p.life > 0);
    
    gameState.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life -= 0.02;
        
        // Draw particle
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

// ========================================
// LEVEL PROGRESSION
// ========================================

// Note: Level is now controlled by completing unicorn goals, not by score
// This function is kept for compatibility but doesn't change the level anymore
function updateLevel() {
    // Level only changes when player completes unicorn goals
    // See showLevelCompleteModal() for level progression
}

// ========================================
// UI UPDATES
// ========================================

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('unicornsCreated').textContent = gameState.unicornsCreated;
    document.getElementById('unicornsNeeded').textContent = gameState.unicornsNeeded;
}

function showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    const highestCreature = getHighestCreature();
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('highestCreature').textContent = highestCreature.emoji + ' ' + highestCreature.name;
    
    modal.classList.remove('hidden');
}

function hideGameOverModal() {
    document.getElementById('gameOverModal').classList.add('hidden');
}

function getHighestCreature() {
    let maxLevel = 1;
    gameState.animals.forEach(animal => {
        if (animal.level > maxLevel) maxLevel = animal.level;
    });
    return creatures[maxLevel - 1];
}

// ========================================
// GAME OVER
// ========================================

function checkGameOver() {
    // Check if any animal is above the danger zone
    const dangerZone = 120;
    
    for (let animal of gameState.animals) {
        if (animal.y - animal.size < dangerZone) {
            gameState.isGameOver = true;
            showGameOverModal();
            return;
        }
    }
}

// ========================================
// EVENT HANDLERS
// ========================================

canvas.addEventListener('click', (e) => {
    if (gameState.isGameOver || gameState.droppingAnimal) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Make sure click is within play area
    if (clickX < WALL_LEFT || clickX > WALL_RIGHT) return;
    
    // Drop the animal!
    const animal = gameState.nextAnimal;
    animal.x = clickX;
    animal.y = 100;
    animal.vx = 0;
    animal.vy = 0;
    animal.isPreview = false;
    
    gameState.droppingAnimal = animal;
    gameState.nextAnimal = null;
});

document.getElementById('restartBtn').addEventListener('click', () => {
    init();
});

// Evolution Sequence Modal
document.getElementById('sequenceBtn').addEventListener('click', () => {
    document.getElementById('sequenceModal').classList.remove('hidden');
});

document.getElementById('closeSequenceBtn').addEventListener('click', () => {
    document.getElementById('sequenceModal').classList.add('hidden');
});

// Close sequence modal when clicking outside
document.getElementById('sequenceModal').addEventListener('click', (e) => {
    if (e.target.id === 'sequenceModal') {
        document.getElementById('sequenceModal').classList.add('hidden');
    }
});

// ========================================
// SOUND MANAGEMENT
// ========================================

let isMusicPlaying = false;
const backgroundMusic = document.getElementById('backgroundMusic');
const mergeSound = document.getElementById('mergeSound');
const soundToggle = document.getElementById('soundToggle');

// Set audio volumes
backgroundMusic.volume = 0.6;  // Música de fondo más fuerte
mergeSound.volume = 0.3;       // Efecto de merge más bajo

// Volume control elements
const volumeControl = document.getElementById('volumeControl');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

// Sound toggle button - also toggles volume control visibility
soundToggle.addEventListener('click', () => {
    if (isMusicPlaying) {
        backgroundMusic.pause();
        soundToggle.textContent = '🔇';
        isMusicPlaying = false;
        volumeControl.classList.add('hidden');
    } else {
        backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
        soundToggle.textContent = '🔊';
        isMusicPlaying = true;
        volumeControl.classList.remove('hidden');
    }
});

// Volume slider control
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    backgroundMusic.volume = volume;
    volumeValue.textContent = e.target.value + '%';
});

// Function to play merge sound - ALWAYS plays when music is on
function playMergeSound() {
    try {
        // Reset and play the merge sound
        mergeSound.currentTime = 0;
        mergeSound.play().catch(e => {
            console.log('Merge sound failed:', e);
            // Try alternative method
            const sound = new Audio('Sound Effects/Background.mp3');
            sound.volume = 0.3;
            sound.play().catch(err => console.log('Alternative sound failed:', err));
        });
    } catch (error) {
        console.log('Sound error:', error);
    }
}

// ========================================
// DIFFICULTY SELECTION
// ========================================

// Show difficulty modal on start
document.addEventListener('DOMContentLoaded', () => {
    const difficultyModal = document.getElementById('difficultyModal');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const difficulty = btn.getAttribute('data-difficulty');
            gameState.difficulty = difficulty;
            
            // Apply difficulty settings
            const settings = difficultySettings[difficulty];
            GRAVITY = settings.gravity;
            
            // Update UI
            document.getElementById('difficultyDisplay').textContent = 
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            
            // Hide modal and start game
            difficultyModal.classList.add('hidden');
            
            // Start game
            init();
        });
    });
});

