class LLMIntegration {
    constructor() {
        this.provider = 'local';
        this.apiKey = '';
        this.tokenCosts = {
            openai: { input: 0.0005, output: 0.0015 },
            anthropic: { input: 0.00025, output: 0.00125 },
            groq: { input: 0, output: 0 },
            local: { input: 0, output: 0 }
        };
        this.totalCost = 0;
        this.localModel = new LocalCheckersAI();
    }

    setProvider(provider, apiKey = '') {
        this.provider = provider;
        this.apiKey = apiKey;
    }

    async analyzeBoardAndSuggest(game) {
        const boardState = this.encodeBoardState(game);
        const prompt = this.createAnalysisPrompt(boardState, game);
        
        try {
            let response;
            switch (this.provider) {
                case 'local':
                    response = await this.getLocalAnalysis(game);
                    break;
                case 'openai':
                    response = await this.getOpenAIAnalysis(prompt);
                    break;
                case 'anthropic':
                    response = await this.getClaudeAnalysis(prompt);
                    break;
                case 'groq':
                    response = await this.getGroqAnalysis(prompt);
                    break;
                default:
                    response = await this.getLocalAnalysis(game);
            }
            
            return response;
        } catch (error) {
            console.error('LLM Analysis Error:', error);
            return this.getLocalAnalysis(game);
        }
    }

    encodeBoardState(game) {
        let boardString = "Current Board State:\n";
        boardString += "  A B C D E F G H\n";
        
        for (let row = 0; row < 8; row++) {
            boardString += (8 - row) + " ";
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (!piece) {
                    boardString += (row + col) % 2 === 1 ? ". " : "  ";
                } else {
                    if (piece.color === 'red') {
                        boardString += piece.isKing ? "R " : "r ";
                    } else {
                        boardString += piece.isKing ? "B " : "b ";
                    }
                }
            }
            boardString += "\n";
        }
        
