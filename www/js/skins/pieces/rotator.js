// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Rotator - Creates 3D lathed geometry meshes from SVG path profiles using
// THREE.LatheGeometry. Used to generate 3D chess piece bodies by rotating
// a 2D profile curve around the Y axis.
//

import * as THREE from 'three';
import { getPointsFromSVGPath } from '../svg-path.js';


export function rotator(pathData, mat, scale = 0.015, details = 180, positionY = 0.0) {
    const segments = details;
    const nPoints = details;
    const points = getPointsFromSVGPath(pathData, nPoints, scale);
    const geometry = new THREE.LatheGeometry(points, segments);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = positionY;
    return mesh;
}
