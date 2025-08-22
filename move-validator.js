// Move Validator System - Detects bugs and stuck states
class MoveValidator {
    constructor() {
        this.lastMoveTime = Date.now();
        this.moveTimeout = 15000; // 15 seconds max per move
        this.currentPlayer = null;
        this.moveCount = 0;
        this.validationInterval = null;
        this.gameInstance = null;
        this.isMonitoring = false;
    }
    
    startMonitoring(game) {
        this.gameInstance = game;
        this.isMonitoring = true;
        this.currentPlayer = game.currentPlayer;
        this.lastMoveTime = Date.now();
        
        // Check every second
        this.validationInterval = setInterval(() => {
            this.validateGameState();
        }, 1000);
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
    }
    
    onMoveMade() {
        this.lastMoveTime = Date.now();
        this.moveCount++;
        
        if (this.gameInstance) {
            this.currentPlayer = this.gameInstance.currentPlayer;
        }
    }
    
    validateGameState() {
        if (!this.isMonitoring || !this.gameInstance) return;
        
        const timeSinceLastMove = Date.now() - this.lastMoveTime;
        const game = this.gameInstance;
        
        // Check if game is over
        if (game.isGameOver) {
            this.stopMonitoring();
            return;
        }
        
        // Check if it's been too long since last move
        if (timeSinceLastMove > this.moveTimeout) {
            this.detectIssue(timeSinceLastMove);
        }
        
        // Warn if approaching timeout
        if (timeSinceLastMove > 10000 && timeSinceLastMove < this.moveTimeout) {
            this.showWarning(timeSinceLastMove);
        }
    }
    
    detectIssue(timeSinceLastMove) {
        const game = this.gameInstance;
        const currentPlayer = game.currentPlayer;
        
        // Check what moves are available
        const availableMoves = this.getAllMovesForPlayer(game, currentPlayer);
        const hasJumps = game.getAllJumpsForPlayer(currentPlayer).length > 0;
        
        let issueType = 'UNKNOWN';
        let message = '';
        
        if (window.currentMode === 'pvc' && currentPlayer === window.computerSide) {
            // Computer's turn - this is a potential bug
            if (availableMoves > 0) {
                issueType = 'AI_BUG';
                message = `BUG DETECTED: AI (${currentPlayer}) has ${availableMoves} possible moves but hasn't moved in ${Math.floor(timeSinceLastMove/1000)}s`;
                if (hasJumps) {
                    message += ' - MANDATORY JUMP AVAILABLE!';
                }
            } else {
                issueType = 'NO_MOVES';
                message = `Game might be stuck: AI (${currentPlayer}) has no valid moves`;
            }
            
            // Log and fix the issue
            this.logIssue(issueType, message, {
                player: currentPlayer,
                availableMoves: availableMoves,
                hasJumps: hasJumps,
                timeSinceLastMove: timeSinceLastMove,
                mode: window.currentMode
            });
            
            // Auto-fix for AI bugs
            if (issueType === 'AI_BUG' && window.makeAIMove) {
                console.log('Attempting to fix AI bug by retriggering move...');
                this.lastMoveTime = Date.now(); // Reset timer
                setTimeout(() => window.makeAIMove(), 100);
            }
        } else {
            // Human's turn - just reset timer, don't show alerts
            // Players can take their time thinking
            this.lastMoveTime = Date.now(); // Reset timer to avoid repeated checks
            
            // Only log to console for debugging, no visual alerts
            console.log(`Player ${currentPlayer} is thinking... ${availableMoves} moves available`);
            
            // Only show issue if there are truly no moves (game stuck)
            if (availableMoves === 0 && !game.isGameOver) {
                issueType = 'NO_MOVES';
                message = `Game might be stuck: ${currentPlayer} has no valid moves`;
                this.logIssue(issueType, message, {
                    player: currentPlayer,
                    availableMoves: availableMoves,
                    hasJumps: hasJumps,
                    timeSinceLastMove: timeSinceLastMove,
                    mode: window.currentMode
                });
            }
        }
    }
    
    showWarning(timeSinceLastMove) {
        // Only show warnings for AI, not human players
        if (window.currentMode === 'pvc' && this.gameInstance.currentPlayer === window.computerSide) {
            const remainingTime = Math.floor((this.moveTimeout - timeSinceLastMove) / 1000);
            const player = this.gameInstance.currentPlayer;
            
            if (remainingTime === 5) {
                this.showNotification(`Warning: AI (${player}) has ${remainingTime} seconds to move`, 'warning');
            }
        }
    }
    
    getAllMovesForPlayer(game, player) {
        let totalMoves = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (piece && piece.color === player) {
                    const moves = game.getValidMoves(row, col);
                    totalMoves += moves.length;
                }
            }
        }
        
        return totalMoves;
    }
    
    logIssue(type, message, details) {
        console.error(`[VALIDATOR] ${type}: ${message}`, details);
        
        // Show visual notification
        this.showNotification(message, type === 'AI_BUG' ? 'error' : 'warning');
        
        // Log to debug panel
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.textContent = message;
            debugInfo.style.display = 'block';
            debugInfo.style.color = type === 'AI_BUG' ? '#ff4444' : '#ffaa00';
        }
        
        // Auto-capture screenshot for bugs
        if (type === 'AI_BUG' && window.captureScreenshot) {
            console.log('Auto-capturing screenshot for bug report...');
            window.captureScreenshot();
        }
    }
    
    showNotification(message, type = 'info') {
        // Create or update notification element
        let notification = document.getElementById('move-validator-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'move-validator-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 25px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 10000;
                transition: opacity 0.3s;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(notification);
        }
        
        // Set color based on type
        const colors = {
            error: '#ff4444',
            warning: '#ffaa00',
            info: '#4CAF50'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.style.color = 'white';
        notification.textContent = message;
        notification.style.display = 'block';
        notification.style.opacity = '1';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 5000);
    }
}

// Create global validator instance
window.moveValidator = new MoveValidator();