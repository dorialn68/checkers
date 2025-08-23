class Checkers3DRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.pieces = [];
        this.board = null;
        this.validMoveIndicators = [];
        this.selectedPieceGlow = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isRotating = false;
        this.animationQueue = [];
        this.hintHighlights = [];
        
        // Store lights for later adjustment
        this.ambientLight = null;
        this.mainLight = null;
        this.rimLight = null;
        this.pointLight = null;
        
        // Visual settings
        this.customRedColor = null;
        this.customBlackColor = null;
        this.saturationLevel = 1.0;
        this.shininessLevel = 0.3;
        
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 100);

        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 12, 12);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true // Enable for recording/screenshots
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 25;
        this.controls.enablePan = false;

        this.setupLights();
        this.createBoard();
        this.createPieces();
        this.setupEventListeners();
        
        this.animate();
    }

    setupLights() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);

        this.mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.mainLight.position.set(5, 10, 5);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.camera.near = 0.1;
        this.mainLight.shadow.camera.far = 50;
        this.mainLight.shadow.camera.left = -10;
        this.mainLight.shadow.camera.right = 10;
        this.mainLight.shadow.camera.top = 10;
        this.mainLight.shadow.camera.bottom = -10;
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.scene.add(this.mainLight);

        this.rimLight = new THREE.DirectionalLight(0x667eea, 0.3);
        this.rimLight.position.set(-5, 5, -5);
        this.scene.add(this.rimLight);

        this.pointLight = new THREE.PointLight(0xffd700, 0.5, 20);
        this.pointLight.position.set(0, 5, 0);
        this.scene.add(this.pointLight);
    }

    createBoard() {
        const boardGroup = new THREE.Group();
        
        const boardGeometry = new THREE.BoxGeometry(8.5, 0.3, 8.5);
        this.boardMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b4513,
            specular: 0x222222,
            shininess: 30
        });
        const boardBase = new THREE.Mesh(boardGeometry, this.boardMaterial);
        boardBase.position.y = -0.15;
        boardBase.receiveShadow = true;
        boardBase.castShadow = true;
        boardGroup.add(boardBase);

        const edgeGeometry = new THREE.BoxGeometry(0.2, 0.5, 8.5);
        const edgeMaterial = new THREE.MeshPhongMaterial({
            color: 0x654321,
            specular: 0x111111,
            shininess: 20
        });
        
        for (let i = 0; i < 4; i++) {
            const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
            if (i < 2) {
                edge.position.x = i === 0 ? -4.35 : 4.35;
                edge.rotation.y = 0;
            } else {
                edge.position.z = i === 2 ? -4.35 : 4.35;
                edge.rotation.y = Math.PI / 2;
            }
            edge.castShadow = true;
            boardGroup.add(edge);
        }

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isBlack = (row + col) % 2 === 1;
                const squareGeometry = new THREE.PlaneGeometry(1, 1);
                const squareMaterial = new THREE.MeshPhongMaterial({
                    color: isBlack ? 0x2c1810 : 0xf0d9b5,
                    specular: isBlack ? 0x000000 : 0x444444,
                    shininess: isBlack ? 10 : 30,
                    side: THREE.DoubleSide
                });
                
                const square = new THREE.Mesh(squareGeometry, squareMaterial);
                square.rotation.x = -Math.PI / 2;
                square.position.set(col - 3.5, 0.01, row - 3.5);
                square.receiveShadow = true;
                square.userData = { row, col, isSquare: true };
                boardGroup.add(square);

                // Only add edge labels, not on every square
                if (row === 7 || col === 0) {
                    const labelCanvas = document.createElement('canvas');
                    labelCanvas.width = 64;
                    labelCanvas.height = 64;
                    const ctx = labelCanvas.getContext('2d');
                    ctx.fillStyle = isBlack ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Show column letters on bottom row
                    if (row === 7) {
                        ctx.fillText(String.fromCharCode(65 + col), 32, 50);
                    }
                    // Show row numbers on left column
                    if (col === 0) {
                        ctx.fillText(8 - row, 12, 32);
                    }
                    
                    const labelTexture = new THREE.CanvasTexture(labelCanvas);
                    const labelMaterial = new THREE.MeshBasicMaterial({
                        map: labelTexture,
                        transparent: true,
                        opacity: 0.3
                    });
                    const labelMesh = new THREE.Mesh(squareGeometry, labelMaterial);
                    labelMesh.rotation.x = -Math.PI / 2;
                    labelMesh.position.set(col - 3.5, 0.02, row - 3.5);
                    // Make label mesh non-interactive
                    labelMesh.userData = { isLabel: true };
                    boardGroup.add(labelMesh);
                }
            }
        }

        this.board = boardGroup;
        this.scene.add(boardGroup);
    }

    createPieces() {
        this.clearPieces();

        const pieceGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 32);
        const kingGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 32);
        
        // Get piece colors
        let redColor, blackColor;
        
        if (this.customRedColor && this.customBlackColor) {
            // Use custom colors
            redColor = new THREE.Color(this.customRedColor);
            blackColor = new THREE.Color(this.customBlackColor);
        } else {
            // Use default colors
            redColor = new THREE.Color(0xcc0000);
            blackColor = new THREE.Color(0x1a1a1a);
        }
        
        // Apply saturation adjustment
        if (this.saturationLevel !== 1.0) {
            const hslRed = {};
            const hslBlack = {};
            redColor.getHSL(hslRed);
            blackColor.getHSL(hslBlack);
            hslRed.s *= this.saturationLevel;
            hslBlack.s *= this.saturationLevel;
            redColor.setHSL(hslRed.h, hslRed.s, hslRed.l);
            blackColor.setHSL(hslBlack.h, hslBlack.s, hslBlack.l);
        }
        
        const redMaterial = new THREE.MeshPhongMaterial({
            color: redColor,
            specular: 0xffffff,
            shininess: Math.max(10, this.shininessLevel * 100),
            emissive: redColor.clone().multiplyScalar(0.3),
            emissiveIntensity: 0.2
        });
        
        const blackMaterial = new THREE.MeshPhongMaterial({
            color: blackColor,
            specular: 0xffffff,
            shininess: Math.max(10, this.shininessLevel * 100),
            emissive: blackColor.clone().multiplyScalar(0.3),
            emissiveIntensity: 0.1
        });

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.game.board[row][col];
                if (piece) {
                    const geometry = piece.isKing ? kingGeometry : pieceGeometry;
                    const material = piece.color === 'red' ? redMaterial.clone() : blackMaterial.clone();
                    const mesh = new THREE.Mesh(geometry, material);
                    
                    mesh.position.set(col - 3.5, piece.isKing ? 0.2 : 0.15, row - 3.5);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    mesh.userData = { row, col, piece: true, color: piece.color };

                    if (piece.isKing) {
                        const crownGeometry = new THREE.ConeGeometry(0.15, 0.2, 6);
                        const crownMaterial = new THREE.MeshPhongMaterial({
                            color: 0xffd700,
                            specular: 0xffffff,
                            shininess: 200,
                            emissive: 0xffaa00,
                            emissiveIntensity: 0.3
                        });
                        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
                        crown.position.y = 0.2;
                        crown.rotation.y = Math.PI / 6;
                        mesh.add(crown);
                    }

                    this.pieces.push(mesh);
                    this.scene.add(mesh);
                }
            }
        }
    }

    clearPieces() {
        this.pieces.forEach(piece => {
            this.scene.remove(piece);
        });
        this.pieces = [];
    }

    updateBoard() {
        this.createPieces();
        this.clearValidMoveIndicators();
        this.clearHintHighlights();
        
        // Visual feedback for which pieces can move
        if (this.game.currentPlayer && !this.game.isGameOver) {
            const jumps = this.game.rules.mandatoryCapture ? 
                this.game.getAllJumpsForPlayer(this.game.currentPlayer) : [];
            
            if (jumps.length > 0) {
                // Highlight pieces that MUST jump
                const mustJumpPieces = new Set();
                jumps.forEach(jump => {
                    mustJumpPieces.add(`${jump.from.row},${jump.from.col}`);
                });
                
                this.pieces.forEach(piece => {
                    if (piece && piece.material && piece.userData) {
                        const key = `${piece.userData.row},${piece.userData.col}`;
                        if (mustJumpPieces.has(key)) {
                            // Pieces that must jump - bright glow
                            piece.material.emissiveIntensity = 0.5;
                        } else if (this.game.board[piece.userData.row][piece.userData.col]?.color === this.game.currentPlayer) {
                            // Other pieces of current player - dimmed
                            piece.material.emissiveIntensity = 0.05;
                        }
                        piece.material.needsUpdate = true;
                    }
                });
            } else {
                // No mandatory jumps - show all pieces that can move
                this.pieces.forEach(piece => {
                    if (piece && piece.material && piece.userData) {
                        const boardPiece = this.game.board[piece.userData.row][piece.userData.col];
                        if (boardPiece && boardPiece.color === this.game.currentPlayer) {
                            const moves = this.game.getValidMoves(piece.userData.row, piece.userData.col);
                            piece.material.emissiveIntensity = moves.length > 0 ? 0.25 : 0.05;
                            piece.material.needsUpdate = true;
                        }
                    }
                });
            }
        }
        
        if (this.game.selectedPiece) {
            this.highlightSelectedPiece(this.game.selectedPiece.row, this.game.selectedPiece.col);
            this.showValidMoves(this.game.validMoves);
        }
    }

    highlightSelectedPiece(row, col) {
        const piece = this.pieces.find(p => 
            p.userData.row === row && p.userData.col === col
        );
        
        if (piece) {
            const glowGeometry = new THREE.RingGeometry(0.4, 0.5, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.rotation.x = -Math.PI / 2;
            glow.position.set(col - 3.5, 0.02, row - 3.5);
            this.selectedPieceGlow = glow;
            this.scene.add(glow);

            piece.position.y += 0.3;
        }
    }

    showValidMoves(moves) {
        this.clearValidMoveIndicators();
        
        moves.forEach(move => {
            const indicatorGeometry = new THREE.RingGeometry(0.35, 0.45, 32);
            const indicatorMaterial = new THREE.MeshBasicMaterial({
                color: move.isJump ? 0xff0000 : 0x00ff00,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.rotation.x = -Math.PI / 2;
            indicator.position.set(move.col - 3.5, 0.03, move.row - 3.5);
            
            this.validMoveIndicators.push(indicator);
            this.scene.add(indicator);
        });
    }

    clearValidMoveIndicators() {
        this.validMoveIndicators.forEach(indicator => {
            this.scene.remove(indicator);
        });
        this.validMoveIndicators = [];
        
        if (this.selectedPieceGlow) {
            this.scene.remove(this.selectedPieceGlow);
            this.selectedPieceGlow = null;
        }
    }

    showHintMoves(moves) {
        this.clearHintHighlights();
        
        moves.forEach((move, index) => {
            const fromGeometry = new THREE.RingGeometry(0.3, 0.4, 32);
            const toGeometry = new THREE.RingGeometry(0.35, 0.5, 32);
            const material = new THREE.MeshBasicMaterial({
                color: index === 0 ? 0xffd700 : 0xc0c0c0,
                transparent: true,
                opacity: 0.8 - (index * 0.2),
                side: THREE.DoubleSide
            });
            
            const fromIndicator = new THREE.Mesh(fromGeometry, material);
            fromIndicator.rotation.x = -Math.PI / 2;
            fromIndicator.position.set(move.from.col - 3.5, 0.04, move.from.row - 3.5);
            
            const toIndicator = new THREE.Mesh(toGeometry, material.clone());
            toIndicator.rotation.x = -Math.PI / 2;
            toIndicator.position.set(move.to.col - 3.5, 0.04, move.to.row - 3.5);
            
            const arrowGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
            const arrow = new THREE.Mesh(arrowGeometry, material.clone());
            const midX = (move.from.col + move.to.col) / 2 - 3.5;
            const midZ = (move.from.row + move.to.row) / 2 - 3.5;
            arrow.position.set(midX, 0.3, midZ);
            
            const angle = Math.atan2(
                move.to.row - move.from.row,
                move.to.col - move.from.col
            );
            arrow.rotation.z = -Math.PI / 2;
            arrow.rotation.x = -angle + Math.PI / 2;
            
            this.hintHighlights.push(fromIndicator, toIndicator, arrow);
            this.scene.add(fromIndicator);
            this.scene.add(toIndicator);
            this.scene.add(arrow);
        });
    }

    clearHintHighlights() {
        this.hintHighlights.forEach(highlight => {
            this.scene.remove(highlight);
        });
        this.hintHighlights = [];
    }

    animateMove(from, to, callback) {
        const piece = this.pieces.find(p => 
            p.userData.row === from.row && p.userData.col === from.col
        );
        
        if (!piece) {
            if (callback) callback();
            return;
        }

        const startPos = new THREE.Vector3(from.col - 3.5, piece.position.y, from.row - 3.5);
        const endPos = new THREE.Vector3(to.col - 3.5, piece.position.y, to.row - 3.5);
        const midPos = startPos.clone().lerp(endPos, 0.5);
        midPos.y += 1;

        const duration = 500;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = this.easeInOutQuad(progress);
            
            if (progress < 0.5) {
                const subProgress = easeProgress * 2;
                piece.position.lerpVectors(startPos, midPos, subProgress);
            } else {
                const subProgress = (easeProgress - 0.5) * 2;
                piece.position.lerpVectors(midPos, endPos, subProgress);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                piece.userData.row = to.row;
                piece.userData.col = to.col;
                if (callback) callback();
            }
        };

        animate();
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', this.onMouseClick.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onMouseClick(event) {
        if (this.game.isGameOver) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Get all objects to check, including children of the board group
        const objectsToCheck = [];
        this.scene.traverse((child) => {
            if (child.isMesh) {
                objectsToCheck.push(child);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(objectsToCheck, false);

        // Sort intersects by distance to get the closest object
        intersects.sort((a, b) => a.distance - b.distance);
        
        // First check if we clicked on a piece directly
        for (const intersect of intersects) {
            const object = intersect.object;
            // Skip label meshes
            if (object.userData && object.userData.isLabel) {
                continue;
            }
            // Check if it's a piece
            if (object.userData && object.userData.piece) {
                const { row, col } = object.userData;
                if (this.onSquareClick) {
                    this.onSquareClick(row, col);
                }
                return;
            }
        }
        
        // If no piece was clicked, check for squares
        for (const intersect of intersects) {
            const object = intersect.object;
            // Skip label meshes
            if (object.userData && object.userData.isLabel) {
                continue;
            }
            // Check for clickable squares
            if (object.userData && object.userData.isSquare) {
                const { row, col } = object.userData;
                if (this.onSquareClick) {
                    this.onSquareClick(row, col);
                }
                break;
            }
        }
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Get all objects to check, including children of the board group
        const objectsToCheck = [];
        this.scene.traverse((child) => {
            if (child.isMesh) {
                objectsToCheck.push(child);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(objectsToCheck, false);

        this.canvas.style.cursor = 'default';
        // Sort intersects by distance
        intersects.sort((a, b) => a.distance - b.distance);
        
        for (const intersect of intersects) {
            const object = intersect.object;
            // Skip label meshes
            if (object.userData && object.userData.isLabel) {
                continue;
            }
            if (object.userData && (object.userData.isSquare || object.userData.piece)) {
                this.canvas.style.cursor = 'pointer';
                break;
            }
        }
    }

    onWindowResize() {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }

    setCameraView(view) {
        const duration = 1000;
        const startPos = this.camera.position.clone();
        const startRot = this.camera.rotation.clone();
        
        let targetPos, targetLookAt;
        
        switch(view) {
            case 'top':
                targetPos = new THREE.Vector3(0, 15, 0.1);
                targetLookAt = new THREE.Vector3(0, 0, 0);
                break;
            case 'side':
                targetPos = new THREE.Vector3(15, 8, 0);
                targetLookAt = new THREE.Vector3(0, 0, 0);
                break;
            case 'player-red':
                // Red player sits at bottom (positive Z) - default view
                targetPos = new THREE.Vector3(0, 12, 12);
                targetLookAt = new THREE.Vector3(0, 0, 0);
                break;
            case 'player-black':
                // Black player sits at top (negative Z) - flipped view
                targetPos = new THREE.Vector3(0, 12, -12);
                targetLookAt = new THREE.Vector3(0, 0, 0);
                break;
            case 'perspective':
            default:
                targetPos = new THREE.Vector3(0, 12, 12);
                targetLookAt = new THREE.Vector3(0, 0, 0);
                break;
        }

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeInOutQuad(progress);

            this.camera.position.lerpVectors(startPos, targetPos, easeProgress);
            this.camera.lookAt(targetLookAt);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    startAutoRotate() {
        this.isRotating = !this.isRotating;
        if (this.isRotating) {
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 2;
        } else {
            this.controls.autoRotate = false;
        }
    }
    
    setCustomColors(redHex, blackHex) {
        this.customRedColor = redHex;
        this.customBlackColor = blackHex;
        // Re-create pieces with new colors
        this.createPieces();
    }
    
    updateShininess(level) {
        this.shininessLevel = level;
        // Update all piece materials
        this.pieces.forEach(piece => {
            if (piece && piece.material) {
                piece.material.shininess = Math.max(10, level * 100);
                piece.material.needsUpdate = true;
            }
        });
    }
    
    updateSaturation(level) {
        this.saturationLevel = level;
        // Recreate pieces with new saturation
        this.createPieces();
    }
    
    updateBoardReflection(level) {
        // Update board material shininess
        if (this.boardMaterial) {
            this.boardMaterial.shininess = Math.max(5, level * 50);
            this.boardMaterial.needsUpdate = true;
        }
        
        // Also update square materials
        if (this.board) {
            this.board.traverse((child) => {
                if (child.isMesh && child.material && child.material.shininess !== undefined) {
                    child.material.shininess = Math.max(5, level * 30);
                    child.material.needsUpdate = true;
                }
            });
        }
    }
    
    
    updateBrightness(brightness) {
        // Update light intensities
        if (this.ambientLight) {
            this.ambientLight.intensity = 0.4 * brightness;
        }
        if (this.mainLight) {
            this.mainLight.intensity = 0.8 * brightness;
        }
        if (this.rimLight) {
            this.rimLight.intensity = 0.3 * brightness;
        }
        if (this.pointLight) {
            this.pointLight.intensity = 0.5 * brightness;
        }
        
        // Update tone mapping exposure
        this.renderer.toneMappingExposure = 1.2 * brightness;
    }
    

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.controls.update();
        
        this.validMoveIndicators.forEach((indicator, index) => {
            indicator.material.opacity = 0.4 + Math.sin(Date.now() * 0.003 + index) * 0.2;
        });
        
        if (this.selectedPieceGlow) {
            this.selectedPieceGlow.material.opacity = 0.6 + Math.sin(Date.now() * 0.005) * 0.3;
        }
        
        this.hintHighlights.forEach((highlight, index) => {
            if (highlight.material) {
                highlight.material.opacity = 0.5 + Math.sin(Date.now() * 0.004 + index) * 0.3;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}