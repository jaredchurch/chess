// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Rook - Low-poly rook piece geometry builder.
//
import * as THREE from 'three';
import { rotator } from '../../rotator.js';

function createRamparts(increment = 0, total = 8, mat, posY = 0.845, innerRadius = 0.15, outerRadius = 0.2, height = 0.10) {
        // 1. Create the 2D Shape (The footprint of the ring)
    const shape = new THREE.Shape();

    // const innerRadius = 0.15;
    // const outerRadius = 0.2;
    const startAngle = 0 + Math.PI* 2 * increment/total; // 0 degrees (starting point)
    const endAngle = Math.PI * 1/total + Math.PI * 2 * increment/total; // 270 degrees (partial ring)

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

export function buildRook(group, mat, scale=0.014) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 3-16 5-32 10-32 11-35 9-35L5-35 11-39 11-47 7-47 7-42 0-42";
    group.add(rotator(pathData, mat, scale));

    // Add 8 crenellations around the top
    const rampartCount=7;
    for (let i = 0; i < rampartCount; i++) {
        group.add(createRamparts(i, rampartCount, mat, 0.72, 0.0978, 0.1541, 0.08));
    }

}
