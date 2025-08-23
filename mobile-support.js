class MobileSupport {
    constructor() {
        this.isMobile = this.detectMobile();
        this.touchStartPos = null;
        this.selectedPiece = null;
        this.validMoves = [];
        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    }

    init() {
        if (this.isMobile) {
            console.log('Mobile device detected - enabling touch support');
            this.setupMobileUI();
            this.setupTouchControls();
            this.adjustLayout();
            this.showMobileWelcome();
        }

        // Also handle responsive changes
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustLayout();
                if (window.renderer3D) {
                    window.renderer3D.onWindowResize();
                }
            }, 100);
        });
    }

    setupMobileUI() {
        // Add mobile-specific CSS
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile-specific styles */
            @media (max-width: 768px) {
                body {
                    touch-action: none;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                    overflow-x: hidden;
                }

                .game-container {
                    padding: 5px;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                .game-header {
                    padding: 10px 5px;
                    flex-shrink: 0;
                }

                .game-title {
                    font-size: 1.2em !important;
                }

                .game-stats {
                    flex-direction: column;
                    gap: 5px;
                }

                .stat-item {
                    font-size: 0.9em;
                    padding: 3px 5px;
                }

                .main-content {
                    flex-direction: column;
                    flex: 1;
                    min-height: 0;
                }

                .game-board-container {
                    width: 100%;
                    height: 50vh;
                    min-height: 300px;
                    position: relative;
                }

                #game-canvas {
                    width: 100% !important;
                    height: 100% !important;
                    touch-action: none;
                    position: relative;
                    z-index: 1;
                }

                .sidebar {
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 10px !important;
                    margin: 0 !important;
                    max-height: 40vh;
                    overflow-y: auto;
                }

                .sidebar-left {
                    order: 2;
                }

                .sidebar-right {
                    order: 3;
                    display: none; /* Hide chat on mobile */
                }

                .panel {
                    margin-bottom: 10px;
                    padding: 10px;
                }

                .panel h3 {
                    font-size: 1em;
                    margin-bottom: 10px;
                }

                .mode-buttons {
                    flex-direction: column;
                }

                .mode-btn {
                    padding: 10px;
                    font-size: 0.9em;
                    width: 100%;
                }

                .control-buttons {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 5px;
                }

                .control-btn {
                    padding: 10px;
                    font-size: 0.9em;
                }

                .difficulty-controls {
                    flex-direction: column;
                }

                .move-history {
                    max-height: 100px;
                }

                .history-item {
                    padding: 5px;
                    font-size: 0.85em;
                }

                /* Mobile-specific buttons */
                .mobile-controls {
                    position: fixed;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 10px;
                    z-index: 1000;
                    background: rgba(26, 26, 46, 0.95);
                    padding: 10px;
                    border-radius: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                }

                .mobile-btn {
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.9em;
                    font-weight: 600;
                    touch-action: manipulation;
                }

                .mobile-btn:active {
                    transform: scale(0.95);
                }

                /* Hide desktop-only elements */
                .recording-controls {
                    display: none;
                }

                /* Landscape mode adjustments */
                @media (orientation: landscape) and (max-height: 500px) {
                    .game-header {
                        display: none;
                    }
                    
                    .game-board-container {
                        height: 70vh;
                    }
                    
                    .sidebar {
                        max-height: 30vh;
                    }
                }

                /* Touch feedback */
                .piece-highlight {
                    background: rgba(102, 126, 234, 0.3);
                    border: 2px solid #667eea;
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                /* Modal adjustments */
                #analytics-modal-wrapper > div {
                    width: 95% !important;
                    height: 95% !important;
                    max-width: none !important;
                    max-height: none !important;
                }

                .analytics-content {
                    padding: 15px !important;
                }

                .stats-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                }

                .charts-grid {
                    grid-template-columns: 1fr !important;
                }
            }

            /* Tablet-specific adjustments */
            @media (min-width: 769px) and (max-width: 1024px) {
                .game-container {
                    padding: 10px;
                }

                .sidebar {
                    max-width: 250px;
                }

                .game-board-container {
                    max-width: 600px;
                    max-height: 600px;
                }
            }

            /* High-DPI mobile screens */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                canvas {
                    image-rendering: crisp-edges;
                }
            }
        `;
        document.head.appendChild(style);

        // Add mobile controls
        this.addMobileControls();
    }

    addMobileControls() {
        // Create mobile control bar
        const mobileControls = document.createElement('div');
        mobileControls.className = 'mobile-controls';
        mobileControls.innerHTML = `
            <button class="mobile-btn" onclick="mobileSupport.undoMove()">↩️ Undo</button>
            <button class="mobile-btn" onclick="mobileSupport.showHelp()">❓ Help</button>
            <button class="mobile-btn" onclick="mobileSupport.toggleMenu()">☰ Menu</button>
        `;
        
        if (this.isMobile) {
            document.body.appendChild(mobileControls);
        }
    }

    setupTouchControls() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;

        // Prevent default touch behaviors
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        // Don't add another click handler on mobile - let the 3D renderer handle it
        // The touch events will dispatch click events to the canvas
    }

    handleTouchStart(event) {
        const touch = event.touches[0];
        this.touchStartPos = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }

    handleTouchMove(event) {
        if (!this.touchStartPos) return;
        
        const touch = event.touches[0];
        const deltaX = touch.clientX - this.touchStartPos.x;
        const deltaY = touch.clientY - this.touchStartPos.y;
        
        // If moved significantly, consider it a drag (camera rotation)
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            if (window.renderer3D && window.renderer3D.controls) {
                // Rotate camera
                window.renderer3D.controls.rotateSpeed = 0.5;
            }
        }
    }

    handleTouchEnd(event) {
        if (!this.touchStartPos) return;
        
        const touchDuration = Date.now() - this.touchStartPos.time;
        const touch = event.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
        
        // If it's a tap (short duration and small movement)
        if (touchDuration < 300 && deltaX < 10 && deltaY < 10) {
            this.handleBoardTap(touch.clientX, touch.clientY);
        }
        
        this.touchStartPos = null;
    }

    handleTap(event) {
        this.handleBoardTap(event.clientX, event.clientY);
    }

    handleBoardTap(x, y) {
        // Simply trigger a click event on the canvas
        // This will use the existing 3D renderer's click handling
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        // Create and dispatch a click event
        const clickEvent = new MouseEvent('click', {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        canvas.dispatchEvent(clickEvent);
        
        console.log('Mobile tap dispatched to canvas at:', x, y);
    }

    adjustLayout() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Adjust canvas size
        const canvas = document.getElementById('game-canvas');
        if (canvas && window.renderer3D) {
            const boardContainer = document.querySelector('.game-board-container');
            if (boardContainer) {
                // For mobile, make the board square and centered
                if (this.isMobile) {
                    const size = Math.min(width * 0.95, height * 0.5);
                    boardContainer.style.width = size + 'px';
                    boardContainer.style.height = size + 'px';
                    boardContainer.style.margin = '0 auto';
                }
                
                // Update Three.js renderer
                window.renderer3D.onWindowResize();
            }
        }

        // Adjust UI elements for mobile
        if (this.isMobile) {
            // Hide certain desktop elements
            const desktopOnly = document.querySelectorAll('.desktop-only');
            desktopOnly.forEach(el => el.style.display = 'none');
            
            // Adjust font sizes
            this.adjustFontSizes();
        }
    }

    adjustFontSizes() {
        const baseFontSize = Math.min(window.innerWidth / 25, 16);
        document.documentElement.style.fontSize = baseFontSize + 'px';
    }

    showMobileWelcome() {
        const welcome = document.createElement('div');
        welcome.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        welcome.innerHTML = `
            <h2>Welcome Mobile Player! 📱</h2>
            <p style="margin: 15px 0;">Touch controls enabled:</p>
            <ul style="text-align: left; margin: 10px 0;">
                <li>Tap pieces to select</li>
                <li>Tap squares to move</li>
                <li>Swipe to rotate board</li>
                <li>Use bottom buttons for actions</li>
            </ul>
            <button onclick="this.parentElement.remove()" style="
                padding: 10px 20px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                margin-top: 10px;
                cursor: pointer;
            ">Got it! Let's Play</button>
        `;
        document.body.appendChild(welcome);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (welcome.parentElement) {
                welcome.style.animation = 'fadeOut 0.5s';
                setTimeout(() => welcome.remove(), 500);
            }
        }, 5000);
    }

    undoMove() {
        // Trigger undo
        const undoBtn = document.querySelector('[onclick*="undo"]');
        if (undoBtn) {
            undoBtn.click();
        }
    }

    showHelp() {
        alert('How to Play:\n\n' +
              '1. Tap your piece to select it\n' +
              '2. Tap a highlighted square to move\n' +
              '3. Jump over opponent pieces to capture\n' +
              '4. Reach the opposite end to get a King\n' +
              '5. Kings can move backwards\n\n' +
              'Swipe on the board to rotate the view!');
    }

    toggleMenu() {
        const sidebar = document.querySelector('.sidebar-left');
        if (sidebar) {
            sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Vibration feedback for mobile
    vibrate(pattern = [50]) {
        if (this.isMobile && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    // Provide feedback when piece is selected
    highlightPiece(row, col) {
        this.vibrate([30]);
        // Add visual feedback
        if (window.renderer3D) {
            const piece = window.renderer3D.getPieceAt(row, col);
            if (piece) {
                // Add highlight effect
                piece.material.emissive = new THREE.Color(0x667eea);
                piece.material.emissiveIntensity = 0.3;
            }
        }
    }
}

// Initialize mobile support
window.addEventListener('DOMContentLoaded', () => {
    window.mobileSupport = new MobileSupport();
});