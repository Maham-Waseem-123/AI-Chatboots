// Chrono Heist - Mobile Version
// Core Game Engine with Touch Controls

class ChronoHeist {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        
        // Mobile detection and setup
        this.isMobile = this.detectMobile();
        this.setupMobileOptimizations();
        
        // Game state
        this.currentLoop = 1;
        this.timeRemaining = 90;
        this.gamePhase = 'planning';
        this.gameStarted = false;
        
        // Player and clones
        this.player = new Player(80, 80);
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
        this.setupMobileControls();
        
        // Game loop
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Initialize game world
        this.initializeWorld();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    }

    setupMobileOptimizations() {
        if (this.isMobile) {
            // Show mobile controls
            const controls = document.querySelector('.mobile-controls');
            if (controls) controls.style.display = 'flex';
            
            // Prevent zoom and scrolling
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) e.preventDefault();
            }, { passive: false });
            
            document.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
            
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) e.preventDefault();
                lastTouchEnd = now;
            }, { passive: false });
        }
    }

    setupMobileControls() {
        // Movement controls
        this.setupTouchControl('moveUp', 'w');
        this.setupTouchControl('moveDown', 's');
        this.setupTouchControl('moveLeft', 'a');
        this.setupTouchControl('moveRight', 'd');
        
        // Action controls
        this.setupTouchControl('interactBtn', 'e');
        this.setupTouchControl('toolBtn', ' ');
        this.setupTouchControl('resetBtn', 'r');
        
        // Stealth control (toggle)
        const stealthBtn = document.getElementById('stealthBtn');
        if (stealthBtn) {
            let stealthActive = false;
            stealthBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                stealthActive = !stealthActive;
                this.keys['shift'] = stealthActive;
                stealthBtn.style.background = stealthActive ? 
                    'rgba(0, 255, 136, 0.8)' : 'rgba(0, 255, 136, 0.3)';
            });
        }
    }

    setupTouchControl(elementId, key) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys[key] = true;
            element.style.background = 'rgba(0, 255, 136, 0.8)';
        });

        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys[key] = false;
            element.style.background = 'rgba(0, 255, 136, 0.3)';
        });

        element.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.keys[key] = false;
            element.style.background = 'rgba(0, 255, 136, 0.3)';
        });
    }

    setupEventListeners() {
        // Keyboard events (fallback)
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'r' && this.gameStarted) {
                this.resetLoop();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Canvas touch for tap-to-move
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            this.handleCanvasTouch(x, y);
        }, { passive: false });
    }

    handleCanvasTouch(x, y) {
        if (!this.gameStarted) return;
        
        // Check if touching an interactive object first
        const touchedObject = this.getTouchedObject(x, y);
        if (touchedObject) {
            this.keys['e'] = true;
            setTimeout(() => this.keys['e'] = false, 100);
            return;
        }
        
        // Otherwise, move towards touch point
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        const dx = x - playerCenterX;
        const dy = y - playerCenterY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 15) {
                this.keys['d'] = true;
                setTimeout(() => this.keys['d'] = false, 150);
            } else if (dx < -15) {
                this.keys['a'] = true;
                setTimeout(() => this.keys['a'] = false, 150);
            }
        } else {
            if (dy > 15) {
                this.keys['s'] = true;
                setTimeout(() => this.keys['s'] = false, 150);
            } else if (dy < -15) {
                this.keys['w'] = true;
                setTimeout(() => this.keys['w'] = false, 150);
            }
        }
    }

    getTouchedObject(x, y) {
        // Check collectibles
        for (let collectible of this.collectibles) {
            if (x >= collectible.x && x <= collectible.x + collectible.width &&
                y >= collectible.y && y <= collectible.y + collectible.height) {
                return collectible;
            }
        }
        
        // Check objectives
        for (let objective of this.objectives) {
            if (x >= objective.x && x <= objective.x + objective.width &&
                y >= objective.y && y <= objective.y + objective.height) {
                return objective;
            }
        }
        
        return null;
    }

    initializeWorld() {
        this.vault.generateLayout();
        
        // Scale positions for mobile
        const scale = this.isMobile ? 0.8 : 1;
        
        this.collectibles = [
            new Collectible(240 * scale, 160 * scale, 'keycard'),
            new Collectible(520 * scale, 280 * scale, 'data'),
            new Collectible(400 * scale, 450 * scale, 'code'),
            new Collectible(650 * scale, 200 * scale, 'treasure')
        ];

        this.objectives = [
            new Objective(350 * scale, 350 * scale, 'hack_terminal'),
            new Objective(580 * scale, 420 * scale, 'disable_laser'),
            new Objective(700 * scale, 120 * scale, 'final_vault')
        ];
    }

    start() {
        this.gameStarted = true;
        this.running = true;
        document.getElementById('titleScreen').classList.add('hidden');
        
        if (this.isMobile) {
            const gameInfo = document.getElementById('gameInfo');
            if (gameInfo) gameInfo.classList.remove('hidden');
        }
        
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
        this.timeRemaining -= deltaTime / 1000;
        
        if (this.timeRemaining <= 0) {
            this.resetLoop();
            return;
        }

        if (this.gameStarted) {
            this.recordPlayerAction();
        }

        this.player.update(this.keys, deltaTime, this.vault, this.security);

        this.clones.forEach(clone => {
            clone.update(deltaTime, this.vault, this.security);
        });

        this.security.update(deltaTime, this.player, this.clones, this.currentLoop);
        this.checkInteractions();
        this.updateUI();
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
        if (this.currentRecording.length > 0) {
            this.recordedActions.push([...this.currentRecording]);
            this.clones.push(new Clone(this.recordedActions.length - 1, this.recordedActions[this.recordedActions.length - 1]));
        }

        this.currentLoop++;
        this.timeRemaining = 90;
        this.currentRecording = [];
        
        this.player.reset();

        this.collectibles.forEach(collectible => {
            if (!collectible.permanentlyCollected) {
                collectible.reset();
            }
        });

        if (this.currentLoop === 2) {
            this.gamePhase = 'action';
        } else if (this.currentLoop >= 4) {
            this.gamePhase = 'extraction';
        }

        this.security.adaptToLoop(this.currentLoop, this.recordedActions);
    }

    checkInteractions() {
        this.collectibles.forEach(collectible => {
            if (collectible.checkCollision(this.player) && this.keys['e']) {
                collectible.collect();
                this.player.inventory.push(collectible.type);
            }
        });

        this.objectives.forEach(objective => {
            if (objective.checkCollision(this.player) && this.keys['e']) {
                objective.interact(this.player, this.clones);
            }
        });
    }

    checkWinCondition() {
        const allObjectivesComplete = this.objectives.every(obj => obj.completed);
        const playerAtExtraction = this.player.x > (this.isMobile ? 680 : 1100) && this.player.y < (this.isMobile ? 80 : 100);
        
        if (allObjectivesComplete && playerAtExtraction) {
            this.victory();
        }
    }

    victory() {
        this.running = false;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = this.isMobile ? '32px Courier New' : '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HEIST SUCCESSFUL!', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = this.isMobile ? '16px Courier New' : '24px Courier New';
        this.ctx.fillText(`Completed in ${this.currentLoop} loops`, this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    updateUI() {
        document.getElementById('timer').textContent = `${Math.ceil(this.timeRemaining)}s`;
        document.getElementById('loopCounter').textContent = `Loop: ${this.currentLoop}`;
        document.getElementById('gameStatus').textContent = `${this.gamePhase.charAt(0).toUpperCase() + this.gamePhase.slice(1)}`;
        document.getElementById('clonesInfo').textContent = `Clones: ${this.clones.length}`;
        
        // Update mobile phase info
        const phaseInfo = document.getElementById('phaseInfo');
        if (phaseInfo) {
            let infoText = '';
            switch(this.gamePhase) {
                case 'planning':
                    infoText = 'Explore and learn the layout';
                    break;
                case 'action':
                    infoText = 'Coordinate with your clones';
                    break;
                case 'extraction':
                    infoText = 'Complete objectives and escape!';
                    break;
            }
            phaseInfo.textContent = infoText;
        }
    }

    render() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.vault.render(this.ctx);
        this.security.render(this.ctx);

        this.collectibles.forEach(collectible => {
            collectible.render(this.ctx);
        });

        this.objectives.forEach(objective => {
            objective.render(this.ctx);
        });

        this.clones.forEach(clone => {
            clone.render(this.ctx);
        });

        this.player.render(this.ctx);
    }
}

