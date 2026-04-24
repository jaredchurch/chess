// index.js - Chess WASM Bridge Demo
import init, { get_legal_moves, apply_move, get_best_move_wasm, get_game_state } from './pkg/chess_core.js';

let currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let selectedSquare = null;
let legalMoves = [];

const pieceUnicode = {
    'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

async function start() {
    await init();
    updateUI();
}

function updateUI() {
    const gameState = get_game_state(currentFen);
    const statusEl = document.getElementById('status');
    const fenEl = document.getElementById('fen');
    
    fenEl.innerText = currentFen;

    if (gameState.is_checkmate) {
        statusEl.innerText = `Checkmate! ${gameState.side_to_move === 'w' ? 'Black' : 'White'} wins.`;
    } else if (gameState.is_draw) {
        statusEl.innerText = "Draw!";
    } else {
        statusEl.innerText = `${gameState.side_to_move === 'w' ? 'White' : 'Black'}'s turn${gameState.is_check ? ' (Check!)' : ''}`;
        
        if (gameState.side_to_move === 'b' && !gameState.is_checkmate && !gameState.is_draw) {
            // Trigger AI move after a short delay
            setTimeout(makeAiMove, 500);
        }
    }

    renderBoard();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    const pieces = parseFenPieces(currentFen);
    legalMoves = get_legal_moves(currentFen) || [];

    for (let rank = 7; rank >= 0; rank--) {
        for (let file = 0; file < 8; file++) {
            const squareName = String.fromCharCode(97 + file) + (rank + 1);
            const squareEl = document.createElement('div');
            squareEl.className = `square ${(rank + file) % 2 === 0 ? 'black' : 'white'}`;
            if (selectedSquare === squareName) squareEl.classList.add('highlight');
            
            const piece = pieces[squareName];
            if (piece) {
                squareEl.innerText = pieceUnicode[piece];
                squareEl.classList.add(piece === piece.toUpperCase() ? 'piece-white' : 'piece-black');
            }

            squareEl.onclick = () => handleSquareClick(squareName);
            boardEl.appendChild(squareEl);
        }
    }
}

function handleSquareClick(square) {
    if (selectedSquare === square) {
        selectedSquare = null;
    } else if (selectedSquare) {
        const move = legalMoves.find(m => m.from === selectedSquare && m.to === square);
        if (move) {
            const nextFen = apply_move(currentFen, move);
            if (nextFen) {
                currentFen = nextFen;
                selectedSquare = null;
                updateUI();
                return;
            }
        }
        selectedSquare = square;
    } else {
        selectedSquare = square;
    }
    renderBoard();
}

function makeAiMove() {
    const move = get_best_move_wasm(currentFen);
    if (move) {
        const nextFen = apply_move(currentFen, move);
        if (nextFen) {
            currentFen = nextFen;
            updateUI();
        }
    }
}

function parseFenPieces(fen) {
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

window.resetGame = () => {
    currentFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    selectedSquare = null;
    updateUI();
};

start();
