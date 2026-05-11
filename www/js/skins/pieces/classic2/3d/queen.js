// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Queen - Low-poly queen piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';
import { getPointsFromSVGPath } from '../../../svg-path.js';


export function buildQueen(group, mat, scale = 0.017) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 8-15 7-32 11-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39 10-49 13-57 8-53 4-54 3-56 2-56 4-57 4-58 2-58 3-58 3-59 1-59 2-59 1-60 0-60";

    const segments = 180;
    const nPoints = 180;
    const points = getPointsFromSVGPath(pathData, nPoints, scale);
    const geometry = new THREE.LatheGeometry(points, segments);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.y = 0.0;
    group.add(mesh);

}



//     // CROWN: Cylinder (r=0.16, h=0.06) at y=0.93
//     const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 8), mat);
//     crown.position.y = 0.93;
//     group.add(crown);
//     // SPIKES: 6 cones (r=0.025, h=0.12) at radius 0.16, y=1.02
//     const n = 6;
//     for (let i = 0; i < n; i++) {
//         const a = (i / n) * Math.PI * 2;
//         const p = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), mat);
//         p.position.set(Math.cos(a) * 0.16, 1.02, Math.sin(a) * 0.16);
//         group.add(p);
//     }
//     // TOP: Sphere (r=0.05) at y=1.12
//     const top = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), mat);
//     top.position.y = 1.12;
//     group.add(top);
// }
