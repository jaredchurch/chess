// ui.js - Chess board rendering and UI management

import { 
    getCurrentFen, setCurrentFen, getSelectedSquare, setSelectedSquare,
    getCurrentGame, getCapturedPieces, getBoardOrientation, getMoveStartTime,
    setMoveStartTime, getCapturedPiece, getInitialFen, getCurrentFen
} from './game.js';

const pieceUnicode = {
    'K': '♚\uFE0E', 'Q': '♛\uFE0E', 'R': '♜\uFE0E', 'B': '♝\uFE0E', 'N': '♞\uFE0E', 'P': '♟\uFE0E',
    'k': '♚\uFE0E', 'q': '♛\uFE0E', 'r': '♜\uFE0E', 'b': '♝\uFE0E', 'n': '♞\uFE0E', 'p': '♟\uFE0E'
};

const pieceValues = { 'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0 };

export function renderBoard() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const pieces = parseFenPieces(getCurrentFen());
    const legalMoves = get_legal_moves(getCurrentFen()) || [];
    const boardOrientation = getBoardOrientation();

    const ranks = boardOrientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const files = boardOrientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    ranks.forEach((rank, ri) => {
        files.forEach((file, fi) => {
            const squareName = String.fromCharCode(97 + file) + (rank + 1);
            const squareEl = document.createElement('div');
            squareEl.className = `square ${(ri + fi) % 2 === 0 ? 'black-square' : 'white-square'}`;
            if (getSelectedSquare() === squareName) squareEl.classList.add('highlight');
            
            const piece = pieces[squareName];
            if (piece) {
                squareEl.innerText = pieceUnicode[piece];
                squareEl.classList.add(piece === piece.toUpperCase() ? 'piece-white' : 'piece-black');
            }

            squareEl.onclick = () => handleSquareClick(squareName, legalMoves);
            boardEl.appendChild(squareEl);
        });
    });
}

export function handleSquareClick(square, legalMoves) {
    const selectedSquare = getSelectedSquare();
    
    if (selectedSquare === square) {
        setSelectedSquare(null);
    } else if (selectedSquare) {
        const move = legalMoves.find(m => m.from === selectedSquare && m.to === square);
        if (move) {
            const nextFen = apply_move(getCurrentFen(), move);
            if (nextFen) {
                const durationMs = Date.now() - getMoveStartTime();
                saveMoveToGame(selectedSquare, square, durationMs);
                setCurrentFen(nextFen);
                setSelectedSquare(null);
                setMoveStartTime(Date.now());
                updateUI();
                return;
            }
        }
        setSelectedSquare(square);
    } else {
        setSelectedSquare(square);
    }
    renderBoard();
}

function saveMoveToGame(from, to, durationMs) {
    import('./game.js').then(({ saveMove, finishGame, getGameState, getCurrentGame }) => {
        const { getCurrentFen } = await import('./game.js');
        saveMove(from, to, durationMs);
        
        const gameState = getGameState(getCurrentFen());
        const currentGame = getCurrentGame();
        
        if (gameState.is_checkmate) {
            const winner = gameState.side_to_move === 'w' ? 'Black' : 'White';
            const result = gameState.side_to_move === 'w' ? 'win_black' : 'win_white';
            updateStatus(`Checkmate! ${winner} wins.`);
            finishGame(result, 'checkmate');
        } else if (gameState.is_draw) {
            updateStatus("Draw!");
            finishGame('draw', 'stalemate');
        }
    });
}

export function parseFenPieces(fen) {
    const placement = fen.split(' ')[0];
    const rows = placement.split('/');
    const pieces = {};

    rows.forEach((row, i) => {
        const rank = 8 - i;
        let file = 0;
        for (const char of row) {
            if (isNaN(char)) {
                const squareName = String.fromCharCode(97 + file) + rank;
                pieces[squareName] = char;
                file++;
            } else {
                file += parseInt(char);
            }
        }
    });
    return pieces;
}

