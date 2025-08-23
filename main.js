let game = null;
let renderer = null;
let ai = null;
let llm = null;
let gameAnalytics = null;
let playbackController = null;
let totalUndosThisGame = 0; // Track total undos performed in current game
let pendingUndoCount = 0; // Track pending undo requests
let undoTimeout = null; // Timeout for batching undo requests
let currentMode = 'pvc';  // Default to PvC mode
let aiDifficulty = 'medium';
let isAIThinking = false;
let helperMode = false;
let moveHistoryCount = 0;
let moveStartTime = null;

// Player side determines which pieces they control (red or black)
let playerSide = 'red';  // Which side the human plays (red or black)
let computerSide = 'black';  // Which side the computer plays (opposite of player)

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    hideLoadingScreen();
    
    // Start move validation monitoring
    if (window.moveValidator) {
        window.moveValidator.startMonitoring(game);
    }
});

// Make functions globally available for validator
window.makeAIMove = makeAIMove;
window.currentMode = currentMode;
window.computerSide = computerSide;

function initializeGame() {
    const canvas = document.getElementById('game-canvas');
    
    game = new CheckersGame();
    renderer = new Checkers3DRenderer(canvas, game);
    window.renderer3D = renderer; // Make globally accessible for mobile support
    ai = new CheckersAI(aiDifficulty);
    llm = new LLMIntegration();
    gameAnalytics = new GameAnalytics();
    playbackController = new PlaybackController(game, renderer);
    
    // Make it globally available for onclick handlers
    window.playbackController = playbackController;
    
    // Start recording analytics
    gameAnalytics.startRecording();
    moveStartTime = Date.now();
    
    renderer.onSquareClick = handleSquareClick;
    
    // Set initial camera based on player side
    const playerSideSelect = document.getElementById('player-side');
    if (playerSideSelect && playerSideSelect.value === 'black') {
        renderer.setCameraView('player-black');
    }
    
    // Set initial first move preference
    const firstMoveSelect = document.getElementById('first-move');
    if (firstMoveSelect) {
        game.setStartingPlayer(firstMoveSelect.value);
    }
    
    updateUI();
    
    // Check if computer should make the first move
    if (currentMode === 'pvc' && game.currentPlayer === computerSide) {
        setTimeout(() => makeAIMove(), 1000);
    }
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
    
    // Player side selection
    document.getElementById('player-side').addEventListener('change', (e) => {
        playerSide = e.target.value;
        computerSide = (playerSide === 'red') ? 'black' : 'red';
        window.computerSide = computerSide; // Update global reference
        
        // Adjust camera perspective based on player side
        if (playerSide === 'black') {
            // Black player should see board from their perspective (top)
            renderer.setCameraView('player-black');
        } else {
            // Red player sees board from default perspective (bottom)
            renderer.setCameraView('player-red');
        }
        
        // Restart game to apply new sides
        if (currentMode === 'pvc') {
            startNewGame();
        }
    });
    
    // First move selection
    document.getElementById('first-move').addEventListener('change', (e) => {
        const firstMove = e.target.value;
        game.setStartingPlayer(firstMove);
        
        // If game hasn't started, just update the setting
        // If game is in progress, restart to apply
        if (game.moveHistory.length > 0) {
            const confirm = window.confirm('This will restart the game. Continue?');
            if (confirm) {
                startNewGame();
            } else {
                // Revert the selection
                e.target.value = game.currentPlayer === 'red' ? 'red' : 'black';
            }
        }
    });
    
    // Custom color toggle
    document.getElementById('piece-color').addEventListener('change', (e) => {
        const customColors = document.getElementById('custom-colors');
        if (e.target.value === 'custom') {
            customColors.style.display = 'block';
        } else {
            customColors.style.display = 'none';
        }
        updatePieceColors();
    });
    
    // Custom color pickers
    document.getElementById('red-piece-color').addEventListener('input', (e) => {
        updatePieceColors();
    });
    
    document.getElementById('black-piece-color').addEventListener('input', (e) => {
        updatePieceColors();
    });
    
    // Visual control listeners
    document.getElementById('shininess-slider').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('shininess-value').textContent = value + '%';
        if (renderer) renderer.updateShininess(value / 100);
    });
    
    document.getElementById('saturation-slider').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('saturation-value').textContent = value + '%';
        if (renderer) renderer.updateSaturation(value / 100);
    });
    
    document.getElementById('brightness-slider').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('brightness-value').textContent = value + '%';
        if (renderer) renderer.updateBrightness(value / 100);
    });
    
    document.getElementById('board-reflection-slider').addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('board-reflection-value').textContent = value + '%';
        if (renderer) renderer.updateBoardReflection(value / 100);
    });

    document.getElementById('new-game').addEventListener('click', startNewGame);
    document.getElementById('undo-move').addEventListener('click', undoMove);
    document.getElementById('show-hint').addEventListener('click', showHint);
    document.getElementById('show-rules').addEventListener('click', showRules);
    document.getElementById('view-analytics').addEventListener('click', showAnalytics);
    document.getElementById('enter-playback').addEventListener('click', enterPlaybackMode);
    document.getElementById('online-play').addEventListener('click', showOnlinePlayModal);
    
    // Debug tools
    document.getElementById('capture-screenshot').addEventListener('click', captureScreenshot);
    document.getElementById('copy-board-state').addEventListener('click', copyBoardState);
    
    // Recording controls
    document.getElementById('record-video').addEventListener('click', () => {
        if (window.gameRecorder) {
            const area = document.getElementById('recording-area').value;
            window.gameRecorder.startRecording('video', area);
            const areaText = area === 'full' ? 'full game' : 'board only';
            showMoveIndicator(`📹 Recording ${areaText} video... (max 60s)`);
            setTimeout(() => hideMoveIndicator(), 3000);
            
            // Auto-stop after 60 seconds
            setTimeout(() => {
                if (window.gameRecorder && window.gameRecorder.isRecording) {
                    window.gameRecorder.stopRecording();
                    showMoveIndicator('Recording stopped (60s limit)');
                    setTimeout(() => hideMoveIndicator(), 3000);
                }
            }, 60000);
        }
    });
    
    document.getElementById('record-gif').addEventListener('click', () => {
        if (window.gameRecorder) {
            const area = document.getElementById('recording-area').value;
            window.gameRecorder.startRecording('gif', area);
            const areaText = area === 'full' ? 'full game' : 'board only';
            showMoveIndicator(`🎬 Recording ${areaText} GIF... (max 30s)`);
            setTimeout(() => hideMoveIndicator(), 3000);
            
            // Auto-stop after 30 seconds
            setTimeout(() => {
                if (window.gameRecorder && window.gameRecorder.isRecording) {
                    window.gameRecorder.stopRecording();
                    showMoveIndicator('GIF recording stopped (30s limit)');
                    setTimeout(() => hideMoveIndicator(), 3000);
                }
            }, 30000);
        }
    });
    
    document.getElementById('stop-recording').addEventListener('click', () => {
        if (window.gameRecorder && window.gameRecorder.isRecording) {
            window.gameRecorder.stopRecording();
            showMoveIndicator('Recording stopped');
            setTimeout(() => hideMoveIndicator(), 2000);
        }
    });
    
    // Timeline click handler for playback
    const timeline = document.getElementById('playback-timeline');
    if (timeline) {
        timeline.addEventListener('click', (e) => {
            if (!playbackController || !playbackController.isPlaybackMode) return;
            
            const rect = timeline.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const targetMove = Math.floor(percent * playbackController.fullGameHistory.length);
            playbackController.goToMove(targetMove);
        });
    }

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
        const warning = document.getElementById('api-key-warning');
        
        if (provider === 'local') {
            apiKeyInput.style.display = 'none';
            if (warning) warning.style.display = 'none';
        } else {
            apiKeyInput.style.display = 'block';
            apiKeyInput.placeholder = `Enter ${provider} API key`;
            if (warning) warning.style.display = 'block';
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
    window.currentMode = mode; // Update global reference
    
    // Reset undo tracking when switching modes
    totalUndosThisGame = 0;
    pendingUndoCount = 0;
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
    }
    
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
    // Vibrate on mobile for feedback
    if (window.mobileSupport && window.mobileSupport.isMobile) {
        window.mobileSupport.vibrate([20]);
    }
    if (game.isGameOver) return;
    
    // Prevent clicking during AI's turn
    if (currentMode === 'pvc' && game.currentPlayer === computerSide) {
        return; // It's the computer's turn, don't allow clicks
    }
    
    // Also prevent if AI is thinking
    if (isAIThinking) {
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
        const validMove = game.validMoves.find(m => m.row === row && m.col === col);
        const moveSuccessful = game.makeMove(row, col);
        
        if (moveSuccessful) {
            // Record analytics
            const timeTaken = Date.now() - moveStartTime;
            gameAnalytics.recordMove({
                from,
                to,
                player: game.currentPlayer === 'red' ? 'black' : 'red', // Previous player made the move
                isJump: validMove && validMove.isJump,
                wasKing: game.board[to.row][to.col]?.wasKing || false
            }, game, timeTaken);
            moveStartTime = Date.now();
            
            renderer.updateBoard();
            updateUI();
            updateMoveCount();
            addMoveToHistory(from, to);
            
            // Notify validator that a move was made
            if (window.moveValidator) {
                window.moveValidator.onMoveMade();
            }
            
            if (!game.multiJumpMode) {
                if (game.isGameOver) {
                    showGameOver();
                } else if (currentMode === 'pvc' && game.currentPlayer === computerSide) {
                    setTimeout(() => makeAIMove(), 1000);
                } else if (helperMode) {
                    showAgentSuggestions();
                }
            } else {
                // Check if it's still AI's turn during multi-jump
                if (currentMode === 'pvc' && game.currentPlayer === computerSide) {
                    setTimeout(() => {
                        // Continue AI's multi-jump
                        const validMoves = game.validMoves;
                        if (validMoves && validMoves.length > 0) {
                            // AI continues jump sequence
                            const nextJump = validMoves[0]; // Pick first available jump
                            makeMove(nextJump.row, nextJump.col);
                        }
                    }, 500);
                }
            }
        }
    });
}

