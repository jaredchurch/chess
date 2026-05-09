// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Rook - Low-poly rook piece geometry builder.
// Components (from bottom to top):
//   BASE: Cylinder (r=0.26, h=0.06) at y=0.03
//   UPPER BASE: Cylinder (r=0.20, h=0.24) at y=0.36
//   RING: Cylinder (r=0.24, h=0.05) at y=0.70
//   PLATFORM: Cylinder (r=0.26, h=0.06) at y=0.755
//   CRENELLATIONS: 8 boxes (0.06x0.10x0.06) at radius 0.20, y=0.845
//   (Spaced at 45° intervals around the platform edge)
//

import * as THREE from 'three';

export function buildRook(group, mat) {
    const add = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; group.add(m); };
    // BASE: Cylinder (r=0.26, h=0.06) at y=0.03
    add(new THREE.CylinderGeometry(0.26, 0.28, 0.06, 8), 0.03);
    // UPPER BASE: Cylinder (r=0.20, h=0.24) at y=0.36
    add(new THREE.CylinderGeometry(0.20, 0.24, 0.6, 8), 0.36);
    // RING: Cylinder (r=0.24, h=0.05) at y=0.70
    add(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 8), 0.70);
    // PLATFORM: Cylinder (r=0.26, h=0.06) at y=0.755
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 12), mat);
    plat.position.y = 0.755;
    group.add(plat);
    // CRENELLATIONS: 8 boxes (0.06x0.10x0.06) at radius 0.20, y=0.845
    // (Spaced at 45° intervals around the platform edge)
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.06), mat);
        b.position.set(Math.cos(a) * 0.20, 0.845, Math.sin(a) * 0.20);
        group.add(b);
    }
}
