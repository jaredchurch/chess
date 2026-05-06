// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Board Module - Handles chess board rendering, square clicks, board orientation,
// and preview board for move history.
//

import { pieceUnicode, isWhitePiece } from './ui.js';
import { getLegalMoves, applyMove, getGameState } from './chess-wasm.js';
import { getCapturedPiece, getBoardStateAtMove } from './game.js';

window.boardOrientation = 'white';
window.selectedSquare = null;
window.legalMoves = [];

/**
 * Updates the board size to maximize available space while keeping squares perfect
 * Handles both mobile and desktop layouts, prevents iPad row height issues (BUG12)
 * Uses pixel-based grid to prevent sub-pixel rendering issues
 */
window.updateBoardSize = function() {
    const board = document.getElementById('board');
    if (!board) return;
    
    // Get actual container dimensions to maximize board size
    const container = document.getElementById('board-container');
    const isMobile = window.innerWidth <= 700;
    
    let maxSize;
    if (isMobile) {
        // On mobile, use full viewport minus status bar and padding
        maxSize = Math.min(window.innerWidth - 20, window.innerHeight - 120);
    } else {
        // On desktop, subtract info panel width from viewport
        const infoPanel = document.getElementById('info-panel');
        const panelWidth = infoPanel ? infoPanel.offsetWidth + 20 : 300;
        const availableWidth = window.innerWidth - panelWidth - 40;
        const availableHeight = window.innerHeight - 140;
        maxSize = Math.min(availableWidth, availableHeight);
    }
    
    // Make board as large as possible while keeping it square
    const size = Math.floor(Math.max(maxSize, 200));
    
    // Calculate square size (ensure it's an integer to prevent sub-pixel rendering)
    const squareSize = Math.floor(size / 8);
    const actualBoardSize = squareSize * 8;
    
    // Reset to exact size that's divisible by 8
    board.style.width = actualBoardSize + 'px';
    board.style.height = actualBoardSize + 'px';
    
    // Use pixel-based grid to prevent iPad row height changes (BUG12 fix)
    board.style.gridTemplateColumns = `repeat(8, ${squareSize}px)`;
    board.style.gridTemplateRows = `repeat(8, ${squareSize}px)`;
    
    // Set font size based on square size for piece rendering
    board.style.fontSize = Math.floor(squareSize * 0.8) + 'px';
    
    // Update label sizes to match board
    if (typeof window.updateBoardLabels === 'function') {
        window.updateBoardLabels();
    }
};

/**
 * Updates the algebraic notation labels (a-h, 1-8) around the board
 * Adjusts font size to match board square size
 */
window.updateBoardLabels = function() {
    const board = document.getElementById('board');
    if (!board) return;
    
    const boardWidth = parseInt(board.style.width);
    if (!boardWidth || isNaN(boardWidth)) return;
    
    const squareSize = Math.floor(boardWidth / 8);
    const fontSize = Math.max(Math.floor(squareSize * 0.25), 10);
    const labelsVisible = localStorage.getItem('chess_show_board_labels') !== 'false';
    
    // Files (a-h) top and bottom
    const files = window.boardOrientation === 'white' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
    ['board-labels-top', 'board-labels-bottom'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = labelsVisible ? 'flex' : 'none';
        el.style.fontSize = fontSize + 'px';
        el.innerHTML = files.map(f => `<div style="width:${squareSize}px;text-align:center;">${f}</div>`).join('');
    });
    
    // Ranks (1-8) left and right
    const ranks = window.boardOrientation === 'white' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
    ['board-labels-left', 'board-labels-right'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = labelsVisible ? 'flex' : 'none';
        el.style.fontSize = fontSize + 'px';
        el.innerHTML = ranks.map(r => `<div style="height:${squareSize}px;display:flex;align-items:center;">${r}</div>`).join('');
    });
};

// Debounced resize handler to prevent excessive recalculations
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => requestAnimationFrame(window.updateBoardSize), 100);
});

/**
 * Initializes panels to show by default on page load
 */
window.initPanels = function() {
    const historyWrapper = document.getElementById('history-card-wrapper');
    if (historyWrapper) historyWrapper.classList.remove('panel-hidden');
};

/**
 * Flips the board orientation (white/black perspective)
 * Useful for players who want to see the board from the opponent's view
 */
