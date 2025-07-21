// Chrono Heist - The Time Loop Puzzle
// Core Game Engine

class ChronoHeist {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        
        // Game state
        this.currentLoop = 1;
        this.timeRemaining = 90;
        this.gamePhase = 'planning'; // planning, action, extraction
        this.gameStarted = false;
        
        // Player and clones
        this.player = new Player(100, 100);
        this.clones = [];
        this.recordedActions = [];
        this.currentRecording = [];
        
        // Game world
        this.vault = new Vault();
        this.security = new SecuritySystem();
        this.collectibles = [];
        this.objectives = [];
        
        // Input handling
        this.keys = {};
        this.setupEventListeners();
        
        // Game loop
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Initialize game world
        this.initializeWorld();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'r' && this.gameStarted) {
                this.resetLoop();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    initializeWorld() {
        // Create vault layout
        this.vault.generateLayout();
        
        // Place collectibles
        this.collectibles = [
            new Collectible(300, 200, 'keycard'),
            new Collectible(800, 400, 'data'),
            new Collectible(600, 600, 'code'),
            new Collectible(1000, 300, 'treasure')
        ];

        // Create objectives
        this.objectives = [
            new Objective(500, 500, 'hack_terminal'),
            new Objective(900, 600, 'disable_laser'),
            new Objective(1050, 150, 'final_vault')
        ];
    }

    start() {
        this.gameStarted = true;
        this.running = true;
        document.getElementById('titleScreen').classList.add('hidden');
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        if (!this.running) return;

        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(this.deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update timer
        this.timeRemaining -= deltaTime / 1000;
        
        if (this.timeRemaining <= 0) {
            this.resetLoop();
            return;
        }

        // Record player actions for clones
        if (this.gameStarted) {
            this.recordPlayerAction();
        }

        // Update player
        this.player.update(this.keys, deltaTime, this.vault, this.security);

        // Update clones
        this.clones.forEach(clone => {
            clone.update(deltaTime, this.vault, this.security);
        });

        // Update security system (adaptive AI)
        this.security.update(deltaTime, this.player, this.clones, this.currentLoop);

        // Check interactions
        this.checkInteractions();

        // Update UI
        this.updateUI();

        // Check win condition
        this.checkWinCondition();
    }

    recordPlayerAction() {
        const action = {
            time: 90 - this.timeRemaining,
            x: this.player.x,
            y: this.player.y,
            action: this.player.currentAction,
            stealth: this.player.stealth
        };
        this.currentRecording.push(action);
    }

    resetLoop() {
        // Save current recording for new clone
        if (this.currentRecording.length > 0) {
            this.recordedActions.push([...this.currentRecording]);
            this.clones.push(new Clone(this.recordedActions.length - 1, this.recordedActions[this.recordedActions.length - 1]));
        }

        // Reset game state
        this.currentLoop++;
        this.timeRemaining = 90;
        this.currentRecording = [];
        
        // Reset player position
        this.player.reset();

        // Reset collectibles (but not permanently collected ones)
        this.collectibles.forEach(collectible => {
            if (!collectible.permanentlyCollected) {
                collectible.reset();
            }
        });

        // Update game phase
        if (this.currentLoop === 2) {
            this.gamePhase = 'action';
        } else if (this.currentLoop >= 4) {
            this.gamePhase = 'extraction';
        }

        // Security AI adapts
        this.security.adaptToLoop(this.currentLoop, this.recordedActions);
    }

    checkInteractions() {
        // Check collectible interactions
        this.collectibles.forEach(collectible => {
            if (collectible.checkCollision(this.player) && this.keys['e']) {
                collectible.collect();
                this.player.inventory.push(collectible.type);
            }
        });

        // Check objective interactions
        this.objectives.forEach(objective => {
            if (objective.checkCollision(this.player) && this.keys['e']) {
                objective.interact(this.player, this.clones);
            }
        });
    }

    checkWinCondition() {
        // Win if all objectives completed and player reaches extraction
        const allObjectivesComplete = this.objectives.every(obj => obj.completed);
        const playerAtExtraction = this.player.x > 1100 && this.player.y < 100;
        
        if (allObjectivesComplete && playerAtExtraction) {
            this.victory();
        }
    }

    victory() {
        this.running = false;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HEIST SUCCESSFUL!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Courier New';
        this.ctx.fillText(`Completed in ${this.currentLoop} loops`, this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    updateUI() {
        document.getElementById('timer').textContent = `${Math.ceil(this.timeRemaining)}s`;
        document.getElementById('loopCounter').textContent = `Loop: ${this.currentLoop}`;
        document.getElementById('gameStatus').textContent = `Phase: ${this.gamePhase.charAt(0).toUpperCase() + this.gamePhase.slice(1)}`;
        document.getElementById('clonesInfo').textContent = `Clones: ${this.clones.length}`;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render vault
        this.vault.render(this.ctx);

        // Render security system
        this.security.render(this.ctx);

        // Render collectibles
        this.collectibles.forEach(collectible => {
            collectible.render(this.ctx);
        });

        // Render objectives
        this.objectives.forEach(objective => {
            objective.render(this.ctx);
        });

        // Render clones
        this.clones.forEach(clone => {
            clone.render(this.ctx);
        });

        // Render player
        this.player.render(this.ctx);

        // Render UI overlays
        this.renderGameInfo();
    }

    renderGameInfo() {
        // Render phase-specific information
        this.ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
        this.ctx.fillRect(10, this.canvas.height - 150, 300, 100);
        
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = '14px Courier New';
        this.ctx.textAlign = 'left';
        
        let infoText = '';
        switch(this.gamePhase) {
            case 'planning':
                infoText = 'PLANNING PHASE\nExplore and learn the layout\nDisable simple traps';
                break;
            case 'action':
                infoText = 'ACTION PHASE\nCoordinate with your clones\nAccess restricted areas';
                break;
            case 'extraction':
                infoText = 'EXTRACTION PHASE\nComplete final objectives\nReach the extraction point';
                break;
        }
        
        const lines = infoText.split('\n');
        lines.forEach((line, index) => {
            this.ctx.fillText(line, 20, this.canvas.height - 130 + (index * 20));
        });
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 150;
        this.stealth = false;
        this.inventory = [];
        this.currentAction = 'idle';
    }

    update(keys, deltaTime, vault, security) {
        this.currentAction = 'idle';
        
        // Movement
        let dx = 0, dy = 0;
        
        if (keys['w'] || keys['arrowup']) {
            dy = -this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }
        if (keys['s'] || keys['arrowdown']) {
            dy = this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }
        if (keys['a'] || keys['arrowleft']) {
            dx = -this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }
        if (keys['d'] || keys['arrowright']) {
            dx = this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }

        // Stealth mode
        this.stealth = keys['shift'];
        if (this.stealth) {
            dx *= 0.5;
            dy *= 0.5;
        }

        // Tool usage
        if (keys[' ']) {
            this.currentAction = 'use_tool';
        }

        // Collision detection
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (!vault.checkCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        }
        if (!vault.checkCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        }

        // Keep player in bounds
        this.x = Math.max(0, Math.min(1200 - this.width, this.x));
        this.y = Math.max(0, Math.min(800 - this.height, this.y));
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.inventory = [];
        this.currentAction = 'idle';
    }

    render(ctx) {
        // Player glow effect
        ctx.shadowColor = this.stealth ? '#4444ff' : '#00ff88';
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = this.stealth ? '#6666ff' : '#00ff88';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Reset shadow
        ctx.shadowBlur = 0;

        // Render action indicator
        if (this.currentAction !== 'idle') {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + this.width + 5, this.y, 5, this.height);
        }
    }
}

// Clone class
class Clone {
    constructor(id, recordedActions) {
        this.id = id;
        this.recordedActions = recordedActions;
        this.currentActionIndex = 0;
        this.x = 100;
        this.y = 100;
        this.width = 20;
        this.height = 20;
        this.currentTime = 0;
        this.active = true;
    }

    update(deltaTime, vault, security) {
        this.currentTime += deltaTime / 1000;

        // Find current action based on time
        while (this.currentActionIndex < this.recordedActions.length - 1 &&
               this.recordedActions[this.currentActionIndex + 1].time <= this.currentTime) {
            this.currentActionIndex++;
        }

        if (this.currentActionIndex < this.recordedActions.length) {
            const action = this.recordedActions[this.currentActionIndex];
            this.x = action.x;
            this.y = action.y;
            this.currentAction = action.action;
            this.stealth = action.stealth;
        }
    }

    render(ctx) {
        if (!this.active) return;

        // Clone has a different color - cyan with transparency
        ctx.globalAlpha = 0.7;
        ctx.shadowColor = this.stealth ? '#4444aa' : '#00aaff';
        ctx.shadowBlur = 8;
        
        ctx.fillStyle = this.stealth ? '#4466aa' : '#00aaff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Reset
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Clone ID
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`C${this.id + 1}`, this.x + this.width/2, this.y - 5);
    }
}

// Vault class
class Vault {
    constructor() {
        this.walls = [];
        this.doors = [];
        this.vents = [];
    }

    generateLayout() {
        // Outer walls
        this.walls = [
            {x: 0, y: 0, width: 1200, height: 20},      // Top
            {x: 0, y: 780, width: 1200, height: 20},    // Bottom
            {x: 0, y: 0, width: 20, height: 800},       // Left
            {x: 1180, y: 0, width: 20, height: 800}     // Right
        ];

        // Internal walls creating rooms
        this.walls.push(
            {x: 200, y: 100, width: 20, height: 300},   // Vertical separator
            {x: 400, y: 200, width: 300, height: 20},   // Horizontal separator
            {x: 800, y: 100, width: 20, height: 500},   // Main vault wall
            {x: 600, y: 400, width: 200, height: 20}    // Security room
        );

        // Doors
        this.doors = [
            {x: 200, y: 300, width: 20, height: 60, locked: true, keycard: false},
            {x: 800, y: 400, width: 20, height: 60, locked: true, keycard: true},
            {x: 950, y: 100, width: 60, height: 20, locked: true, keycard: true}
        ];
    }

    checkCollision(x, y, width, height) {
        // Check wall collisions
        for (let wall of this.walls) {
            if (x < wall.x + wall.width &&
                x + width > wall.x &&
                y < wall.y + wall.height &&
                y + height > wall.y) {
                return true;
            }
        }

        // Check locked door collisions
        for (let door of this.doors) {
            if (door.locked &&
                x < door.x + door.width &&
                x + width > door.x &&
                y < door.y + door.height &&
                y + height > door.y) {
                return true;
            }
        }

        return false;
    }

    render(ctx) {
        // Render walls
        ctx.fillStyle = '#333333';
        this.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });

        // Render doors
        this.doors.forEach(door => {
            ctx.fillStyle = door.locked ? '#ff4444' : '#44ff44';
            ctx.fillRect(door.x, door.y, door.width, door.height);
            
            if (door.keycard && door.locked) {
                ctx.fillStyle = '#ffff00';
                ctx.font = '12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('KEY', door.x + door.width/2, door.y + door.height/2 + 4);
            }
        });

        // Render room labels
        ctx.fillStyle = '#666666';
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('ENTRANCE', 100, 250);
        ctx.fillText('SECURITY', 500, 350);
        ctx.fillText('VAULT', 1000, 350);
    }
}

