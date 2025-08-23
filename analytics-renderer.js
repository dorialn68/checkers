class AnalyticsRenderer {
    constructor() {
        this.charts = {};
        this.analyticsData = null;
    }

    render(container, data) {
        this.analyticsData = data;
        
        // Clear container
        container.innerHTML = '';
        
        // Create analytics content
        const analyticsHTML = `
            <div class="analytics-content" style="
                width: 100%;
                height: 100%;
                overflow-y: auto;
                padding: 30px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                color: white;
            ">
                <div class="analytics-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                ">
                    <h1 style="
                        font-size: 2.5em;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin: 0;
                    ">📊 Game Analytics</h1>
                </div>

                <div class="stats-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                    ">
                        <div class="stat-value" style="font-size: 2em; font-weight: bold;" id="modal-total-moves">0</div>
                        <div class="stat-label" style="font-size: 0.9em; opacity: 0.9;">Total Moves</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                    ">
                        <div class="stat-value" style="font-size: 2em; font-weight: bold;" id="modal-game-duration">0:00</div>
                        <div class="stat-label" style="font-size: 0.9em; opacity: 0.9;">Game Duration</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                    ">
                        <div class="stat-value" style="font-size: 2em; font-weight: bold;" id="modal-red-captures">0</div>
                        <div class="stat-label" style="font-size: 0.9em; opacity: 0.9;">Red Captures</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                    ">
                        <div class="stat-value" style="font-size: 2em; font-weight: bold;" id="modal-black-captures">0</div>
                        <div class="stat-label" style="font-size: 0.9em; opacity: 0.9;">Black Captures</div>
                    </div>
                </div>

                <div class="chart-section" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                ">
                    <h3 style="margin-bottom: 15px;">📈 Move Efficiency Over Time</h3>
                    <canvas id="modal-efficiency-chart" style="max-width: 100%; height: 200px;"></canvas>
                </div>

                <div class="chart-section" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                ">
                    <h3 style="margin-bottom: 15px;">⚖️ Piece Advantage</h3>
                    <canvas id="modal-advantage-chart" style="max-width: 100%; height: 200px;"></canvas>
                </div>

                <div class="key-moments" style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 20px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                ">
                    <h3 style="margin-bottom: 15px;">🎯 Key Moments</h3>
                    <div id="modal-key-moments-list"></div>
                </div>

                <div class="action-buttons" style="
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                ">
                    <button onclick="window.analyticsRenderer.watchReplay()" style="
                        flex: 1;
                        padding: 15px;
                        background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
                        border: none;
                        color: white;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                    ">🎮 Watch Replay</button>
                    <button onclick="window.analyticsRenderer.exportData()" style="
                        flex: 1;
                        padding: 15px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        color: white;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                    ">📥 Export Data</button>
                </div>
            </div>
        `;
        
        container.innerHTML = analyticsHTML;
        
        // Update stats
        this.updateStats(data);
        
        // Create charts after DOM is ready
        setTimeout(() => {
            this.createCharts(data);
            this.updateKeyMoments(data);
        }, 100);
    }

    updateStats(data) {
        const stats = data.stats || {};
        
        // Update stat values
        const totalMoves = document.getElementById('modal-total-moves');
        const gameDuration = document.getElementById('modal-game-duration');
        const redCaptures = document.getElementById('modal-red-captures');
        const blackCaptures = document.getElementById('modal-black-captures');
        
        if (totalMoves) totalMoves.textContent = stats.totalMoves || 0;
        if (gameDuration) gameDuration.textContent = this.formatTime(stats.duration || 0);
        if (redCaptures) redCaptures.textContent = stats.redCaptures || 0;
        if (blackCaptures) blackCaptures.textContent = stats.blackCaptures || 0;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    createCharts(data) {
        // Create efficiency chart
        const effCanvas = document.getElementById('modal-efficiency-chart');
        if (effCanvas && window.Chart) {
            const effCtx = effCanvas.getContext('2d');
            this.charts.efficiency = new Chart(effCtx, {
                type: 'line',
                data: {
                    labels: data.graphData?.efficiency?.map((_, i) => `Move ${i + 1}`) || [],
                    datasets: [{
                        label: 'Efficiency %',
                        data: data.graphData?.efficiency?.map(e => e.value) || [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    }
                }
            });
        }

        // Create advantage chart
        const advCanvas = document.getElementById('modal-advantage-chart');
        if (advCanvas && window.Chart) {
            const advCtx = advCanvas.getContext('2d');
            this.charts.advantage = new Chart(advCtx, {
                type: 'bar',
                data: {
                    labels: ['Red', 'Black'],
                    datasets: [{
                        label: 'Pieces',
                        data: [
                            data.stats?.redPieces || 12,
                            data.stats?.blackPieces || 12
                        ],
                        backgroundColor: ['#ff6b6b', '#4a4a4a']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 12,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    }
                }
            });
        }
    }

    updateKeyMoments(data) {
        const container = document.getElementById('modal-key-moments-list');
        if (!container) return;
        
        const moments = data.gameData?.keyMoments || [];
        
        if (moments.length === 0) {
            container.innerHTML = '<p style="opacity: 0.7;">No key moments recorded</p>';
            return;
        }
        
        container.innerHTML = moments.map(moment => `
            <div style="
                display: flex;
                align-items: center;
                padding: 10px;
                margin-bottom: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
            ">
                <span style="font-size: 24px; margin-right: 15px;">${this.getEventIcon(moment.type)}</span>
                <div style="flex: 1;">
                    <div>${moment.description}</div>
                    <div style="font-size: 0.9em; opacity: 0.7;">Move ${moment.move || 0}</div>
                </div>
            </div>
        `).join('');
    }

    getEventIcon(type) {
        const icons = {
            'first_blood': '🩸',
            'king_promotion': '👑',
            'turning_point': '🔄',
            'brilliant_move': '✨',
            'game_over': '🏁'
        };
        return icons[type] || '📍';
    }

    watchReplay() {
        // Close modal and open replay
        if (window.analyticsModal) {
            window.analyticsModal.close();
        }
        if (window.openPlaybackViewer) {
            window.openPlaybackViewer();
        }
    }

    exportData() {
        if (!this.analyticsData) return;
        
        const dataStr = JSON.stringify(this.analyticsData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `checkers-game-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    destroy() {
        // Clean up charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create global instance
window.analyticsRenderer = new AnalyticsRenderer();