// Mobile-optimized Player class
class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.width = 18;
        this.height = 18;
        this.speed = 120;
        this.stealth = false;
        this.inventory = [];
        this.currentAction = 'idle';
    }

    update(keys, deltaTime, vault, security) {
        this.currentAction = 'idle';
        
        let dx = 0, dy = 0;
        
        if (keys['w']) {
            dy = -this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }
        if (keys['s']) {
            dy = this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }
        if (keys['a']) {
            dx = -this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }
        if (keys['d']) {
            dx = this.speed * (deltaTime / 1000);
            this.currentAction = 'move';
        }

        this.stealth = keys['shift'];
        if (this.stealth) {
            dx *= 0.5;
            dy *= 0.5;
        }

        if (keys[' ']) {
            this.currentAction = 'use_tool';
        }

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (!vault.checkCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        }
        if (!vault.checkCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        }

        this.x = Math.max(0, Math.min(this.canvas?.width || 800 - this.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas?.height || 600 - this.height, this.y));
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.inventory = [];
        this.currentAction = 'idle';
    }

    render(ctx) {
        ctx.shadowColor = this.stealth ? '#4444ff' : '#00ff88';
        ctx.shadowBlur = 8;
        
        ctx.fillStyle = this.stealth ? '#6666ff' : '#00ff88';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowBlur = 0;

        if (this.currentAction !== 'idle') {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + this.width + 3, this.y, 3, this.height);
        }

        if (this.inventory.length > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.inventory.length}`, this.x + this.width/2, this.y - 5);
        }
    }
}

// Simplified classes for mobile
class Clone {
    constructor(id, recordedActions) {
        this.id = id;
        this.recordedActions = recordedActions;
        this.currentActionIndex = 0;
        this.x = 80;
        this.y = 80;
        this.width = 18;
        this.height = 18;
        this.currentTime = 0;
        this.active = true;
    }

    update(deltaTime) {
        this.currentTime += deltaTime / 1000;

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

        ctx.globalAlpha = 0.7;
        ctx.shadowColor = this.stealth ? '#4444aa' : '#00aaff';
        ctx.shadowBlur = 6;
        
        ctx.fillStyle = this.stealth ? '#4466aa' : '#00aaff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`C${this.id + 1}`, this.x + this.width/2, this.y - 3);
    }
}

class Vault {
    constructor() {
        this.walls = [];
        this.doors = [];
    }

    generateLayout() {
        const width = 800;
        const height = 600;
        
        this.walls = [
            {x: 0, y: 0, width: width, height: 15},
            {x: 0, y: height - 15, width: width, height: 15},
            {x: 0, y: 0, width: 15, height: height},
            {x: width - 15, y: 0, width: 15, height: height}
        ];

        this.walls.push(
            {x: 160, y: 80, width: 15, height: 240},
            {x: 300, y: 160, width: 200, height: 15},
            {x: 480, y: 80, width: 15, height: 320},
            {x: 360, y: 280, width: 120, height: 15}
        );

        this.doors = [
            {x: 160, y: 200, width: 15, height: 50, locked: true, keycard: false},
            {x: 480, y: 240, width: 15, height: 50, locked: true, keycard: true},
            {x: 560, y: 80, width: 50, height: 15, locked: true, keycard: true}
        ];
    }

    checkCollision(x, y, width, height) {
        for (let wall of this.walls) {
            if (x < wall.x + wall.width &&
                x + width > wall.x &&
                y < wall.y + wall.height &&
                y + height > wall.y) {
                return true;
            }
        }

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
        ctx.fillStyle = '#333333';
        this.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });

        this.doors.forEach(door => {
            ctx.fillStyle = door.locked ? '#ff4444' : '#44ff44';
            ctx.fillRect(door.x, door.y, door.width, door.height);
        });

        ctx.fillStyle = '#666666';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('ENTRANCE', 80, 200);
        ctx.fillText('SECURITY', 280, 250);
        ctx.fillText('VAULT', 580, 200);
    }
}

class SecuritySystem {
    constructor() {
        this.guards = [
            {x: 240, y: 240, patrolRoute: [{x: 240, y: 240}, {x: 360, y: 240}, {x: 360, y: 360}, {x: 240, y: 360}], currentTarget: 0, detectionRadius: 60, alerted: false},
            {x: 580, y: 160, patrolRoute: [{x: 580, y: 160}, {x: 700, y: 160}, {x: 700, y: 400}, {x: 580, y: 400}], currentTarget: 0, detectionRadius: 70, alerted: false}
        ];
        
        this.lasers = [
            {x1: 175, y1: 120, x2: 175, y2: 280, active: true},
            {x1: 495, y1: 160, x2: 495, y2: 400, active: true}
        ];
        
        this.adaptationLevel = 0;
    }

    update(deltaTime, player, clones, currentLoop) {
        this.guards.forEach(guard => {
            this.updateGuard(guard, deltaTime, player, clones);
        });
        
        this.adaptationLevel = Math.floor(currentLoop / 2);
    }

    updateGuard(guard, deltaTime, player, clones) {
        const target = guard.patrolRoute[guard.currentTarget];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 8) {
            guard.currentTarget = (guard.currentTarget + 1) % guard.patrolRoute.length;
        } else {
            const speed = guard.alerted ? 80 : 40;
            guard.x += (dx / distance) * speed * (deltaTime / 1000);
            guard.y += (dy / distance) * speed * (deltaTime / 1000);
        }

        const playerDistance = Math.sqrt((player.x - guard.x) ** 2 + (player.y - guard.y) ** 2);
        if (playerDistance < guard.detectionRadius && !player.stealth) {
            guard.alerted = true;
        }
    }

    adaptToLoop(currentLoop, recordedActions) {
        if (currentLoop > 2) {
            this.guards.forEach(guard => {
                guard.detectionRadius += 5;
            });
        }
    }

    render(ctx) {
        this.lasers.forEach(laser => {
            if (laser.active) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(laser.x1, laser.y1);
                ctx.lineTo(laser.x2, laser.y2);
                ctx.stroke();
            }
        });

        this.guards.forEach(guard => {
            ctx.fillStyle = guard.alerted ? '#ff4444' : '#ffaa00';
            ctx.fillRect(guard.x - 8, guard.y - 8, 16, 16);
            
            ctx.strokeStyle = guard.alerted ? '#ff4444' : '#ffaa00';
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.arc(guard.x, guard.y, guard.detectionRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }
}

class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.collected = false;
        this.permanentlyCollected = false;
        this.width = 12;
        this.height = 12;
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

        ctx.shadowColor = colors[this.type] || '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase().substr(0,3), this.x + this.width/2, this.y - 3);
    }
}

class Objective {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.completed = false;
        this.width = 24;
        this.height = 24;
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
            this.progress += 3;
            if (this.progress >= this.maxProgress) {
                this.completed = true;
                this.onComplete();
            }
        }
    }

    onComplete() {
        switch(this.type) {
            case 'disable_laser':
                game.security.lasers.forEach(laser => {
                    if (Math.abs(laser.x1 - this.x) < 80) {
                        laser.active = false;
                    }
                });
                break;
            case 'hack_terminal':
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

        ctx.fillStyle = this.completed ? '#444444' : colors[this.type];
        ctx.fillRect(this.x, this.y, this.width, this.height);

        if (!this.completed && this.progress > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y - 8, (this.width * this.progress / this.maxProgress), 4);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '6px Courier New';
        ctx.textAlign = 'center';
        const label = this.type.replace('_', ' ').toUpperCase();
        ctx.fillText(label, this.x + this.width/2, this.y + this.height + 12);
    }
}

// Initialize game
let game;

function startGame() {
    game = new ChronoHeist();
    game.start();
}

document.addEventListener('deviceready', function() {
    console.log('Cordova device ready');
}, false);

console.log('Chrono Heist Mobile loaded!');