// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Bishop - Low-poly bishop piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { getPointsFromSVGPath } from '../../../svg-path.js';

export function buildBishop(group, mat, scale = 0.01) {
    const pathData = "M0 0 25 0 25-5 20-5C15-10 19-9 12-10L12-10C7-21 4-55 14-55L14-55C19-55 23-61 10-60L10-60C17-72 15-85 5-95 7-98 2-99 0-99";
    
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


