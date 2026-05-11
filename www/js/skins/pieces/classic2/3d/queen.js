// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Classic 3D Queen - Low-poly queen piece geometry builder using SVG path lathe.
// SVG path designed with: https://yqnn.github.io/svg-path-editor/

import { rotator } from '../../rotator.js';


export function buildQueen(group, mat, scale = 0.019) {
    const pathData = "M0 0 13 0 13-3 12-3C12-4 13-5 12-6 11-7 10.6667-8 10-9 10-9.6667 11-10 10-11 9-12 3-16 5-32 10-32 11-35 9-35 6-35 12-37 7-37 9-37 9-39 7-39 10-49 13-57 8-53 4-54 3-56 2-56 4-57 4-58 2-58 3-58 3-59 1-59 2-59 1-60 0-60";
    group.add(rotator(pathData, mat, scale));
}
