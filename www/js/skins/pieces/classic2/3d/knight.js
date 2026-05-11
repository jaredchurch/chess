// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Pawn - Low-poly pawn piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import { rotator } from '../../rotator.js';

export function buildKnight(group, mat, scale = 0.015) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 3-16 5-32 10-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39L3-39 3-42 6-42 6-46C5-46 5-47 6-47L6-51C5-51 5-52 6-52L6-56 0-56";

    group.add(rotator(pathData, mat, scale));
}


