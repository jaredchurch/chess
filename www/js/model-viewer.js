// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// 3D Model Viewer - Controls and interactions for the 3D model viewer page.
// Provides view mode switching (full/board/piece), single piece selection,
// and camera position controls.
//

import * as THREE from 'three';
import { skinRegistry, switchSkin, initializeSkin } from './skins.js';
import { renderBoard3d } from './board.js';

function setupViewerControls() {
    const renderer = window._chessRenderer;
    if (!renderer) return;

    const viewModeBtns = document.querySelectorAll('.view-mode-btn');
    function switchViewMode(mode) {
        viewModeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        document.getElementById('piece-controls').style.display = mode === 'piece' ? '' : 'none';
        renderer.setViewMode(mode);
        renderer.resetCamera();
        syncCameraSliders();
        if (mode === 'piece') {
            updateSinglePiece();
        }
        saveViewerState();
    }
    viewModeBtns.forEach(btn => {
        btn.addEventListener('click', () => switchViewMode(btn.dataset.mode));
    });

    const pieceType = document.getElementById('piece-type');
    const pieceColor = document.getElementById('piece-color');
    function updateSinglePiece() {
        renderer.setSinglePiece(pieceType.value, pieceColor.value);
        saveViewerState();
    }
    pieceType.addEventListener('change', updateSinglePiece);
    pieceColor.addEventListener('change', updateSinglePiece);

    const camX = document.getElementById('cam-x');
    const camY = document.getElementById('cam-y');
    const camZ = document.getElementById('cam-z');
    const camFov = document.getElementById('cam-fov');

    function onCamSlider() {
        const x = parseFloat(camX.value);
        const y = parseFloat(camY.value);
        const z = parseFloat(camZ.value);
        const fov = parseFloat(camFov.value);
        renderer.setCameraPosition(x, y, z);
        renderer.setCameraFov(fov);
        syncCameraSliders();
        saveViewerState();
    }

    camX.addEventListener('input', onCamSlider);
    camY.addEventListener('input', onCamSlider);
    camZ.addEventListener('input', onCamSlider);
    camFov.addEventListener('input', onCamSlider);

    document.getElementById('reset-camera').addEventListener('click', () => {
        renderer.resetCamera();
        syncCameraSliders();
        saveViewerState();
    });

    renderer.resetCamera();
    syncCameraSliders();
    renderer.setSinglePiece(pieceType.value, pieceColor.value);
}

function setupLightControls() {
    const renderer = window._chessRenderer;
    if (!renderer) return;

    const lx = document.getElementById('light-x');
    const ly = document.getElementById('light-y');
    const lz = document.getElementById('light-z');
    const li = document.getElementById('light-intensity');
    const ai = document.getElementById('ambient-intensity');

    function onLightSlider() {
        renderer.setMainLightPosition(
            parseFloat(lx.value), parseFloat(ly.value), parseFloat(lz.value)
        );
        renderer.setMainLightIntensity(parseFloat(li.value));
        renderer.setAmbientIntensity(parseFloat(ai.value));
        syncLightSliders();
        saveViewerState();
    }

    lx.addEventListener('input', onLightSlider);
    ly.addEventListener('input', onLightSlider);
    lz.addEventListener('input', onLightSlider);
    li.addEventListener('input', onLightSlider);
    ai.addEventListener('input', onLightSlider);

    document.getElementById('reset-lighting').addEventListener('click', resetLighting);

    syncLightSliders();
}

let _skinSelectInitialized = false;

function initSkinSelect() {
    const skinSelect = document.getElementById('skin-select');
    if (!skinSelect) {
        setTimeout(() => {
            const retry = document.getElementById('skin-select');
            if (retry) initSkinSelect();
        }, 100);
        return;
    }
    if (_skinSelectInitialized) return;
    _skinSelectInitialized = true;

    skinSelect.innerHTML = skinRegistry.getAll()
        .filter(s => s.supports3d)
        .map(skin =>
            `<option value="${skin.id}">${skin.name}</option>`
        ).join('');

    const activeSkin = skinRegistry.getActive();
    skinSelect.value = activeSkin ? activeSkin.id : 'classic';

    skinSelect.addEventListener('change', () => {
        const skinId = skinSelect.value;
        if (switchSkin(skinId)) {
            window.renderBoard();
        }
    });
}

