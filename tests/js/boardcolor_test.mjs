// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License.
//
// Tests for 3D board square colors and checkerboard pattern.
// Verifies: all squares have distinct light/dark colors in a checkerboard pattern,
//          a1 is dark (per chess convention), and contrast is sufficient.

import * as THREE from 'three';

// Import the renderer module
import { ChessRenderer3D } from '../../www/js/renderer-3d.js';

function relativeLuminance(hex) {
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = (hex & 0xff) / 255;
    // Linearize sRGB
    const toLin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const L = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    return L;
}

function contrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function squareName(r, f) {
    return String.fromCharCode(97 + f) + (r + 1);
}

function test(name, fn) {
    try {
        fn();
        console.log(`  \u2713 ${name}`);
    } catch (e) {
        console.error(`  \u2717 ${name}: ${e.message}`);
        process.exitCode = 1;
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'assertion failed');
}

// ---- Create minimal renderer instance ----
const renderer = new ChessRenderer3D();
renderer.scene = new THREE.Scene();
renderer._createBoard();

const meshes = renderer.squareMeshes;
const boardColors = renderer.boardColors;

// ---- Test 1: All 64 squares exist ----
test('64 square meshes created', () => {
    assert(meshes.length === 64, `Expected 64 squares, got ${meshes.length}`);
});

// ---- Test 2: Every square has a MeshBasicMaterial ----
test('All squares use MeshBasicMaterial', () => {
    for (const m of meshes) {
        assert(m.material instanceof THREE.MeshBasicMaterial,
            `Square ${m.userData.square} material is ${m.material.type}`);
    }
});

// ---- Test 3: Every square has a color ----
test('All squares have a color set', () => {
    for (const m of meshes) {
        const c = m.material.color.getHex();
        assert(typeof c === 'number' && c >= 0 && c <= 0xffffff,
            `Square ${m.userData.square} has invalid color ${c}`);
    }
});

// ---- Test 4: Exactly two distinct colors are used ----
test('Exactly two distinct square colors exist', () => {
    const uniqueColors = new Set(meshes.map(m => m.material.color.getHex()));
    assert(uniqueColors.size === 2,
        `Expected 2 distinct colors, found ${uniqueColors.size}: ${[...uniqueColors].map(c => '0x' + c.toString(16)).join(', ')}`);

    // Verify they match boardColors
    assert(uniqueColors.has(boardColors.light), `Light color 0x${boardColors.light.toString(16)} not found on any square`);
    assert(uniqueColors.has(boardColors.dark), `Dark color 0x${boardColors.dark.toString(16)} not found on any square`);
});

// ---- Test 5: Checkerboard pattern (adjacent squares differ) ----
test('Adjacent squares have different colors (checkerboard)', () => {
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const idx = r * 8 + f;
            const thisColor = meshes[idx].material.color.getHex();

            // Right neighbor
            if (f < 7) {
                const rightColor = meshes[r * 8 + f + 1].material.color.getHex();
                assert(thisColor !== rightColor,
                    `Squares ${squareName(r, f)} (0x${thisColor.toString(16)}) and ${squareName(r, f+1)} (0x${rightColor.toString(16)}) have same color`);
            }

            // Top neighbor
            if (r < 7) {
                const topColor = meshes[(r + 1) * 8 + f].material.color.getHex();
                assert(thisColor !== topColor,
                    `Squares ${squareName(r, f)} (0x${thisColor.toString(16)}) and ${squareName(r+1, f)} (0x${topColor.toString(16)}) have same color`);
            }
        }
    }
});

// ---- Test 6: a1 should be dark (per FIDE chess convention) ----
test('a1 square is dark (FIDE convention: bottom-right h1 is light)', () => {
    const a1Mesh = meshes[0]; // r=0, f=0
    const a1Color = a1Mesh.material.color.getHex();
    // a1 should be dark, so it should NOT be the light color
    assert(a1Color === boardColors.dark,
        `a1 is 0x${a1Color.toString(16)} but expected dark 0x${boardColors.dark.toString(16)} (a1 must be dark per FIDE rules)`);
});

// ---- Test 7: h1 should be light ----
test('h1 square is light', () => {
    const h1Mesh = meshes[7]; // r=0, f=7
    const h1Color = h1Mesh.material.color.getHex();
    assert(h1Color === boardColors.light,
        `h1 is 0x${h1Color.toString(16)} but expected light 0x${boardColors.light.toString(16)}`);
});

// ---- Test 8: Contrast between light and dark is high ----
test('Light and dark squares have high contrast ratio', () => {
    const Llight = relativeLuminance(boardColors.light);
    const Ldark = relativeLuminance(boardColors.dark);
    const ratio = contrastRatio(Llight, Ldark);
    console.log(`\n  Board colors: light=0x${boardColors.light.toString(16)}, dark=0x${boardColors.dark.toString(16)}`);
    console.log(`  Luminance: light=${Llight.toFixed(4)}, dark=${Ldark.toFixed(4)}`);
    console.log(`  Contrast ratio: ${ratio.toFixed(2)}:1`);
    assert(ratio >= 7, `Contrast ratio ${ratio.toFixed(2)}:1 is too low (need >= 7:1 for high contrast)`);
});

// ---- Test 9: Exactly 32 light and 32 dark squares ----
test('Exactly 32 light and 32 dark squares', () => {
    let lightCount = 0, darkCount = 0;
    for (const m of meshes) {
        if (m.material.color.getHex() === boardColors.light) lightCount++;
        else darkCount++;
    }
    assert(lightCount === 32, `Expected 32 light squares, got ${lightCount}`);
    assert(darkCount === 32, `Expected 32 dark squares, got ${darkCount}`);
});

// ---- Test 10: Border does not cover the squares ----
test('Border mesh sits below square meshes (top face below square bottom)', () => {
    // Find the border mesh in the boardGroup
    let borderMesh = null;
    for (const child of renderer.boardGroup.children) {
        if (child.isMesh && child !== meshes[0] && !meshes.includes(child)) {
            borderMesh = child;
            break;
        }
    }
    assert(borderMesh !== null, 'Border mesh not found in boardGroup');

    const borderGeo = borderMesh.geometry;
    assert(borderGeo.parameters !== undefined, 'Border has BoxGeometry parameters');
    
    const borderHalfH = borderGeo.parameters.height / 2;
    const borderTopY = borderMesh.position.y + borderHalfH;

    // Square: BoxGeometry(1, 0.04, 1) at y=0
    const squareHalfH = 0.02;
    const squareBottomY = 0 - squareHalfH;

    console.log(`\n  Border top face y=${borderTopY.toFixed(4)}, Square bottom y=${squareBottomY.toFixed(4)}`);
    assert(borderTopY <= squareBottomY,
        `Border top face (y=${borderTopY.toFixed(4)}) must be at or below square bottom (y=${squareBottomY.toFixed(4)}) to not occlude squares`);

    // Also verify the border is behind the squares in the group (squares added first)
    const squareIdx = renderer.boardGroup.children.indexOf(meshes[0]);
    const borderIdx = renderer.boardGroup.children.indexOf(borderMesh);
    assert(squareIdx < borderIdx,
        `Squares (index ${squareIdx}) must be added before border (index ${borderIdx})`);
});

// ---- Cleanup ----
renderer._disposeGroup(renderer.boardGroup);

console.log(`\nAll board color tests complete.`);
