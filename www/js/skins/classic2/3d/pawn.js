// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder.
// Components (from bottom to top):
//   BASE: Cylinder (r=0.192, h=0.048) at y=0.024
//   NECK: Cylinder (r=0.112, h=0.176) at y=0.272
//   BODY: Sphere (r=0.112) at y=0.592
//   KNOB: Sphere (r=0.08) at y=0.704
//

import * as THREE from 'three';

export function buildPawn(group, mat) {
    const add = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; group.add(m); };
    // BASE: Cylinder (r=0.192, h=0.048) at y=0.024
    add(new THREE.CylinderGeometry(0.192, 0.224, 0.048, 8), 0.024);
    // NECK: Cylinder (r=0.112, h=0.176) at y=0.272
    add(new THREE.CylinderGeometry(0.112, 0.176, 0.176, 8), 0.272);
    // BODY: Sphere (r=0.112) at y=0.592
    add(new THREE.SphereGeometry(0.112, 6, 5), 0.592);
    // KNOB: Sphere (r=0.08) at y=0.704
    add(new THREE.SphereGeometry(0.08, 6, 5), 0.704);
}
