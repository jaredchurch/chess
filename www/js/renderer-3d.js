// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// 3D Renderer Module - Three.js-based chess board with procedural low-poly pieces.
// Provides scene management, piece placement from FEN, and click interaction.
// Supports loading GLTF models when placed in www/models/.
//

import * as THREE from 'three';
import { skinRegistry } from './skins.js';
import { buildPawn as buildPawnClassic } from './skins/classic/3d/pawn.js';
import { buildRook as buildRookClassic } from './skins/classic/3d/rook.js';
import { buildKnight as buildKnightClassic } from './skins/classic/3d/knight.js';
import { buildBishop as buildBishopClassic } from './skins/classic/3d/bishop.js';
import { buildQueen as buildQueenClassic } from './skins/classic/3d/queen.js';
import { buildKing as buildKingClassic } from './skins/classic/3d/king.js';
import { buildPawn as buildPawnClassic2 } from './skins/classic2/3d/pawn.js';
import { buildRook as buildRookClassic2 } from './skins/classic2/3d/rook.js';
import { buildKnight as buildKnightClassic2 } from './skins/classic2/3d/knight.js';
import { buildBishop as buildBishopClassic2 } from './skins/classic2/3d/bishop.js';
import { buildQueen as buildQueenClassic2 } from './skins/classic2/3d/queen.js';
import { buildKing as buildKingClassic2 } from './skins/classic2/3d/king.js';

const WHITE_MAT = { color: 0xf0f0f0, roughness: 0.25, metalness: 0.05 };
const BLACK_MAT = { color: 0x333333, roughness: 0.45, metalness: 0.1  };

export class ChessRenderer3D {

    constructor() {
        // Initialize with placeholder values - will be properly set in init()
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Initialize light and board properties (will be set up in init())
        this._viewMode = 'full';
        this._singlePieceGroup = null;
        this.boardColors = { light: 0xf0d9b5, dark: 0xb58863 };

        // Drag and zoom controls state
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this._controlsEnabled = false;
        this._isDragging = false;
        this._wasDrag = false;
        this._pointerDown = false;
        this._previousMousePosition = { x: 0, y: 0 };
    }

    /**
     * Initialize the renderer with a container DOM element.
     * @param {HTMLElement} container - The DOM element to render into
     */
    init(container) {
        this.container = container;

        // Set up the scene with proper aspect ratio
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 600;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2c3e50);

