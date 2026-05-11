// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Rook - Low-poly rook piece geometry builder.
//
import * as THREE from 'three';
import { getPointsFromSVGPath } from '../../../svg-path.js';

function createRamparts(increment = 0, mat, posY = 0.845, innerRadius = 0.15, outerRadius = 0.2, height = 0.10) {
        // 1. Create the 2D Shape (The footprint of the ring)
    const shape = new THREE.Shape();

    // const innerRadius = 0.15;
    // const outerRadius = 0.2;
    const startAngle = 0 + Math.PI* 2 * increment/8; // 0 degrees (starting point)
    const endAngle = Math.PI * 2/16 + Math.PI * 2 * increment/8; // 270 degrees (partial ring)

    // Outer edge
    shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);

    // Inner edge (drawn in reverse to create the "hole")
    shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);

    // 2. Extrude it to add depth
    const extrudeSettings = {
        depth: height,           // How thick the ring is on the Z-axis
        bevelEnabled: false, // Adds rounded edges (highly recommended)
        curveSegments: 48   // Makes the ring look smooth
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const meshRamparts = new THREE.Mesh(geometry, mat);
    meshRamparts.rotation.x = Math.PI / 2;
    meshRamparts.position.y = posY;
    return meshRamparts;

}

export function buildRook(group, mat, scale=0.045) {
    const pathData = "M0 0 4 0 4-1 3-1C3-2 3-1 2-2L2-2C2-5 1-9 3-11 3-11 1-11 3-11L3-11C3-12 2-12 2-12L3-12 4-13 4-15 3-15 3-14 0-14";
    
    const segments = 180;
    const nPoints = 180;
    const points = getPointsFromSVGPath(pathData, nPoints, scale);
    const geometryRook = new THREE.LatheGeometry(points, segments);
    const meshRook = new THREE.Mesh(geometryRook, mat);
    meshRook.position.y = 0.0;
    group.add(meshRook);

    // Add crenellations
    group.add(createRamparts(0, mat, 0.745, 0.135, 0.18, 0.08));
    group.add(createRamparts(1, mat, 0.745, 0.135, 0.18, 0.08));
    group.add(createRamparts(2, mat, 0.745, 0.135, 0.18, 0.08));
    group.add(createRamparts(3, mat, 0.745, 0.135, 0.18, 0.08));
    group.add(createRamparts(4, mat, 0.745, 0.135, 0.18, 0.08));
    group.add(createRamparts(5, mat, 0.745, 0.135, 0.18, 0.08));
    group.add(createRamparts(6, mat, 0.745, 0.135, 0.18, 0.08));
    group.add(createRamparts(7, mat, 0.745, 0.135, 0.18, 0.08));

}
