// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Skins Module - Skin registry and management for visual themes.
// Handles skin definitions, switching, CSS variable application,
// and asset preloading for image-based skins.
//

import { getActiveSkinId, setActiveSkinId } from './storage.js';

export const STORAGE_KEY_ACTIVE_SKIN = 'chess_active_skin';
export const DEFAULT_SKIN_ID = 'classic';

const SKIN_DEFINITIONS = [
    {
        id: 'classic',
        name: 'Classic',
        type: '2d',
        theme: {
            whiteSquare: '#f0d9b5',
            blackSquare: '#b58863',
            highlight: '#f1c40f',
            pieceWhite: '#ffffff',
            pieceBlack: '#000000'
        },
        pieceSet: { type: 'unicode' }
    },
    {
        id: 'wood',
        name: 'Wood',
        type: '2d',
        theme: {
            whiteSquare: '#deb887',
            blackSquare: '#8b5e3c',
            highlight: '#ffd700',
            pieceWhite: '#ffffff',
            pieceBlack: '#2c1810'
        },
        pieceSet: { type: 'unicode' }
    },
    // Disabled temporarily — needs proper 3D rendering via WebGL/Three.js
    // {
    //     id: '3d-classic',
    //     name: '3D Classic',
    //     type: '3d',
    //     theme: {
    //         whiteSquare: '#e8dcc8',
    //         blackSquare: '#6b4c2a',
    //         highlight: '#ffd700',
    //         pieceWhite: '#ffffff',
    //         pieceBlack: '#1a1a1a'
    //     },
    //     pieceSet: { type: 'unicode' }
    // },
    // // Disabled temporarily — needs proper image assets
    // {
    //     id: 'pokemon',
    //     name: 'Pokemon',
    //     type: '2d',
    //     theme: {
    //         whiteSquare: '#78C850',
    //         blackSquare: '#A8B820',
    //         highlight: '#F8D030',
    //         pieceWhite: '#ffffff',
    //         pieceBlack: '#1a1a1a'
    //     },
    //     pieceSet: {
    //         type: 'image',
    //         mapping: {
    //             'K': 'assets/skins/pokemon/pikachu_king.svg',
    //             'Q': 'assets/skins/pokemon/mewtwo_queen.svg',
    //             'R': 'assets/skins/pokemon/charizard_rook.svg',
    //             'B': 'assets/skins/pokemon/jigglypuff_bishop.svg',
    //             'N': 'assets/skins/pokemon/rapidash_knight.svg',
    //             'P': 'assets/skins/pokemon/eevee_pawn.svg',
    //             'k': 'assets/skins/pokemon/meowth_king.svg',
    //             'q': 'assets/skins/pokemon/absol_queen.svg',
    //             'r': 'assets/skins/pokemon/tyranitar_rook.svg',
    //             'b': 'assets/skins/pokemon/haunter_bishop.svg',
    //             'n': 'assets/skins/pokemon/sneasel_knight.svg',
    //             'p': 'assets/skins/pokemon/zubat_pawn.svg'
    //         }
    //     }
    // }
];

/**
 * SkinRegistry - Manages skin definitions and active skin state.
 */
export class SkinRegistry {
    constructor() {
        this.skins = new Map();
        this.activeSkinId = null;
    }

    register(skin) {
        this.skins.set(skin.id, skin);
    }

    get(skinId) {
        return this.skins.get(skinId) || null;
    }

    getAll() {
        return Array.from(this.skins.values());
    }

    setActive(skinId) {
        if (!this.skins.has(skinId)) return false;
        this.activeSkinId = skinId;
        return true;
    }

    getActive() {
        return this.skins.get(this.activeSkinId) || null;
    }

    applyActive() {
        const skin = this.getActive();
        if (!skin) return;
        this.applySkin(skin);
    }

    applySkin(skin) {
        const root = document.documentElement;
        if (skin.theme) {
            if (skin.theme.whiteSquare) root.style.setProperty('--board-white', skin.theme.whiteSquare);
            if (skin.theme.blackSquare) root.style.setProperty('--board-black', skin.theme.blackSquare);
            if (skin.theme.highlight) root.style.setProperty('--board-highlight', skin.theme.highlight);
            if (skin.theme.pieceWhite) root.style.setProperty('--piece-white', skin.theme.pieceWhite);
            if (skin.theme.pieceBlack) root.style.setProperty('--piece-black', skin.theme.pieceBlack);
        }
    }

    preloadAssets(skinId) {
        const skin = this.skins.get(skinId);
        if (!skin || skin.pieceSet.type !== 'image' || !skin.pieceSet.mapping) return;
        Object.values(skin.pieceSet.mapping).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
}

export const skinRegistry = new SkinRegistry();

SKIN_DEFINITIONS.forEach(skin => skinRegistry.register(skin));

export function initializeSkin() {
    const savedId = getActiveSkinId();
    if (!skinRegistry.setActive(savedId)) {
        skinRegistry.setActive(DEFAULT_SKIN_ID);
    }
    skinRegistry.applyActive();
    // Preload next likely skins (image-based ones) on startup
    skinRegistry.getAll().forEach(skin => {
        if (skin.pieceSet && skin.pieceSet.type === 'image') {
            skinRegistry.preloadAssets(skin.id);
        }
    });
    return skinRegistry.getActive();
}

export function switchSkin(skinId) {
    // Fallback: if skin doesn't exist, revert to default
    if (!skinRegistry.skins.has(skinId)) {
        console.warn('Skin "' + skinId + '" not found, falling back to "' + DEFAULT_SKIN_ID + '"');
        skinId = DEFAULT_SKIN_ID;
    }

    if (!skinRegistry.setActive(skinId)) return false;
    setActiveSkinId(skinId);
    skinRegistry.applyActive();

    // Preload image assets for this skin
    skinRegistry.preloadAssets(skinId);

    const skin = skinRegistry.getActive();
    const is3d = skin && skin.type === '3d';

    // Toggle UI components for 3D mode
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.style.display = is3d ? 'none' : '';

    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) infoPanel.style.display = is3d ? 'none' : '';

    // Hide board labels in 3D mode (they don't work with perspective)
    ['board-labels-top', 'board-labels-bottom', 'board-labels-left', 'board-labels-right'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = is3d ? 'none' : '';
    });

    // Force layout reflow so visibility changes take effect before sizing
    document.body.offsetWidth;

    // Recalculate board size BEFORE rendering so grid template is correct
    if (typeof window.updateBoardSize === 'function') {
        window.updateBoardSize();
    }

    if (typeof renderBoard === 'function') renderBoard();
    return true;
}
