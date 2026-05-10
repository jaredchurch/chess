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

export function buildPawn(group, mat, scale = 0.4) { // Added scale parameter
    const segments = 180;
    const points = [];

    // Helper function to scale coordinates on the fly
    const s = (x, y) => new THREE.Vector2(x * scale, y * scale);

    // 1. THE BASE (Multi-tiered)
    points.push(s(0, 0));       
    points.push(s(0.65, 0));    
    points.push(s(0.65, 0.05)); 
    points.push(s(0.6, 0.08));  
    points.push(s(0.6, 0.12));  
    points.push(s(0.55, 0.15)); 

    // 2. THE MAIN BODY (Elegant concave curve)
    const bodyDivisions = segments; 
    const startX = 0.55;  
    const midX = 0.15;    
    const endX = 0.22;    
    const startY = 0.15;
    const height = 0.7;

    for (let i = 0; i <= bodyDivisions; i++) {
        const t = i / bodyDivisions;
        const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
        const y = startY + (t * height); 
        points.push(s(x, y)); // Scaled
    }

    // 3. THE COLLAR
    points.push(s(0.28, 0.88)); 
    points.push(s(0.28, 0.92)); 
    points.push(s(0.18, 0.95)); 

    // 4. THE HEAD (Smooth Sphere)
    const headDivisions = segments;
    const headRadius = 0.32;
    const headCenterY = 1.25;

    for (let i = 0; i <= headDivisions; i++) {
        const angle = (i / headDivisions) * Math.PI;
        const x = Math.sin(angle) * headRadius;
        const y = headCenterY - Math.cos(angle) * headRadius;
        points.push(s(x, y)); // Scaled
    }

    const geometry = new THREE.LatheGeometry(points, segments);
    const latheMesh = new THREE.Mesh(geometry, mat);

    group.add(latheMesh);
}
