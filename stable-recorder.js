class StableRecorder {
    constructor() {
        this.isRecording = false;
        this.frames = [];
        this.canvas = null;
        this.ctx = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.frameQueue = [];
        this.processing = false;
    }

    async init() {
        // Create a stable recording canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true 
        });
        
        // Set up media stream
        this.stream = this.canvas.captureStream(30); // 30 FPS stream
    }

    async startRecording() {
        if (this.isRecording) return;
        
        await this.init();
        this.isRecording = true;
        this.frames = [];
        
        // Update UI
        this.updateRecordingUI(true);
        this.showRecordingIndicator();
        this.showNotification('Recording started (stable mode)...', 'success', 2000);
        
        // Set up MediaRecorder
        this.mediaRecorder = new MediaRecorder(this.stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 5000000 // 5 Mbps
        });
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                this.frames.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.frames, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Download the video
            const a = document.createElement('a');
            a.href = url;
            a.download = `checkers-recording-${Date.now()}.webm`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.showNotification('Recording saved!', 'success', 3000);
        };
        
        this.mediaRecorder.start();
        
        // Start stable capture loop
        this.captureLoop();
        
        console.log('Stable recording started');
    }

    async captureLoop() {
        if (!this.isRecording) return;
        
        // Use requestAnimationFrame for smooth capture
        requestAnimationFrame(async () => {
            await this.captureFrame();
            this.captureLoop();
        });
    }

    async captureFrame() {
        if (this.processing) return;
        this.processing = true;
        
        try {
            // Clear canvas with solid background
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Check if analytics modal is open
            const analyticsModal = document.getElementById('analytics-modal-wrapper');
            const isModalOpen = analyticsModal && analyticsModal.style.display === 'flex';
            
            if (isModalOpen) {
                // Capture modal content
                await this.captureModal();
            } else {
                // Capture game
                await this.captureGame();
            }
        } catch (error) {
            console.error('Capture error:', error);
        } finally {
            this.processing = false;
        }
    }

    async captureModal() {
        // Get modal content
        const modalContent = document.querySelector('#analytics-modal-wrapper > div');
        if (!modalContent) return;
        
        // Use DOM to Canvas approach for stable capture
        if (window.html2canvas) {
            try {
                const tempCanvas = await html2canvas(modalContent, {
                    backgroundColor: '#1a1a2e',
                    scale: 1,
                    logging: false,
                    useCORS: true,
                    allowTaint: true
                });
                
                // Center modal content on recording canvas
                const x = (this.canvas.width - tempCanvas.width) / 2;
                const y = (this.canvas.height - tempCanvas.height) / 2;
                
                // Draw background
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw modal
                this.ctx.drawImage(tempCanvas, x, y);
            } catch (e) {
                console.error('Modal capture error:', e);
            }
        }
    }

    async captureGame() {
        // Capture game canvas
        const gameCanvas = document.getElementById('game-canvas');
        const gameContainer = document.querySelector('.game-container');
        
        if (gameCanvas && gameContainer) {
            // Draw game container background
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw game canvas
            const rect = gameCanvas.getBoundingClientRect();
            this.ctx.drawImage(gameCanvas, rect.left, rect.top, rect.width, rect.height);
            
            // Capture UI elements
            if (window.html2canvas) {
                try {
                    // Capture header
                    const header = document.querySelector('.game-header');
                    if (header) {
                        const headerCanvas = await html2canvas(header, {
                            backgroundColor: null,
                            scale: 1,
                            logging: false
                        });
                        const headerRect = header.getBoundingClientRect();
                        this.ctx.drawImage(headerCanvas, headerRect.left, headerRect.top);
                    }
                    
                    // Capture sidebars
                    const sidebars = document.querySelectorAll('.sidebar');
                    for (const sidebar of sidebars) {
                        const sidebarCanvas = await html2canvas(sidebar, {
                            backgroundColor: null,
                            scale: 1,
                            logging: false
                        });
                        const sidebarRect = sidebar.getBoundingClientRect();
                        this.ctx.drawImage(sidebarCanvas, sidebarRect.left, sidebarRect.top);
                    }
                } catch (e) {
                    console.error('UI capture error:', e);
                }
            }
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // Clean up
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Update UI
        this.updateRecordingUI(false);
        this.hideRecordingIndicator();
        
        console.log('Stable recording stopped');
    }
    
    // UI Helper Methods
    updateRecordingUI(isRecording) {
        const recordBtn = document.getElementById('record-game');
        const stopBtn = document.getElementById('stop-recording');
        
        if (recordBtn) {
            recordBtn.style.display = isRecording ? 'none' : 'block';
        }
        if (stopBtn) {
            stopBtn.style.display = isRecording ? 'block' : 'none';
        }
    }
    
    showRecordingIndicator() {
        let indicator = document.getElementById('recording-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'recording-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: red;
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: bold;
                z-index: 10000;
                animation: pulse 1.5s infinite;
            `;
            indicator.innerHTML = '🔴 REC';
            document.body.appendChild(indicator);
            
            // Add pulse animation
            if (!document.getElementById('recording-pulse-style')) {
                const style = document.createElement('style');
                style.id = 'recording-pulse-style';
                style.textContent = `
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    hideRecordingIndicator() {
        const indicator = document.getElementById('recording-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Add slide animation
        if (!document.getElementById('notification-slide-style')) {
            const style = document.createElement('style');
            style.id = 'notification-slide-style';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// Create global instance
window.stableRecorder = new StableRecorder();

// Override existing recorder with stable version
if (window.gameRecorder) {
    const originalStart = window.gameRecorder.startRecording.bind(window.gameRecorder);
    const originalStop = window.gameRecorder.stopRecording.bind(window.gameRecorder);
    
    window.gameRecorder.startRecording = function(mode, area) {
        if (area === 'full') {
            // Mark gameRecorder as recording too for UI consistency
            window.gameRecorder.isRecording = true;
            window.stableRecorder.startRecording();
        } else {
            originalStart(mode, area);
        }
    };
    
    window.gameRecorder.stopRecording = function() {
        if (window.stableRecorder.isRecording) {
            window.gameRecorder.isRecording = false;
            window.stableRecorder.stopRecording();
        } else {
            originalStop();
        }
    };
    
    // Also override the stop button directly
    document.addEventListener('DOMContentLoaded', () => {
        const stopBtn = document.getElementById('stop-recording');
        if (stopBtn) {
            stopBtn.onclick = () => {
                if (window.stableRecorder.isRecording) {
                    window.stableRecorder.stopRecording();
                } else if (window.gameRecorder.isRecording) {
                    window.gameRecorder.stopRecording();
                }
            };
        }
    });
}