window.flipBoard = () => {
    window.boardOrientation = window.boardOrientation === 'white' ? 'black' : 'white';
    if (typeof renderBoard === 'function') renderBoard();
    window.updateBoardLabels();
};

/**
 * Renders the chess board with pieces, highlights, and click handlers
 * Creates squares based on current board orientation
 */
export function renderBoard() {
    const boardEl = document.getElementById('board');
    if (!boardEl) {
        console.warn('Board element not found');
        return;
    }
    boardEl.innerHTML = '';

    const pieces = parseFenPieces(window.currentFen);
    window.legalMoves = getLegalMoves(window.currentFen) || [];

    const ranks = window.boardOrientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const files = window.boardOrientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    ranks.forEach((rank, ri) => {
        files.forEach((file, fi) => {
            const squareName = String.fromCharCode(97 + file) + (rank + 1);
            const squareEl = document.createElement('div');
            squareEl.className = `square ${(ri + fi) % 2 === 0 ? 'black-square' : 'white-square'}`;
            if (window.selectedSquare === squareName) squareEl.classList.add('highlight');
            
            const piece = pieces[squareName];
            if (piece) {
                squareEl.innerText = pieceUnicode[piece];
                squareEl.classList.add(piece === piece.toUpperCase() ? 'piece-white' : 'piece-black');
            }

            squareEl.onclick = () => handleSquareClick(squareName);
            boardEl.appendChild(squareEl);
        });
    });
}

/**
 * Parses FEN string to extract piece positions
 * Returns object mapping square names (e.g., 'e4') to piece characters
 * @param {string} fen - FEN string
 * @returns {Object} Map of square to piece
 */
export function parseFenPieces(fen) {
    const pieces = {};
    let rank = 7, file = 0;
    for (const ch of fen.split(' ')[0]) {
        if (ch === '/') { rank--; file = 0; }
        else if (ch >= '1' && ch <= '8') { file += parseInt(ch); }
        else { pieces[String.fromCharCode(97 + file) + (rank + 1)] = ch; file++; }
    }
    return pieces;
}

/**
 * Handles clicking on a chess board square
 * Manages piece selection, move validation, and executing moves
 * @param {string} square - The clicked square (e.g., 'e4')
 */
export function handleSquareClick(square) {
    if (window.selectedSquare === square) {
        window.selectedSquare = null;
    } else if (window.selectedSquare) {
        const move = window.legalMoves.find(m => m.from === window.selectedSquare && m.to === square);
        if (move) {
            // TODO 20: Handle promotion - let user choose piece
            if (move.promotion) {
                showPromotionDialog(move);
                return;
            }
            makeMove(move);
        } else {
            window.selectedSquare = square;
        }
    } else {
        window.selectedSquare = square;
    }
    renderBoard();
}

