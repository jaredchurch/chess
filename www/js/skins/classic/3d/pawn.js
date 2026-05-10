// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder.
// Components (from bottom to top):
//   BASE: Cylinder (r=0.24, h=0.06) at y=0.03
//   NECK: Cylinder (r=0.14, h=0.22) at y=0.34
//   BODY: Sphere (r=0.14) at y=0.74
//   KNOB: Sphere (r=0.10) at y=0.88
//

import * as THREE from 'three';

export function buildPawn(group, mat) {
    const segments = 360;

    const add = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; group.add(m); };
    // BASE: Cylinder (r=0.24, h=0.06) at y=0.03
    add(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 64), 0.03);
    // NECK: Cylinder (r=0.14, h=0.22) at y=0.34
    add(new THREE.CylinderGeometry(0.08, 0.13, 0.40, 64), 0.2);
    // NECK: Cylinder (r=0.14, h=0.22) at y=0.34
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.04, 100,100), mat);
    torus.position.y = 0.4;
    torus.rotation.x = Math.PI / 2;
    group.add(torus);
    // BODY: Sphere (r=0.14) at y=0.74
    add(new THREE.SphereGeometry(0.12, 64, 32), 0.52);
    // KNOB: Sphere (r=0.10) at y=0.88
    // add(new THREE.SphereGeometry(0.10, 6, 5), 0.88);
}
