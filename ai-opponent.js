class CheckersAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.maxDepth = this.getMaxDepth(difficulty);
        this.evaluationWeights = this.getEvaluationWeights(difficulty);
        this.thinkingTime = this.getThinkingTime(difficulty);
    }

    getMaxDepth(difficulty) {
        const depths = {
            easy: 2,
            medium: 3,
            hard: 4,
            expert: 5
        };
        return depths[difficulty] || 3;
    }

    getThinkingTime(difficulty) {
        const times = {
            easy: 500,
            medium: 1000,
            hard: 1500,
            expert: 2000
        };
        return times[difficulty] || 1000;
    }

    getEvaluationWeights(difficulty) {
        if (difficulty === 'easy') {
            return {
                piece: 10,
                king: 15,
                backRow: 1,
                center: 1,
                mobility: 1,
                threat: 1
            };
        } else if (difficulty === 'expert') {
            return {
                piece: 10,
                king: 30,
                backRow: 5,
                center: 3,
                mobility: 5,
                threat: 8,
                formation: 4,
                tempo: 3
            };
        } else {
            return {
                piece: 10,
                king: 20,
                backRow: 3,
                center: 2,
                mobility: 3,
                threat: 5
            };
        }
    }

    async getBestMove(game, player) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // First check for mandatory jumps
                const jumps = game.getAllJumpsForPlayer(player);
                if (jumps.length > 0) {
                    // Must take a jump - evaluate which jump is best
                    let bestJump = null;
                    let bestScore = -Infinity;
                    
                    for (const jumpSet of jumps) {
                        for (const jump of jumpSet.jumps) {
                            const gameCopy = this.cloneGame(game);
                            // jumpSet has {row, col, jumps} structure
                            gameCopy.selectedPiece = { row: jumpSet.row, col: jumpSet.col };
                            gameCopy.validMoves = jumpSet.jumps;
                            gameCopy.makeMove(jump.row, jump.col);
                            
                            const score = this.evaluatePosition(gameCopy, player);
                            if (score > bestScore) {
                                bestScore = score;
                                bestJump = {
                                    from: { row: jumpSet.row, col: jumpSet.col },
                                    to: { row: jump.row, col: jump.col }
                                };
                            }
                        }
                    }
                    resolve(bestJump);
                } else {
                    // No mandatory jumps, use minimax for best move
                    const move = this.minimax(game, player);
                    resolve(move);
                }
            }, this.thinkingTime);
        });
    }

    minimax(game, player) {
        const alpha = -Infinity;
        const beta = Infinity;
        const maximizingPlayer = player;
        
        const result = this.minimaxRecursive(
            game, 
            this.maxDepth, 
            alpha, 
            beta, 
            maximizingPlayer, 
            player
        );
        
        return result.move;
    }

    minimaxRecursive(game, depth, alpha, beta, maximizingPlayer, currentPlayer) {
        if (depth === 0 || game.isGameOver) {
            return {
                score: this.evaluatePosition(game, maximizingPlayer),
                move: null
            };
        }

        const possibleMoves = game.getAllPossibleMovesForPlayer(currentPlayer);
        
        if (possibleMoves.length === 0) {
            return {
                score: currentPlayer === maximizingPlayer ? -10000 : 10000,
                move: null
            };
        }

        let bestMove = null;
        let bestScore = currentPlayer === maximizingPlayer ? -Infinity : Infinity;

        for (const moveSet of possibleMoves) {
            for (const move of moveSet.moves) {
                const gameCopy = this.cloneGame(game);
                
                gameCopy.selectedPiece = moveSet.from;
                gameCopy.validMoves = moveSet.moves;
                gameCopy.makeMove(move.row, move.col);
                
                const nextPlayer = gameCopy.currentPlayer;
                const result = this.minimaxRecursive(
                    gameCopy, 
                    depth - 1, 
                    alpha, 
                    beta, 
                    maximizingPlayer, 
                    nextPlayer
                );

                if (currentPlayer === maximizingPlayer) {
                    if (result.score > bestScore) {
                        bestScore = result.score;
                        bestMove = {
                            from: moveSet.from,
                            to: { row: move.row, col: move.col }
                        };
                    }
                    alpha = Math.max(alpha, bestScore);
                } else {
                    if (result.score < bestScore) {
                        bestScore = result.score;
                        bestMove = {
                            from: moveSet.from,
                            to: { row: move.row, col: move.col }
                        };
                    }
                    beta = Math.min(beta, bestScore);
                }

                if (beta <= alpha) {
                    break;
                }
            }
        }

        return { score: bestScore, move: bestMove };
    }

    evaluatePosition(game, player) {
        let score = 0;
        const opponent = player === 'red' ? 'black' : 'red';
        const weights = this.evaluationWeights;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (!piece) continue;

                const isPlayerPiece = piece.color === player;
                const multiplier = isPlayerPiece ? 1 : -1;

                score += weights.piece * multiplier;

                if (piece.isKing) {
                    score += weights.king * multiplier;
                }

                if (isPlayerPiece) {
                    if ((player === 'red' && row === 7) || (player === 'black' && row === 0)) {
                        score += weights.backRow;
                    }

                    if (row >= 3 && row <= 4 && col >= 2 && col <= 5) {
                        score += weights.center;
                    }

                    const threats = this.countThreats(game, row, col);
                    score -= threats * weights.threat;
                }

                if (weights.formation) {
                    score += this.evaluateFormation(game, row, col, player) * multiplier;
                }
            }
        }

        const playerMoves = game.getAllPossibleMovesForPlayer(player).length;
        const opponentMoves = game.getAllPossibleMovesForPlayer(opponent).length;
        score += (playerMoves - opponentMoves) * weights.mobility;

        if (weights.tempo) {
            const advancementScore = this.evaluateAdvancement(game, player);
            score += advancementScore * weights.tempo;
        }

        return score;
    }

    countThreats(game, row, col) {
        const piece = game.board[row][col];
        if (!piece) return 0;

        let threats = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

        for (const [dRow, dCol] of directions) {
            const threatRow = row + dRow;
            const threatCol = col + dCol;
            const escapeRow = row - dRow;
            const escapeCol = col - dCol;

            if (game.isValidPosition(threatRow, threatCol) && 
                game.isValidPosition(escapeRow, escapeCol)) {
                const threatPiece = game.board[threatRow][threatCol];
                const escapeTile = game.board[escapeRow][escapeCol];

                if (threatPiece && 
                    threatPiece.color !== piece.color && 
                    !escapeTile) {
                    const canJump = (threatPiece.isKing || 
                        (threatPiece.color === 'red' && dRow < 0) ||
                        (threatPiece.color === 'black' && dRow > 0));
                    
                    if (canJump) {
                        threats++;
                    }
                }
            }
        }

        return threats;
    }

    evaluateFormation(game, row, col, player) {
        const piece = game.board[row][col];
        if (!piece || piece.color !== player) return 0;

        let formationScore = 0;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

        for (const [dRow, dCol] of directions) {
            const neighborRow = row + dRow;
            const neighborCol = col + dCol;

            if (game.isValidPosition(neighborRow, neighborCol)) {
                const neighbor = game.board[neighborRow][neighborCol];
                if (neighbor && neighbor.color === player) {
                    formationScore += 2;
                }
            }
        }

        return formationScore;
    }

    evaluateAdvancement(game, player) {
        let advancement = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (piece && piece.color === player && !piece.isKing) {
                    if (player === 'red') {
                        advancement += (7 - row);
                    } else {
                        advancement += row;
                    }
                }
            }
        }

        return advancement;
    }

    cloneGame(game) {
        const clone = new CheckersGame();
        clone.board = game.board.map(row => 
            row.map(cell => cell ? {...cell} : null)
        );
        clone.currentPlayer = game.currentPlayer;
        clone.selectedPiece = game.selectedPiece ? {...game.selectedPiece} : null;
        clone.validMoves = [...game.validMoves];
        clone.mandatoryJumps = [...game.mandatoryJumps];
        clone.moveHistory = [...game.moveHistory];
        clone.gameMode = game.gameMode;
        clone.redPieces = game.redPieces;
        clone.blackPieces = game.blackPieces;
        clone.isGameOver = game.isGameOver;
        clone.winner = game.winner;
        clone.multiJumpMode = game.multiJumpMode;
        clone.lastMovedPiece = game.lastMovedPiece;
        return clone;
    }

    suggestMoves(game, player, count = 3) {
        const possibleMoves = game.getAllPossibleMovesForPlayer(player);
        const evaluatedMoves = [];

        for (const moveSet of possibleMoves) {
            for (const move of moveSet.moves) {
                const gameCopy = this.cloneGame(game);
                gameCopy.selectedPiece = moveSet.from;
                gameCopy.validMoves = moveSet.moves;
                gameCopy.makeMove(move.row, move.col);

                const score = this.evaluatePosition(gameCopy, player);
                
                evaluatedMoves.push({
                    from: moveSet.from,
                    to: { row: move.row, col: move.col },
                    score: score,
                    isJump: move.isJump,
                    explanation: this.explainMove(game, moveSet.from, move)
                });
            }
        }

        evaluatedMoves.sort((a, b) => b.score - a.score);
        return evaluatedMoves.slice(0, count);
    }

    explainMove(game, from, move) {
        const explanations = [];
        const piece = game.board[from.row][from.col];

        if (move.isJump) {
            explanations.push("Captures opponent piece");
        }

        if ((piece.color === 'red' && move.row === 0) ||
            (piece.color === 'black' && move.row === 7)) {
            explanations.push("Promotes to King");
        }

        if (move.row >= 3 && move.row <= 4 && move.col >= 2 && move.col <= 5) {
            explanations.push("Controls center");
        }

        const threats = this.countThreats(game, move.row, move.col);
        if (threats === 0) {
            explanations.push("Safe position");
        } else if (threats > 1) {
            explanations.push(`Under threat from ${threats} pieces`);
        }

        return explanations.length > 0 ? explanations.join(", ") : "Standard move";
    }
}