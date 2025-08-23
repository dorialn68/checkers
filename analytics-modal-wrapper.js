class AnalyticsModalWrapper {
    constructor() {
        this.modal = null;
        this.contentContainer = null;
        this.isOpen = false;
    }

    create() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.id = 'analytics-modal-wrapper';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create modal content container
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            width: 90%;
            height: 90%;
            max-width: 1400px;
            max-height: 900px;
            background: #1a1a2e;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        `;

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            font-size: 24px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10001;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            closeBtn.style.transform = 'rotate(90deg)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            closeBtn.style.transform = 'rotate(0deg)';
        };
        closeBtn.onclick = () => this.close();

        // Create content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.style.cssText = `
            width: 100%;
            height: 100%;
            background: transparent;
            overflow: hidden;
        `;

        // Assemble modal
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(this.contentContainer);
        this.modal.appendChild(modalContent);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    transform: translateY(50px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Add to document
        document.body.appendChild(this.modal);

        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Handle click outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    open(analyticsData) {
        if (!this.modal) {
            this.create();
        }

        // Show modal
        this.modal.style.display = 'flex';
        this.isOpen = true;

        // Pause the game if it's running
        if (window.game && !window.game.isGameOver) {
            window.gamePausedForAnalytics = true;
        }

        // Store analytics data globally for recording purposes
        window.currentAnalyticsData = analyticsData;

        // Render analytics directly with full features
        if (window.analyticsRendererFull) {
            window.analyticsRendererFull.render(this.contentContainer, analyticsData);
        } else if (window.analyticsRenderer) {
            window.analyticsRenderer.render(this.contentContainer, analyticsData);
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;

            // Clean up analytics renderer
            if (window.analyticsRenderer) {
                window.analyticsRenderer.destroy();
            }

            // Resume game if it was paused
            if (window.gamePausedForAnalytics) {
                window.gamePausedForAnalytics = false;
            }
        }
    }

    isModalOpen() {
        return this.isOpen;
    }
}

// Create global instance
window.analyticsModal = new AnalyticsModalWrapper();

// Analytics renderer handles these actions directly now