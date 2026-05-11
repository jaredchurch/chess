// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D King - Low-poly king piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { rotator } from '../../rotator.js';
import { getPointsFromSVGPath } from '../../../svg-path.js';

export function buildKing(group, mat, scale = 0.02) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 7-15 6-32 11-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39 10-49 12-52 8-53 4-54 2-55 0-55";
    group.add(rotator(pathData, mat, scale));

    const crossPath="M-6 0 6 0C9-1 9-1 7-3L7-3 1-10 10-6C11-9 11-12 10-15L1-11 7-18C9-20 9-20 6-21L6-21C2-22-2-22-6-21L-6-21C-9-20-9-20-7-18L-1-11-10-15C-11-12-11-9-10-6L-1-10-7-3C-9-1-9-1-6 0-2 1 2 1 6 0";
    
    const points = getPointsFromSVGPath(crossPath, 100, 0.008);
    points.shift(); // remove spurious (0,0) start point from lathe-geometry helper
    const crossShape = new THREE.Shape(points);
    const crossGeom = new THREE.ExtrudeGeometry(crossShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 });
    const crossMesh = new THREE.Mesh(crossGeom, mat);
    crossMesh.position.y = 1.1;
    group.add(crossMesh);
}


