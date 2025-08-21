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
                        jumps.push({ row, col, jumps: jumpMoves });
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

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.row = toRow;
        piece.col = toCol;

        this.lastMovedPiece = piece;

        if (move.isJump) {
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
                return true;
            }
        }

        if ((piece.color === 'red' && toRow === 0) || 
            (piece.color === 'black' && toRow === 7)) {
            piece.isKing = true;
        }

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            player: this.currentPlayer,
            isJump: move.isJump,
            turnNumber: Math.floor(this.moveHistory.length / 2) + 1
        });

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

    undoLastMove() {
        if (this.moveHistory.length === 0) return false;

        const lastMove = this.moveHistory.pop();
        const piece = this.board[lastMove.to.row][lastMove.to.col];
        
        this.board[lastMove.from.row][lastMove.from.col] = piece;
        this.board[lastMove.to.row][lastMove.to.col] = null;
        
        if (piece) {
            piece.row = lastMove.from.row;
            piece.col = lastMove.from.col;
        }

        this.currentPlayer = lastMove.player;
        this.selectedPiece = null;
        this.validMoves = [];
        this.mandatoryJumps = this.getAllJumpsForPlayer(this.currentPlayer);
        
        return true;
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