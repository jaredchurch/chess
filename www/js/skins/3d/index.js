// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// 3D Skin Pieces - Aggregates all 3D piece builders from all skins into a
// single map keyed by skin ID. Renderers import this module instead of
// importing each skin's pieces individually.
//

import * as classicPieces from '../pieces/classic/3d/index.js';
import * as classic2Pieces from '../pieces/classic2/3d/index.js';

export const skin3dPieces = {
    'classic': classicPieces,
    'classic2': classic2Pieces,
};