        return boardString;
    }

    createAnalysisPrompt(boardState, game) {
        return `You are an expert checkers player analyzing a game position. 
${boardState}

Legend: r=red piece, R=red king, b=black piece, B=black king, .=empty black square

Current turn: ${game.currentPlayer}
Red pieces: ${game.redPieces}, Black pieces: ${game.blackPieces}

Please analyze the position and suggest the best moves for ${game.currentPlayer}. Consider:
1. Immediate captures (mandatory in checkers)
2. King promotion opportunities
3. Defensive positions
4. Strategic center control
5. Endgame considerations if applicable

Provide your analysis in this format:
BEST MOVE: [from square] to [to square]
REASONING: [brief explanation]
ALTERNATIVE MOVES: [list 2-3 other good options]
TACTICAL TIPS: [general strategy advice]`;
    }

    async getLocalAnalysis(game) {
        const ai = new CheckersAI('expert');
        const suggestions = ai.suggestMoves(game, game.currentPlayer, 3);
        
        if (suggestions.length === 0) {
            return {
                text: "No valid moves available. The game might be over.",
                moves: [],
                cost: 0
            };
        }

        const bestMove = suggestions[0];
        const moveNotation = this.getMoveNotation(bestMove.from, bestMove.to);
        
        let analysis = `BEST MOVE: ${moveNotation}\n`;
        analysis += `REASONING: ${bestMove.explanation}\n`;
        analysis += `Score advantage: ${bestMove.score.toFixed(1)} points\n\n`;
        
        if (suggestions.length > 1) {
            analysis += "ALTERNATIVE MOVES:\n";
            for (let i = 1; i < Math.min(3, suggestions.length); i++) {
                const move = suggestions[i];
                const notation = this.getMoveNotation(move.from, move.to);
                analysis += `${i}. ${notation} - ${move.explanation}\n`;
            }
            analysis += "\n";
        }
        
        analysis += "TACTICAL TIPS:\n";
        analysis += this.getStrategicAdvice(game);
        
        return {
            text: analysis,
            moves: suggestions,
            cost: 0
        };
    }

    async getOpenAIAnalysis(prompt) {
        if (!this.apiKey) {
            throw new Error('OpenAI API key required');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are an expert checkers player and coach.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API request failed');
        }

        const data = await response.json();
        const text = data.choices[0].message.content;
        const tokens = data.usage;
        
        const cost = this.calculateCost('openai', tokens.prompt_tokens, tokens.completion_tokens);
        this.totalCost += cost;

        return {
            text: text,
            moves: this.parseMovesFromText(text),
            cost: cost
        };
    }

    async getClaudeAnalysis(prompt) {
        if (!this.apiKey) {
            throw new Error('Anthropic API key required');
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('Claude API request failed');
        }

        const data = await response.json();
        const text = data.content[0].text;
        
        const inputTokens = prompt.length / 4;
        const outputTokens = text.length / 4;
        const cost = this.calculateCost('anthropic', inputTokens, outputTokens);
        this.totalCost += cost;

        return {
            text: text,
            moves: this.parseMovesFromText(text),
            cost: cost
        };
    }

    async getGroqAnalysis(prompt) {
        if (!this.apiKey) {
            throw new Error('Groq API key required. Get one free at https://console.groq.com');
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    { role: 'system', content: 'You are an expert checkers player and coach.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error('Groq API request failed');
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        return {
            text: text,
            moves: this.parseMovesFromText(text),
            cost: 0
        };
    }

    parseMovesFromText(text) {
        const moves = [];
        const movePattern = /([A-H][1-8])\s*to\s*([A-H][1-8])/gi;
        const matches = text.matchAll(movePattern);
        
        for (const match of matches) {
            const from = this.parseSquareNotation(match[1]);
            const to = this.parseSquareNotation(match[2]);
            if (from && to) {
                moves.push({ from, to });
            }
        }
        
        return moves;
    }

    parseSquareNotation(notation) {
        if (!notation || notation.length !== 2) return null;
        
        const col = notation.charCodeAt(0) - 65;
        const row = 8 - parseInt(notation[1]);
        
        if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            return { row, col };
        }
        return null;
    }

    getMoveNotation(from, to) {
        const fromNotation = String.fromCharCode(65 + from.col) + (8 - from.row);
        const toNotation = String.fromCharCode(65 + to.col) + (8 - to.row);
        return `${fromNotation} to ${toNotation}`;
    }

    getStrategicAdvice(game) {
        const advice = [];
        
        const pieceRatio = game.currentPlayer === 'red' 
            ? game.redPieces / game.blackPieces 
            : game.blackPieces / game.redPieces;
        
        if (pieceRatio < 0.7) {
            advice.push("You're behind in pieces. Focus on defensive play and look for multi-jump opportunities.");
        } else if (pieceRatio > 1.3) {
            advice.push("You have a piece advantage. Press forward and trade pieces when beneficial.");
        }
        
        const kings = this.countKings(game, game.currentPlayer);
        if (kings === 0 && game.moveHistory.length > 20) {
            advice.push("Try to promote pieces to kings for better mobility.");
        }
        
        if (game.mandatoryJumps.length > 0) {
            advice.push("Remember: captures are mandatory! Look for chain jumps.");
        }
        
        const centerControl = this.evaluateCenterControl(game, game.currentPlayer);
        if (centerControl < 2) {
            advice.push("Control the center of the board for strategic advantage.");
        }
        
        return advice.join("\n");
    }

    countKings(game, player) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (piece && piece.color === player && piece.isKing) {
                    count++;
                }
            }
        }
        return count;
    }

    evaluateCenterControl(game, player) {
        let control = 0;
        for (let row = 3; row <= 4; row++) {
            for (let col = 2; col <= 5; col++) {
                const piece = game.board[row][col];
                if (piece && piece.color === player) {
                    control++;
                }
            }
        }
        return control;
    }

    calculateCost(provider, inputTokens, outputTokens) {
        const costs = this.tokenCosts[provider];
        if (!costs) return 0;
        
        const inputCost = (inputTokens / 1000) * costs.input;
        const outputCost = (outputTokens / 1000) * costs.output;
        return inputCost + outputCost;
    }

    getTotalCost() {
        return this.totalCost.toFixed(4);
    }
}