        this.camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);
        this.camera.position.set(0, 11.8, 16.5); // position x, y, z
        this.camera.lookAt(0, 0, 0);
        this.camera.updateMatrixWorld(true);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Setup lights, board, and pieces
        this._setupLights();
        this._setupBoard();
        this._setupPieceGroups();

        // Frame the board appropriately
        this._frameBoard();

        // Set up click handling
        this.renderer.domElement.addEventListener('click', (e) => this._onClick(e));

        // Set up resize observer
        const ro = new ResizeObserver(() => this.resize());
        ro.observe(container);
        this._resizeObserver = ro;

        // Bind drag and zoom event listeners
        this._bindDragZoomHandlers();

        // Start animation loop
        this._animate();

        return this;
    }

    setBoardColors(light, dark) {
        this.boardColors = { light, dark };
        this._rebuildBoard();
    }

    _setFileLabelsBySide(side) {
        // Toggle file labels visibility so only the ones closest to camera are shown
        // When side is 'white', bottom labels (z=5.0) are close, top labels (z=-5.0) are far.
        // When side is 'black', the board is rotated 180 deg, so bottom labels (z=5.0 relative to board)
        // are now at z=-5.0 in world space, and top labels are at z=5.0 in world space.
        const showBottom = (side === 'white');
        this.fileLabelsBottom.forEach(l => l.visible = showBottom);
        this.fileLabelsTop.forEach(l => l.visible = !showBottom);
    }

    _setupBoard() {
        this._boardWrap = new THREE.Group();
        this.scene.add(this._boardWrap);
        this._createBoard();
    }

    _setupPieceGroups() {
        this.pieceGroup = new THREE.Group();
        this._boardWrap.add(this.pieceGroup);
    }

    _setupLights() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(this.ambientLight);
        this.mainLight = new THREE.DirectionalLight(0xffffff, 2.95);
        this.mainLight.position.set(5, 15, 10);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 30;
        this.mainLight.shadow.camera.left = -8;
        this.mainLight.shadow.camera.right = 8;
        this.mainLight.shadow.camera.top = 8;
        this.mainLight.shadow.camera.bottom = -8;
        this.mainLight.shadow.bias = -0.001;
        this.scene.add(this.mainLight);
        this.fillLight = new THREE.DirectionalLight(0x8888cc, 0.3);
        this.fillLight.position.set(-3, 5, -5);
        this.scene.add(this.fillLight);
    }

    _createBoard() {
        if (this.boardGroup) {
            this._boardWrap.remove(this.boardGroup);
            this._disposeGroup(this.boardGroup);
        }
        this.boardGroup = new THREE.Group();
        this._boardWrap.add(this.boardGroup);
        
        this.squareMeshes = [];
        this.squareMap = {};

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const isLight = (r + f) % 2 !== 0;
                const color = isLight ? this.boardColors.light : this.boardColors.dark;
                const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0 });
                const geo = new THREE.BoxGeometry(1, 0.04, 1);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(f - 3.5, 0, -(r - 3.5));
                mesh.receiveShadow = true;
                mesh.userData.square = String.fromCharCode(97 + f) + (r + 1);
                this.boardGroup.add(mesh);
                this.squareMeshes.push(mesh);
                this.squareMap[mesh.userData.square] = mesh;
            }
        }

        const bMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.8, metalness: 0 });
        const bGeo = new THREE.BoxGeometry(8.6, 0.12, 8.6);
        const border = new THREE.Mesh(bGeo, bMat);
        border.position.set(0, -0.08, 0);
        border.receiveShadow = true;
        this.boardGroup.add(border);

        this._createLabels();
    }

    _makeLabelSprite(text) {
        // Guard for Node.js test environment where document is not defined
        if (typeof document === 'undefined') {
            const mat = new THREE.SpriteMaterial({ color: 0xffffff });
            return new THREE.Sprite(mat);
        }
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#95a5a6';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 34);
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        return new THREE.Sprite(mat);
    }

    _createLabels() {
        const files = ['a','b','c','d','e','f','g','h'];
        const ranks = [1,2,3,4,5,6,7,8];

        this.fileLabelsBottom = [];
        this.fileLabelsTop = [];

        // Files along bottom (z = 5.0, near Rank 1) and top (z = -5.0, near Rank 8)
        for (let f = 0; f < 8; f++) {
            const x = f - 3.5;
            const bottom = this._makeLabelSprite(files[f]);
            bottom.position.set(x, 0.05, 5.0);
            this.boardGroup.add(bottom);
            this.fileLabelsBottom.push(bottom);

            const top = this._makeLabelSprite(files[f]);
            top.position.set(x, 0.05, -5.0);
            this.boardGroup.add(top);
            this.fileLabelsTop.push(top);
        }

        // Ranks along left (x = -4.5) and right (x = 4.5)
        for (let r = 0; r < 8; r++) {
            const z = -(r - 3.5);
            const left = this._makeLabelSprite(ranks[r].toString());
            left.position.set(-4.5, 0.05, z);
            this.boardGroup.add(left);
            const right = this._makeLabelSprite(ranks[r].toString());
            right.position.set(4.5, 0.05, z);
            this.boardGroup.add(right);
        }
    }

    highlightSquare(sq, on) {
        const mesh = this.squareMap[sq];
        if (!mesh) return;
        if (on) {
            mesh.material.color.setHex(0xf1c40f);
        } else {
            const f = sq.charCodeAt(0) - 97;
            const r = parseInt(sq[1]) - 1;
            const isLight = (r + f) % 2 !== 0;
            mesh.material.color.setHex(isLight ? this.boardColors.light : this.boardColors.dark);
        }
    }

    _frameBoard() {
        this.camera.updateMatrixWorld(true);
        const margin = 1.4;
        const pts = [
            [-3.5, 0, -3.5], [3.5, 0, -3.5],
            [-3.5, 0, 3.5],  [3.5, 0, 3.5],
        ];
        const ndc = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]).project(this.camera));
        const minY = Math.min(...ndc.map(v => v.y));
        const maxY = Math.max(...ndc.map(v => v.y));
        const minX = Math.min(...ndc.map(v => v.x));
        const maxX = Math.max(...ndc.map(v => v.x));

        const halfVert = this.camera.fov * Math.PI / 180 / 2;
        const tanHalf = Math.tan(halfVert);

        const fovY = 2 * Math.atan(tanHalf * (maxY - minY) / 2) * 180 / Math.PI;
        const fovX = 2 * Math.atan(tanHalf * (maxX - minX) / 2) * 180 / Math.PI;

        this.camera.fov = Math.max(fovY, fovX) * margin;
        this.camera.updateProjectionMatrix();
    }

    _rebuildBoard() {
        this._createBoard();
    }

    // ---- Low-poly piece builders (delegated to skins/classic/3d/ or skins/classic2/3d/) ----

    _buildPawn(group, mat) {
        const activeSkinId = skinRegistry.getActive()?.id || 'classic';
        if (activeSkinId === 'classic2') {
            buildPawnClassic2(group, mat);
        } else {
            buildPawnClassic(group, mat);
        }
    }
    _buildRook(group, mat) {
        const activeSkinId = skinRegistry.getActive()?.id || 'classic';
        if (activeSkinId === 'classic2') {
            buildRookClassic2(group, mat);
        } else {
            buildRookClassic(group, mat);
        }
    }
    _buildKnight(group, mat) {
        const activeSkinId = skinRegistry.getActive()?.id || 'classic';
        if (activeSkinId === 'classic2') {
            buildKnightClassic2(group, mat);
        } else {
            buildKnightClassic(group, mat);
        }
    }
    _buildBishop(group, mat) {
        const activeSkinId = skinRegistry.getActive()?.id || 'classic';
        if (activeSkinId === 'classic2') {
            buildBishopClassic2(group, mat);
        } else {
            buildBishopClassic(group, mat);
        }
    }
    _buildQueen(group, mat) {
        const activeSkinId = skinRegistry.getActive()?.id || 'classic';
        if (activeSkinId === 'classic2') {
            buildQueenClassic2(group, mat);
        } else {
            buildQueenClassic(group, mat);
        }
    }
    _buildKing(group, mat) {
        const activeSkinId = skinRegistry.getActive()?.id || 'classic';
        if (activeSkinId === 'classic2') {
            buildKingClassic2(group, mat);
        } else {
            buildKingClassic(group, mat);
        }
    }

    // ---- Public API ----

    setPosition(fen) {
        if (!fen) return;
        // Clear all square highlights before rebuilding
        for (const mesh of this.squareMeshes) {
            const sq = mesh.userData.square;
            const f = sq.charCodeAt(0) - 97;
            const r = parseInt(sq[1]) - 1;
            const isLight = (r + f) % 2 !== 0;
            mesh.material.color.setHex(isLight ? this.boardColors.light : this.boardColors.dark);
        }

        this._clearPieces();
        this.piecesMap = {};

        const pieces = {};
        let rank = 7, file = 0;
        for (const ch of fen.split(' ')[0]) {
            if (ch === '/') { rank--; file = 0; }
            else if (ch >= '1' && ch <= '8') { file += parseInt(ch); }
            else { pieces[String.fromCharCode(97 + file) + (rank + 1)] = ch; file++; }
        }

        for (const [sq, ch] of Object.entries(pieces)) {
            const isWhite = ch === ch.toUpperCase();
            const opts = isWhite ? WHITE_MAT : BLACK_MAT;
            const mat = new THREE.MeshStandardMaterial({ ...opts, flatShading: true });
            const grp = new THREE.Group();
            const type = ch.toUpperCase();
            const builders = {
                P: (grp, mat) => this._buildPawn(grp, mat),
                R: (grp, mat) => this._buildRook(grp, mat),
                N: (grp, mat) => this._buildKnight(grp, mat),
                B: (grp, mat) => this._buildBishop(grp, mat),
                Q: (grp, mat) => this._buildQueen(grp, mat),
                K: (grp, mat) => this._buildKing(grp, mat),
            };
            (builders[type] || builders.P)(grp, mat);
            grp.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

            const pos = this._squareToPos(sq);
            grp.position.set(pos.x, 0, pos.z);
            this.pieceGroup.add(grp);
            this.piecesMap[sq] = grp;
        }
    }

    _clearPieces() {
        for (const child of this.pieceGroup.children) {
            this._disposeGroup(child);
        }
        while (this.pieceGroup.children.length) {
            this.pieceGroup.remove(this.pieceGroup.children[0]);
        }
    }

    setOrientation(side) {
        this._boardWrap.rotation.y = (side === 'black') ? Math.PI : 0;
        this._setFileLabelsBySide(side);
    }

    setViewMode(mode) {
        this._viewMode = mode;
        const showBoard = mode === 'full' || mode === 'board';
        const showPieces = mode === 'full';
        const showSingle = mode === 'piece';
        if (this.boardGroup) this.boardGroup.visible = showBoard;
        if (this.pieceGroup) this.pieceGroup.visible = showPieces;
        if (this._singlePieceGroup) this._singlePieceGroup.visible = showSingle;
    }

    setSinglePiece(type, color) {
        const typeUpper = type.toUpperCase();
        if (!this._singlePieceGroup) {
            this._singlePieceGroup = new THREE.Group();
            this._boardWrap.add(this._singlePieceGroup);
        }
        while (this._singlePieceGroup.children.length) {
            const child = this._singlePieceGroup.children[0];
            this._disposeGroup(child);
            this._singlePieceGroup.remove(child);
        }
        const isWhite = color === 'white';
        const opts = isWhite ? WHITE_MAT : BLACK_MAT;
        const mat = new THREE.MeshStandardMaterial({ ...opts, flatShading: true });
        const grp = new THREE.Group();
        const builders = {
            P: (grp, mat) => this._buildPawn(grp, mat),
            R: (grp, mat) => this._buildRook(grp, mat),
            N: (grp, mat) => this._buildKnight(grp, mat),
            B: (grp, mat) => this._buildBishop(grp, mat),
            Q: (grp, mat) => this._buildQueen(grp, mat),
            K: (grp, mat) => this._buildKing(grp, mat),
        };
        (builders[typeUpper] || buildPawn)(grp, mat);
        grp.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
        const box = new THREE.Box3().setFromObject(grp);
        const center = box.getCenter(new THREE.Vector3());
        grp.position.sub(center);
        this._singlePieceGroup.add(grp);
    }

    setCameraPosition(x, y, z) {
        this._manualCamera = true;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
    }

    setCameraFov(fov) {
        this._manualCamera = true;
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }

    resetCamera() {
        this._manualCamera = false;
        const isPiece = this._viewMode === 'piece';
        this.camera.position.set(0, isPiece ? 4 : 11.8, isPiece ? 5 : 16.5);
        this.camera.lookAt(0, 0, 0);
        this.camera.fov = isPiece ? 29 : 28;
        this.camera.updateProjectionMatrix();
        this._boardWrap.rotation.set(0, 0, 0);
        // Only auto-frame the board in full/board mode — in piece mode
        // there is no board visible and the close camera would produce
        // an extreme FOV from projecting empty board corners
        if (!isPiece) this._frameBoard();
    }

    getCameraPosition() {
        return {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z,
            fov: this.camera.fov,
        };
    }

    setMainLightPosition(x, y, z) {
        if (this.mainLight) this.mainLight.position.set(x, y, z);
    }

    setMainLightIntensity(intensity) {
        if (this.mainLight) this.mainLight.intensity = intensity;
    }

    setAmbientIntensity(intensity) {
        if (this.ambientLight) this.ambientLight.intensity = intensity;
    }

    getLightState() {
        return {
            mainX: this.mainLight ? this.mainLight.position.x : 5,
            mainY: this.mainLight ? this.mainLight.position.y : 15,
            mainZ: this.mainLight ? this.mainLight.position.z : 10,
            mainIntensity: this.mainLight ? this.mainLight.intensity : 2.95,
            ambientIntensity: this.ambientLight ? this.ambientLight.intensity : 0.3,
        };
    }

    setSelection(sq) {
        if (this.selectedSquare) this.highlightSquare(this.selectedSquare, false);
        this.selectedSquare = sq;
        if (sq) this.highlightSquare(sq, true);
    }

    _squareToPos(sq) {
        return {
            x: (sq.charCodeAt(0) - 97) - 3.5,
            z: -(parseInt(sq[1]) - 1 - 3.5),
        };
    }

    _onClick(event) {
        if (this._wasDrag) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const hits = this.raycaster.intersectObjects(this.squareMeshes);
        if (hits.length > 0) {
            const sq = hits[0].object.userData.square;
            if (this.onSquareClick) this.onSquareClick(sq);
        }
    }

    resize() {
        if (!this.container || !this.renderer || this._disposed) return;

        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        if (w === 0 || h === 0) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        if (!this._manualCamera) this._frameBoard();
    }

    _animate() {
        if (this._disposed) return;
        requestAnimationFrame(() => this._animate());
        this.renderer.render(this.scene, this.camera);
    }

    _disposeGroup(obj) {
        if (!obj) return;
        obj.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else if (child.material) {
                    child.material.dispose();
                }
            }
        });
    }

    // Drag and zoom controls
    _bindDragZoomHandlers() {
        // Bind methods to maintain correct 'this' context
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onWheel = this._onWheel.bind(this);

        // Add event listeners
        this.container.addEventListener('mousedown', this._onMouseDown);
        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('mouseup', this._onMouseUp);
        this.container.addEventListener('mouseleave', this._onMouseLeave);
        this.container.addEventListener('touchstart', this._onTouchStart);
        this.container.addEventListener('touchmove', this._onTouchMove);
        this.container.addEventListener('touchend', this._onTouchEnd);
        this.container.addEventListener('wheel', this._onWheel);
    }

    _onMouseDown(event) {
        if (!this._controlsEnabled) return;
        this._wasDrag = false;
        this._pointerDown = true;
        this._isDragging = false;
        this._previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    _onMouseMove(event) {
        if (!this._controlsEnabled || !this._pointerDown) return;
        if (!this._isDragging) {
            const dx = event.clientX - this._previousMousePosition.x;
            const dy = event.clientY - this._previousMousePosition.y;
            if (dx * dx + dy * dy < 16) return;
            this._isDragging = true;
            this._wasDrag = true;
            this.container.style.cursor = 'grabbing';
        }
        const deltaMove = {
            x: event.clientX - this._previousMousePosition.x,
            y: event.clientY - this._previousMousePosition.y
        };
        
        const rotSpeed = 0.005;
        if (this._boardWrap) {
            this._boardWrap.rotation.y += deltaMove.x * rotSpeed;
            this._boardWrap.rotation.x += deltaMove.y * rotSpeed;
            
            const maxVert = Math.PI / 2;
            this._boardWrap.rotation.x = Math.max(
                -maxVert,
                Math.min(maxVert, this._boardWrap.rotation.x)
            );
        }
        this._previousMousePosition = { x: event.clientX, y: event.clientY };
    }

    _onMouseUp() {
        if (!this._controlsEnabled) return;
        this._isDragging = false;
        this._pointerDown = false;
        this.container.style.cursor = 'grab';
    }

    _onMouseLeave() {
        if (!this._controlsEnabled) return;
        this._isDragging = false;
        this._pointerDown = false;
        this.container.style.cursor = 'grab';
    }

    _onTouchStart(event) {
        if (!this._controlsEnabled) return;
        if (event.touches.length === 1) {
            this._wasDrag = false;
            this._pointerDown = true;
            this._isDragging = false;
            this._previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }

    _onTouchMove(event) {
        if (!this._controlsEnabled || !this._pointerDown || event.touches.length !== 1) return;
        if (!this._isDragging) {
            const dx = event.touches[0].clientX - this._previousMousePosition.x;
            const dy = event.touches[0].clientY - this._previousMousePosition.y;
            if (dx * dx + dy * dy < 16) return;
            this._isDragging = true;
            this._wasDrag = true;
            this.container.style.cursor = 'grabbing';
        }
        const deltaMove = {
            x: event.touches[0].clientX - this._previousMousePosition.x,
            y: event.touches[0].clientY - this._previousMousePosition.y
        };
        
        const rotSpeed = 0.005;
        if (this._boardWrap) {
            this._boardWrap.rotation.y += deltaMove.x * rotSpeed;
            this._boardWrap.rotation.x += deltaMove.y * rotSpeed;
            
            const maxVert = Math.PI / 2;
            this._boardWrap.rotation.x = Math.max(
                -maxVert,
                Math.min(maxVert, this._boardWrap.rotation.x)
            );
        }
        this._previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }

    _onTouchEnd() {
        if (!this._controlsEnabled) return;
        this._isDragging = false;
        this._pointerDown = false;
        this.container.style.cursor = 'grab';
    }

    _onWheel(event) {
        if (!this._controlsEnabled) return;
        event.preventDefault();
        
        const zoomSpeed = 0.001;
        const distance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        const zoomAmount = event.deltaY * zoomSpeed;
        const direction = new THREE.Vector3()
            .subVectors(this.camera.position, new THREE.Vector3(0, 0, 0))
            .normalize();
        const newDistance = Math.max(5, Math.min(30, distance + zoomAmount));
        this.camera.position.copy(new THREE.Vector3(0, 0, 0)).add(direction.multiplyScalar(newDistance));
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
    }

    enableControls() {
        this._controlsEnabled = true;
        this.container.style.cursor = 'grab';
    }

    disableControls() {
        this._controlsEnabled = false;
        this._isDragging = false;
        this.container.style.cursor = 'default';
    }

    dispose() {
        // Remove event listeners
        this.container.removeEventListener('mousedown', this._onMouseDown);
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('mouseup', this._onMouseUp);
        this.container.removeEventListener('mouseleave', this._onMouseLeave);
        this.container.removeEventListener('touchstart', this._onTouchStart);
        this.container.removeEventListener('touchmove', this._onTouchMove);
        this.container.removeEventListener('touchend', this._onTouchEnd);
        this.container.removeEventListener('wheel', this._onWheel);

        this._disposed = true;
        this._disposeGroup(this.boardGroup);
        this._disposeGroup(this.pieceGroup);
        this._disposeGroup(this._singlePieceGroup);
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (this.renderer) this.renderer.dispose();
        if (this.container && this.renderer && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

export function createRenderer(container) {
    const r = new ChessRenderer3D();
    r.init(container);
    return r;
}
