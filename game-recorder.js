// Game Recorder - Capture gameplay as GIF or WebM video
class GameRecorder {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.canvas = null;
        this.stream = null;
        this.gifFrames = [];
        this.frameCount = 0;
        this.maxFrames = 300; // Limit for GIF (10 seconds at 30fps)
        this.captureInterval = null;
        this.recordingStartTime = null;
        this.recordingMode = 'video'; // 'video' or 'gif'
        this.recordingArea = 'full'; // 'canvas' or 'full'
        this.virtualCanvas = null;
    }
    
    startRecording(mode = 'video', area = 'full') {
        if (this.isRecording) {
            console.log('Already recording');
            return;
        }
        
        this.recordingMode = mode;
        this.recordingArea = area;
        
        // Preload html2canvas for full screen capture
        if (area === 'full') {
            this.showNotification('Preparing to record full game...', 'info', 1500);
            this.loadHtml2Canvas().then(() => {
                this.continueRecording(mode, area);
            }).catch(() => {
                console.warn('html2canvas not available, using fallback');
                this.continueRecording(mode, area);
            });
        } else {
            this.continueRecording(mode, area);
        }
    }
    
    continueRecording(mode, area) {
        // Decide what to capture
        if (area === 'canvas') {
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                console.error('Canvas not found');
                return;
            }
        } else {
            // Create virtual canvas for full screen capture
            this.setupFullScreenCapture();
            // Inform about analytics recording
            setTimeout(() => {
                this.showNotification('📹 Recording full game screen. Analytics will be captured automatically when opened!', 'success', 3000);
            }, 2000);
        }
        
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.frameCount = 0;
        
        if (mode === 'video') {
            this.startVideoRecording();
        } else {
            this.startGifRecording();
        }
        
        this.updateRecordingUI(true);
    }
    
    setupFullScreenCapture() {
        // Always use full viewport size to handle modal transitions smoothly
        this.virtualCanvas = document.createElement('canvas');
        this.virtualCanvas.width = window.innerWidth;
        this.virtualCanvas.height = window.innerHeight;
        
        console.log(`Full viewport capture setup: ${this.virtualCanvas.width}x${this.virtualCanvas.height}`);
        
        // Use this virtual canvas for recording
        this.canvas = this.virtualCanvas;
    }
    
    captureFullScreen() {
        if (!this.virtualCanvas) return Promise.resolve(null);
        
        const ctx = this.virtualCanvas.getContext('2d');
        
        // Simple approach: always use html2canvas for full screen recording
        return this.captureEntireScreen(ctx);
    }
    
    captureEntireScreen(ctx) {
        return new Promise((resolve) => {
            
            if (!window.html2canvas) {
                // If html2canvas not loaded, just capture the game canvas
                const gameCanvas = document.getElementById('game-canvas');
                if (gameCanvas) {
                    ctx.clearRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    
                    const rect = gameCanvas.getBoundingClientRect();
                    ctx.drawImage(gameCanvas, rect.left, rect.top, rect.width, rect.height);
                }
                resolve(this.virtualCanvas);
                return;
            }
            
            // Use html2canvas to capture everything visible
            html2canvas(document.body, {
                backgroundColor: '#1a1a2e',
                scale: 1,
                logging: false,
                width: window.innerWidth,
                height: window.innerHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                x: 0,
                y: 0,
                useCORS: true,
                allowTaint: true
            }).then(canvas => {
                ctx.clearRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                ctx.drawImage(canvas, 0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                resolve(this.virtualCanvas);
            }).catch(error => {
                console.error('Capture error:', error);
                // Fallback to game canvas only
                const gameCanvas = document.getElementById('game-canvas');
                if (gameCanvas) {
                    ctx.clearRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    
                    const rect = gameCanvas.getBoundingClientRect();
                    ctx.drawImage(gameCanvas, rect.left, rect.top, rect.width, rect.height);
                }
                resolve(this.virtualCanvas);
            });
        });
    }
    
    hybridCapture(ctx, container, gameCanvas) {
        return new Promise((resolve) => {
            // Clear the canvas first
            ctx.clearRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
            
            // Fill with background color
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
            
            const containerRect = container.getBoundingClientRect();
            
            // First, capture WebGL canvas content
            let gameCanvasImage = null;
            if (gameCanvas) {
                try {
                    // Create image from WebGL canvas
                    gameCanvasImage = new Image();
                    gameCanvasImage.src = gameCanvas.toDataURL('image/png');
                } catch (e) {
                    console.warn('Could not capture WebGL canvas:', e);
                }
            }
            
            // Use html2canvas for UI elements, excluding the game canvas
            if (window.html2canvas) {
                html2canvas(container, {
                    backgroundColor: null, // Preserve transparency to show game background
                    scale: 1,
                    logging: false,
                    width: this.virtualCanvas.width,
                    height: this.virtualCanvas.height,
                    ignoreElements: (element) => {
                        // Ignore only the canvas element
                        return element.id === 'game-canvas';
                    }
                }).then(uiCanvas => {
                    // Clear virtual canvas
                    ctx.clearRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    
                    // First draw the background gradient (purple)
                    const gradient = ctx.createLinearGradient(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    
                    // Draw dark background for game area
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(0, 0, this.virtualCanvas.width, 80); // Header area
                    
                    // Draw UI with some transparency
                    ctx.globalAlpha = 0.98;
                    ctx.drawImage(uiCanvas, 0, 0);
                    ctx.globalAlpha = 1.0;
                    
                    // Then overlay the WebGL canvas
                    if (gameCanvasImage && gameCanvas) {
                        const rect = gameCanvas.getBoundingClientRect();
                        const x = rect.left - containerRect.left;
                        const y = rect.top - containerRect.top;
                        
                        // Draw WebGL content on top of UI
                        ctx.drawImage(gameCanvas, x, y, rect.width, rect.height);
                    }
                    
                    resolve(this.virtualCanvas);
                }).catch(error => {
                    console.error('html2canvas error:', error);
                    // Fallback to direct composition
                    this.fallbackComposition(ctx, container, gameCanvas);
                    resolve(this.virtualCanvas);
                });
            } else {
                // Load html2canvas first
                this.loadHtml2Canvas().then(() => {
                    this.hybridCapture(ctx, container, gameCanvas).then(resolve);
                }).catch(() => {
                    this.fallbackComposition(ctx, container, gameCanvas);
                    resolve(this.virtualCanvas);
                });
            }
        });
    }
    
    captureModalOrAnalytics(ctx) {
        return new Promise((resolve) => {
            if (window.html2canvas) {
                // Capture the entire viewport for modals
                html2canvas(document.body, {
                    backgroundColor: '#1a1a2e', // Use the proper background color
                    scale: 1,
                    logging: false,
                    width: this.virtualCanvas.width,
                    height: this.virtualCanvas.height,
                    windowWidth: this.virtualCanvas.width,
                    windowHeight: this.virtualCanvas.height,
                    x: window.scrollX,
                    y: window.scrollY,
                    useCORS: true,
                    allowTaint: true
                }).then(canvas => {
                    // First draw the background gradient
                    ctx.clearRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    
                    // Create purple gradient background
                    const gradient = ctx.createLinearGradient(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    
                    // Then draw the captured content with transparency
                    ctx.globalAlpha = 0.95;
                    ctx.drawImage(canvas, 0, 0);
                    ctx.globalAlpha = 1.0;
                    
                    resolve();
                }).catch(error => {
                    console.error('Modal capture error:', error);
                    // Draw error message with gradient
                    const gradient = ctx.createLinearGradient(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    gradient.addColorStop(0, '#667eea');
                    gradient.addColorStop(1, '#764ba2');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
                    
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Recording Analytics/Modal View', this.virtualCanvas.width / 2, this.virtualCanvas.height / 2);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
    
    fallbackComposition(ctx, container, gameCanvas) {
        const containerRect = container.getBoundingClientRect();
        
        // Clear and set background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
        
        // Draw the game canvas
        if (gameCanvas) {
            try {
                const rect = gameCanvas.getBoundingClientRect();
                const x = rect.left - containerRect.left;
                const y = rect.top - containerRect.top;
                ctx.drawImage(gameCanvas, x, y, rect.width, rect.height);
            } catch (e) {
                console.warn('Could not capture game canvas:', e);
            }
        }
        
        // Draw simplified UI
        this.drawFullUI(ctx, container);
    }
    
    drawFullUI(ctx, container) {
        const containerRect = container.getBoundingClientRect();
        
        // Save context state
        ctx.save();
        
        // Draw header
        ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
        ctx.fillRect(0, 0, this.virtualCanvas.width, 80);
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('3D CHECKERS PRO', this.virtualCanvas.width / 2, 35);
        
        // Game stats
        const turnElement = document.getElementById('current-turn');
        const modeElement = document.getElementById('game-mode');
        const redScore = document.getElementById('red-score');
        const blackScore = document.getElementById('black-score');
        
        ctx.font = '16px Inter';
        ctx.fillStyle = '#e0e0e0';
        
        if (turnElement) {
            ctx.textAlign = 'left';
            ctx.fillText(`Turn: ${turnElement.textContent}`, 20, 65);
        }
        
        if (modeElement) {
            ctx.textAlign = 'center';
            ctx.fillText(`Mode: ${modeElement.textContent}`, this.virtualCanvas.width / 2, 65);
        }
        
        if (redScore && blackScore) {
            ctx.textAlign = 'right';
            ctx.fillText(`Score: Red ${redScore.textContent} - Black ${blackScore.textContent}`, 
                        this.virtualCanvas.width - 20, 65);
        }
        
        // Draw side panels indication (simplified)
        ctx.fillStyle = 'rgba(42, 42, 66, 0.8)';
        ctx.fillRect(0, 80, 250, this.virtualCanvas.height - 80); // Left panel
        ctx.fillRect(this.virtualCanvas.width - 250, 80, 250, this.virtualCanvas.height - 80); // Right panel
        
        // Panel labels
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Game Controls', 125, 110);
        ctx.fillText('AI Assistant', this.virtualCanvas.width - 125, 110);
        
        // Add recording watermark if recording
        if (this.isRecording) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('● REC', 10, this.virtualCanvas.height - 10);
        }
        
        // Restore context
        ctx.restore();
    }
    
    manualComposition(ctx, container) {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.virtualCanvas.width, this.virtualCanvas.height);
        
        // Get the game canvas
        const gameCanvas = document.getElementById('game-canvas');
        if (gameCanvas) {
            const rect = gameCanvas.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Calculate relative position
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;
            
            // Draw the game canvas
            ctx.drawImage(gameCanvas, x, y, rect.width, rect.height);
        }
        
        // Add UI elements as overlays (simplified representation)
        this.drawUIOverlay(ctx, container);
    }
    
    drawUIOverlay(ctx, container) {
        // Draw basic UI representation
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        
        // Title
        ctx.fillText('3D CHECKERS PRO', this.virtualCanvas.width / 2, 40);
        
        // Current turn indicator
        const turnElement = document.getElementById('current-turn');
        if (turnElement) {
            ctx.font = '18px Inter';
            ctx.fillText(`Turn: ${turnElement.textContent}`, this.virtualCanvas.width / 2, 70);
        }
        
        // Score
        const redScore = document.getElementById('red-score');
        const blackScore = document.getElementById('black-score');
        if (redScore && blackScore) {
            ctx.fillText(`Score: Red ${redScore.textContent} - Black ${blackScore.textContent}`, 
                        this.virtualCanvas.width / 2, 95);
        }
    }
    
    startVideoRecording() {
        try {
            if (this.recordingArea === 'full') {
                // For full screen, we need to continuously capture frames
                this.startFullScreenVideoCapture();
            } else {
                // Get canvas stream at 30 FPS
                this.stream = this.canvas.captureStream(30);
                
                // Setup MediaRecorder with WebM format
                const options = {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
                };
                
                // Fallback to vp8 if vp9 not supported
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'video/webm;codecs=vp8';
                }
                
                this.mediaRecorder = new MediaRecorder(this.stream, options);
                this.recordedChunks = [];
                
                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.recordedChunks.push(event.data);
                    }
                };
                
                this.mediaRecorder.onstop = () => {
                    this.saveVideoRecording();
                };
                
                this.mediaRecorder.start();
                console.log('Video recording started');
                
                // Show recording indicator
                this.showRecordingIndicator();
            }
            
        } catch (error) {
            console.error('Failed to start video recording:', error);
            this.isRecording = false;
            this.showNotification('Failed to start recording', 'error');
        }
    }
    
    startFullScreenVideoCapture() {
        // Load html2canvas if not already loaded
        this.loadHtml2Canvas().then(() => {
            // Get stream from virtual canvas
            this.stream = this.canvas.captureStream(30);
            
            // Setup MediaRecorder
            const options = {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 4500000 // Higher bitrate for full screen with UI
            };
            
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm;codecs=vp8';
            }
            
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.saveVideoRecording();
                if (this.captureInterval) {
                    clearInterval(this.captureInterval);
                }
            };
            
            this.mediaRecorder.start();
            
            // Start capturing frames
            this.captureInterval = setInterval(() => {
                this.captureFullScreen();
            }, 100); // 10 FPS for smooth capture
            
            console.log('Full screen video recording started with html2canvas');
            this.showRecordingIndicator();
            this.showNotification('Recording full game with menus...', 'info', 2000);
            
        }).catch(error => {
            console.error('Failed to load html2canvas:', error);
            this.showNotification('Full screen recording not available', 'error');
            this.isRecording = false;
        });
    }
    
    startGifRecording() {
        if (!window.GIF) {
            // Load gif.js library if not already loaded
            this.loadGifLibrary().then(() => {
                this.startGifCapture();
            }).catch(error => {
                console.error('Failed to load GIF library:', error);
                this.showNotification('GIF recording not available', 'error');
                this.isRecording = false;
            });
        } else {
            this.startGifCapture();
        }
    }
    
    startGifCapture() {
        this.gifFrames = [];
        
        // Load html2canvas if needed for full screen
        const setupPromise = this.recordingArea === 'full' 
            ? this.loadHtml2Canvas() 
            : Promise.resolve();
            
        setupPromise.then(() => {
            // Create GIF encoder
            this.gif = new GIF({
                workers: 2,
                quality: 10,
                width: this.canvas.width,
                height: this.canvas.height,
                workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
            });
            
            // Capture frames every 100ms (10 FPS for smaller file size)
            this.captureInterval = setInterval(async () => {
                if (this.frameCount >= this.maxFrames) {
                    this.stopRecording();
                    return;
                }
                
                // Clone canvas content
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const ctx = tempCanvas.getContext('2d');
                
                if (this.recordingArea === 'full') {
                    // Capture full screen
                    await this.captureFullScreen();
                    ctx.drawImage(this.canvas, 0, 0);
                } else {
                    // Just copy the game canvas
                    ctx.drawImage(this.canvas, 0, 0);
                }
                
                // Add frame to GIF
                this.gif.addFrame(tempCanvas, {delay: 100});
                this.frameCount++;
                
                // Update progress
                const progress = (this.frameCount / this.maxFrames) * 100;
                this.updateProgress(progress);
                
            }, 100); // Capture at 10 FPS for GIF
            
            console.log('GIF recording started');
            this.showRecordingIndicator();
        });
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.recordingMode === 'video') {
            if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
        } else {
            if (this.captureInterval) {
                clearInterval(this.captureInterval);
                this.captureInterval = null;
            }
            this.processGif();
        }
        
        this.updateRecordingUI(false);
        this.hideRecordingIndicator();
    }
    
    processGif() {
        if (!this.gif) return;
        
        this.showNotification('Processing GIF... This may take a moment', 'info');
        
        this.gif.on('finished', (blob) => {
            this.saveGifRecording(blob);
        });
        
        this.gif.render();
    }
    
    saveVideoRecording() {
        const blob = new Blob(this.recordedChunks, {
            type: 'video/webm'
        });
        
        const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const fileName = `checkers-gameplay-${this.getTimestamp()}.webm`;
        
        this.downloadFile(blob, fileName);
        
        this.showNotification(`Video saved! Duration: ${duration}s`, 'success');
        
        // Show options for conversion
        this.showConversionOptions(blob);
    }
    
    saveGifRecording(blob) {
        const fileName = `checkers-gameplay-${this.getTimestamp()}.gif`;
        this.downloadFile(blob, fileName);
        
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        this.showNotification(`GIF saved! Size: ${sizeMB}MB`, 'success');
    }
    
    downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    showConversionOptions(blob) {
        const message = `
            <div style="margin-top: 10px;">
                <p><strong>Video saved as WebM format</strong></p>
                <p style="font-size: 12px; margin-top: 5px;">
                    To convert to MP4 for better compatibility:
                </p>
                <ol style="font-size: 11px; text-align: left; margin: 5px 0;">
                    <li>Use online converter: <a href="https://cloudconvert.com/webm-to-mp4" target="_blank" style="color: #4CAF50;">CloudConvert</a></li>
                    <li>Or use FFmpeg: <code>ffmpeg -i input.webm output.mp4</code></li>
                    <li>Or use VLC Media Player: Media → Convert/Save</li>
                </ol>
                <p style="font-size: 11px; margin-top: 5px;">
                    WebM works directly on LinkedIn web, but MP4 is better for mobile.
                </p>
            </div>
        `;
        
        this.showNotification(message, 'info', 10000);
    }
    
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
        // Remove existing indicator if any
        this.hideRecordingIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'recording-indicator';
        indicator.innerHTML = `
            <span class="record-dot"></span>
            <span>REC</span>
            <span id="record-time">00:00</span>
        `;
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: bold;
            z-index: 10000;
            animation: pulse 1.5s infinite;
        `;
        
        // Add pulsing animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes pulse {
                0% { opacity: 0.9; }
                50% { opacity: 0.6; }
                100% { opacity: 0.9; }
            }
            .record-dot {
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                animation: blink 1s infinite;
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(indicator);
        
        // Update timer
        this.updateTimer();
    }
    
    updateTimer() {
        if (!this.isRecording) return;
        
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerElement = document.getElementById('record-time');
        if (timerElement) {
            timerElement.textContent = timeStr;
        }
        
        // Update every second
        if (this.isRecording) {
            setTimeout(() => this.updateTimer(), 1000);
        }
    }
    
    hideRecordingIndicator() {
        const indicator = document.getElementById('recording-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    updateProgress(percent) {
        const indicator = document.getElementById('recording-indicator');
        if (indicator && this.recordingMode === 'gif') {
            indicator.innerHTML += `<span style="margin-left: 10px;">${percent.toFixed(0)}%</span>`;
        }
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10001;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }
    
    loadGifLibrary() {
        return new Promise((resolve, reject) => {
            if (window.GIF) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    loadHtml2Canvas() {
        return new Promise((resolve, reject) => {
            if (window.html2canvas) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    getTimestamp() {
        const now = new Date();
        return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
    }
    
    // Quick record functions for easy access
    quickRecordVideo(duration = 30000) {
        this.startRecording('video');
        setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
            }
        }, duration);
    }
    
    quickRecordGif(duration = 10000) {
        this.startRecording('gif');
        setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
            }
        }, duration);
    }
}

// Initialize recorder
window.gameRecorder = new GameRecorder();