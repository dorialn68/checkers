let game = null;
let renderer = null;
let ai = null;
let llm = null;
let currentMode = 'pvp';
let aiDifficulty = 'medium';
let isAIThinking = false;
let helperMode = false;
let moveHistoryCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    hideLoadingScreen();
});

function initializeGame() {
    const canvas = document.getElementById('game-canvas');
    
    game = new CheckersGame();
    renderer = new Checkers3DRenderer(canvas, game);
    ai = new CheckersAI(aiDifficulty);
    llm = new LLMIntegration();
    
    renderer.onSquareClick = handleSquareClick;
    
    updateUI();
}

function setupEventListeners() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.currentTarget.dataset.mode;
            changeGameMode(mode);
        });
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.currentTarget.dataset.level;
            changeAIDifficulty(level);
        });
    });

    document.getElementById('cam-top').addEventListener('click', () => {
        renderer.setCameraView('top');
    });

    document.getElementById('cam-side').addEventListener('click', () => {
        renderer.setCameraView('side');
    });

    document.getElementById('cam-perspective').addEventListener('click', () => {
        renderer.setCameraView('perspective');
    });

    document.getElementById('cam-rotate').addEventListener('click', () => {
        renderer.startAutoRotate();
    });

    document.getElementById('new-game').addEventListener('click', startNewGame);
    document.getElementById('undo-move').addEventListener('click', undoMove);
    document.getElementById('show-hint').addEventListener('click', showHint);
    document.getElementById('show-rules').addEventListener('click', showRules);
    document.getElementById('online-play').addEventListener('click', showOnlinePlayModal);

    // Rule toggles
    document.getElementById('backward-capture').addEventListener('change', (e) => {
        game.rules.backwardCapture = e.target.checked;
        updateRulesDisplay();
    });

    document.getElementById('flying-kings').addEventListener('change', (e) => {
        game.rules.flyingKings = e.target.checked;
        updateRulesDisplay();
    });

    document.getElementById('mandatory-capture').addEventListener('change', (e) => {
        game.rules.mandatoryCapture = e.target.checked;
        game.mandatoryJumps = e.target.checked ? game.getAllJumpsForPlayer(game.currentPlayer) : [];
        updateUI();
        updateRulesDisplay();
    });

    document.getElementById('llm-provider').addEventListener('change', (e) => {
        const provider = e.target.value;
        llm.setProvider(provider);
        
        const apiKeyInput = document.getElementById('api-key');
        if (provider === 'local') {
            apiKeyInput.style.display = 'none';
        } else {
            apiKeyInput.style.display = 'block';
            apiKeyInput.placeholder = `Enter ${provider} API key`;
        }
    });

    document.getElementById('api-key').addEventListener('change', (e) => {
        llm.apiKey = e.target.value;
    });

    document.getElementById('chat-send').addEventListener('click', sendChatMessage);
    
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    document.getElementById('analyze-board').addEventListener('click', analyzeBoardWithAI);

    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('rules-modal').style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('rules-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function hideLoadingScreen() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1000);
}

function changeGameMode(mode) {
    currentMode = mode;
    game.gameMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    document.getElementById('game-mode').textContent = 
        mode === 'pvp' ? 'PvP' : 
        mode === 'pvc' ? 'PvC' : 
        'Helper';
    
    helperMode = (mode === 'helper');
    
    if (helperMode && game.currentPlayer === game.currentPlayer) {
        showAgentSuggestions();
    }
    
    startNewGame();
}

