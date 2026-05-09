// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Bishop - Low-poly bishop piece geometry builder.
// Components (from bottom to top):
//   BASE: Cylinder (r=0.24, h=0.06) at y=0.03
//   UPPER BASE: Cylinder (r=0.16, h=0.22) at y=0.36
//   NODULE: Cylinder (r=0.16, h=0.18) at y=0.58
//   NECK: Cylinder (r=0.08, h=0.22) at y=0.70
//   MITRE: Cone (r=0.08, h=0.26) at y=0.92
//

import * as THREE from 'three';

export function buildBishop(group, mat) {
    const add = (geo, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; group.add(m); };
    // BASE: Cylinder (r=0.24, h=0.06) at y=0.03
    add(new THREE.CylinderGeometry(0.24, 0.28, 0.06, 8), 0.03);
    // UPPER BASE: Cylinder (r=0.16, h=0.22) at y=0.36
    add(new THREE.CylinderGeometry(0.16, 0.22, 0.5, 8), 0.30);
    // NODULE: Cylinder (r=0.16, h=0.18) at y=0.58
    add(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 8), 0.58);
    // NECK: Cylinder (r=0.08, h=0.22) at y=0.70
    add(new THREE.CylinderGeometry(0.08, 0.10, 0.22, 6), 0.70);
    // MITRE: Cone (r=0.08, h=0.26) at y=0.92
    add(new THREE.ConeGeometry(0.08, 0.26, 6), 0.92);
}
