class ConfettiCelebration {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.gravity = 0.3;
        this.friction = 0.99;
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff1493', '#00fa9a', '#ffd700'];
    }

    init() {
        // Create canvas for confetti
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '10000';
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    createParticle(x, y) {
        return {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 15,
            vy: Math.random() * -15 - 10,
            size: Math.random() * 8 + 5,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            angle: Math.random() * Math.PI * 2,
            angularVelocity: (Math.random() - 0.5) * 0.2,
            opacity: 1,
            shape: Math.random() > 0.5 ? 'square' : 'circle'
        };
    }

    celebrate(duration = 3000) {
        if (!this.canvas) {
            this.init();
        }

        // Clear any existing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Create initial burst of confetti from multiple points
        const burstPoints = [
            { x: window.innerWidth * 0.25, y: window.innerHeight * 0.7 },
            { x: window.innerWidth * 0.5, y: window.innerHeight * 0.7 },
            { x: window.innerWidth * 0.75, y: window.innerHeight * 0.7 }
        ];

        this.particles = [];
        burstPoints.forEach(point => {
            for (let i = 0; i < 50; i++) {
                this.particles.push(this.createParticle(point.x, point.y));
            }
        });

        // Add continuous stream from top
        let streamInterval = setInterval(() => {
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 3 + 2,
                    size: Math.random() * 8 + 5,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    angle: Math.random() * Math.PI * 2,
                    angularVelocity: (Math.random() - 0.5) * 0.1,
                    opacity: 1,
                    shape: Math.random() > 0.5 ? 'square' : 'circle'
                });
            }
        }, 100);

        const startTime = Date.now();
        
        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Update and draw particles
            this.particles = this.particles.filter(particle => {
                // Update physics
                particle.vy += this.gravity;
                particle.vx *= this.friction;
                particle.vy *= this.friction;
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.angle += particle.angularVelocity;
                
                // Fade out particles that are falling off screen
                if (particle.y > window.innerHeight * 0.8) {
                    particle.opacity -= 0.02;
                }
                
                // Draw particle
                this.ctx.save();
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.fillStyle = particle.color;
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.angle);
                
                if (particle.shape === 'square') {
                    this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
                
                // Keep particle if still visible
                return particle.opacity > 0 && particle.y < window.innerHeight + 20;
            });
            
            // Check if animation should continue
            const elapsed = Date.now() - startTime;
            if (elapsed < duration || this.particles.length > 0) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                // Clean up
                clearInterval(streamInterval);
                this.stop();
            }
            
            // Stop creating new particles after duration
            if (elapsed >= duration) {
                clearInterval(streamInterval);
            }
        };
        
        animate();
        
        // Add victory sound effect (optional)
        this.playVictorySound();
    }

    playVictorySound() {
        // Create a simple victory sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create notes for victory fanfare
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            
            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                // Set timing
                const startTime = audioContext.currentTime + index * 0.1;
                const duration = 0.2;
                
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });
        } catch (e) {
            console.log('Audio not available');
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
            this.canvas = null;
            this.ctx = null;
        }
        
        this.particles = [];
    }
}

// Create global instance
window.confettiCelebration = new ConfettiCelebration();