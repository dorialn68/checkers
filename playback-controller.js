class PlaybackController {
    constructor(game, renderer) {
        this.game = game;
        this.renderer = renderer;
        this.isPlaybackMode = false;
        this.playbackSpeed = 1;
        this.isPlaying = false;
        this.playbackInterval = null;
        this.fullGameHistory = [];
        this.currentMoveIndex = 0;
        this.savedGameState = null;
    }
    
    enterPlaybackMode() {
        if (this.isPlaybackMode) return;
        
        // Save current game state
        this.savedGameState = {
            board: this.game.board.map(row => row.map(cell => cell ? {...cell} : null)),
            currentPlayer: this.game.currentPlayer,
            selectedPiece: this.game.selectedPiece ? {...this.game.selectedPiece} : null,
            validMoves: [...this.game.validMoves],
            moveHistory: this.game.moveHistory.map(m => ({...m})),
            redPieces: this.game.redPieces,
            blackPieces: this.game.blackPieces,
            isGameOver: this.game.isGameOver,
            winner: this.game.winner,
            multiJumpMode: this.game.multiJumpMode,
            lastMovedPiece: this.game.lastMovedPiece
        };
        
        // Store the full history
        this.fullGameHistory = [...this.game.moveHistory];
        this.currentMoveIndex = this.fullGameHistory.length;
        
        this.isPlaybackMode = true;
        this.showPlaybackControls();
        
        return true;
    }
    
    exitPlaybackMode() {
        if (!this.isPlaybackMode) return;
        
        this.stopPlayback();
        
        // Restore to latest state (go to end)
        if (this.currentMoveIndex < this.fullGameHistory.length) {
            this.goToEnd();
        }
        
        this.isPlaybackMode = false;
        this.hidePlaybackControls();
        this.savedGameState = null;
        
        return true;
    }
    
    goToStart() {
        if (!this.isPlaybackMode) return;
        
        // Reset to initial board state
        this.game.newGame();
        this.currentMoveIndex = 0;
        
        this.renderer.updateBoard();
        this.updatePlaybackUI();
    }
    
    goToEnd() {
        if (!this.isPlaybackMode) return;
        
        // Replay all moves from start
        this.goToStart();
        
        for (let i = 0; i < this.fullGameHistory.length; i++) {
            const move = this.fullGameHistory[i];
            this.replayMove(move);
        }
        
        this.currentMoveIndex = this.fullGameHistory.length;
        this.renderer.updateBoard();
        this.updatePlaybackUI();
    }
    
    previousMove() {
        if (!this.isPlaybackMode || this.currentMoveIndex <= 0) return;
        
        // Undo one move
        this.game.undoLastMove(1);
        this.currentMoveIndex--;
        
        this.renderer.updateBoard();
        this.updatePlaybackUI();
    }
    
    nextMove() {
        if (!this.isPlaybackMode || this.currentMoveIndex >= this.fullGameHistory.length) return;
        
        const move = this.fullGameHistory[this.currentMoveIndex];
        this.replayMove(move);
        this.currentMoveIndex++;
        
        this.renderer.updateBoard();
        this.updatePlaybackUI();
    }
    
    replayMove(move) {
        // Select the piece
        this.game.selectedPiece = { row: move.from.row, col: move.from.col };
        this.game.validMoves = this.game.getValidMoves(move.from.row, move.from.col);
        
        // Make the move
        this.game.makeMove(move.to.row, move.to.col);
    }
    
    goToMove(index) {
        if (!this.isPlaybackMode) return;
        
        index = Math.max(0, Math.min(index, this.fullGameHistory.length));
        
        if (index < this.currentMoveIndex) {
            // Go backward
            const undoCount = this.currentMoveIndex - index;
            this.game.undoLastMove(undoCount);
            this.currentMoveIndex = index;
        } else if (index > this.currentMoveIndex) {
            // Go forward
            while (this.currentMoveIndex < index) {
                this.nextMove();
            }
        }
        
        this.renderer.updateBoard();
        this.updatePlaybackUI();
    }
    
    togglePlayback() {
        if (!this.isPlaybackMode) return;
        
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }
    
    startPlayback() {
        if (!this.isPlaybackMode || this.isPlaying) return;
        
        this.isPlaying = true;
        this.updatePlayButton();
        
        this.playbackInterval = setInterval(() => {
            if (this.currentMoveIndex < this.fullGameHistory.length) {
                this.nextMove();
            } else {
                this.stopPlayback();
            }
        }, 1000 / this.playbackSpeed);
    }
    
    stopPlayback() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        this.updatePlayButton();
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }
    
    setSpeed(speed) {
        this.playbackSpeed = speed;
        
        // Restart playback if currently playing
        if (this.isPlaying) {
            this.stopPlayback();
            this.startPlayback();
        }
    }
    
    showPlaybackControls() {
        const controls = document.getElementById('playback-controls-container');
        if (controls) {
            controls.style.display = 'block';
            
            // Update move counter
            document.getElementById('playback-move-counter').textContent = 
                `Move ${this.currentMoveIndex} / ${this.fullGameHistory.length}`;
        }
        
        // Disable game controls
        document.getElementById('new-game').disabled = true;
        
        // Show playback indicator
        const indicator = document.getElementById('move-indicator');
        if (indicator) {
            indicator.textContent = '📹 PLAYBACK MODE';
            indicator.style.display = 'block';
            indicator.style.background = '#ffc107';
        }
    }
    
    hidePlaybackControls() {
        const controls = document.getElementById('playback-controls-container');
        if (controls) {
            controls.style.display = 'none';
        }
        
        // Enable game controls
        document.getElementById('new-game').disabled = false;
        
        // Hide playback indicator
        const indicator = document.getElementById('move-indicator');
        if (indicator && indicator.textContent === '📹 PLAYBACK MODE') {
            indicator.style.display = 'none';
        }
    }
    
    updatePlaybackUI() {
        // Update move counter
        const counter = document.getElementById('playback-move-counter');
        if (counter) {
            counter.textContent = `Move ${this.currentMoveIndex} / ${this.fullGameHistory.length}`;
        }
        
        // Update timeline
        const timeline = document.getElementById('playback-timeline');
        if (timeline) {
            const progress = this.fullGameHistory.length > 0 ? 
                (this.currentMoveIndex / this.fullGameHistory.length) * 100 : 0;
            timeline.querySelector('.timeline-progress').style.width = `${progress}%`;
        }
        
        // Update current move info
        if (this.currentMoveIndex > 0 && this.currentMoveIndex <= this.fullGameHistory.length) {
            const move = this.fullGameHistory[this.currentMoveIndex - 1];
            const info = document.getElementById('playback-move-info');
            if (info) {
                const fromCol = String.fromCharCode(65 + move.from.col);
                const fromRow = 8 - move.from.row;
                const toCol = String.fromCharCode(65 + move.to.col);
                const toRow = 8 - move.to.row;
                info.textContent = `${move.player}: ${fromCol}${fromRow} → ${toCol}${toRow}`;
            }
        }
    }
    
    updatePlayButton() {
        const btn = document.getElementById('playback-play-btn');
        if (btn) {
            btn.textContent = this.isPlaying ? '⏸' : '▶';
        }
    }
}