function updateSkinSelect() {
    const skinSelect = document.getElementById('skin-select');
    if (!skinSelect) return;
    const activeSkin = skinRegistry.getActive();
    skinSelect.value = activeSkin ? activeSkin.id : 'classic';
}

function setupDragControls() {
    const rendererDiv = document.getElementById('renderer-3d-container');
    if (!rendererDiv) return;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    rendererDiv.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        rendererDiv.style.cursor = 'grabbing';
    });

    rendererDiv.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };
        if (window._chessRenderer) {
            const rotSpeed = 0.005;
            window._chessRenderer._boardWrap.rotation.y += deltaMove.x * rotSpeed;
            window._chessRenderer._boardWrap.rotation.x += deltaMove.y * rotSpeed;
            const maxVert = Math.PI / 2;
            window._chessRenderer._boardWrap.rotation.x = Math.max(
                -maxVert,
                Math.min(maxVert, window._chessRenderer._boardWrap.rotation.x)
            );
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    rendererDiv.addEventListener('mouseup', () => {
        isDragging = false;
        rendererDiv.style.cursor = 'grab';
    });

    rendererDiv.addEventListener('mouseleave', () => {
        isDragging = false;
        rendererDiv.style.cursor = 'grab';
    });

    rendererDiv.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            rendererDiv.style.cursor = 'grabbing';
        }
    });

    rendererDiv.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };
        if (window._chessRenderer) {
            const rotSpeed = 0.005;
            window._chessRenderer._boardWrap.rotation.y += deltaMove.x * rotSpeed;
            window._chessRenderer._boardWrap.rotation.x += deltaMove.y * rotSpeed;
            const maxVert = Math.PI / 2;
            window._chessRenderer._boardWrap.rotation.x = Math.max(
                -maxVert,
                Math.min(maxVert, window._chessRenderer._boardWrap.rotation.x)
            );
        }
        previousMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    });

    rendererDiv.addEventListener('touchend', () => {
        isDragging = false;
        rendererDiv.style.cursor = 'grab';
    });

    rendererDiv.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (window._chessRenderer) {
            const zoomSpeed = 0.001;
            const cam = window._chessRenderer.camera;
            const distance = cam.position.distanceTo(new THREE.Vector3(0, 0, 0));
            const zoomAmount = e.deltaY * zoomSpeed;
            const direction = new THREE.Vector3()
                .subVectors(cam.position, new THREE.Vector3(0, 0, 0))
                .normalize();
            const newDistance = Math.max(5, Math.min(30, distance + zoomAmount));
            cam.position.copy(new THREE.Vector3(0, 0, 0)).add(direction.multiplyScalar(newDistance));
            cam.lookAt(0, 0, 0);
            cam.updateProjectionMatrix();
        }
    });
}

const VIEWER_STATE_KEY = 'chess_3d_viewer_state';

function syncCameraSliders() {
    const r = window._chessRenderer;
    if (!r) return;
    const pos = r.getCameraPosition();
    const el = id => document.getElementById(id);
    el('cam-x').value = pos.x.toFixed(1);
    el('cam-y').value = pos.y.toFixed(1);
    el('cam-z').value = pos.z.toFixed(1);
    el('cam-fov').value = Math.round(pos.fov);
    el('cam-x-val').textContent = pos.x.toFixed(1);
    el('cam-y-val').textContent = pos.y.toFixed(1);
    el('cam-z-val').textContent = pos.z.toFixed(1);
    el('cam-fov-val').textContent = Math.round(pos.fov);
}

function syncLightSliders() {
    const r = window._chessRenderer;
    if (!r) return;
    const s = r.getLightState();
    const el = id => document.getElementById(id);
    el('light-x').value = s.mainX.toFixed(1);
    el('light-y').value = s.mainY.toFixed(1);
    el('light-z').value = s.mainZ.toFixed(1);
    el('light-intensity').value = s.mainIntensity.toFixed(2);
    el('ambient-intensity').value = s.ambientIntensity.toFixed(2);
    el('light-x-val').textContent = s.mainX.toFixed(1);
    el('light-y-val').textContent = s.mainY.toFixed(1);
    el('light-z-val').textContent = s.mainZ.toFixed(1);
    el('light-intensity-val').textContent = s.mainIntensity.toFixed(2);
    el('ambient-intensity-val').textContent = s.ambientIntensity.toFixed(2);
}

