// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { rotator } from '../../rotator.js';
import { getPointsFromSVGPath } from '../../../svg-path.js';

export function buildKnight(group, mat, scale = 0.0125) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 3-16 5-32 10-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39L3-39 3-42 0-42";
    //M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 3-16 5-32 10-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39L3-39 3-42 6-42 6-46C5-46 5-47 6-47L6-51C5-51 5-52 6-52L6-56 0-56";
    group.add(rotator(pathData, mat, scale));

    const horseHead = "M-23 0 34 0C34 0 40 1 38-7 23-39 93-130 24-150 19.6667-157 10-174 10-166 10-163 12-160 12-152-14-139-26-109-40-95-55-79-34-65-22-75-16-80 14-109 5-88-5-70-6-69-13-63-36-45-63-2-23 0";
    
    const points = getPointsFromSVGPath(horseHead, 200, 0.002);
    const depth = 0.1;
    points.shift(); // remove spurious (0,0) start point from lathe-geometry helper
    const crossShape = new THREE.Shape(points);
    const crossGeom = new THREE.ExtrudeGeometry(crossShape, { depth: depth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 });
    const crossMesh = new THREE.Mesh(crossGeom, mat);
    crossMesh.position.y = 0.52;
    crossMesh.position.z = -1 * depth/2;
    group.add(crossMesh);

}


