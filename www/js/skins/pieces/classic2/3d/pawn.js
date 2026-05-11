// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import { rotator } from '../../rotator.js';

export function buildPawn(group, mat, scale = 0.0095) {
    const pathData = "M0 0 20 0 20-5 15-5C15-10 15-5 10-10L10-10C5-20 5-35 10-40 18-41 16-44 10-45L5-45C0-45 3-50 5-50M5-50C10-52 10-65 0-65";
    group.add(rotator(pathData, mat, scale));
}