async function makeAIMove() {
    if (game.isGameOver || game.currentPlayer !== computerSide) {
        console.log(`AI move skipped - Game over: ${game.isGameOver}, Current: ${game.currentPlayer}, Computer: ${computerSide}`);
        return;
    }
    
    console.log(`AI (${computerSide}) starting move calculation...`);
    
    isAIThinking = true;
    showMoveIndicator('AI is thinking...');
    
    try {
        // Add timeout to prevent infinite thinking
        const movePromise = ai.getBestMove(game, computerSide);
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
    // Get the first move setting
    const firstMoveSelect = document.getElementById('first-move');
    if (firstMoveSelect) {
        game.setStartingPlayer(firstMoveSelect.value);
    }
    
    game.newGame();
    totalUndosThisGame = 0; // Reset undo counter for new game
    renderer.updateBoard();
    updateUI();
    clearMoveHistory();
    
    if (helperMode) {
        showAgentSuggestions();
    }
    
    // Check if computer should make the first move
    if (currentMode === 'pvc' && game.currentPlayer === computerSide) {
        setTimeout(() => makeAIMove(), 1000);
    }
}

function undoMove() {
    // Don't allow undo in playback mode
    if (playbackController && playbackController.isPlaybackMode) {
        showMoveIndicator('Exit playback mode to undo');
        setTimeout(() => hideMoveIndicator(), 2000);
        return;
    }
    
    // Get undo settings
    const undoLimit = parseInt(document.getElementById('undo-limit').value);
    const undoBothPlayers = document.getElementById('undo-both-players').checked;
    
    // Check if we have moves to undo
    if (game.moveHistory.length === 0) {
        showMoveIndicator('No moves to undo');
        setTimeout(() => hideMoveIndicator(), 2000);
        return;
    }
    
    // Check if we've exceeded undo limit for entire game
    if (undoLimit !== -1 && totalUndosThisGame >= undoLimit) {
        showMoveIndicator(`❌ Undo limit reached! Used all ${undoLimit} undo(s) for this game`);
        setTimeout(() => hideMoveIndicator(), 3000);
        return;
    }
    
    // Calculate how many moves this click represents
    let clickUndoCount = 1;
    if (undoBothPlayers && currentMode === 'pvc') {
        clickUndoCount = 2; // Undo both player and computer moves
    }
    
    // Add to pending undo count
    pendingUndoCount += clickUndoCount;
    
    // Show that we're waiting for more undo clicks
    showMoveIndicator(`⏳ Preparing to undo ${pendingUndoCount} move(s)... (click again to undo more)`);
    
    // Clear existing timeout
    if (undoTimeout) {
        clearTimeout(undoTimeout);
    }
    
    // Set new timeout to process undos after 2 seconds of no clicks
    undoTimeout = setTimeout(() => {
        processUndoQueue();
    }, 2000);
}

function processUndoQueue() {
    const undoLimit = parseInt(document.getElementById('undo-limit').value);
    const undoBothPlayers = document.getElementById('undo-both-players').checked;
    
    // Calculate actual undos to perform
    let actualUndoCount = pendingUndoCount;
    const movesAvailable = game.moveHistory.length;
    
    // Limit to available moves
    if (actualUndoCount > movesAvailable) {
        actualUndoCount = movesAvailable;
    }
    
    // Check against remaining undo limit
    if (undoLimit !== -1) {
        const turnsToUndo = undoBothPlayers ? actualUndoCount / 2 : actualUndoCount;
        const remainingUndos = undoLimit - totalUndosThisGame;
        
        if (turnsToUndo > remainingUndos) {
            // Adjust to only use remaining undos
            actualUndoCount = undoBothPlayers ? remainingUndos * 2 : remainingUndos;
            showMoveIndicator(`⚠️ Limited to ${remainingUndos} remaining undo(s)`);
            setTimeout(() => hideMoveIndicator(), 2000);
        }
    }
    
    // Remember whose turn it was before undo
    const turnBeforeUndo = game.currentPlayer;
    
    // Perform the undo
    const undone = game.undoLastMove(actualUndoCount);
    
    if (undone) {
        // Track undos (convert to turns)
        const turnsUndone = undoBothPlayers ? Math.ceil(undone / 2) : undone;
        totalUndosThisGame += turnsUndone;
        
        // Update display
        renderer.updateBoard();
        updateUI();
        updateMoveCount();
        
        // Remove appropriate number of moves from history display
        for (let i = 0; i < undone; i++) {
            removeLastMoveFromHistory();
        }
        
        // Verify correct player turn
        const expectedPlayer = calculateExpectedPlayer(turnBeforeUndo, undone);
        if (game.currentPlayer !== expectedPlayer) {
            console.warn(`Turn mismatch after undo: expected ${expectedPlayer}, got ${game.currentPlayer}`);
        }
        
        // Show comprehensive status
        let statusMsg = `✅ Undone ${undone} move(s)`;
        if (undoLimit !== -1) {
            const remaining = undoLimit - totalUndosThisGame;
            if (remaining > 0) {
                statusMsg += ` | ${remaining} undo(s) remaining for this game`;
            } else {
                statusMsg += ` | ❌ No undos remaining`;
            }
        }
        statusMsg += ` | ${game.currentPlayer}'s turn`;
        
        showMoveIndicator(statusMsg);
        
        // Update analytics
        if (gameAnalytics) {
            gameAnalytics.recordUndo(undone);
            moveStartTime = Date.now();
        }
        
        // Show AI suggestions if in helper mode
        if (helperMode) {
            showAgentSuggestions();
        }
        
        setTimeout(() => hideMoveIndicator(), 4000);
    } else {
        showMoveIndicator('Failed to undo moves');
        setTimeout(() => hideMoveIndicator(), 2000);
    }
    
    // Reset pending count
    pendingUndoCount = 0;
    undoTimeout = null;
}

function calculateExpectedPlayer(turnBefore, movesUndone) {
    // If we undo an odd number of moves, the turn switches
    // If we undo an even number of moves, the turn stays the same
    if (movesUndone % 2 === 0) {
        return turnBefore;
    } else {
        return turnBefore === 'red' ? 'black' : 'red';
    }
}

function enterPlaybackMode() {
    if (!playbackController) return;
    
    if (playbackController.isPlaybackMode) {
        playbackController.exitPlaybackMode();
        updateUI();
    } else {
        if (game.moveHistory.length === 0) {
            showMoveIndicator('No moves to replay');
            setTimeout(() => hideMoveIndicator(), 2000);
            return;
        }
        
        playbackController.enterPlaybackMode();
    }
}

function updateMoveCount() {
    const counter = document.getElementById('move-count');
    if (counter) {
        const undoLimit = parseInt(document.getElementById('undo-limit').value);
        let text = `${game.moveHistory.length}`;
        
        // Show undo usage if limited
        if (undoLimit !== -1) {
            const remaining = undoLimit - totalUndosThisGame;
            text += ` (${remaining}/${undoLimit} undos left)`;
            if (remaining === 0) {
                counter.style.color = '#ff4444';
            } else if (remaining <= 2) {
                counter.style.color = '#ffaa00';
            } else {
                counter.style.color = '#666';
            }
        } else {
            counter.style.color = '#666';
        }
        
        counter.textContent = text;
    }
}

function updateUI() {
    document.getElementById('current-turn').textContent = 
        game.currentPlayer.charAt(0).toUpperCase() + game.currentPlayer.slice(1);
    
    // Display captured pieces (opposite of remaining pieces)
    const redCaptured = 12 - game.blackPieces;  // Red captured black pieces
    const blackCaptured = 12 - game.redPieces;  // Black captured red pieces
    document.getElementById('red-score').textContent = redCaptured;
    document.getElementById('black-score').textContent = blackCaptured;
    
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
    showMoveIndicator(`Game Over! ${winner} wins! View Analytics to see detailed stats and replay.`);
    
    addChatMessage('ai', `🎉 Congratulations! ${winner} has won the game! Click "📊 Analytics" to review the game.`);
    
    // Check if the user (human player) won
    const isUserWin = checkIfUserWon(game.winner);
    
    // Trigger confetti celebration if user wins
    if (isUserWin && window.confettiCelebration) {
        window.confettiCelebration.celebrate(5000); // 5 second celebration
    }
    
    // End analytics recording
    const stats = gameAnalytics.endGame(game.winner);
    
    // Auto-save the completed game
    autoSaveGame();
}

function checkIfUserWon(winner) {
    // In PvC mode, check if the winner is not the AI
    if (window.currentMode === 'pvc') {
        // User plays as the selected color, AI plays opposite
        const userColor = document.querySelector('input[name="player-color"]:checked')?.value || 'red';
        return winner === userColor;
    }
    // In PvP mode, always celebrate (both are human players)
    else if (window.currentMode === 'pvp') {
        return true;
    }
    // In helper mode, celebrate when the game ends
    else if (window.currentMode === 'helper') {
        return true;
    }
    return false;
}

function autoSaveGame() {
    try {
        // Save to localStorage
        const gameHistory = JSON.parse(localStorage.getItem('checkersGameHistory') || '[]');
        const gameData = {
            ...gameAnalytics.gameData,
            savedAt: Date.now(),
            id: `game_${Date.now()}`
        };
        
        // Keep only last 10 games
        gameHistory.unshift(gameData);
        if (gameHistory.length > 10) {
            gameHistory.pop();
        }
        
        localStorage.setItem('checkersGameHistory', JSON.stringify(gameHistory));
        localStorage.setItem('lastGame', JSON.stringify(gameData));
        
        console.log('Game auto-saved successfully');
    } catch (e) {
        console.error('Failed to auto-save game:', e);
    }
}

function showAnalytics() {
    // Calculate analytics data
    const startTime = gameAnalytics.gameData.startTime || gameAnalytics.gameStartTime || Date.now();
    const endTime = gameAnalytics.gameData.endTime || Date.now();
    const duration = Math.max(0, Math.floor((endTime - startTime) / 1000)); // Ensure non-negative, convert to seconds
    
    const analyticsData = {
        stats: gameAnalytics.calculateGameStats(),
        graphData: gameAnalytics.getGraphData(),
        gameData: {...gameAnalytics.gameData, duration: duration}
    };
    
    // Open analytics in modal overlay
    if (window.analyticsModal) {
        window.analyticsModal.open(analyticsData);
    } else {
        // Fallback to new window if modal not available
        const analyticsWindow = window.open('analytics-view.html', 'analytics', 'width=1400,height=900');
        analyticsWindow.addEventListener('load', () => {
            analyticsWindow.postMessage({
                type: 'analytics-data',
                data: analyticsData
            }, '*');
        });
    }
}

function openPlaybackViewer() {
    const playbackWindow = window.open('playback-viewer.html', 'playback', 'width=1600,height=900');
    // The playback viewer will get data from window.opener.gameAnalytics
}

// Make it globally available
window.openPlaybackViewer = openPlaybackViewer;

// Listen for analytics requests
window.addEventListener('message', (event) => {
    if (event.data.type === 'request-analytics' && gameAnalytics) {
        event.source.postMessage({
            type: 'analytics-data',
            data: {
                stats: gameAnalytics.calculateGameStats(),
                graphData: gameAnalytics.getGraphData(),
                gameData: gameAnalytics.gameData
            }
        }, '*');
    }
});

function showRules() {
    document.getElementById('rules-modal').style.display = 'block';
}

function showAnalyticsModal() {
    // Create modal overlay
    let modal = document.getElementById('analytics-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'analytics-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.src = 'analytics-modal.html';
        iframe.style.cssText = `
            width: 90%;
            height: 90%;
            max-width: 1400px;
            max-height: 900px;
            border: none;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;
        
        modal.appendChild(iframe);
        document.body.appendChild(modal);
        
        // Send data to iframe when loaded
        iframe.onload = () => {
            // Calculate proper duration
            const startTime = gameAnalytics.gameData.startTime || gameAnalytics.gameStartTime;
            const endTime = gameAnalytics.gameData.endTime || Date.now();
            const duration = endTime && startTime ? endTime - startTime : 0;
            
            iframe.contentWindow.postMessage({
                type: 'analytics-data',
                data: {
                    moves: gameAnalytics.gameData.moves,
                    duration: duration,
                    avgEfficiency: gameAnalytics.calculateAverageEfficiency(),
                    totalCaptures: gameAnalytics.gameData.totalCaptures,
                    kingsPromoted: gameAnalytics.gameData.kingsPromoted,
                    longestChain: gameAnalytics.gameData.longestJumpChain,
                    events: gameAnalytics.gameData.events
                }
            }, '*');
        };
        
        // Close on click outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        // Listen for close message
        window.addEventListener('message', (e) => {
            if (e.data.type === 'close-analytics') {
                modal.style.display = 'none';
            } else if (e.data.type === 'start-replay') {
                modal.style.display = 'none';
                enterPlaybackMode();
            }
        });
    } else {
        modal.style.display = 'flex';
        
        // Resend data
        const iframe = modal.querySelector('iframe');
        if (iframe) {
            // Calculate proper duration
            const startTime = gameAnalytics.gameData.startTime || gameAnalytics.gameStartTime;
            const endTime = gameAnalytics.gameData.endTime || Date.now();
            const duration = endTime && startTime ? endTime - startTime : 0;
            
            iframe.contentWindow.postMessage({
                type: 'analytics-data',
                data: {
                    moves: gameAnalytics.gameData.moves,
                    duration: duration,
                    avgEfficiency: gameAnalytics.calculateAverageEfficiency(),
                    totalCaptures: gameAnalytics.gameData.totalCaptures,
                    kingsPromoted: gameAnalytics.gameData.kingsPromoted,
                    longestChain: gameAnalytics.gameData.longestJumpChain,
                    events: gameAnalytics.gameData.events
                }
            }, '*');
        }
    }
    
    // No need for tips since it's always modal now
}

function updateRulesDisplay() {
    const rulesText = [];
    if (game.rules.backwardCapture) rulesText.push('Backward Capture');
    if (game.rules.flyingKings) rulesText.push('Flying Kings');
    if (game.rules.mandatoryCapture) rulesText.push('Mandatory Capture');
    
    console.log('Active rules:', rulesText.join(', '));
}

function updatePieceColors() {
    if (renderer) {
        const colorMode = document.getElementById('piece-color').value;
        if (colorMode === 'custom') {
            const redColor = document.getElementById('red-piece-color').value;
            const blackColor = document.getElementById('black-piece-color').value;
            renderer.setCustomColors(redColor, blackColor);
        } else {
            renderer.setCustomColors(null, null); // Use default colors
        }
        renderer.updateBoard();
    }
}

function captureScreenshot() {
    // Use the new bug capture tool
    if (window.bugCapture) {
        window.bugCapture.startCapture();
        showMoveIndicator('Select area to capture bug');
    } else {
        // Fallback to canvas capture
        const canvas = document.getElementById('game-canvas');
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            a.download = `checkers-bug-${timestamp}.png`;
            a.click();
            URL.revokeObjectURL(url);
            
            // Show confirmation
            const debugInfo = document.getElementById('debug-info');
            debugInfo.textContent = 'Screenshot saved! Check your Downloads folder.';
            debugInfo.style.display = 'block';
            setTimeout(() => {
                debugInfo.style.display = 'none';
            }, 3000);
        });
    }
}

function copyBoardState() {
    // Create a comprehensive board state with issue detection
    const boardState = {
        currentPlayer: game.currentPlayer,
        board: [],
        moveHistory: game.moveHistory,
        rules: game.rules,
        mandatoryJumps: game.mandatoryJumps,
        detectedIssues: []
    };
    
    // Detect logical issues
    if (window.bugCapture) {
        const issues = window.bugCapture.detectLogicalIssues();
        if (issues.length > 0) {
            boardState.detectedIssues = issues;
        }
    }
    
    // Convert board to readable format
    for (let row = 0; row < 8; row++) {
        const rowData = [];
        for (let col = 0; col < 8; col++) {
            const piece = game.board[row][col];
            if (piece) {
                rowData.push(`${piece.color[0].toUpperCase()}${piece.isKing ? 'K' : ''}`);
            } else {
                rowData.push((row + col) % 2 === 1 ? '.' : ' ');
            }
        }
        boardState.board.push(rowData.join(' '));
    }
    
    const stateText = `
=== CHECKERS DEBUG STATE ===
Turn: ${boardState.currentPlayer}
Mandatory Jumps: ${boardState.mandatoryJumps.length}

Board (A-H, 1-8):
  A B C D E F G H
8 ${boardState.board[0]}
7 ${boardState.board[1]}
6 ${boardState.board[2]}
5 ${boardState.board[3]}
4 ${boardState.board[4]}
3 ${boardState.board[5]}
2 ${boardState.board[6]}
1 ${boardState.board[7]}

Rules:
- Backward Capture: ${boardState.rules.backwardCapture}
- Flying Kings: ${boardState.rules.flyingKings}
- Mandatory Capture: ${boardState.rules.mandatoryCapture}

Last Moves: ${boardState.moveHistory.slice(-5).map(m => `${m.player}: ${String.fromCharCode(65 + m.from.col)}${8 - m.from.row} to ${String.fromCharCode(65 + m.to.col)}${8 - m.to.row}`).join(', ')}
===========================
    `;
    
    // Copy to clipboard
    navigator.clipboard.writeText(stateText).then(() => {
        const debugInfo = document.getElementById('debug-info');
        debugInfo.textContent = 'Board state copied to clipboard!';
        debugInfo.style.display = 'block';
        setTimeout(() => {
            debugInfo.style.display = 'none';
        }, 3000);
    });
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
}// Expose functions for mobile support
window.handleSquareClick = handleSquareClick;
