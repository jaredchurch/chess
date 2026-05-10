// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Knight - Low-poly knight piece geometry builder.
// Components (from bottom to top):
//   BASE: Cylinder (r=0.24, h=0.06) at y=0.03
//   NECK: Cylinder (r=0.16, h=0.22) at y=0.36
//   CHEST: Cylinder (r=0.12, h=0.15) at y=0.56
//   HEAD: Box (0.28x0.18x0.18) at (0.04, 0.75, -0.02), rotated z=0.08, x=0.15
//   EAR: Cone (r=0.035, h=0.12) at (0.10, 0.88, 0.03), rotated z=-0.15, x=0.25
//

import * as THREE from 'three';

export function buildKnight(group, mat) {
    const add = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; group.add(m); };
    // BASE: Cylinder (r=0.24, h=0.06) at y=0.03
    add(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 24), 0.03);
    // NECK: Cylinder (r=0.16, h=0.22) at y=0.36
    add(new THREE.CylinderGeometry(0.16, 0.22, 0.5, 24), 0.30);
    // CHEST: Cylinder (r=0.12, h=0.15) at y=0.56
    add(new THREE.CylinderGeometry(0.12, 0.14, 0.15, 24), 0.56);
    // HEAD: Box (0.28x0.18x0.18) at (0.04, 0.75, -0.02), rotated z=0.08, x=0.15
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.18), mat);
    head.position.set(0.04, 0.75, -0.02);
    head.rotation.z = 0.08;
    head.rotation.x = 0.15;
    group.add(head);
    // EAR: Cone (r=0.035, h=0.12) at (0.10, 0.88, 0.03), rotated z=-0.15, x=0.25
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 5), mat);
    ear.position.set(0.10, 0.88, 0.03);
    ear.rotation.z = -0.15;
    ear.rotation.x = 0.25;
    group.add(ear);
}
