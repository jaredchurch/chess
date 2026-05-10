// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Queen - Low-poly queen piece geometry builder.
// Components (from bottom to top):
//   BASE: Cylinder (r=0.24, h=0.06) at y=0.03
//   UPPER BASE: Cylinder (r=0.16, h=0.22) at y=0.36
//   BELT: Cylinder (r=0.18, h=0.20) at y=0.58
//   NECK: Cylinder (r=0.08, h=0.30) at y=0.73
//   CROWN: Cylinder (r=0.16, h=0.06) at y=0.93
//   SPIKES: 6 cones (r=0.025, h=0.12) at radius 0.16, y=1.02
//   TOP: Sphere (r=0.05) at y=1.12
//

import * as THREE from 'three';

export function buildQueen(group, mat) {
    const add = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; group.add(m); };
    // BASE: Cylinder (r=0.24, h=0.06) at y=0.03
    add(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 24), 0.03);
    // UPPER BASE: Cylinder (r=0.16, h=0.22) at y=0.36
    add(new THREE.CylinderGeometry(0.16, 0.22, 0.5, 24), 0.30);
    // BELT: Cylinder (r=0.18, h=0.20) at y=0.58
    add(new THREE.CylinderGeometry(0.18, 0.20, 0.05, 24), 0.58);
    // NECK: Cylinder (r=0.08, h=0.30) at y=0.73
    add(new THREE.CylinderGeometry(0.08, 0.10, 0.3, 24), 0.73);
    // CROWN: Cylinder (r=0.16, h=0.06) at y=0.93
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 24), mat);
    crown.position.y = 0.93;
    group.add(crown);
    // SPIKES: 6 cones (r=0.025, h=0.12) at radius 0.16, y=1.02
    const n = 6;
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 24), mat);
        p.position.set(Math.cos(a) * 0.14, 1.02, Math.sin(a) * 0.14);
        group.add(p);
    }
    // TOP: Sphere (r=0.05) at y=1.12
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 24), mat);
    top.position.y = 1.12;
    group.add(top);
}
