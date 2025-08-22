class BugCapture {
    constructor() {
        this.isCapturing = false;
        this.captureArea = null;
        this.startX = 0;
        this.startY = 0;
        this.overlay = null;
    }
    
    startCapture() {
        if (this.isCapturing) return;
        
        this.isCapturing = true;
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 10000;
            cursor: crosshair;
        `;
        
        // Create selection area
        this.captureArea = document.createElement('div');
        this.captureArea.style.cssText = `
            position: absolute;
            border: 2px dashed #ff0000;
            background: rgba(255, 0, 0, 0.1);
            display: none;
            pointer-events: none;
        `;
        
        // Create instruction text
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10001;
        `;
        instructions.innerHTML = '🎯 Click and drag to select the bug area<br><small>Press ESC to cancel</small>';
        
        this.overlay.appendChild(this.captureArea);
        this.overlay.appendChild(instructions);
        document.body.appendChild(this.overlay);
        
        // Add event listeners
        this.overlay.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.overlay.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.overlay.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    handleMouseDown(e) {
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.captureArea.style.display = 'block';
        this.captureArea.style.left = this.startX + 'px';
        this.captureArea.style.top = this.startY + 'px';
        this.captureArea.style.width = '0px';
        this.captureArea.style.height = '0px';
    }
    
    handleMouseMove(e) {
        if (this.captureArea.style.display !== 'block') return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const left = Math.min(this.startX, currentX);
        const top = Math.min(this.startY, currentY);
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        this.captureArea.style.left = left + 'px';
        this.captureArea.style.top = top + 'px';
        this.captureArea.style.width = width + 'px';
        this.captureArea.style.height = height + 'px';
    }
    
    async handleMouseUp(e) {
        if (this.captureArea.style.display !== 'block') return;
        
        const rect = {
            left: parseInt(this.captureArea.style.left),
            top: parseInt(this.captureArea.style.top),
            width: parseInt(this.captureArea.style.width),
            height: parseInt(this.captureArea.style.height)
        };
        
        // Remove overlay first
        this.cleanup();
        
        // Small delay to ensure overlay is removed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture the selected area
        this.captureSelectedArea(rect);
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.cleanup();
        }
    }
    
    cleanup() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
        this.isCapturing = false;
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    async captureSelectedArea(rect) {
        try {
            // Use html2canvas if available, otherwise use canvas rendering
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(document.body, {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    logging: false
                });
                
                // Convert to blob
                canvas.toBlob(blob => {
                    this.saveBugReport(blob, rect);
                });
            } else {
                // Fallback: capture game state and create report
                this.captureGameState(rect);
            }
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            this.captureGameState(rect);
        }
    }
    
    captureGameState(rect) {
        // Capture game logic state
        const bugReport = {
            timestamp: new Date().toISOString(),
            area: rect,
            gameState: null,
            moveHistory: null,
            error: null
        };
        
        if (window.game) {
            bugReport.gameState = {
                board: window.game.getBoardState(),
                currentPlayer: window.game.currentPlayer,
                moveCount: window.game.moveHistory.length,
                isGameOver: window.game.isGameOver,
                winner: window.game.winner,
                rules: window.game.rules
            };
            
            bugReport.moveHistory = window.game.moveHistory.slice(-10); // Last 10 moves
        }
        
        // Check for logical issues
        const issues = this.detectLogicalIssues();
        if (issues.length > 0) {
            bugReport.detectedIssues = issues;
        }
        
        // Create visual representation
        this.createBugReportUI(bugReport);
    }
    
    detectLogicalIssues() {
        const issues = [];
        
        if (!window.game) return issues;
        
        // Check for stuck state
        const possibleMoves = window.game.getAllPossibleMovesForPlayer(window.game.currentPlayer);
        if (possibleMoves.length === 0 && !window.game.isGameOver) {
            issues.push({
                type: 'STUCK_STATE',
                description: 'Player has no moves but game is not over'
            });
        }
        
        // Check for invalid piece counts
        let redCount = 0, blackCount = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = window.game.board[row][col];
                if (piece) {
                    if (piece.color === 'red') redCount++;
                    else blackCount++;
                }
            }
        }
        
        if (redCount !== window.game.redPieces) {
            issues.push({
                type: 'PIECE_COUNT_MISMATCH',
                description: `Red pieces: counted ${redCount}, stored ${window.game.redPieces}`
            });
        }
        
        if (blackCount !== window.game.blackPieces) {
            issues.push({
                type: 'PIECE_COUNT_MISMATCH',
                description: `Black pieces: counted ${blackCount}, stored ${window.game.blackPieces}`
            });
        }
        
        // Check for mandatory jumps not being enforced
        const jumps = window.game.getAllJumpsForPlayer(window.game.currentPlayer);
        if (jumps.length > 0 && window.game.rules.mandatoryCapture) {
            const hasNonJumpMoves = window.game.validMoves.some(m => !m.isJump);
            if (hasNonJumpMoves) {
                issues.push({
                    type: 'MANDATORY_JUMP_NOT_ENFORCED',
                    description: 'Player has jumps available but non-jump moves are allowed'
                });
            }
        }
        
        return issues;
    }
    
    createBugReportUI(bugReport) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            z-index: 10002;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        let issuesHTML = '';
        if (bugReport.detectedIssues && bugReport.detectedIssues.length > 0) {
            issuesHTML = '<h3 style="color: #dc3545;">🐛 Detected Issues:</h3><ul>';
            bugReport.detectedIssues.forEach(issue => {
                issuesHTML += `<li><strong>${issue.type}:</strong> ${issue.description}</li>`;
            });
            issuesHTML += '</ul>';
        } else {
            issuesHTML = '<p style="color: #28a745;">✅ No logical issues detected</p>';
        }
        
        modal.innerHTML = `
            <h2 style="margin-top: 0;">📸 Bug Report Captured</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Current Player:</strong> ${bugReport.gameState?.currentPlayer || 'N/A'}</p>
            <p><strong>Move #:</strong> ${bugReport.gameState?.moveCount || 0}</p>
            ${issuesHTML}
            <h3>📋 Board State:</h3>
            <textarea style="width: 100%; height: 150px; font-family: monospace; font-size: 12px;" readonly>${
                JSON.stringify(bugReport.gameState?.board, null, 2)
            }</textarea>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="bugCapture.saveBugReportJSON(${JSON.stringify(bugReport).replace(/"/g, '&quot;')})" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    💾 Save Report
                </button>
                <button onclick="bugCapture.copyBugReport(${JSON.stringify(bugReport).replace(/"/g, '&quot;')})" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    📋 Copy to Clipboard
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    ✖ Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    saveBugReportJSON(bugReport) {
        const dataStr = JSON.stringify(bugReport, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const fileName = `bug_report_${Date.now()}.json`;
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        link.click();
    }
    
    copyBugReport(bugReport) {
        const text = JSON.stringify(bugReport, null, 2);
        navigator.clipboard.writeText(text).then(() => {
            alert('Bug report copied to clipboard!');
        });
    }
    
    saveBugReport(blob, rect) {
        // Create a link to download the screenshot
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bug_screenshot_${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        // Also capture game state
        this.captureGameState(rect);
    }
}

// Initialize globally
window.bugCapture = new BugCapture();