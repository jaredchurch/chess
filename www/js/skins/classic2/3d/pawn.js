// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { getPointsFromSVGPath } from '../../svg-path.js';

export function buildPawn(group, mat, scale = 0.04) {
    const pathData = "M0 0 4 0 4-1 3-1C3-2 3-1 2-2L2-2C1-4 1-9 2-10 2-10 1-11 3-11L3-11C3-12 2-12 2-12L1-12C1-12 0-12 1-13M1-13C3-14 3-17 0-17";
    
    const segments = 180;
    const nPoints = 180;
    const points = getPointsFromSVGPath(pathData, nPoints, scale);
    const geometry = new THREE.LatheGeometry(points, segments);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = 0.0;
    group.add(mesh);
}


