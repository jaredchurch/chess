// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D King - Low-poly king piece geometry builder.
// Components (from bottom to top):
//   BASE: Cylinder (r=0.24, h=0.06) at y=0.03
//   UPPER BASE: Cylinder (r=0.16, h=0.22) at y=0.36
//   BELT: Cylinder (r=0.18, h=0.20) at y=0.55
//   NECK: Cylinder (r=0.08, h=0.30) at y=0.78
//   CROWN: Cylinder (r=0.18, h=0.06) at y=0.98
//   SPIKES: 5 cones (r=0.025, h=0.10) at radius 0.18, y=1.07
//   VERTICAL: Box (0.05x0.32x0.05) at y=1.26
//   HORIZONTAL: Box (0.16x0.05x0.05) at y=1.24
//

import * as THREE from 'three';

export function buildKing(group, mat) {
    const add = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; group.add(m); };
    // BASE: Cylinder (r=0.24, h=0.06) at y=0.03
    add(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 24), 0.03);
    // UPPER BASE: Cylinder (r=0.16, h=0.22) at y=0.36
    add(new THREE.CylinderGeometry(0.16, 0.22, 0.55, 24), 0.32);
    // BELT: Cylinder (r=0.18, h=0.20) at y=0.55
    add(new THREE.CylinderGeometry(0.18, 0.20, 0.20, 24), 0.63);
    // NECK: Cylinder (r=0.08, h=0.30) at y=0.78
    add(new THREE.CylinderGeometry(0.08, 0.10, 0.3, 24), 0.78);
    // CROWN: Cylinder (r=0.18, h=0.06) at y=0.98
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.06, 24), mat);
    crown.position.y = 0.98;
    group.add(crown);
    // SPIKES: 5 cones (r=0.025, h=0.10) at radius 0.18, y=1.07
    const n = 6;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.10, 24), mat);
        p.position.set(Math.cos(a) * 0.16, 1.05, Math.sin(a) * 0.16);
        group.add(p);
    }
    // VERTICAL: Box (0.05xHx0.05) at y=1.26
    const vert = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.05), mat);
    vert.position.y = 1.14;
    group.add(vert);
    // HORIZONTAL: Box (0.16x0.05x0.05) at y=1.24
    const horiz = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), mat);
    horiz.position.y = 1.17;
    group.add(horiz);
}
