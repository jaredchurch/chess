// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { getPointsFromSVGPath } from '../../svg-path.js';

export function buildPawn(group, mat, scale = 0.0095) {
    const pathData = "M0 0 20 0 20-5 15-5C15-10 15-5 10-10L10-10C5-20 5-35 10-40 18-41 16-44 10-45L5-45C0-45 3-50 5-50M5-50C10-52 10-65 0-65";
    
    const segments = 180;
    const nPoints = 180;
    const points = getPointsFromSVGPath(pathData, nPoints, scale);
    const geometry = new THREE.LatheGeometry(points, segments);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = 0.0;
    group.add(mesh);
}