// Security System with Adaptive AI
class SecuritySystem {
    constructor() {
        this.guards = [
            {x: 300, y: 300, patrolRoute: [{x: 300, y: 300}, {x: 500, y: 300}, {x: 500, y: 500}, {x: 300, y: 500}], currentTarget: 0, detectionRadius: 80, alerted: false},
            {x: 900, y: 200, patrolRoute: [{x: 900, y: 200}, {x: 1100, y: 200}, {x: 1100, y: 600}, {x: 900, y: 600}], currentTarget: 0, detectionRadius: 100, alerted: false}
        ];
        
        this.lasers = [
            {x1: 220, y1: 150, x2: 220, y2: 350, active: true, adaptive: false},
            {x1: 820, y1: 200, x2: 820, y2: 500, active: true, adaptive: true}
        ];
        
        this.cameras = [
            {x: 600, y: 150, angle: 0, range: 120, adaptive: false},
            {x: 850, y: 250, angle: 45, range: 100, adaptive: true}
        ];

        this.adaptationLevel = 0;
        this.playerPatterns = [];
    }

    update(deltaTime, player, clones, currentLoop) {
        // Update guards
        this.guards.forEach(guard => {
            this.updateGuard(guard, deltaTime, player, clones);
        });

        // Update adaptive security based on loop
        this.adaptToPlayerBehavior(player, clones, currentLoop);

        // Update lasers
        this.lasers.forEach(laser => {
            if (laser.adaptive && this.adaptationLevel > 1) {
                // Adaptive lasers change pattern
                laser.active = Math.sin(Date.now() / 1000) > 0;
            }
        });

        // Update cameras
        this.cameras.forEach(camera => {
            if (camera.adaptive) {
                camera.angle += 0.5; // Rotating camera
            }
        });
    }

