// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// SVG Path to LatheGeometry points - Parses SVG path commands (M, L, C, V, H)
// and samples evenly by arc length to produce points for THREE.LatheGeometry.
//
// Supports absolute (uppercase) and relative (lowercase) command variants.
// All coordinates are normalized to absolute during parsing.
// SVG uses Y-down convention; returned points have Y negated for Y-up 3D coords.
//
// Design SVG paths for piece profiles using: https://yqnn.github.io/svg-path-editor/

import * as THREE from 'three';

export function getPointsFromSVGPath(pathData, nPoints, scale = 1) {
    const tokens = pathData.match(/[MLCHVmlchv]|[-+]?\d*\.?\d+/g);
    const cmds = [];
    let i = 0, curX = 0, curY = 0;

    const isLetter = t => /[A-Za-z]/.test(t);

    while (i < tokens.length) {
        const raw = tokens[i++];
        const abs = raw === raw.toUpperCase();
        const c = raw.toUpperCase();

        if (c === 'M') {
            curX = abs ? +tokens[i] : curX + +tokens[i]; i++;
            curY = abs ? +tokens[i] : curY + +tokens[i]; i++;
            cmds.push({ c: 'M', x: curX, y: curY });
            // Implicit L for additional coordinate pairs after M
            while (i < tokens.length && !isLetter(tokens[i])) {
                curX = abs ? +tokens[i] : curX + +tokens[i]; i++;
                curY = abs ? +tokens[i] : curY + +tokens[i]; i++;
                cmds.push({ c: 'L', x: curX, y: curY });
            }
        } else if (c === 'L') {
            while (i < tokens.length && !isLetter(tokens[i])) {
                curX = abs ? +tokens[i] : curX + +tokens[i]; i++;
                curY = abs ? +tokens[i] : curY + +tokens[i]; i++;
                cmds.push({ c: 'L', x: curX, y: curY });
            }
        } else if (c === 'V') {
            while (i < tokens.length && !isLetter(tokens[i])) {
                curY = abs ? +tokens[i] : curY + +tokens[i]; i++;
                cmds.push({ c: 'L', x: curX, y: curY });
            }
        } else if (c === 'H') {
            while (i < tokens.length && !isLetter(tokens[i])) {
                curX = abs ? +tokens[i] : curX + +tokens[i]; i++;
                cmds.push({ c: 'L', x: curX, y: curY });
            }
        } else if (c === 'C') {
            while (i < tokens.length && !isLetter(tokens[i])) {
                // Need 6 consecutive numbers for each cubic bezier
                let has6 = true;
                for (let k = 0; k < 6; k++) {
                    if (i + k >= tokens.length || isLetter(tokens[i + k])) {
                        has6 = false; break;
                    }
                }
                if (!has6) break;

                const cx1 = +tokens[i]; i++;
                const cy1 = +tokens[i]; i++;
                const cx2 = +tokens[i]; i++;
                const cy2 = +tokens[i]; i++;
                const cx = +tokens[i]; i++;
                const cy = +tokens[i]; i++;

                cmds.push({
                    c: 'C',
                    x1: abs ? cx1 : curX + cx1, y1: abs ? cy1 : curY + cy1,
                    x2: abs ? cx2 : curX + cx2, y2: abs ? cy2 : curY + cy2,
                    x: abs ? cx : curX + cx, y: abs ? cy : curY + cy
                });
                curX = abs ? cx : curX + cx;
                curY = abs ? cy : curY + cy;
            }
        }
    }

    const lens = [];
    let total = 0, px = 0, py = 0;

    for (const cmd of cmds) {
        let len = 0;
        if (cmd.c === 'M') {
            // no length
        } else if (cmd.c === 'L') {
            len = Math.hypot(cmd.x - px, cmd.y - py);
        } else if (cmd.c === 'C') {
            let bx = px, by = py;
            for (let s = 1; s <= 20; s++) {
                const t = s / 20, u = 1 - t;
                const cx = u*u*u*px + 3*u*u*t*cmd.x1 + 3*u*t*t*cmd.x2 + t*t*t*cmd.x;
                const cy = u*u*u*py + 3*u*u*t*cmd.y1 + 3*u*t*t*cmd.y2 + t*t*t*cmd.y;
                len += Math.hypot(cx - bx, cy - by);
                bx = cx; by = cy;
            }
        }
        lens.push(len);
        total += len;
        px = cmd.x ?? px;
        py = cmd.y ?? py;
    }

    const pts = [new THREE.Vector2(0, 0)];
    px = 0; py = 0;
    let ci = 0, done = 0;

    for (let p = 1; p < nPoints; p++) {
        const target = (p / (nPoints - 1)) * total;
        while (ci < cmds.length && done + lens[ci] < target) {
            done += lens[ci];
            const cc = cmds[ci];
            if (cc.c !== 'M') { px = cc.x; py = cc.y; }
            ci++;
        }

        const seg = cmds[ci];
        const t = lens[ci] > 0 ? (target - done) / lens[ci] : 1;
        let sx, sy;

        if (seg.c === 'M' || seg.c === 'L') {
            sx = px + (seg.x - px) * t;
            sy = py + (seg.y - py) * t;
        } else if (seg.c === 'C') {
            const u = 1 - t;
            sx = u*u*u*px + 3*u*u*t*seg.x1 + 3*u*t*t*seg.x2 + t*t*t*seg.x;
            sy = u*u*u*py + 3*u*u*t*seg.y1 + 3*u*t*t*seg.y2 + t*t*t*seg.y;
        }

        // Clamp near-zero X to exactly 0 to prevent floating-point artifacts in LatheGeometry
        if (Math.abs(sx) < 1e-10) sx = 0;
        pts.push(new THREE.Vector2(sx * scale, -sy * scale));
    }

    return pts;
}