export function updateUI() {
    const gameState = get_game_state(getCurrentFen());
    const statusEl = document.getElementById('status');
    if (!statusEl) return;

    if (gameState.is_checkmate) {
        const winner = gameState.side_to_move === 'w' ? 'Black' : 'White';
        updateStatus(`Checkmate! ${winner} wins.`);
    } else if (gameState.is_draw) {
        updateStatus("Draw!");
    } else {
        const turn = gameState.side_to_move === 'w' ? 'White' : 'Black';
        updateStatus(`${turn}'s turn${gameState.is_check ? ' (Check!)' : ''}`);
    }

    renderBoard();
    updateScoreCard();
    updateMoveHistoryCard();
}

function updateStatus(text) {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerText = text;
}

export function updateScoreCard() {
    const scoreCard = document.getElementById('score-card');
    if (!scoreCard) return;
    
    const captured = getCapturedPieces();
    const whiteScore = calculateScore(captured.white);
    const blackScore = calculateScore(captured.black);
    
    scoreCard.innerHTML = `
        <div class="score-section">
            <div class="score-title">White</div>
            <div class="score-value">+${whiteScore}</div>
            <div class="captured-pieces">${captured.white.map(p => 
                `<span class="${p === p.toUpperCase() ? 'piece-white' : 'piece-black'}">${pieceUnicode[p]}</span>`
            ).join('')}</div>
        </div>
        <div class="score-section">
            <div class="score-title">Black</div>
            <div class="score-value">+${blackScore}</div>
            <div class="captured-pieces">${captured.black.map(p => 
                `<span class="${p === p.toUpperCase() ? 'piece-white' : 'piece-black'}">${pieceUnicode[p]}</span>`
            ).join('')}</div>
        </div>
    `;
}

function calculateScore(capturedList) {
    return capturedList.reduce((sum, piece) => {
        return sum + (pieceValues[piece.toUpperCase()] || 0);
    }, 0);
}

export function updateMoveHistoryCard() {
    const historyCard = document.getElementById('move-history');
    if (!historyCard || !getCurrentGame()) return;
    
    const moves = getCurrentGame().moves;
    let html = '';
    
    for (let i = 0; i < moves.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = moves[i] ? moves[i].coords : '';
        const blackMove = moves[i + 1] ? moves[i + 1].coords : '';
        
        html += `<div class="move-row">
            <span class="move-number">${moveNum}.</span>
            <span class="move-item" data-move-index="${i}">${whiteMove}</span>
            <span class="move-item" data-move-index="${i + 1}">${blackMove}</span>
        </div>`;
    }
    
    historyCard.innerHTML = html || '';
    
    historyCard.querySelectorAll('.move-item').forEach(el => {
        el.onclick = () => {
            const idx = parseInt(el.dataset.moveIndex);
            showMovePreview(idx);
        };
    });
}

export function showMovePreview(moveIndex) {
    const state = getBoardStateAtMove(moveIndex);
    const move = getCurrentGame().moves[moveIndex];
    if (!move) return;
    
    const from = move.coords.substring(0, 2);
    const to = move.coords.substring(2, 4);
    
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
            </div>
        `;
        dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;';
        dialog.onclick = (e) => { if (e.target === dialog) closePreviewDialog(); };
        document.body.appendChild(dialog);
    }
    
    const title = document.getElementById('preview-title');
    if (title) {
        title.textContent = `Move ${Math.floor(moveIndex / 2) + 1} ${moveIndex % 2 === 0 ? 'White' : 'Black'}`;
    }
    
    const previewBoard = document.getElementById('preview-board');
    if (previewBoard) {
        renderPreviewBoard(previewBoard, state.fen, from, to);
    }
}

export function closePreviewDialog() {
    const dialog = document.getElementById('preview-dialog');
    if (dialog) dialog.style.display = 'none';
}

export function renderPreviewBoard(boardEl, fen, highlightFrom, highlightTo) {
    boardEl.innerHTML = '';
    const pieces = parseFenPieces(fen);
    const boardOrientation = getBoardOrientation();
    
    const ranks = boardOrientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const files = boardOrientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

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