// TODO 20: Show promotion piece selection dialog
function showPromotionDialog(move) {
    let dialog = document.getElementById('promotion-dialog');
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'promotion-dialog';
        dialog.innerHTML = `
            <div class="promotion-content">
                <div class="promotion-header">Choose promotion piece:</div>
                <div class="promotion-options">
                    <button class="promotion-btn" data-piece="q">♕ Queen</button>
                    <button class="promotion-btn" data-piece="r">♖ Rook</button>
                    <button class="promotion-btn" data-piece="b">♗ Bishop</button>
                    <button class="promotion-btn" data-piece="n">♘ Knight</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.onclick = (e) => {
            if (e.target === dialog) closePromotionDialog();
        };
    }
    
    // Store the move and handle selection
    window.pendingPromotionMove = move;
    dialog.querySelectorAll('.promotion-btn').forEach(btn => {
        btn.onclick = () => {
            const piece = btn.dataset.piece;
            window.pendingPromotionMove.promotion = piece;
            closePromotionDialog();
            makeMove(window.pendingPromotionMove);
            window.pendingPromotionMove = null;
        };
    });
    
    dialog.style.display = 'flex';
}

window.closePromotionDialog = function() {
    const dialog = document.getElementById('promotion-dialog');
    if (dialog) dialog.style.display = 'none';
}

// Helper function to execute a move
function makeMove(move) {
    if (typeof window.recordMoveTime === 'function') window.recordMoveTime();
    if (typeof window.stopMoveTimer === 'function') window.stopMoveTimer();
    
    const nextFen = applyMove(window.currentFen, move);
    if (nextFen) {
        if (typeof window.saveCurrentGame === 'function') {
            window.saveCurrentGame(window.selectedSquare, move.to, move.promotion);
        }
        window.currentFen = nextFen;
        window.selectedSquare = null;
        window.moveStartTime = Date.now();
        if (typeof window.updateUI === 'function') window.updateUI();
        if (typeof window.startMoveTimer === 'function') window.startMoveTimer();
    }
}

/**
 * Renders a preview board for move history review
 * Highlights the from/to squares of the reviewed move
 * @param {HTMLElement} boardEl - The board element to render into
 * @param {string} fen - FEN string of the position
 * @param {string} highlightFrom - Square to highlight as move origin
 * @param {string} highlightTo - Square to highlight as move destination
 */
export function renderPreviewBoard(boardEl, fen, highlightFrom, highlightTo) {
    boardEl.innerHTML = '';
    
    // Set up grid layout for the preview board
    const squareSize = Math.floor(parseInt(getComputedStyle(boardEl).width) / 8);
    boardEl.style.gridTemplateColumns = `repeat(8, ${squareSize}px)`;
    boardEl.style.gridTemplateRows = `repeat(8, ${squareSize}px)`;
    
    const pieces = parseFenPieces(fen);
    
    const ranks = window.boardOrientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const files = window.boardOrientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    ranks.forEach((rank, ri) => {
        files.forEach((file, fi) => {
            const squareName = String.fromCharCode(97 + file) + (rank + 1);
            const squareEl = document.createElement('div');
            const isHighlight = squareName === highlightFrom || squareName === highlightTo;
            squareEl.className = `square ${(ri + fi) % 2 === 0 ? 'black-square' : 'white-square'}${isHighlight ? ' highlight' : ''}`;
            
            const piece = pieces[squareName];
            if (piece) {
                squareEl.innerText = pieceUnicode[piece];
                squareEl.classList.add(piece === piece.toUpperCase() ? 'piece-white' : 'piece-black');
            }

            boardEl.appendChild(squareEl);
        });
    });
}

/**
 * Shows a preview dialog for a specific move in the game history
 * Allows players to review past positions
 * @param {number} moveIndex - Index of the move to preview
 */
export function showMovePreview(moveIndex) {
    const state = getBoardStateAtMove(moveIndex);
    const move = window.currentGame.moves[moveIndex];
    const from = move.coords.substring(0, 2);
    const to = move.coords.substring(2, 4);
    
    // Create or show dialog
    let dialog = document.getElementById('preview-dialog');
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'preview-dialog';
        dialog.innerHTML = `
            <div class="preview-content">
                <div class="preview-header">
                    <span id="preview-title"></span>
                    <button class="preview-close" onclick="closePreviewDialog()">&times;</button>
                </div>
                <div id="preview-board"></div>
                <div class="preview-fen">
                    <span id="preview-fen-text"></span>
                    <button id="preview-copy-fen" onclick="copyPreviewFen()">Copy FEN</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.onclick = (e) => {
            if (e.target === dialog) window.closePreviewDialog();
        };
    }
    
    const title = document.getElementById('preview-title');
    if (title) {
        title.textContent = `Move ${Math.floor(moveIndex / 2) + 1} ${moveIndex % 2 === 0 ? 'White' : 'Black'}`;
    }
    
    const previewBoard = document.getElementById('preview-board');
    if (previewBoard) {
        renderPreviewBoard(previewBoard, state.fen, from, to);
    }
    
    // TODO 19: Show FEN for the position
    const fenText = document.getElementById('preview-fen-text');
    if (fenText) {
        fenText.textContent = state.fen;
        fenText.title = 'Click "Copy FEN" to copy this position';
    }
    
    window.currentPreviewFen = state.fen;
    dialog.style.display = 'flex';
}

// TODO 19: Copy FEN to clipboard
window.copyPreviewFen = function() {
    if (window.currentPreviewFen) {
        navigator.clipboard.writeText(window.currentPreviewFen).then(() => {
            const btn = document.getElementById('preview-copy-fen');
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = originalText; }, 1500);
            }
        }).catch(err => console.warn('Failed to copy FEN:', err));
    }
};

/**
 * Closes the move preview dialog
 */
window.closePreviewDialog = function() {
    const dialog = document.getElementById('preview-dialog');
    if (dialog) dialog.style.display = 'none';
};
