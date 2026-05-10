// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { getPointsFromSVGPath } from '../../svg-path.js';

export function buildBishop(group, mat, scale = 0.05) {
    const pathData = "M0 0 5 0 5-1 4-1C3-2 4-2 2-2L2-2C1-4 1-9 2-11L3-11C3-11 4-11 4-12L2-12C4-15 3-17 1-19 2-20 0-21 0-20";
    
    const segments = 180;
    const nPoints = 180;
    const points = getPointsFromSVGPath(pathData, nPoints, scale);
    const geometry = new THREE.LatheGeometry(points, segments);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = 0;
    group.add(mesh);


    // 2. Create the "Cutter" (a thin box for the slit)
    // TBD
}