    updateGuard(guard, deltaTime, player, clones) {
        // Move guard along patrol route
        const target = guard.patrolRoute[guard.currentTarget];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            guard.currentTarget = (guard.currentTarget + 1) % guard.patrolRoute.length;
        } else {
            const speed = guard.alerted ? 100 : 50;
            guard.x += (dx / distance) * speed * (deltaTime / 1000);
            guard.y += (dy / distance) * speed * (deltaTime / 1000);
        }

        // Check detection
        const playerDistance = Math.sqrt((player.x - guard.x) ** 2 + (player.y - guard.y) ** 2);
        if (playerDistance < guard.detectionRadius && !player.stealth) {
            guard.alerted = true;
        }

        // Check clone detection
        clones.forEach(clone => {
            const cloneDistance = Math.sqrt((clone.x - guard.x) ** 2 + (clone.y - guard.y) ** 2);
            if (cloneDistance < guard.detectionRadius && !clone.stealth) {
                guard.alerted = true;
            }
        });
    }

    adaptToPlayerBehavior(player, clones, currentLoop) {
        // Record player patterns
        this.playerPatterns.push({
            loop: currentLoop,
            x: player.x,
            y: player.y,
            stealth: player.stealth
        });

        // Increase adaptation based on loop number
        this.adaptationLevel = Math.floor(currentLoop / 2);

        // Adaptive responses
        if (this.adaptationLevel > 0) {
            // Guards get faster and more alert
            this.guards.forEach(guard => {
                guard.detectionRadius += this.adaptationLevel * 10;
            });
        }

        if (this.adaptationLevel > 2) {
            // Add new patrol points based on player patterns
            this.adaptPatrolRoutes();
        }
    }

    adaptPatrolRoutes() {
        // Analyze common player positions and add patrol points
        const commonAreas = this.analyzePlayerPatterns();
        
        this.guards.forEach(guard => {
            commonAreas.forEach(area => {
                if (!guard.patrolRoute.some(point => 
                    Math.sqrt((point.x - area.x) ** 2 + (point.y - area.y) ** 2) < 50)) {
                    guard.patrolRoute.push({x: area.x, y: area.y});
                }
            });
        });
    }

    analyzePlayerPatterns() {
        // Simple clustering of player positions
        const areas = [];
        const gridSize = 100;
        
        for (let x = 0; x < 1200; x += gridSize) {
            for (let y = 0; y < 800; y += gridSize) {
                const count = this.playerPatterns.filter(pattern => 
                    pattern.x >= x && pattern.x < x + gridSize &&
                    pattern.y >= y && pattern.y < y + gridSize
                ).length;
                
                if (count > 5) {
                    areas.push({x: x + gridSize/2, y: y + gridSize/2});
                }
            }
        }
        
        return areas;
    }

    adaptToLoop(currentLoop, recordedActions) {
        if (currentLoop > 2) {
            // Analyze all previous loops and adapt
            recordedActions.forEach(actions => {
                actions.forEach(action => {
                    // Add counter-measures for repeated patterns
                    if (action.action === 'use_tool') {
                        this.addCounterMeasure(action.x, action.y);
                    }
                });
            });
        }
    }

    addCounterMeasure(x, y) {
        // Add new security elements near player tool usage
        if (Math.random() < 0.3) {
            this.cameras.push({
                x: x + Math.random() * 100 - 50,
                y: y + Math.random() * 100 - 50,
                angle: 0,
                range: 80,
                adaptive: true
            });
        }
    }

    render(ctx) {
        // Render lasers
        this.lasers.forEach(laser => {
            if (laser.active) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(laser.x1, laser.y1);
                ctx.lineTo(laser.x2, laser.y2);
                ctx.stroke();
            }
        });

        // Render guards
        this.guards.forEach(guard => {
            // Guard body
            ctx.fillStyle = guard.alerted ? '#ff4444' : '#ffaa00';
            ctx.fillRect(guard.x - 10, guard.y - 10, 20, 20);
            
            // Detection radius
            ctx.strokeStyle = guard.alerted ? '#ff4444' : '#ffaa00';
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(guard.x, guard.y, guard.detectionRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Patrol route
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            guard.patrolRoute.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.closePath();
            ctx.stroke();
        });

        // Render cameras
        this.cameras.forEach(camera => {
            ctx.fillStyle = '#666666';
            ctx.fillRect(camera.x - 5, camera.y - 5, 10, 10);
            
            // Camera vision cone
            ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
            ctx.beginPath();
            ctx.moveTo(camera.x, camera.y);
            const angleRad = camera.angle * Math.PI / 180;
            const coneWidth = 45 * Math.PI / 180;
            ctx.arc(camera.x, camera.y, camera.range, angleRad - coneWidth/2, angleRad + coneWidth/2);
            ctx.closePath();
            ctx.fill();
        });
    }
}

