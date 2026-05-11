// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D King - Low-poly king piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { getPointsFromSVGPath } from '../../../svg-path.js';


export function buildKing(group, mat, scale = 0.02) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 7-15 6-32 11-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39 10-49 12-52 8-53 4-54 2-55 0-55";
    
    const segments = 180;
    const nPoints = 180;
    const points = getPointsFromSVGPath(pathData, nPoints, scale);
    const geometry = new THREE.LatheGeometry(points, segments);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = 0.0;
    group.add(mesh);

    // VERTICAL: Box (0.05x0.32x0.05) at y=1.26
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.05), mat);
    vert.position.y = 1.26;
    group.add(vert);
    // HORIZONTAL: Box (0.16x0.05x0.05) at y=1.24
    const horiz = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), mat);
    horiz.position.y = 1.24;
    group.add(horiz);

}


