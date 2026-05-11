// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Bishop - Low-poly bishop piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { rotator } from '../../rotator.js';

export function buildBishop(group, mat, scale = 0.016) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 3-16 5-32 10-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39L5-39C10-43 8-52 1-59 2-59 2-61 0-61";
    const mesh = rotator(pathData, mat, scale);

    const pos = mesh.geometry.attributes.position;
    let maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y > maxY) maxY = y;
    }

    const slitStartY = maxY - 0.18;
    const halfWidth = 0.01;
    const offsetX = 0.025;
    const theta = -1 * Math.PI / 18; // 10°

    // Cutter: a thin box matching the desired mitre position, size, and tilt
    const cutterGeom = new THREE.BoxGeometry(halfWidth * 2, maxY - slitStartY, 0.3);
    const cutterBrush = new Brush(cutterGeom);
    cutterBrush.position.set(offsetX, (slitStartY + maxY) / 2, 0);
    cutterBrush.rotation.z = theta;
    cutterBrush.updateMatrixWorld(true);

    // CSG subtraction: body - cutter
    const brushA = new Brush(mesh.geometry);
    const evaluator = new Evaluator();
    const result = evaluator.evaluate(brushA, cutterBrush, SUBTRACTION);
    result.material = mat;

    // Clean up original body geometry (no longer needed)
    mesh.geometry.dispose();
    cutterGeom.dispose();

    group.add(result);
}


