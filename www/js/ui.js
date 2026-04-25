// ui.js - UI constants and rendering utilities

export const pieceUnicode = {
    'K': '♚\uFE0E', 'Q': '♛\uFE0E', 'R': '♜\uFE0E', 'B': '♝\uFE0E', 'N': '♞\uFE0E', 'P': '♟\uFE0E',
    'k': '♚\uFE0E', 'q': '♛\uFE0E', 'r': '♜\uFE0E', 'b': '♝\uFE0E', 'n': '♞\uFE0E', 'p': '♟\uFE0E'
};

export const pieceValues = { 'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0 };

export function calculateScore(capturedList) {
    return capturedList.reduce((sum, piece) => sum + (pieceValues[piece.toUpperCase()] || 0), 0);
}

export function isWhitePiece(piece) {
    return piece === piece.toUpperCase();
}

export const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";