function saveViewerState() {
    const r = window._chessRenderer;
    if (!r) return;
    const pos = r.getCameraPosition();
    const light = r.getLightState();
    const state = {
        skinId: skinRegistry.getActive()?.id || 'classic',
        viewMode: r._viewMode,
        cameraX: pos.x, cameraY: pos.y, cameraZ: pos.z, cameraFov: pos.fov,
        lightX: light.mainX, lightY: light.mainY, lightZ: light.mainZ,
        lightIntensity: light.mainIntensity, ambientIntensity: light.ambientIntensity,
        pieceType: document.getElementById('piece-type')?.value || 'K',
        pieceColor: document.getElementById('piece-color')?.value || 'white',
        boardRotation: r._boardWrap ? { x: r._boardWrap.rotation.x, y: r._boardWrap.rotation.y } : null
    };
    try { localStorage.setItem(VIEWER_STATE_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadViewerState() {
    try {
        const raw = localStorage.getItem(VIEWER_STATE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function resetLighting() {
    const r = window._chessRenderer;
    if (!r) return;
    r.setMainLightPosition(5, 15, 10);
    r.setMainLightIntensity(2.95);
    r.setAmbientIntensity(0.3);
    syncLightSliders();
    saveViewerState();
}

// WebGL detection — set flag; error message shown in load handler if unavailable
let _webglOk = true;
try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) throw new Error('No WebGL');
} catch (e) {
    _webglOk = false;
}

initializeSkin();

if (_webglOk) {
    // Use set3dMode directly instead of toggle3dMode to avoid calling
    // renderBoard() at module level, which triggers WASM getLegalMoves()
    // before WASM is initialized (startGame async hasn't resolved yet).
    // toggle3dMode also persists to localStorage (undesired for viewer page).
    skinRegistry.set3dMode(true);
}

window.renderBoard = function() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    skinRegistry.applyActive();
    const boardWrapper = document.getElementById('board-wrapper');
    if (boardWrapper) {
        boardWrapper.classList.toggle('mode-3d', skinRegistry.get3dMode());
    }
    boardEl.style.width = '';
    boardEl.style.height = '';
    renderBoard3d(boardEl);
    setupDragControls();
    setupViewerControls();
    setupLightControls();
    initSkinSelect();
    updateSkinSelect();

    // Restore persisted state if available (overrides defaults set above)
    const saved = loadViewerState();
    if (saved) {
        const r = window._chessRenderer;
        if (!r) return;

        if (saved.viewMode) {
            document.querySelectorAll('.view-mode-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.mode === saved.viewMode));
            document.getElementById('piece-controls').style.display =
                saved.viewMode === 'piece' ? '' : 'none';
            r.setViewMode(saved.viewMode);
        }

        if (saved.viewMode === 'piece') {
            document.getElementById('piece-type').value = saved.pieceType || 'K';
            document.getElementById('piece-color').value = saved.pieceColor || 'white';
            r.setSinglePiece(saved.pieceType || 'K', saved.pieceColor || 'white');
        }

        if (saved.cameraX !== undefined) r.setCameraPosition(saved.cameraX, saved.cameraY, saved.cameraZ);
        if (saved.cameraFov !== undefined) r.setCameraFov(saved.cameraFov);

        if (saved.lightX !== undefined) r.setMainLightPosition(saved.lightX, saved.lightY, saved.lightZ);
        if (saved.lightIntensity !== undefined) r.setMainLightIntensity(saved.lightIntensity);
        if (saved.ambientIntensity !== undefined) r.setAmbientIntensity(saved.ambientIntensity);

        if (saved.boardRotation && r._boardWrap) {
            r._boardWrap.rotation.x = saved.boardRotation.x;
            r._boardWrap.rotation.y = saved.boardRotation.y;
        }

        syncCameraSliders();
        syncLightSliders();
    }
    updateSkinSelect();
};

window.addEventListener('load', () => {
    if (!_webglOk) {
        document.getElementById('status-text').textContent =
            'WebGL not available — 3D viewer requires a WebGL-enabled browser';
        document.getElementById('model-container').style.display = 'none';
        document.getElementById('viewer-controls').style.display = 'none';
        return;
    }
    document.getElementById('status-text').textContent = 'Loading 3D models...';
    setTimeout(() => {
        if (typeof window.renderBoard === 'function') {
            window.renderBoard();
            document.getElementById('status-text').textContent = '3D Model Viewer - Drag to rotate, scroll to zoom';
        }
    }, 100);
});
