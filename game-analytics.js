class GameAnalytics {
    constructor() {
        this.gameData = {
            moves: [],
            captures: [],
            efficiency: [],
            pieceAdvantage: [],
            timePerMove: [],
            keyMoments: [],
            startTime: null,
            endTime: null,
            winner: null,
            totalMoves: 0,
            redCaptures: 0,
            blackCaptures: 0,
            longestJumpChain: 0,
            currentJumpChain: 0
        };
        
        this.recording = false;
        this.playbackMode = false;
        this.playbackIndex = 0;
    }
    
    startRecording() {
        this.recording = true;
        this.gameData.startTime = Date.now();
        this.gameData.moves = [];
        this.gameData.captures = [];
        this.gameData.efficiency = [];
        this.gameData.pieceAdvantage = [];
        this.gameData.timePerMove = [];
        this.gameData.keyMoments = [];
        this.gameData.totalMoves = 0;
        this.gameData.redCaptures = 0;
        this.gameData.blackCaptures = 0;
        this.gameData.longestJumpChain = 0;
        this.gameData.currentJumpChain = 0;
    }
    
    recordUndo(undoCount) {
        if (!this.recording) return;
        
        // Add undo event to timeline
        this.gameData.events.push({
            type: 'undo',
            move: this.gameData.moves.length,
            timestamp: Date.now() - this.gameStartTime,
            description: `Undone ${undoCount} move(s)`
        });
        
        // Remove the last moves from history
        for (let i = 0; i < undoCount && this.gameData.moves.length > 0; i++) {
            this.gameData.moves.pop();
        }
    }
    
    recordMove(move, game, timeTaken) {
        if (!this.recording) return;
        
        const timestamp = Date.now() - this.gameData.startTime;
        const efficiency = this.calculateMoveEfficiency(move, game);
        const pieceAdvantage = game.redPieces - game.blackPieces;
        
        // Record the move
        const moveData = {
            ...move,
            timestamp,
            timeTaken,
            efficiency,
            pieceAdvantage,
            boardState: this.serializeBoardState(game),
            player: move.player,
            moveNumber: ++this.gameData.totalMoves
        };
        
        this.gameData.moves.push(moveData);
        this.gameData.efficiency.push({ time: timestamp, value: efficiency, player: move.player });
        this.gameData.pieceAdvantage.push({ time: timestamp, value: pieceAdvantage });
        this.gameData.timePerMove.push({ time: timestamp, value: timeTaken, player: move.player });
        
        // Track captures
        if (move.isJump) {
            if (move.player === 'red') {
                this.gameData.redCaptures++;
            } else {
                this.gameData.blackCaptures++;
            }
            
            this.gameData.captures.push({
                time: timestamp,
                player: move.player,
                totalCaptures: move.player === 'red' ? this.gameData.redCaptures : this.gameData.blackCaptures
            });
            
            // Track jump chains
            this.gameData.currentJumpChain++;
            if (this.gameData.currentJumpChain > this.gameData.longestJumpChain) {
                this.gameData.longestJumpChain = this.gameData.currentJumpChain;
                this.addKeyMoment(timestamp, 'longest_chain', `Longest jump chain: ${this.gameData.currentJumpChain} jumps`, move);
            }
        } else {
            this.gameData.currentJumpChain = 0;
        }
        
        // Detect key moments
        this.detectKeyMoments(moveData, game);
    }
    
    calculateMoveEfficiency(move, game) {
        let score = 50; // Base score
        
        // Capture is good
        if (move.isJump) score += 30;
        
        // Getting a king is excellent
        const piece = game.board[move.to.row][move.to.col];
        if (piece && piece.isKing && !move.wasKing) score += 40;
        
        // Center control is good
        if (move.to.row >= 3 && move.to.row <= 4 && move.to.col >= 2 && move.to.col <= 5) {
            score += 15;
        }
        
        // Forward progress for non-kings
        if (piece && !piece.isKing) {
            if (piece.color === 'red' && move.to.row < move.from.row) score += 10;
            if (piece.color === 'black' && move.to.row > move.from.row) score += 10;
        }
        
        // Protecting back row is good
        if ((piece.color === 'red' && move.from.row === 7) || 
            (piece.color === 'black' && move.from.row === 0)) {
            score -= 5; // Penalty for leaving back row
        }
        
        return Math.min(100, score);
    }
    
    detectKeyMoments(moveData, game) {
        const timestamp = moveData.timestamp;
        
        // First blood
        if (this.gameData.captures.length === 1 && moveData.isJump) {
            this.addKeyMoment(timestamp, 'first_blood', 'First capture of the game!', moveData);
        }
        
        // King promotion
        const piece = game.board[moveData.to.row][moveData.to.col];
        if (piece && piece.isKing && !moveData.wasKing) {
            this.addKeyMoment(timestamp, 'promotion', `${moveData.player} gets a King!`, moveData);
        }
        
        // Turning point - when advantage switches
        if (this.gameData.pieceAdvantage.length > 1) {
            const prev = this.gameData.pieceAdvantage[this.gameData.pieceAdvantage.length - 2].value;
            const curr = moveData.pieceAdvantage;
            if ((prev > 0 && curr < 0) || (prev < 0 && curr > 0)) {
                this.addKeyMoment(timestamp, 'turning_point', 'Game advantage switches!', moveData);
            }
        }
        
        // Brilliant move (high efficiency)
        if (moveData.efficiency >= 90) {
            this.addKeyMoment(timestamp, 'brilliant', 'Brilliant move!', moveData);
        }
        
        // Critical moment - few pieces left
        if (game.redPieces <= 3 || game.blackPieces <= 3) {
            if (this.gameData.keyMoments.filter(m => m.type === 'endgame').length === 0) {
                this.addKeyMoment(timestamp, 'endgame', 'Entering endgame phase', moveData);
            }
        }
    }
    
    addKeyMoment(timestamp, type, description, moveData) {
        this.gameData.keyMoments.push({
            timestamp,
            type,
            description,
            moveNumber: moveData.moveNumber,
            move: {
                from: moveData.from,
                to: moveData.to,
                player: moveData.player
            }
        });
    }
    
    serializeBoardState(game) {
        return {
            board: game.board.map(row => row.map(cell => 
                cell ? { color: cell.color, isKing: cell.isKing } : null
            )),
            currentPlayer: game.currentPlayer,
            redPieces: game.redPieces,
            blackPieces: game.blackPieces
        };
    }
    
    endGame(winner) {
        if (!this.recording) return;
        
        this.recording = false;
        this.gameData.endTime = Date.now();
        this.gameData.winner = winner;
        
        // Calculate game statistics
        const stats = this.calculateGameStats();
        return stats;
    }
    
    calculateGameStats() {
        // Ensure valid timestamps and non-negative duration
        const startTime = this.gameData.startTime || Date.now();
        const endTime = this.gameData.endTime || Date.now();
        const duration = Math.max(0, Math.floor((endTime - startTime) / 1000)); // in seconds, ensure non-negative
        
        const avgTimePerMove = this.gameData.timePerMove.length > 0 
            ? this.gameData.timePerMove.reduce((a, b) => a + b.value, 0) / this.gameData.timePerMove.length
            : 0;
        
        const redMoves = this.gameData.efficiency.filter(e => e.player === 'red');
        const blackMoves = this.gameData.efficiency.filter(e => e.player === 'black');
        
        const redEfficiency = redMoves.length > 0
            ? redMoves.reduce((a, b) => a + b.value, 0) / redMoves.length
            : 0;
            
        const blackEfficiency = blackMoves.length > 0
            ? blackMoves.reduce((a, b) => a + b.value, 0) / blackMoves.length
            : 0;
        
        // Count current pieces on board
        let redPieces = 12 - this.gameData.blackCaptures;
        let blackPieces = 12 - this.gameData.redCaptures;
        
        return {
            duration: Math.round(duration),
            totalMoves: this.gameData.totalMoves,
            avgTimePerMove: Math.round(avgTimePerMove),
            redCaptures: this.gameData.redCaptures,
            blackCaptures: this.gameData.blackCaptures,
            redEfficiency: Math.round(redEfficiency),
            blackEfficiency: Math.round(blackEfficiency),
            redPieces: redPieces,
            blackPieces: blackPieces,
            longestJumpChain: this.gameData.longestJumpChain,
            keyMoments: this.gameData.keyMoments.length,
            winner: this.gameData.winner
        };
    }
    
    getGraphData() {
        return {
            efficiency: this.gameData.efficiency,
            pieceAdvantage: this.gameData.pieceAdvantage,
            timePerMove: this.gameData.timePerMove,
            captures: this.gameData.captures,
            keyMoments: this.gameData.keyMoments
        };
    }
    
    // Playback functionality
    startPlayback(savedGame) {
        this.playbackMode = true;
        this.playbackIndex = 0;
        this.gameData = savedGame;
        return this.gameData.moves[0]?.boardState || null;
    }
    
    getNextMove() {
        if (!this.playbackMode || this.playbackIndex >= this.gameData.moves.length) {
            return null;
        }
        return this.gameData.moves[this.playbackIndex++];
    }
    
    getPreviousMove() {
        if (!this.playbackMode || this.playbackIndex <= 0) {
            return null;
        }
        this.playbackIndex = Math.max(0, this.playbackIndex - 2);
        return this.gameData.moves[this.playbackIndex++];
    }
    
    jumpToMove(moveNumber) {
        if (!this.playbackMode || moveNumber < 0 || moveNumber >= this.gameData.moves.length) {
            return null;
        }
        this.playbackIndex = moveNumber;
        return this.gameData.moves[moveNumber];
    }
    
    jumpToKeyMoment(momentIndex) {
        if (!this.playbackMode || momentIndex < 0 || momentIndex >= this.gameData.keyMoments.length) {
            return null;
        }
        const moment = this.gameData.keyMoments[momentIndex];
        return this.jumpToMove(moment.moveNumber - 1);
    }
    
    exportGame() {
        return JSON.stringify(this.gameData, null, 2);
    }
    
    importGame(jsonData) {
        try {
            this.gameData = JSON.parse(jsonData);
            return true;
        } catch (e) {
            console.error('Failed to import game:', e);
            return false;
        }
    }
}