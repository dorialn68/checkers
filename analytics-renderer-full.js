class AnalyticsRendererFull {
    constructor() {
        this.charts = {};
        this.analyticsData = null;
        this.playbackInterval = null;
        this.currentMoveIndex = 0;
    }

    render(container, data) {
        this.analyticsData = data;
        
        console.log('Rendering analytics with data:', data);
        
        // Clear container
        container.innerHTML = '';
        
        // Create comprehensive analytics content
        const analyticsHTML = `
            <div class="analytics-content" style="
                width: 100%;
                height: 100%;
                overflow-y: auto;
                padding: 30px;
                background: linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 100%);
                color: white;
                font-family: 'Inter', -apple-system, sans-serif;
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
                    ">🎮 Game Analytics & Playback</h1>
                </div>

                <!-- Statistics Grid - 6 cards -->
                <div class="stats-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                ">
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        <div class="stat-value" style="font-size: 2.2em; font-weight: bold;" id="modal-total-moves">0</div>
                        <div class="stat-label" style="font-size: 0.85em; opacity: 0.9; margin-top: 5px;">Total Moves</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        <div class="stat-value" style="font-size: 2.2em; font-weight: bold;" id="modal-game-duration">0:00</div>
                        <div class="stat-label" style="font-size: 0.85em; opacity: 0.9; margin-top: 5px;">Game Duration</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        <div class="stat-value" style="font-size: 2.2em; font-weight: bold;" id="modal-red-captures">0</div>
                        <div class="stat-label" style="font-size: 0.85em; opacity: 0.9; margin-top: 5px;">Red Captures</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        <div class="stat-value" style="font-size: 2.2em; font-weight: bold;" id="modal-black-captures">0</div>
                        <div class="stat-label" style="font-size: 0.85em; opacity: 0.9; margin-top: 5px;">Black Captures</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        <div class="stat-value" style="font-size: 2.2em; font-weight: bold; color: #333;" id="modal-red-efficiency">0%</div>
                        <div class="stat-label" style="font-size: 0.85em; opacity: 0.8; margin-top: 5px; color: #333;">Red Efficiency</div>
                    </div>
                    <div class="stat-card" style="
                        background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
                        padding: 20px;
                        border-radius: 15px;
                        text-align: center;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">
                        <div class="stat-value" style="font-size: 2.2em; font-weight: bold; color: #333;" id="modal-black-efficiency">0%</div>
                        <div class="stat-label" style="font-size: 0.85em; opacity: 0.8; margin-top: 5px; color: #333;">Black Efficiency</div>
                    </div>
                </div>

                <!-- Charts Section - 4 charts in 2x2 grid -->
                <div class="charts-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <div class="chart-section" style="
                        background: rgba(255, 255, 255, 0.08);
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    ">
                        <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.2em;">📈 Move Efficiency Over Time</h3>
                        <canvas id="modal-efficiency-chart" style="width: 100%; height: 200px;"></canvas>
                    </div>
                    <div class="chart-section" style="
                        background: rgba(255, 255, 255, 0.08);
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    ">
                        <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.2em;">⚖️ Piece Advantage</h3>
                        <canvas id="modal-advantage-chart" style="width: 100%; height: 200px;"></canvas>
                    </div>
                    <div class="chart-section" style="
                        background: rgba(255, 255, 255, 0.08);
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    ">
                        <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.2em;">⏱️ Time Per Move</h3>
                        <canvas id="modal-time-chart" style="width: 100%; height: 200px;"></canvas>
                    </div>
                    <div class="chart-section" style="
                        background: rgba(255, 255, 255, 0.08);
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    ">
                        <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.2em;">🎯 Captures Timeline</h3>
                        <canvas id="modal-captures-chart" style="width: 100%; height: 200px;"></canvas>
                    </div>
                </div>

                <!-- Playback Section -->
                <div class="playback-section" style="
                    background: rgba(255, 255, 255, 0.08);
                    padding: 25px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                ">
                    <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.2em;">🎮 Game Playback Controls</h3>
                    
                    <div class="playback-controls" style="
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                        margin-bottom: 20px;
                    ">
                        <button onclick="window.analyticsRendererFull.goToStart()" style="
                            padding: 10px 20px;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">⏮ Start</button>
                        <button onclick="window.analyticsRendererFull.previousMove()" style="
                            padding: 10px 20px;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">⏪ Previous</button>
                        <button id="play-pause-btn" onclick="window.analyticsRendererFull.togglePlayback()" style="
                            padding: 10px 30px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border: none;
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">▶ Play</button>
                        <button onclick="window.analyticsRendererFull.nextMove()" style="
                            padding: 10px 20px;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">⏩ Next</button>
                        <button onclick="window.analyticsRendererFull.goToEnd()" style="
                            padding: 10px 20px;
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">⏭ End</button>
                    </div>
                    
                    <div class="timeline" style="
                        position: relative;
                        height: 40px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        overflow: hidden;
                        cursor: pointer;
                    " onclick="window.analyticsRendererFull.seekTimeline(event)">
                        <div id="timeline-progress" style="
                            position: absolute;
                            left: 0;
                            top: 0;
                            height: 100%;
                            width: 0%;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            transition: width 0.3s;
                        "></div>
                        <div id="timeline-markers" style="
                            position: absolute;
                            width: 100%;
                            height: 100%;
                        "></div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 10px; color: rgba(255, 255, 255, 0.7);">
                        Move <span id="current-move">0</span> / <span id="total-moves-playback">0</span>
                    </div>
                </div>

                <!-- Key Moments -->
                <div class="key-moments" style="
                    background: rgba(255, 255, 255, 0.08);
                    padding: 25px;
                    border-radius: 15px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                ">
                    <h3 style="margin-bottom: 15px; color: #fff; font-size: 1.2em;">🎯 Key Moments</h3>
                    <div id="modal-key-moments-list"></div>
                </div>

                <!-- Action Buttons -->
                <div class="action-buttons" style="
                    display: flex;
                    gap: 15px;
                    margin-top: 30px;
                ">
                    <button onclick="window.analyticsRendererFull.watchFullReplay()" style="
                        flex: 1;
                        padding: 15px;
                        background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
                        border: none;
                        color: white;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">🎮 Watch Full Replay</button>
                    <button onclick="window.analyticsRendererFull.exportData()" style="
                        flex: 1;
                        padding: 15px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        color: white;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">📥 Export Data</button>
                    <button onclick="window.analyticsRendererFull.shareGame()" style="
                        flex: 1;
                        padding: 15px;
                        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                        border: none;
                        color: white;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">📤 Share Game</button>
                </div>
            </div>
        `;
        
        container.innerHTML = analyticsHTML;
        
        // Update stats
        this.updateStats(data);
        
        // Create charts after DOM is ready
        setTimeout(() => {
            this.createAllCharts(data);
            this.updateKeyMoments(data);
            this.initializePlayback(data);
        }, 100);
    }

    updateStats(data) {
        const stats = data.stats || {};
        
        document.getElementById('modal-total-moves').textContent = stats.totalMoves || 0;
        document.getElementById('modal-game-duration').textContent = this.formatTime(stats.duration || 0);
        document.getElementById('modal-red-captures').textContent = stats.redCaptures || 0;
        document.getElementById('modal-black-captures').textContent = stats.blackCaptures || 0;
        document.getElementById('modal-red-efficiency').textContent = Math.round(stats.redEfficiency || 0) + '%';
        document.getElementById('modal-black-efficiency').textContent = Math.round(stats.blackEfficiency || 0) + '%';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    createAllCharts(data) {
        const graphData = data.graphData || {};
        
        // Debug log to see what data we're getting
        console.log('Analytics Graph Data:', graphData);
        console.log('Full Analytics Data:', data);
        
        // 1. Efficiency Chart
        const effCanvas = document.getElementById('modal-efficiency-chart');
        if (effCanvas && window.Chart) {
            this.charts.efficiency = new Chart(effCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: graphData.efficiency?.map((_, i) => `Move ${i + 1}`) || [],
                    datasets: [
                        {
                            label: 'Red Efficiency',
                            data: graphData.efficiency?.filter(e => e.player === 'red').map(e => e.value) || [],
                            borderColor: '#ff6b6b',
                            backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Black Efficiency',
                            data: graphData.efficiency?.filter(e => e.player === 'black').map(e => e.value) || [],
                            borderColor: '#4a4a4a',
                            backgroundColor: 'rgba(74, 74, 74, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: this.getChartOptions()
            });
        }

        // 2. Piece Advantage Chart - Shows difference in pieces over time
        const advCanvas = document.getElementById('modal-advantage-chart');
        if (advCanvas && window.Chart) {
            const pieceData = graphData.pieceAdvantage || [];
            
            // If we have piece advantage data, use it; otherwise show current state
            let dataPoints = pieceData.length > 0 
                ? pieceData.map(p => p.value || 0)
                : [data.stats?.redPieces - data.stats?.blackPieces || 0];
            
            let labels = pieceData.length > 0
                ? pieceData.map((_, i) => `Move ${i + 1}`)
                : ['Current'];
            
            this.charts.advantage = new Chart(advCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Piece Advantage (Red - Black)',
                        data: dataPoints,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    ...this.getChartOptions(),
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                            title: { display: true, text: 'Advantage', color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    }
                }
            });
        }

        // 3. Time Per Move Chart - Shows time taken by each player
        const timeCanvas = document.getElementById('modal-time-chart');
        if (timeCanvas && window.Chart) {
            const timeData = graphData.timePerMove || [];
            const redMoves = timeData.filter(t => t.player === 'red');
            const blackMoves = timeData.filter(t => t.player === 'black');
            
            this.charts.time = new Chart(timeCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: timeData.map((_, i) => `Move ${i + 1}`),
                    datasets: [
                        {
                            label: 'Red Player',
                            data: timeData.map(t => t.player === 'red' ? (t.value / 1000) : null),
                            backgroundColor: 'rgba(255, 107, 107, 0.7)',
                            borderColor: '#ff6b6b',
                            borderWidth: 1
                        },
                        {
                            label: 'Black Player',
                            data: timeData.map(t => t.player === 'black' ? (t.value / 1000) : null),
                            backgroundColor: 'rgba(74, 74, 74, 0.7)',
                            borderColor: '#4a4a4a',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    ...this.getChartOptions(),
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                            title: { display: true, text: 'Seconds', color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    }
                }
            });
        }

        // 4. Captures Timeline Chart
        const capturesCanvas = document.getElementById('modal-captures-chart');
        if (capturesCanvas && window.Chart) {
            const capturesData = this.processCapturesData(data);
            this.charts.captures = new Chart(capturesCanvas.getContext('2d'), {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Red Captures',
                            data: capturesData.red,
                            backgroundColor: '#ff6b6b',
                            pointRadius: 8
                        },
                        {
                            label: 'Black Captures',
                            data: capturesData.black,
                            backgroundColor: '#4a4a4a',
                            pointRadius: 8
                        }
                    ]
                },
                options: {
                    ...this.getChartOptions(),
                    scales: {
                        x: {
                            type: 'linear',
                            title: { display: true, text: 'Move Number', color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        },
                        y: {
                            title: { display: true, text: 'Captures', color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                    }
                }
            });
        }
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: true, // Changed to true to prevent stretching
            aspectRatio: 2, // Fixed aspect ratio
            animation: {
                duration: 0 // Disable animations for better recording
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: 'rgba(255, 255, 255, 0.9)' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            }
        };
    }

    processCapturesData(data) {
        const moves = data.gameData?.moves || [];
        const red = [];
        const black = [];
        
        let redCount = 0;
        let blackCount = 0;
        
        // Process moves to find captures
        moves.forEach((move, index) => {
            if (move.isJump) {
                if (move.player === 'red') {
                    redCount++;
                    red.push({ x: index + 1, y: redCount });
                } else {
                    blackCount++;
                    black.push({ x: index + 1, y: blackCount });
                }
            }
        });
        
        return { red, black };
    }

    updateKeyMoments(data) {
        const container = document.getElementById('modal-key-moments-list');
        if (!container) return;
        
        const moments = data.gameData?.keyMoments || [];
        
        if (moments.length === 0) {
            container.innerHTML = '<p style="opacity: 0.7; color: rgba(255, 255, 255, 0.7);">No key moments recorded</p>';
            return;
        }
        
        container.innerHTML = moments.map(moment => `
            <div style="
                display: flex;
                align-items: center;
                padding: 12px;
                margin-bottom: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'" 
               onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'"
               onclick="window.analyticsRendererFull.jumpToMove(${moment.move || 0})">
                <span style="font-size: 28px; margin-right: 15px;">${this.getEventIcon(moment.type)}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 1.1em;">${moment.description}</div>
                    <div style="font-size: 0.9em; opacity: 0.7; margin-top: 4px;">Move ${moment.move || 0}</div>
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
            'game_over': '🏁',
            'multi_capture': '💥',
            'defensive_move': '🛡️'
        };
        return icons[type] || '📍';
    }

    initializePlayback(data) {
        const totalMoves = data.gameData?.moves?.length || 0;
        document.getElementById('total-moves-playback').textContent = totalMoves;
        document.getElementById('current-move').textContent = '0';
        this.currentMoveIndex = 0;
    }

    togglePlayback() {
        const btn = document.getElementById('play-pause-btn');
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
            btn.textContent = '▶ Play';
        } else {
            btn.textContent = '⏸ Pause';
            this.playbackInterval = setInterval(() => {
                this.nextMove();
                if (this.currentMoveIndex >= (this.analyticsData?.gameData?.moves?.length || 0)) {
                    this.togglePlayback();
                }
            }, 1000);
        }
    }

    nextMove() {
        const totalMoves = this.analyticsData?.gameData?.moves?.length || 0;
        if (this.currentMoveIndex < totalMoves) {
            this.currentMoveIndex++;
            this.updatePlaybackDisplay();
        }
    }

    previousMove() {
        if (this.currentMoveIndex > 0) {
            this.currentMoveIndex--;
            this.updatePlaybackDisplay();
        }
    }

    goToStart() {
        this.currentMoveIndex = 0;
        this.updatePlaybackDisplay();
    }

    goToEnd() {
        this.currentMoveIndex = this.analyticsData?.gameData?.moves?.length || 0;
        this.updatePlaybackDisplay();
    }

    jumpToMove(moveIndex) {
        this.currentMoveIndex = Math.max(0, Math.min(moveIndex, this.analyticsData?.gameData?.moves?.length || 0));
        this.updatePlaybackDisplay();
    }

    seekTimeline(event) {
        const timeline = event.currentTarget;
        const rect = timeline.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const totalMoves = this.analyticsData?.gameData?.moves?.length || 0;
        this.currentMoveIndex = Math.floor(percent * totalMoves);
        this.updatePlaybackDisplay();
    }

    updatePlaybackDisplay() {
        document.getElementById('current-move').textContent = this.currentMoveIndex;
        const totalMoves = this.analyticsData?.gameData?.moves?.length || 0;
        const progress = totalMoves > 0 ? (this.currentMoveIndex / totalMoves * 100) : 0;
        document.getElementById('timeline-progress').style.width = progress + '%';
    }

    watchFullReplay() {
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

    shareGame() {
        if (!this.analyticsData) return;
        
        const shareUrl = window.location.origin + '/replay?game=' + btoa(JSON.stringify(this.analyticsData.gameData));
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Replay link copied to clipboard!');
        });
    }

    destroy() {
        // Stop playback
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        
        // Clean up charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create global instance
window.analyticsRendererFull = new AnalyticsRendererFull();