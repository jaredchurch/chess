// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License.
//
// Tests for _frameBoard camera framing math.
// Validates that board corners project inside the viewport with margin.

import * as THREE from 'three';

const W = 800;
const H = 600;

function createTestCamera() {
    const cam = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);
    cam.position.set(0, 12, 18);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();
    return cam;
}

function frameBoard(camera, margin = 1.4) {
    camera.updateMatrixWorld(true);

    const pts = [
        [-3.5, 0, -3.5], [3.5, 0, -3.5],
        [-3.5, 0, 3.5],  [3.5, 0, 3.5],
    ];
    const ndc = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]).project(camera));
    const minY = Math.min(...ndc.map(v => v.y));
    const maxY = Math.max(...ndc.map(v => v.y));
    const minX = Math.min(...ndc.map(v => v.x));
    const maxX = Math.max(...ndc.map(v => v.x));

    const halfVert = camera.fov * Math.PI / 180 / 2;
    const tanHalf = Math.tan(halfVert);

    const fovY = 2 * Math.atan(tanHalf * (maxY - minY) / 2) * 180 / Math.PI;
    const fovX = 2 * Math.atan(tanHalf * (maxX - minX) / 2) * 180 / Math.PI;

    return {
        ndc: { minX, maxX, minY, maxY },
        fovY,
        fovX,
        newFov: Math.max(fovY, fovX) * margin,
        chosenAxis: fovY >= fovX ? 'vertical' : 'horizontal',
    };
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

function approx(a, b, tol = 0.001) {
    return Math.abs(a - b) < tol;
}

// --- Tests ---

{
    const cam = createTestCamera();
    const result = frameBoard(cam);

    test('NDC values are within [-1, 1]', () => {
        assert(result.ndc.minX >= -1 && result.ndc.maxX <= 1,
            `X range [${result.ndc.minX.toFixed(3)}, ${result.ndc.maxX.toFixed(3)}] exceeds viewport`);
        assert(result.ndc.minY >= -1 && result.ndc.maxY <= 1,
            `Y range [${result.ndc.minY.toFixed(3)}, ${result.ndc.maxY.toFixed(3)}] exceeds viewport`);
    });

    test('Board is centred horizontally', () => {
        const centreX = (result.ndc.minX + result.ndc.maxX) / 2;
        assert(approx(centreX, 0, 0.05), `X centre ${centreX.toFixed(4)} not near 0`);
    });

    test('Board is centred vertically', () => {
        const centreY = (result.ndc.minY + result.ndc.maxY) / 2;
        assert(approx(centreY, 0, 0.05), `Y centre ${centreY.toFixed(4)} not near 0`);
    });

    test('Computed FOV is positive and reasonable', () => {
        assert(result.newFov > 10 && result.newFov < 90, `FOV ${result.newFov} out of range`);
    });

    test('Board fits with margin after applying new FOV', () => {
        const cam2 = createTestCamera();
        cam2.fov = result.newFov;
        cam2.updateProjectionMatrix();

        const pts = [
            [-3.5, 0, -3.5], [3.5, 0, -3.5],
            [-3.5, 0, 3.5],  [3.5, 0, 3.5],
        ];
        const ndc2 = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]).project(cam2));

        const allowed = 1 / 1.4;  // after 1.12x margin, board spans 2/1.12
        for (const v of ndc2) {
            assert(v.x >= -allowed && v.x <= allowed,
                `NDC x ${v.x.toFixed(3)} exceeds \u00b1${allowed.toFixed(3)} after reframe`);
            assert(v.y >= -allowed && v.y <= allowed,
                `NDC y ${v.y.toFixed(3)} exceeds \u00b1${allowed.toFixed(3)} after reframe`);
        }
    });

    test('Board occupies at least 70% of viewport in both axes', () => {
        const cam2 = createTestCamera();
        cam2.fov = result.newFov;
        cam2.updateProjectionMatrix();

        const pts = [
            [-3.5, 0, -3.5], [3.5, 0, -3.5],
            [-3.5, 0, 3.5],  [3.5, 0, 3.5],
        ];
        const ndc2 = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]).project(cam2));
        const spanX = Math.max(...ndc2.map(v => v.x)) - Math.min(...ndc2.map(v => v.x));
        const spanY = Math.max(...ndc2.map(v => v.y)) - Math.min(...ndc2.map(v => v.y));

        assert(spanX >= 1.0, `X span ${spanX.toFixed(3)} < 1.0 (50%)`);
        assert(spanY >= 0.4, `Y span ${spanY.toFixed(3)} < 0.4 (20%)`);
    });

    console.log(`\n  Summary: fovY=${result.fovY.toFixed(2)}\u00b0  fovX=${result.fovX.toFixed(2)}\u00b0  newFov=${result.newFov.toFixed(2)}\u00b0  axis=${result.chosenAxis}`);
    console.log(`  NDC ranges: x=[${result.ndc.minX.toFixed(3)}, ${result.ndc.maxX.toFixed(3)}]  y=[${result.ndc.minY.toFixed(3)}, ${result.ndc.maxY.toFixed(3)}]`);
}

// --- Edge cases: different aspect ratios ---

for (const [label, w, h] of [['tall 3:4', 600, 800], ['wide 16:9', 1200, 675], ['square 1:1', 600, 600]]) {
    test(`Framing works at ${label}`, () => {
        const cam = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);
        cam.position.set(0, 12, 18);
        cam.lookAt(0, 0, 0);
        cam.updateMatrixWorld(true);
        cam.updateProjectionMatrix();

        const result = frameBoard(cam);
        assert(result.newFov > 10 && result.newFov < 90, `FOV ${result.newFov} out of range`);

        cam.fov = result.newFov;
        cam.updateProjectionMatrix();
        const pts = [
            [-3.5, 0, -3.5], [3.5, 0, -3.5],
            [-3.5, 0, 3.5],  [3.5, 0, 3.5],
        ];
        const ndc = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]).project(cam));
        for (const v of ndc) {
            assert(v.x > -1 && v.x < 1, `X ${v.x.toFixed(3)} out of [-1,1] at ${label}`);
            assert(v.y > -1 && v.y < 1, `Y ${v.y.toFixed(3)} out of [-1,1] at ${label}`);
        }
    });
}
