// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// 3D Pieces Module - Generates inline SVGs for all 3D chess pieces with
// gradient-based shading. Each piece shares a common tapered body with a
// distinctive top. Supports white and black.
//

const PIECE_COLORS = {
    white: {
        body: '#f5f5f5', highlight: '#ffffff', midtone: '#e0e0e0',
        shadow: '#b0b0b0', h: '#ffffff', s: '#999999', isWhite: true,
    },
    black: {
        body: '#1a1a1a', highlight: '#3a3a3a', midtone: '#252525',
        shadow: '#0a0a0a', h: '#4a4a4a', s: '#000000', isWhite: false,
    }
};

const S = 1.33;
const y = (val) => Math.round(val * S);

function buildDefs(gradId, c) {
    return `<defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${c.highlight}"/>
            <stop offset="25%" stop-color="${c.h}"/>
            <stop offset="50%" stop-color="${c.body}"/>
            <stop offset="80%" stop-color="${c.midtone}"/>
            <stop offset="100%" stop-color="${c.shadow}"/>
        </linearGradient>
    </defs>`;
}

function commonBody(gradId, c) {
    const s = c.s;
    const br = 22;
    const bl = 50 - br, bR = 50 + br;
    const shadow = c.isWhite ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.2)';
    return `
        <ellipse cx="50" cy="${y(100)}" rx="${br}" ry="${y(6)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <path d="M${bl} ${y(100)} Q${bl} ${y(72)} 32 ${y(60)} L34 ${y(54)} Q34 ${y(42)} 28 ${y(36)} L28 ${y(34)} Q38 ${y(35)} 50 ${y(36)} Q62 ${y(35)} 72 ${y(34)} L72 ${y(36)} Q66 ${y(42)} 66 ${y(54)} L68 ${y(60)} Q${bR} ${y(72)} ${bR} ${y(100)} Z" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <ellipse cx="50" cy="${y(100)}" rx="${br}" ry="${y(3)}" fill="${shadow}"/>`;
}

function commonCollar(gradId, c, cy, rx) {
    const s = c.s;
    return `<ellipse cx="50" cy="${y(cy)}" rx="${rx}" ry="${y(2.5)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>`;
}

function kingTop(gradId, c) {
    const s = c.s;
    return `
        <rect x="40" y="${y(20)}" width="20" height="${y(15)}" rx="2" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        ${commonCollar(gradId, c, 20, 12)}
        <path d="M${y(42)} ${y(20)} L${y(42)} ${y(6)} M${y(58)} ${y(20)} L${y(58)} ${y(6)} M50 0 L50 ${y(16)}" stroke="url(#${gradId})" stroke-width="${y(4)}" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="0" r="${y(4)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>`;
}

function queenTop(gradId, c) {
    const s = c.s;
    return `
        <rect x="38" y="${y(20)}" width="24" height="${y(15)}" rx="2" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        ${commonCollar(gradId, c, 20, 14)}
        <path d="M34 ${y(20)} L34 ${y(3)} Q38 ${y(8)} 38 ${y(12)} L42 ${y(3)} Q46 ${y(8)} 46 ${y(12)} L50 ${y(1)} Q54 ${y(8)} 54 ${y(12)} L58 ${y(3)} Q62 ${y(8)} 62 ${y(12)} L66 ${y(3)} L66 ${y(20)} Z" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <circle cx="34" cy="${y(3)}" r="${y(2)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <circle cx="42" cy="${y(3)}" r="${y(2)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <circle cx="50" cy="${y(1)}" r="${y(3)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <circle cx="58" cy="${y(3)}" r="${y(2)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <circle cx="66" cy="${y(3)}" r="${y(2)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <circle cx="50" cy="0" r="${y(3.5)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>`;
}

function rookTop(gradId, c) {
    const s = c.s;
    return `
        <rect x="40" y="${y(14)}" width="20" height="${y(20)}" rx="2" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        ${commonCollar(gradId, c, 14, 12)}
        <rect x="34" y="${y(6)}" width="32" height="${y(8)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <rect x="34" y="0" width="5" height="${y(6)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <rect x="41" y="0" width="5" height="${y(6)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <rect x="48" y="0" width="5" height="${y(6)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <rect x="55" y="0" width="5" height="${y(6)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>`;
}

function bishopTop(gradId, c) {
    const s = c.s;
    return `
        <rect x="42" y="${y(18)}" width="16" height="${y(16)}" rx="2" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        ${commonCollar(gradId, c, 18, 10)}
        <path d="M42 ${y(18)} C44 ${y(10)} 48 ${y(4)} 50 ${y(2)} C52 ${y(4)} 56 ${y(10)} 58 ${y(18)} Z" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <path d="M50 ${y(2)} L50 ${y(8)}" stroke="${s}" stroke-width="${y(1.5)}" fill="none"/>
        <circle cx="50" cy="${y(0.5)}" r="${y(3)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>`;
}

function knightTop(gradId, c) {
    const s = c.s;
    return `
        ${commonCollar(gradId, c, 20, 14)}
        <path d="M36 ${y(20)} C34 ${y(16)} 32 ${y(12)} 30 ${y(8)} C28 ${y(6)} 28 ${y(3)} 30 ${y(2)} C32 ${y(1)} 34 ${y(2)} 36 ${y(6)} C38 ${y(2)} 40 0 42 0 C44 0 44 ${y(2)} 42 ${y(5)} C40 ${y(8)} 40 ${y(12)} 42 ${y(16)} C43 ${y(18)} 44 ${y(20)} 44 ${y(20)} Z" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        <rect x="36" y="${y(6)}" width="${y(1.5)}" height="${y(1.5)}" rx="${y(0.75)}" fill="${c.isWhite ? '#555' : '#666'}"/>`;
}

function pawnTop(gradId, c) {
    const s = c.s;
    return `
        <rect x="42" y="${y(28)}" width="16" height="${y(12)}" rx="2" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>
        ${commonCollar(gradId, c, 28, 10)}
        <circle cx="50" cy="${y(8)}" r="${y(6)}" fill="url(#${gradId})" stroke="${s}" stroke-width="0.5"/>`;
}

const TOPS = {
    K: kingTop, Q: queenTop, R: rookTop,
    B: bishopTop, N: knightTop, P: pawnTop,
};

export function create3dPieceSVG(piece, color) {
    const c = PIECE_COLORS[color] || PIECE_COLORS.white;
    const gradId = 'p' + piece + color;
    const topFn = TOPS[piece] || kingTop;
    const viewH = y(100);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${viewH}" width="100%" height="100%">
        ${buildDefs(gradId, c)}
        ${commonBody(gradId, c)}
        ${topFn(gradId, c)}
    </svg>`;
}
