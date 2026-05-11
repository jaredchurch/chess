// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Board3DV2 - Alternate 3D chessboard design with a different color scheme.
// Identical structure to Board3D (boards/1) — only square and border colors differ.
// Intended for use in the model viewer only, not in the game.
//

import * as THREE from 'three';
import { Board3D, BORDER_SIZE } from '../1/board.js';

const LIGHT_SQUARE = 0xc8e6c9;
const DARK_SQUARE = 0x2e7d32;
const BORDER_COLOR = 0x795548;

export class Board3DV2 extends Board3D {

    constructor(parentGroup, colors) {
        super(parentGroup, colors || { light: LIGHT_SQUARE, dark: DARK_SQUARE });
    }

    _createBorder() {
        const bMat = new THREE.MeshStandardMaterial({ color: BORDER_COLOR, roughness: 0.8, metalness: 0 });
        const bGeo = new THREE.BoxGeometry(BORDER_SIZE, 0.12, BORDER_SIZE);
        const border = new THREE.Mesh(bGeo, bMat);
        border.position.set(0, -0.08, 0);
        border.receiveShadow = true;
        this.group.add(border);
    }
}