class LocalCheckersAI {
    analyzePosition(game) {
        const analysis = {
            materialBalance: this.getMaterialBalance(game),
            positionalStrength: this.getPositionalStrength(game),
            mobility: this.getMobility(game),
            threats: this.getThreats(game),
            opportunities: this.getOpportunities(game)
        };
        
        return this.generateAnalysisText(analysis, game);
    }

    getMaterialBalance(game) {
        const redKings = this.countKings(game, 'red');
        const blackKings = this.countKings(game, 'black');
        
        return {
            red: { pieces: game.redPieces, kings: redKings },
            black: { pieces: game.blackPieces, kings: blackKings }
        };
    }

    countKings(game, color) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (piece && piece.color === color && piece.isKing) {
                    count++;
                }
            }
        }
        return count;
    }

    getPositionalStrength(game) {
        const strength = { red: 0, black: 0 };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (!piece) continue;
                
                let score = 0;
                
                if (row >= 3 && row <= 4 && col >= 2 && col <= 5) {
                    score += 2;
                }
                
                if ((piece.color === 'red' && row === 7) || 
                    (piece.color === 'black' && row === 0)) {
                    score += 3;
                }
                
                if (piece.isKing) {
                    score += 5;
                }
                
                strength[piece.color] += score;
            }
        }
        
        return strength;
    }

    getMobility(game) {
        const redMoves = game.getAllPossibleMovesForPlayer('red').length;
        const blackMoves = game.getAllPossibleMovesForPlayer('black').length;
        
        return { red: redMoves, black: blackMoves };
    }

    getThreats(game) {
        const threats = { red: [], black: [] };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.board[row][col];
                if (!piece) continue;
                
                const enemyColor = piece.color === 'red' ? 'black' : 'red';
                const enemyMoves = game.getAllPossibleMovesForPlayer(enemyColor);
                
                for (const moveSet of enemyMoves) {
                    for (const move of moveSet.moves) {
                        if (move.isJump && move.capturedRow === row && move.capturedCol === col) {
                            threats[piece.color].push({ row, col });
                        }
                    }
                }
            }
        }
        
        return threats;
    }

    getOpportunities(game) {
        const opportunities = [];
        const moves = game.getAllPossibleMovesForPlayer(game.currentPlayer);
        
        for (const moveSet of moves) {
            for (const move of moveSet.moves) {
                if (move.isJump) {
                    opportunities.push({
                        type: 'capture',
                        from: moveSet.from,
                        to: { row: move.row, col: move.col }
                    });
                }
                
                const piece = game.board[moveSet.from.row][moveSet.from.col];
                if (piece && !piece.isKing) {
                    if ((piece.color === 'red' && move.row === 0) ||
                        (piece.color === 'black' && move.row === 7)) {
                        opportunities.push({
                            type: 'promotion',
                            from: moveSet.from,
                            to: { row: move.row, col: move.col }
                        });
                    }
                }
            }
        }
        
        return opportunities;
    }

    generateAnalysisText(analysis, game) {
        let text = `Board Analysis for ${game.currentPlayer}:\n\n`;
        
        text += `Material Count:\n`;
        text += `Red: ${analysis.materialBalance.red.pieces} pieces (${analysis.materialBalance.red.kings} kings)\n`;
        text += `Black: ${analysis.materialBalance.black.pieces} pieces (${analysis.materialBalance.black.kings} kings)\n\n`;
        
        text += `Position Strength: Red ${analysis.positionalStrength.red} - Black ${analysis.positionalStrength.black}\n`;
        text += `Mobility: Red ${analysis.mobility.red} moves - Black ${analysis.mobility.black} moves\n\n`;
        
        if (analysis.threats[game.currentPlayer].length > 0) {
            text += `⚠️ Pieces under threat: ${analysis.threats[game.currentPlayer].length}\n`;
        }
        
        if (analysis.opportunities.length > 0) {
            text += `✨ Opportunities:\n`;
            for (const opp of analysis.opportunities) {
                if (opp.type === 'capture') {
                    text += `- Capture available\n`;
                } else if (opp.type === 'promotion') {
                    text += `- King promotion possible\n`;
                }
            }
        }
        
        return text;
    }
}