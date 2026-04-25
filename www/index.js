// index.js - Chess WASM Bridge with Game Storage
import init, { 
    get_legal_moves, 
    apply_move, 
    get_best_move_wasm, 
    get_game_state
} from './pkg/chess_core.js';

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const STORAGE_KEY_PROFILES = "chess_profiles";
const STORAGE_KEY_ACTIVE_PROFILE = "chess_active_profile";

let currentFen = INITIAL_FEN;
let selectedSquare = null;
let legalMoves = [];
let currentGame = null;
let moveStartTime = Date.now();
let activeProfile = null;

const pieceUnicode = {
    'K': '♚\uFE0E', 'Q': '♛\uFE0E', 'R': '♜\uFE0E', 'B': '♝\uFE0E', 'N': '♞\uFE0E', 'P': '♟\uFE0E',
    'k': '♚\uFE0E', 'q': '♛\uFE0E', 'r': '♜\uFE0E', 'b': '♝\uFE0E', 'n': '♞\uFE0E', 'p': '♟\uFE0E'
};

function localStorage() {
    return window.localStorage;
}

function getStorageItem(key) {
    try {
        return localStorage().getItem(key);
    } catch (e) {
        return null;
    }
}

function setStorageItem(key, value) {
    try {
        localStorage().setItem(key, value);
        return true;
    } catch (e) {
        return false;
    }
}

async function start() {
    await init();
    initializeProfile();
    restoreInProgressGame();
    updateUI();
}

function initializeProfile() {
    try {
        let profileId = getStorageItem(STORAGE_KEY_ACTIVE_PROFILE);
        let profilesJson = getStorageItem(STORAGE_KEY_PROFILES);
        let profiles = profilesJson ? JSON.parse(profilesJson) : [];
        
        if (profileId) {
            activeProfile = profiles.find(p => p.id === profileId) || null;
        }
        
        if (!activeProfile) {
            profileId = generateUUID();
            activeProfile = {
                id: profileId,
                name: "Player",
                created_at: Date.now()
            };
            profiles.push(activeProfile);
            setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
            setStorageItem(STORAGE_KEY_ACTIVE_PROFILE, profileId);
        }
    } catch (e) {
        console.warn("Profile init failed:", e);
    }
}

function restoreInProgressGame() {
    try {
        if (!activeProfile) return;
        
        const key = `chess_games_${activeProfile.id}`;
        const gamesJson = getStorageItem(key);
        const games = gamesJson ? JSON.parse(gamesJson) : [];
        const inProgress = games.find(g => g.result === "in_progress");
        
        if (inProgress) {
            currentGame = inProgress;
            
            if (inProgress.moves && inProgress.moves.length > 0) {
                let fen = INITIAL_FEN;
                for (const moveRecord of inProgress.moves) {
                    const moveObj = {
                        from: moveRecord.coords.substring(0, 2),
                        to: moveRecord.coords.substring(2, 4)
                    };
                    const nextFen = apply_move(fen, moveObj);
                    if (nextFen) fen = nextFen;
                }
                currentFen = fen;
            }
        } else {
            startNewGame();
        }
    } catch (e) {
        console.warn("Game restore failed:", e);
        startNewGame();
    }
}

function startNewGame() {
    currentGame = {
        game_id: generateUUID(),
        profile_id: activeProfile?.id || "default",
        timestamp: Date.now(),
        last_modified: Date.now(),
        moves: [],
        result: "in_progress",
        method: null,
        initial_fen: INITIAL_FEN
    };
}

function saveCurrentGame(from, to) {
    if (!currentGame) return;
    
    try {
        const durationMs = Date.now() - moveStartTime;
        
        if (!currentGame.game_id) {
            currentGame.game_id = generateUUID();
        }
        
        const coords = from + to;
        currentGame.moves.push({
            coords: coords,
            durationMs: durationMs
        });
        currentGame.last_modified = Date.now();
        currentGame.result = "in_progress";
        
        const key = `chess_games_${currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];
        
        const existingIdx = games.findIndex(g => g.game_id === currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = currentGame;
        } else {
            games.push(currentGame);
        }
        
        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Save game failed:", e);
    }
}

function finishGame(result, method) {
    if (!currentGame) return;
    
    try {
        currentGame.result = result;
        currentGame.method = method;
        currentGame.last_modified = Date.now();
        
        const key = `chess_games_${currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];
        
        const existingIdx = games.findIndex(g => g.game_id === currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = currentGame;
        } else {
            games.push(currentGame);
        }
        
        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Finish game failed:", e);
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function updateUI() {
    const gameState = get_game_state(currentFen);
    const statusEl = document.getElementById('status');
    const fenEl = document.getElementById('fen');
    
    fenEl.innerText = currentFen;

    if (gameState.is_checkmate) {
        const winner = gameState.side_to_move === 'w' ? 'Black' : 'White';
        statusEl.innerText = `Checkmate! ${winner} wins.`;
        finishGame(gameState.side_to_move === 'w' ? 'win_black' : 'win_white', 'checkmate');
    } else if (gameState.is_draw) {
        statusEl.innerText = "Draw!";
        finishGame('draw', 'stalemate');
    } else {
        statusEl.innerText = `${gameState.side_to_move === 'w' ? 'White' : 'Black'}'s turn${gameState.is_check ? ' (Check!)' : ''}`;
        
        if (gameState.side_to_move === 'b' && !gameState.is_checkmate && !gameState.is_draw) {
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
                saveCurrentGame(selectedSquare, square);
                currentFen = nextFen;
                selectedSquare = null;
                moveStartTime = Date.now();
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
            saveCurrentGame(move.from, move.to);
            currentFen = nextFen;
            moveStartTime = Date.now();
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
    currentFen = INITIAL_FEN;
    selectedSquare = null;
    startNewGame();
    moveStartTime = Date.now();
    updateUI();
};

start();