function changeAIDifficulty(level) {
    aiDifficulty = level;
    ai = new CheckersAI(aiDifficulty);
    
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-level="${level}"]`).classList.add('active');
}

function handleSquareClick(row, col) {
    if (game.isGameOver) return;
    
    // Allow clicking only for moves, not during AI thinking
    if (isAIThinking && currentMode === 'pvc' && game.currentPlayer === 'black') {
        return;
    }

    const piece = game.board[row][col];
    
    if (game.selectedPiece) {
        const validMove = game.validMoves.find(m => m.row === row && m.col === col);
        if (validMove) {
            makeMove(row, col);
        } else if (piece && piece.color === game.currentPlayer) {
            game.selectPiece(row, col);
            renderer.updateBoard();
        } else {
            game.selectedPiece = null;
            game.validMoves = [];
            renderer.updateBoard();
        }
    } else if (piece && piece.color === game.currentPlayer) {
        game.selectPiece(row, col);
        renderer.updateBoard();
    }
}

function makeMove(row, col) {
    const from = { ...game.selectedPiece };
    const to = { row, col };
    
    renderer.animateMove(from, to, () => {
        const moveSuccessful = game.makeMove(row, col);
        
        if (moveSuccessful) {
            renderer.updateBoard();
            updateUI();
            addMoveToHistory(from, to);
            
            if (!game.multiJumpMode) {
                if (game.isGameOver) {
                    showGameOver();
                } else if (currentMode === 'pvc' && game.currentPlayer === 'black') {
                    setTimeout(() => makeAIMove(), 1000);
                } else if (helperMode) {
                    showAgentSuggestions();
                }
            }
        }
    });
}

async function makeAIMove() {
    if (game.isGameOver || game.currentPlayer !== 'black') return;
    
    isAIThinking = true;
    showMoveIndicator('AI is thinking...');
    
    try {
        // Add timeout to prevent infinite thinking
        const movePromise = ai.getBestMove(game, 'black');
        const timeoutPromise = new Promise((resolve) => 
            setTimeout(() => resolve(null), 5000) // 5 second max timeout
        );
        
        const bestMove = await Promise.race([movePromise, timeoutPromise]);
        
        if (!bestMove) {
            // Fallback to simple move if AI times out
            const fallbackMove = game.getBestMove();
            if (fallbackMove) {
                game.selectPiece(fallbackMove.from.row, fallbackMove.from.col);
                renderer.updateBoard();
                
                setTimeout(() => {
                    makeMove(fallbackMove.to.row, fallbackMove.to.col);
                    isAIThinking = false;
                    hideMoveIndicator();
                }, 300);
            } else {
                isAIThinking = false;
                hideMoveIndicator();
                console.error('AI could not find a valid move');
            }
            return;
        }
        
        // Handle the move structure properly
        const fromRow = bestMove.from.row;
        const fromCol = bestMove.from.col;
        
        if (fromRow === undefined || fromCol === undefined) {
            console.error('Invalid move structure:', bestMove);
            isAIThinking = false;
            hideMoveIndicator();
            return;
        }
        
        game.selectPiece(fromRow, fromCol);
        renderer.updateBoard();
        
        setTimeout(() => {
            makeMove(bestMove.to.row, bestMove.to.col);
            isAIThinking = false;
            hideMoveIndicator();
        }, 300);
    } catch (error) {
        console.error('AI move error:', error);
        isAIThinking = false;
        hideMoveIndicator();
    }
}

function showAgentSuggestions() {
    if (!helperMode) return;
    
    const suggestions = ai.suggestMoves(game, game.currentPlayer, 3);
    renderer.showHintMoves(suggestions);
    
    if (suggestions.length > 0) {
        const best = suggestions[0];
        const notation = llm.getMoveNotation(best.from, best.to);
        showMoveIndicator(`Suggested: ${notation}`);
    }
}

function showHint() {
    const suggestions = ai.suggestMoves(game, game.currentPlayer, 1);
    
    if (suggestions.length > 0) {
        renderer.showHintMoves(suggestions);
        
        const best = suggestions[0];
        const notation = llm.getMoveNotation(best.from, best.to);
        
        addChatMessage('ai', `Hint: Try moving ${notation}. ${best.explanation}`);
        
        setTimeout(() => {
            renderer.clearHintHighlights();
        }, 5000);
    } else {
        addChatMessage('ai', 'No valid moves available.');
    }
}

function startNewGame() {
    game.newGame();
    renderer.updateBoard();
    updateUI();
    clearMoveHistory();
    
    if (helperMode) {
        showAgentSuggestions();
    }
}

function undoMove() {
    if (game.undoLastMove()) {
        renderer.updateBoard();
        updateUI();
        removeLastMoveFromHistory();
        
        if (helperMode) {
            showAgentSuggestions();
        }
    }
}

function updateUI() {
    document.getElementById('current-turn').textContent = 
        game.currentPlayer.charAt(0).toUpperCase() + game.currentPlayer.slice(1);
    
    document.getElementById('red-score').textContent = game.redPieces;
    document.getElementById('black-score').textContent = game.blackPieces;
    
    // Only show mandatory jump message if there are actual jumps for current player
    const currentPlayerJumps = game.getAllJumpsForPlayer(game.currentPlayer);
    if (currentPlayerJumps.length > 0 && !game.multiJumpMode) {
        showMoveIndicator('Jump available! (mandatory)');
    } else if (game.multiJumpMode) {
        showMoveIndicator('Continue jumping!');
    } else {
        hideMoveIndicator();
    }
}

function showMoveIndicator(text) {
    const indicator = document.getElementById('move-indicator');
    indicator.textContent = text;
    indicator.style.display = 'block';
}

function hideMoveIndicator() {
    const indicator = document.getElementById('move-indicator');
    indicator.style.display = 'none';
}

function addMoveToHistory(from, to) {
    moveHistoryCount++;
    const historyDiv = document.getElementById('move-history');
    
    if (moveHistoryCount === 1) {
        historyDiv.innerHTML = '';
    }
    
    const moveEntry = document.createElement('div');
    moveEntry.className = 'move-entry';
    
    const moveNumber = Math.floor((moveHistoryCount - 1) / 2) + 1;
    const player = game.currentPlayer === 'red' ? 'Black' : 'Red';
    const notation = llm.getMoveNotation(from, to);
    
    moveEntry.innerHTML = `
        <span class="move-number">${moveNumber}.</span>
        <span>${player}: ${notation}</span>
    `;
    
    historyDiv.appendChild(moveEntry);
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

function removeLastMoveFromHistory() {
    const historyDiv = document.getElementById('move-history');
    if (historyDiv.lastChild) {
        historyDiv.removeChild(historyDiv.lastChild);
        moveHistoryCount--;
    }
    
    if (moveHistoryCount === 0) {
        historyDiv.innerHTML = '<div class="history-empty">No moves yet</div>';
    }
}

function clearMoveHistory() {
    moveHistoryCount = 0;
    document.getElementById('move-history').innerHTML = '<div class="history-empty">No moves yet</div>';
}

function showGameOver() {
    const winner = game.winner.charAt(0).toUpperCase() + game.winner.slice(1);
    showMoveIndicator(`Game Over! ${winner} wins!`);
    
    addChatMessage('ai', `🎉 Congratulations! ${winner} has won the game!`);
}

function showRules() {
    document.getElementById('rules-modal').style.display = 'block';
}

function updateRulesDisplay() {
    const rulesText = [];
    if (game.rules.backwardCapture) rulesText.push('Backward Capture');
    if (game.rules.flyingKings) rulesText.push('Flying Kings');
    if (game.rules.mandatoryCapture) rulesText.push('Mandatory Capture');
    
    console.log('Active rules:', rulesText.join(', '));
}

function showOnlinePlayModal() {
    alert(`Online Multiplayer - Coming Soon!
    
    Planned Features:
    • Join/Create game rooms
    • Play with friends via room codes
    • Automatic matchmaking
    • Real-time synchronization
    • Chat during games
    
    For now, enjoy local PvP by sharing the screen!`);
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim().toLowerCase();
    
    if (!message) return;
    
    addChatMessage('user', input.value.trim());
    input.value = '';
    
    // Enhanced text understanding
    if (message.includes('best move') || 
        message.includes('what should') || 
        message.includes('suggest') ||
        message.includes('help me') ||
        message.includes('what move') ||
        message.includes('how to play')) {
        // Get move suggestions
        const suggestions = ai.suggestMoves(game, game.currentPlayer, 3);
        if (suggestions.length > 0) {
            const best = suggestions[0];
            const notation = llm.getMoveNotation(best.from, best.to);
            let response = `Best move: ${notation}\n`;
            response += `Why: ${best.explanation}\n`;
            if (suggestions.length > 1) {
                response += `\nAlternatives:\n`;
                for (let i = 1; i < Math.min(3, suggestions.length); i++) {
                    const alt = suggestions[i];
                    response += `${i}. ${llm.getMoveNotation(alt.from, alt.to)} - ${alt.explanation}\n`;
                }
            }
            addChatMessage('ai', response);
            renderer.showHintMoves(suggestions);
        } else {
            addChatMessage('ai', 'No valid moves available in this position.');
        }
    } else if (message.includes('how to win') || 
               message.includes('strategy') || 
               message.includes('tips')) {
        // Strategic advice
        let advice = "Winning strategies:\n";
        advice += "1. Control the center - pieces in center have more mobility\n";
        advice += "2. Protect your back row - prevents opponent from getting kings\n";
        advice += "3. Get kings early - they can move in all directions\n";
        advice += "4. Force trades when ahead - simplify to win\n";
        advice += "5. Create 'bridges' - protect pieces with others\n";
        advice += "\nNew rules active:\n";
        advice += "• Regular pieces can capture backwards!\n";
        advice += "• Kings can fly across the board diagonally!";
        addChatMessage('ai', advice);
    } else if (message.includes('analyze') || 
               message.includes('position') ||
               message.includes('who is winning')) {
        await analyzeBoardWithAI();
    } else if (message.includes('rules') || 
               message.includes('how to') ||
               message.includes('explain')) {
        let rules = "Enhanced Checkers Rules:\n";
        rules += "• Move diagonally on dark squares\n";
        rules += "• Captures are mandatory\n";
        rules += "• NEW: Regular pieces can capture backwards!\n";
        rules += "• NEW: Kings (queens) can fly diagonally across empty squares!\n";
        rules += "• Kings can jump enemies from any distance\n";
        rules += "• Multiple jumps required if available\n";
        rules += "• Win by capturing all enemies or blocking all moves";
        addChatMessage('ai', rules);
    } else if (message.includes('minimax') || 
               message.includes('algorithm') ||
               message.includes('how do you think')) {
        let explanation = "I use the Minimax algorithm:\n\n";
        explanation += "1. I look ahead 3-5 moves\n";
        explanation += "2. For each move, I assume you play perfectly\n";
        explanation += "3. I score positions based on:\n";
        explanation += "   • Material (pieces/kings)\n";
        explanation += "   • Board control\n";
        explanation += "   • King promotion potential\n";
        explanation += "4. I pick the move leading to best position\n";
        explanation += "5. Alpha-beta pruning speeds this up by 50%\n\n";
        explanation += "Think of it like chess - I'm always thinking several moves ahead!";
        addChatMessage('ai', explanation);
    } else {
        // Default response with helpful suggestions
        const response = "I understand: best move, how to win, strategy, analyze position, rules, and how the AI works. Try asking one of these!";
        addChatMessage('ai', response);
    }
}

async function analyzeBoardWithAI() {
    addChatMessage('ai', 'Analyzing board position...');
    
    try {
        const analysis = await llm.analyzeBoardAndSuggest(game);
        
        addChatMessage('ai', analysis.text);
        
        if (analysis.moves && analysis.moves.length > 0) {
            renderer.showHintMoves(analysis.moves);
            setTimeout(() => {
                renderer.clearHintHighlights();
            }, 8000);
        }
        
        if (analysis.cost > 0) {
            document.getElementById('token-cost').textContent = llm.getTotalCost();
        }
    } catch (error) {
        addChatMessage('ai', `Error: ${error.message}. Using local AI analysis instead.`);
        const localAnalysis = await llm.getLocalAnalysis(game);
        addChatMessage('ai', localAnalysis.text);
    }
}

function addChatMessage(sender, message) {
    const chatDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <strong>${sender === 'ai' ? 'AI Assistant' : 'You'} (${timestamp}):</strong>
        <div>${message.replace(/\n/g, '<br>')}</div>
    `;
    
    chatDiv.appendChild(messageDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}