// Collectible class
class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.collected = false;
        this.permanentlyCollected = false;
        this.width = 15;
        this.height = 15;
    }

    checkCollision(player) {
        return !this.collected &&
               player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }

    collect() {
        this.collected = true;
        if (this.type === 'treasure') {
            this.permanentlyCollected = true;
        }
    }

    reset() {
        if (!this.permanentlyCollected) {
            this.collected = false;
        }
    }

    render(ctx) {
        if (this.collected) return;

        const colors = {
            keycard: '#ffff00',
            data: '#00ffff',
            code: '#ff00ff',
            treasure: '#ffd700'
        };

        ctx.fillStyle = colors[this.type] || '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Glow effect
        ctx.shadowColor = colors[this.type] || '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase(), this.x + this.width/2, this.y - 5);
    }
}

// Objective class
class Objective {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.completed = false;
        this.width = 30;
        this.height = 30;
        this.requiresClones = type !== 'hack_terminal';
        this.progress = 0;
        this.maxProgress = 100;
    }

    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }

    interact(player, clones) {
        if (this.completed) return;

        let canComplete = true;
        
        // Check requirements
        switch(this.type) {
            case 'hack_terminal':
                if (!player.inventory.includes('keycard')) {
                    canComplete = false;
                }
                break;
            case 'disable_laser':
                if (clones.length < 1) {
                    canComplete = false;
                }
                break;
            case 'final_vault':
                if (!player.inventory.includes('code') || clones.length < 2) {
                    canComplete = false;
                }
                break;
        }

        if (canComplete) {
            this.progress += 2;
            if (this.progress >= this.maxProgress) {
                this.completed = true;
                this.onComplete();
            }
        }
    }

    onComplete() {
        // Trigger effects based on objective type
        switch(this.type) {
            case 'disable_laser':
                // Disable nearby lasers
                game.security.lasers.forEach(laser => {
                    if (Math.abs(laser.x1 - this.x) < 100) {
                        laser.active = false;
                    }
                });
                break;
            case 'hack_terminal':
                // Unlock doors
                game.vault.doors.forEach(door => {
                    if (!door.keycard) {
                        door.locked = false;
                    }
                });
                break;
        }
    }

    render(ctx) {
        const colors = {
            hack_terminal: '#00ff00',
            disable_laser: '#ff0088',
            final_vault: '#8800ff'
        };

        // Objective body
        ctx.fillStyle = this.completed ? '#444444' : colors[this.type];
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Progress bar
        if (!this.completed && this.progress > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y - 10, (this.width * this.progress / this.maxProgress), 5);
        }

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        const label = this.type.replace('_', ' ').toUpperCase();
        ctx.fillText(label, this.x + this.width/2, this.y + this.height + 15);

        // Requirements indicator
        if (!this.completed) {
            ctx.font = '6px Courier New';
            let reqText = '';
            switch(this.type) {
                case 'hack_terminal':
                    reqText = 'NEEDS: KEYCARD';
                    break;
                case 'disable_laser':
                    reqText = 'NEEDS: 1 CLONE';
                    break;
                case 'final_vault':
                    reqText = 'NEEDS: CODE + 2 CLONES';
                    break;
            }
            ctx.fillText(reqText, this.x + this.width/2, this.y + this.height + 25);
        }
    }
}

// Initialize game
let game;

function startGame() {
    game = new ChronoHeist();
    game.start();
}

// Debug info
console.log('Chrono Heist - The Time Loop Puzzle loaded!');
console.log('Game mechanics:');
console.log('- 90 second time loops');
console.log('- Clone recording and playback');
console.log('- Adaptive AI security system');
console.log('- Multi-phase puzzle progression');
console.log('Click "BEGIN HEIST" to start!');