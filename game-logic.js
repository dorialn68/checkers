class CheckersGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.mandatoryJumps = [];
        this.moveHistory = [];
        this.gameMode = 'pvp';
        this.redPieces = 12;
        this.blackPieces = 12;
        this.isGameOver = false;
        this.winner = null;
        this.multiJumpMode = false;
        this.lastMovedPiece = null;
        
        // Rule options
        this.rules = {
            backwardCapture: true,
            flyingKings: true,
            mandatoryCapture: true
        };
        
        // Check for initial mandatory jumps
        this.mandatoryJumps = this.getAllJumpsForPlayer(this.currentPlayer);
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = { color: 'black', isKing: false, row, col };
                }
            }
        }
        
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = { color: 'red', isKing: false, row, col };
                }
            }
        }
        
        return board;
    }

    selectPiece(row, col) {
        const piece = this.board[row][col];
        
        if (!piece || piece.color !== this.currentPlayer) {
            return false;
        }

        if (this.multiJumpMode && piece !== this.lastMovedPiece) {
            return false;
        }

        // Check if there are mandatory jumps for any piece (if rule is enabled)
        const allJumps = this.rules.mandatoryCapture ? this.getAllJumpsForPlayer(this.currentPlayer) : [];
        
        this.selectedPiece = { row, col };
        this.validMoves = this.getValidMoves(row, col);
        
        // If there are mandatory jumps anywhere on the board and rule is enabled
        if (this.rules.mandatoryCapture && allJumps.length > 0) {
            const jumpMoves = this.validMoves.filter(move => move.isJump);
            // This piece can only move if it has jumps available
            if (jumpMoves.length > 0) {
                this.validMoves = jumpMoves;
                // Piece has jumps, allow selection
                return true;
            } else {
                // This piece has no jumps available
                // Check if this piece is one that MUST jump
                const pieceHasJump = allJumps.some(jump => 
                    jump.from.row === row && jump.from.col === col
                );
                
                if (!pieceHasJump) {
                    // This piece doesn't have any jumps, but other pieces do
                    // Clear moves but allow selection to show it's blocked
                    this.validMoves = [];
                    return true;
                } else {
                    // This piece should have jumps but we didn't find them - there's a logic error
                    console.error('Logic error: Piece should have jumps but none found');
                    this.validMoves = [];
                    return true;
                }
            }
        }
        
        return true;
    }

    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const moves = [];
        
        if (piece.isKing) {
            // Flying king or regular king based on rules
            if (this.rules.flyingKings) {
                this.getKingMoves(row, col, piece, moves);
            } else {
                // Regular king movement (one square in any direction)
                const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                for (const [dRow, dCol] of directions) {
                    this.checkDirection(row, col, dRow, dCol, piece, moves, false);
                }
            }
        } else {
            // Regular pieces
            const forwardDirs = piece.color === 'red' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
            const backwardDirs = piece.color === 'red' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
            
            // Forward moves and captures
            for (const [dRow, dCol] of forwardDirs) {
                this.checkDirection(row, col, dRow, dCol, piece, moves, false);
            }
            
            // Backward captures only if rule is enabled
            if (this.rules.backwardCapture) {
                for (const [dRow, dCol] of backwardDirs) {
                    this.checkDirection(row, col, dRow, dCol, piece, moves, true);
                }
            }
        }

        return moves;
    }

    checkDirection(row, col, dRow, dCol, piece, moves, captureOnly = false) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (this.isValidPosition(newRow, newCol)) {
            if (!this.board[newRow][newCol]) {
                // Empty square - can move here if not capture-only and not in multi-jump
                if (!captureOnly && !this.multiJumpMode) {
                    moves.push({ row: newRow, col: newCol, isJump: false });
                }
            } else if (this.board[newRow][newCol].color !== piece.color) {
                // Enemy piece - check if we can jump
                const jumpRow = newRow + dRow;
                const jumpCol = newCol + dCol;
                
                if (this.isValidPosition(jumpRow, jumpCol) && !this.board[jumpRow][jumpCol]) {
                    moves.push({
                        row: jumpRow,
                        col: jumpCol,
                        isJump: true,
                        capturedRow: newRow,
                        capturedCol: newCol
                    });
                }
            }
        }
    }

    getKingMoves(row, col, piece, moves) {
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        for (const [dRow, dCol] of directions) {
            let currentRow = row;
            let currentCol = col;
            let foundEnemy = false;
            let enemyRow = -1;
            let enemyCol = -1;
            
            // Flying king - can move multiple squares along diagonal
            while (true) {
                currentRow += dRow;
                currentCol += dCol;
                
                if (!this.isValidPosition(currentRow, currentCol)) break;
                
                const targetSquare = this.board[currentRow][currentCol];
                
                if (!targetSquare) {
                    // Empty square
                    if (!foundEnemy) {
                        // Can move here if not in multi-jump mode
                        if (!this.multiJumpMode) {
                            moves.push({ 
                                row: currentRow, 
                                col: currentCol, 
                                isJump: false 
                            });
                        }
                    } else {
                        // Can land here after jumping enemy
                        moves.push({
                            row: currentRow,
                            col: currentCol,
                            isJump: true,
                            capturedRow: enemyRow,
                            capturedCol: enemyCol
                        });
                    }
                } else if (targetSquare.color !== piece.color && !foundEnemy) {
                    // Found first enemy piece
                    foundEnemy = true;
                    enemyRow = currentRow;
                    enemyCol = currentCol;
                } else {
                    // Hit friendly piece or second enemy - stop
                    break;
                }
            }
        }
    }

    getAllJumpsForPlayer(player) {
        const jumps = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === player) {
                    const moves = this.getValidMoves(row, col);
                    const jumpMoves = moves.filter(move => move.isJump);
                    if (jumpMoves.length > 0) {
                        // Return each jump in the format AI expects
                        for (const jumpMove of jumpMoves) {
                            jumps.push({
                                from: { row, col },
                                to: { row: jumpMove.row, col: jumpMove.col },
                                isJump: true
                            });
                        }
                    }
                }
            }
        }
        
        return jumps;
    }

    makeMove(toRow, toCol) {
        if (!this.selectedPiece) return false;

        const move = this.validMoves.find(m => m.row === toRow && m.col === toCol);
        if (!move) return false;

        const fromRow = this.selectedPiece.row;
        const fromCol = this.selectedPiece.col;
        const piece = this.board[fromRow][fromCol];
        
        // Store complete move information for undo
        const moveRecord = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            player: this.currentPlayer,
            isJump: move.isJump,
            turnNumber: Math.floor(this.moveHistory.length / 2) + 1,
            wasKing: piece.isKing,
            becameKing: false,
            capturedPiece: null,
            capturedPosition: null,
            multiJumpContinued: false,
            boardStateBefore: this.getBoardState()
        };

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.row = toRow;
        piece.col = toCol;

        this.lastMovedPiece = piece;

        if (move.isJump) {
            // Store captured piece info
            const capturedPiece = this.board[move.capturedRow][move.capturedCol];
            moveRecord.capturedPiece = capturedPiece ? {...capturedPiece} : null;
            moveRecord.capturedPosition = { row: move.capturedRow, col: move.capturedCol };
            
            this.board[move.capturedRow][move.capturedCol] = null;
            
            if (this.currentPlayer === 'red') {
                this.blackPieces--;
            } else {
                this.redPieces--;
            }

            const additionalJumps = this.getValidMoves(toRow, toCol).filter(m => m.isJump);
            if (additionalJumps.length > 0) {
                this.multiJumpMode = true;
                this.selectedPiece = { row: toRow, col: toCol };
                this.validMoves = additionalJumps;
                moveRecord.multiJumpContinued = true;
                this.moveHistory.push(moveRecord);
                return true;
            }
        }

        // Check for king promotion
        if (!piece.isKing && ((piece.color === 'red' && toRow === 0) || 
            (piece.color === 'black' && toRow === 7))) {
            piece.isKing = true;
            moveRecord.becameKing = true;
        }

        this.moveHistory.push(moveRecord);

        this.multiJumpMode = false;
        this.lastMovedPiece = null;
        this.switchTurn();
        this.checkGameOver();

        return true;
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        // Only check for mandatory jumps for the current player
        this.mandatoryJumps = this.getAllJumpsForPlayer(this.currentPlayer);
    }

    undoLastMove(undoCount = 1) {
        if (this.moveHistory.length === 0) return false;
        
        let undone = 0;
        
        for (let i = 0; i < undoCount && this.moveHistory.length > 0; i++) {
            const lastMove = this.moveHistory.pop();
            
            // Move piece back to original position
            const piece = this.board[lastMove.to.row][lastMove.to.col];
            if (piece) {
                this.board[lastMove.from.row][lastMove.from.col] = piece;
                this.board[lastMove.to.row][lastMove.to.col] = null;
                
                piece.row = lastMove.from.row;
                piece.col = lastMove.from.col;
                
                // Restore king status
                if (lastMove.becameKing) {
                    piece.isKing = false;
                }
            }
            
            // Restore captured piece
            if (lastMove.capturedPiece && lastMove.capturedPosition) {
                const restored = {
                    ...lastMove.capturedPiece,
                    row: lastMove.capturedPosition.row,
                    col: lastMove.capturedPosition.col
                };
                this.board[restored.row][restored.col] = restored;
                
                // Update piece counts
                if (restored.color === 'red') {
                    this.redPieces++;
                } else {
                    this.blackPieces++;
                }
            }
            
            // Handle multi-jump continuation
            if (lastMove.multiJumpContinued) {
                // Continue undoing if this was part of a multi-jump
                while (this.moveHistory.length > 0 && 
                       this.moveHistory[this.moveHistory.length - 1].multiJumpContinued) {
                    this.undoLastMove(1);
                }
            }
            
            this.currentPlayer = lastMove.player;
            undone++;
        }
        
        // Reset game state
        this.selectedPiece = null;
        this.validMoves = [];
        this.multiJumpMode = false;
        this.lastMovedPiece = null;
        this.isGameOver = false;
        this.winner = null;
        this.mandatoryJumps = this.getAllJumpsForPlayer(this.currentPlayer);
        
        return undone > 0;
    }
    
    // New method to support playback
    goToMove(moveIndex) {
        if (moveIndex < 0 || moveIndex > this.moveHistory.length) return false;
        
        // Store current position
        const currentIndex = this.moveHistory.length;
        
        if (moveIndex < currentIndex) {
            // Go backward - undo moves
            const undoCount = currentIndex - moveIndex;
            this.undoLastMove(undoCount);
        } else if (moveIndex > currentIndex) {
            // Go forward - replay moves (requires stored moves)
            // This would need the full history to be stored separately
            return false;
        }
        
        return true;
    }
    
    // Get full game state for playback
    getFullHistory() {
        return {
            moves: [...this.moveHistory],
            currentIndex: this.moveHistory.length,
            currentPlayer: this.currentPlayer,
            board: this.board.map(row => row.map(cell => cell ? {...cell} : null)),
            redPieces: this.redPieces,
            blackPieces: this.blackPieces,
            isGameOver: this.isGameOver,
            winner: this.winner
        };
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    checkGameOver() {
        const currentPlayerMoves = this.getAllPossibleMovesForPlayer(this.currentPlayer);
        
        if (currentPlayerMoves.length === 0) {
            this.isGameOver = true;
            this.winner = this.currentPlayer === 'red' ? 'black' : 'red';
            return true;
        }

        if (this.redPieces === 0) {
            this.isGameOver = true;
            this.winner = 'black';
            return true;
        }

        if (this.blackPieces === 0) {
            this.isGameOver = true;
            this.winner = 'red';
            return true;
        }

        return false;
    }

    getAllPossibleMovesForPlayer(player) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === player) {
                    const validMoves = this.getValidMoves(row, col);
                    if (validMoves.length > 0) {
                        moves.push({ from: { row, col }, moves: validMoves });
                    }
                }
            }
        }
        
        return moves;
    }

    getBoardState() {
        return {
            board: this.board.map(row => row.map(cell => cell ? {...cell} : null)),
            currentPlayer: this.currentPlayer,
            redPieces: this.redPieces,
            blackPieces: this.blackPieces,
            isGameOver: this.isGameOver,
            winner: this.winner,
            mandatoryJumps: this.mandatoryJumps
        };
    }

    getBestMove() {
        const possibleMoves = this.getAllPossibleMovesForPlayer(this.currentPlayer);
        
        const jumpMoves = possibleMoves.filter(moveSet => 
            moveSet.moves.some(move => move.isJump)
        );
        
        if (jumpMoves.length > 0) {
            const bestJump = jumpMoves[0];
            const jumpMove = bestJump.moves.find(m => m.isJump);
            return {
                from: bestJump.from,
                to: { row: jumpMove.row, col: jumpMove.col }
            };
        }

        const scoredMoves = possibleMoves.map(moveSet => {
            const scores = moveSet.moves.map(move => {
                let score = 0;
                
                if ((this.currentPlayer === 'red' && move.row === 0) ||
                    (this.currentPlayer === 'black' && move.row === 7)) {
                    score += 50;
                }
                
                if (move.row === 3 || move.row === 4) {
                    score += 10;
                }
                if (move.col === 3 || move.col === 4) {
                    score += 10;
                }
                
                const piece = this.board[moveSet.from.row][moveSet.from.col];
                if (piece.isKing) {
                    score += 5;
                }
                
                return { move, score, from: moveSet.from };
            });
            
            return scores;
        }).flat();

        if (scoredMoves.length === 0) return null;

        scoredMoves.sort((a, b) => b.score - a.score);
        
        const topMoves = scoredMoves.filter(m => m.score === scoredMoves[0].score);
        const randomIndex = Math.floor(Math.random() * topMoves.length);
        const bestMove = topMoves[randomIndex];
        
        return {
            from: bestMove.from,
            to: { row: bestMove.move.row, col: bestMove.move.col }
        };
    }

    evaluateBoard(player) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;
                
                const multiplier = piece.color === player ? 1 : -1;
                
                score += 10 * multiplier;
                
                if (piece.isKing) {
                    score += 15 * multiplier;
                }
                
                if (piece.color === player) {
                    if ((player === 'red' && row < 3) || (player === 'black' && row > 4)) {
                        score += 3 * multiplier;
                    }
                    
                    if (col > 0 && col < 7) {
                        score += 2 * multiplier;
                    }
                }
            }
        }
        
        const playerMoves = this.getAllPossibleMovesForPlayer(player).length;
        const opponentMoves = this.getAllPossibleMovesForPlayer(
            player === 'red' ? 'black' : 'red'
        ).length;
        
        score += (playerMoves - opponentMoves) * 2;
        
        return score;
    }

    newGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.mandatoryJumps = [];
        this.moveHistory = [];
        this.redPieces = 12;
        this.blackPieces = 12;
        this.isGameOver = false;
        this.winner = null;
        this.multiJumpMode = false;
        this.lastMovedPiece = null;
    }
}