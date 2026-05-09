// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// 3D Model Viewer - Controls and interactions for the 3D model viewer page.
// Provides view mode switching (full/board/piece), single piece selection,
// and camera position controls.
//

import * as THREE from 'three';
import { skinRegistry } from './skins.js';
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
    }
    viewModeBtns.forEach(btn => {
        btn.addEventListener('click', () => switchViewMode(btn.dataset.mode));
    });

    const pieceType = document.getElementById('piece-type');
    const pieceColor = document.getElementById('piece-color');
    function updateSinglePiece() {
        renderer.setSinglePiece(pieceType.value, pieceColor.value);
    }
    pieceType.addEventListener('change', updateSinglePiece);
    pieceColor.addEventListener('change', updateSinglePiece);

    const camX = document.getElementById('cam-x');
    const camY = document.getElementById('cam-y');
    const camZ = document.getElementById('cam-z');
    const camFov = document.getElementById('cam-fov');

    function syncCameraSliders() {
        const pos = renderer.getCameraPosition();
        camX.value = pos.x.toFixed(1);
        camY.value = pos.y.toFixed(1);
        camZ.value = pos.z.toFixed(1);
        camFov.value = Math.round(pos.fov);
        document.getElementById('cam-x-val').textContent = pos.x.toFixed(1);
        document.getElementById('cam-y-val').textContent = pos.y.toFixed(1);
        document.getElementById('cam-z-val').textContent = pos.z.toFixed(1);
        document.getElementById('cam-fov-val').textContent = Math.round(pos.fov);
    }

    function onCamSlider() {
        const x = parseFloat(camX.value);
        const y = parseFloat(camY.value);
        const z = parseFloat(camZ.value);
        const fov = parseFloat(camFov.value);
        renderer.setCameraPosition(x, y, z);
        renderer.setCameraFov(fov);
        syncCameraSliders();
    }

    camX.addEventListener('input', onCamSlider);
    camY.addEventListener('input', onCamSlider);
    camZ.addEventListener('input', onCamSlider);
    camFov.addEventListener('input', onCamSlider);

    document.getElementById('reset-camera').addEventListener('click', () => {
        renderer.resetCamera();
        syncCameraSliders();
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

    function syncLightSliders() {
        const s = renderer.getLightState();
        lx.value = s.mainX.toFixed(1);
        ly.value = s.mainY.toFixed(1);
        lz.value = s.mainZ.toFixed(1);
        li.value = s.mainIntensity.toFixed(2);
        ai.value = s.ambientIntensity.toFixed(2);
        document.getElementById('light-x-val').textContent = s.mainX.toFixed(1);
        document.getElementById('light-y-val').textContent = s.mainY.toFixed(1);
        document.getElementById('light-z-val').textContent = s.mainZ.toFixed(1);
        document.getElementById('light-intensity-val').textContent = s.mainIntensity.toFixed(2);
        document.getElementById('ambient-intensity-val').textContent = s.ambientIntensity.toFixed(2);
    }

    function onLightSlider() {
        renderer.setMainLightPosition(
            parseFloat(lx.value), parseFloat(ly.value), parseFloat(lz.value)
        );
        renderer.setMainLightIntensity(parseFloat(li.value));
        renderer.setAmbientIntensity(parseFloat(ai.value));
        syncLightSliders();
    }

    lx.addEventListener('input', onLightSlider);
    ly.addEventListener('input', onLightSlider);
    lz.addEventListener('input', onLightSlider);
    li.addEventListener('input', onLightSlider);
    ai.addEventListener('input', onLightSlider);

    syncLightSliders();
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

// WebGL detection — set flag; error message shown in load handler if unavailable
let _webglOk = true;
try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) throw new Error('No WebGL');
} catch (e) {
    _webglOk = false;
}

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
