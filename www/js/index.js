// index.js - Chess WASM Bridge with Game Storage & Info Cards
import init, { 
    get_legal_moves, 
    apply_move, 
    get_best_move_wasm, 
    get_game_state,
    get_build_timestamp,
    get_build_profile
} from '../pkg/chess_core.js';

import { 
    pieceUnicode, 
    pieceValues, 
    calculateScore, 
    isWhitePiece, 
    INITIAL_FEN 
} from './ui.js';

import { 
    parseFenPieces, 
    generateUUID 
} from './game.js';

import { 
    getStorageItem, 
    setStorageItem,
    initializeProfile as initProfile,
    saveGame as persistGame,
    loadInProgressGame,
    STORAGE_KEY_PROFILES,
    STORAGE_KEY_ACTIVE_PROFILE,
    exportHistory,
    getAllProfiles,
    switchProfile,
    createProfile,
    deleteProfile
} from './storage.js';

let currentFen = INITIAL_FEN;
let selectedSquare = null;
let legalMoves = [];
let currentGame = null;
let moveStartTime = Date.now();
let activeProfile = null;
let playerColor = window.playerColor || 'random';
let aiDifficulty = window.aiDifficulty || 2; // Default to Beginner (Level 2)
let capturedPieces = { white: [], black: [] };
let boardOrientation = 'white';

window.updateBoardSize = function() {
    const board = document.getElementById('board');
    if (!board) return;
    const isMobile = window.innerWidth <= 700;
    let size;
    if (isMobile) {
        const availableWidth = window.innerWidth - 20;
        const availableHeight = window.innerHeight - 120;
        size = Math.min(availableWidth, availableHeight);
    } else {
        const infoPanel = document.getElementById('info-panel');
        const panelWidth = infoPanel ? infoPanel.offsetWidth + 20 : 300;
        const availableWidth = window.innerWidth - panelWidth - 40;
        const availableHeight = window.innerHeight - 140;
        size = Math.min(availableWidth, availableHeight);
    }
    size = Math.floor(Math.max(size, 200));
    board.style.width = size + 'px';
    board.style.height = size + 'px';
    const squareFontSize = Math.floor(size / 10);
    board.style.fontSize = squareFontSize + 'px';
};

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => requestAnimationFrame(updateBoardSize), 100);
});

async function start() {
    await init();
    window.buildTimestamp = get_build_timestamp();
    window.buildProfile = get_build_profile();
    activeProfile = initProfile();
    restoreInProgressGame();
    updateBoardSize();
    updateUI();
}

function restoreInProgressGame() {
    try {
        if (!activeProfile) {
            startNewGame();
            return;
        }
        
        const key = `chess_games_${activeProfile.id}`;
        const gamesJson = getStorageItem(key);
        if (!gamesJson) {
            startNewGame();
            return;
        }
        
        const games = JSON.parse(gamesJson);
        
        // Find the most recent in-progress game
        let inProgress = null;
        for (const game of games) {
            if (game.result === "in_progress") {
                if (!inProgress || game.last_modified > inProgress.last_modified) {
                    inProgress = game;
                }
            }
        }
        
        if (inProgress) {
            // Store reference to game in localStorage before restoring
            const storedGameId = localStorage().getItem('chess_current_game');
            
            // If there's a current game reference and it matches, restore it
            if (storedGameId && storedGameId === inProgress.game_id) {
                console.log("Restoring game:", inProgress.game_id, "moves:", inProgress.moves?.length);
            } else {
                console.log("No current game reference, using latest in-progress");
            }
            
            // Store current game ID for next reload
            localStorage().setItem('chess_current_game', inProgress.game_id);
            
            currentGame = inProgress;
            
            // Always start from standard position (white to move first)
            let fen = INITIAL_FEN;
            capturedPieces = { white: [], black: [] };
            
            if (inProgress.moves) {
                for (const moveRecord of inProgress.moves) {
                    const moveObj = {
                        from: moveRecord.coords.substring(0, 2),
                        to: moveRecord.coords.substring(2, 4)
                    };
                    const nextFen = apply_move(fen, moveObj);
                    if (nextFen) {
                        const captured = getCapturedPiece(fen, moveObj);
                        if (captured) {
                            const isWhitePiece = captured === captured.toUpperCase();
                            if (isWhitePiece) capturedPieces.black.push(captured);
                            else capturedPieces.white.push(captured);
                        }
                        fen = nextFen;
                    }
                }
            }
            currentFen = fen;
            
            const playerSide = inProgress.player_side || 'white';
            // Orient board based on player, but white always moves first
            boardOrientation = playerSide;
            
            const select = document.getElementById('player-color');
            if (select && playerColor !== 'random') {
                select.value = playerSide;
            }
            
            console.log("Restored to FEN:", currentFen);
        } else {
            console.log("No in-progress game found");
            startNewGame();
        }
    } catch (e) {
        console.warn("Game restore failed:", e);
        startNewGame();
    }
}

function startNewGame() {
    const playerSide = determinePlayerSide();
    currentGame = {
        game_id: generateUUID(),
        profile_id: activeProfile?.id || "default",
        player_side: playerSide,
        timestamp: Date.now(),
        last_modified: Date.now(),
        moves: [],
        result: "in_progress",
        method: null,
        initial_fen: INITIAL_FEN
    };
    capturedPieces = { white: [], black: [] };
    
    // Always start with white to move (standard chess rule)
    currentFen = INITIAL_FEN;
    
    // But orient the board based on player choice
    if (playerSide === 'black') {
        boardOrientation = 'black';
    } else {
        boardOrientation = 'white';
    }
    
    // Only update dropdown if user explicitly chose white or black
    const select = document.getElementById('player-color');
    if (select && playerColor !== 'random') {
        select.value = playerColor;
    }
    
    // Immediately save the new game to localStorage
    saveCurrentGameState();
}

function saveCurrentGameState() {
    if (!currentGame) return;
    try {
        const key = `chess_games_${currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];
        
        // Remove any other in_progress games for this profile (only one at a time)
        games = games.filter(g => g.result !== "in_progress" || g.game_id === currentGame.game_id);
        
        const existingIdx = games.findIndex(g => g.game_id === currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = currentGame;
        } else {
            games.push(currentGame);
        }
        
        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Save game state failed:", e);
    }
}

function getCapturedPiece(oldFen, move) {
    const oldPieces = parseFenPieces(oldFen);
    const toSquare = move.to;
    const captured = oldPieces[toSquare];
    return captured || null;
}

function saveCurrentGame(from, to) {
    if (!currentGame) return;
    
    try {
        const durationMs = Date.now() - moveStartTime;
        
        if (!currentGame.game_id) {
            currentGame.game_id = generateUUID();
        }
        
        const captured = getCapturedPiece(currentFen, { from, to });
        if (captured) {
            const isWhitePiece = captured === captured.toUpperCase();
            if (isWhitePiece) capturedPieces.black.push(captured);
            else capturedPieces.white.push(captured);
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

function determinePlayerSide() {
    if (playerColor === 'random') {
        return Math.random() < 0.5 ? 'white' : 'black';
    }
    return playerColor;
}

function isPlayerTurn(gameState) {
    if (playerColor === 'random') {
        return true;
    }
    return gameState.side_to_move === (playerColor === 'white' ? 'w' : 'b');
}

function updateUI() {
    const gameState = get_game_state(currentFen);
    const statusEl = document.getElementById('status');
    const fenEl = document.getElementById('fen');
    const playerSide = currentGame?.player_side || determinePlayerSide();
    
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
        
        // AI moves when it's NOT player's turn
        const playerIsWhite = playerSide === 'white';
        const isWhiteTurn = gameState.side_to_move === 'w';
        const isAiTurn = playerIsWhite ? !isWhiteTurn : isWhiteTurn;
        
        if (isAiTurn && !gameState.is_checkmate && !gameState.is_draw) {
            setTimeout(makeAiMove, 500);
        }
    }

    renderBoard();
    updateScoreCard();
    updateMoveHistoryCard();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    const pieces = parseFenPieces(currentFen);
    legalMoves = get_legal_moves(currentFen) || [];

    const ranks = boardOrientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const files = boardOrientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

    ranks.forEach((rank, ri) => {
        files.forEach((file, fi) => {
            const squareName = String.fromCharCode(97 + file) + (rank + 1);
            const squareEl = document.createElement('div');
            squareEl.className = `square ${(ri + fi) % 2 === 0 ? 'black-square' : 'white-square'}`;
            if (selectedSquare === squareName) squareEl.classList.add('highlight');
            
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
    const move = get_best_move_wasm(currentFen, aiDifficulty);
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

function getBoardStateAtMove(moveIndex) {
    let fen = INITIAL_FEN;
    const tempCaptures = { white: [], black: [] };
    
    for (let i = 0; i <= moveIndex && i < currentGame.moves.length; i++) {
        const moveRecord = currentGame.moves[i];
        const moveObj = {
            from: moveRecord.coords.substring(0, 2),
            to: moveRecord.coords.substring(2, 4)
        };
        const nextFen = apply_move(fen, moveObj);
        if (nextFen) {
            const captured = getCapturedPiece(fen, moveObj);
            if (captured) {
                const isWhitePiece = captured === captured.toUpperCase();
                if (isWhitePiece) tempCaptures.black.push(captured);
                else tempCaptures.white.push(captured);
            }
            fen = nextFen;
        }
    }
    return { fen, captures: tempCaptures };
}

function updateScoreCard() {
    const scoreCard = document.getElementById('score-card');
    if (!scoreCard) return;
    
    const whiteScore = calculateScore(capturedPieces.white);
    const blackScore = calculateScore(capturedPieces.black);
    
    scoreCard.innerHTML = `
        <div class="score-section">
            <div class="score-title">White</div>
            <div class="score-value">+${whiteScore}</div>
            <div class="captured-pieces">${capturedPieces.white.map(p => 
                `<span class="${isWhitePiece(p) ? 'piece-white' : 'piece-black'}">${pieceUnicode[p]}</span>`
            ).join('')}</div>
        </div>
        <div class="score-section">
            <div class="score-title">Black</div>
            <div class="score-value">+${blackScore}</div>
            <div class="captured-pieces">${capturedPieces.black.map(p => 
                `<span class="${isWhitePiece(p) ? 'piece-white' : 'piece-black'}">${pieceUnicode[p]}</span>`
            ).join('')}</div>
        </div>
    `;
}

window.moveHistoryCollapsed = window.moveHistoryCollapsed || false;

function updateMoveHistoryCard() {
    const historyCard = document.getElementById('move-history');
    if (!historyCard || !currentGame) return;
    
    if (window.moveHistoryCollapsed) {
        historyCard.style.display = 'none';
        return;
    }
    
    historyCard.style.display = 'block';
    
    const moves = currentGame.moves;
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

// Global function for preview dialog close
window.closePreviewDialog = function() {
    const dialog = document.getElementById('preview-dialog');
    if (dialog) dialog.style.display = 'none';
};

function renderPreviewBoard(boardEl, fen, highlightFrom, highlightTo) {
    boardEl.innerHTML = '';
    const pieces = parseFenPieces(fen);
    
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

function showMovePreview(moveIndex) {
    const state = getBoardStateAtMove(moveIndex);
    const move = currentGame.moves[moveIndex];
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
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.onclick = (e) => {
            if (e.target === dialog) closePreviewDialog();
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
    
    dialog.style.display = 'flex';
}

window.flipBoard = () => {
    boardOrientation = boardOrientation === 'white' ? 'black' : 'white';
    renderBoard();
};

window.resetGame = () => {
    currentFen = INITIAL_FEN;
    selectedSquare = null;
    boardOrientation = 'white';
    startNewGame();  // This saves automatically
    moveStartTime = Date.now();
    updateUI();
};

window.changePlayerColor = () => {
    const select = document.getElementById('player-color');
    if (select) {
        window.playerColor = select.value;
        playerColor = select.value;
    }
};

window.changeAiDifficulty = () => {
    const select = document.getElementById('ai-difficulty');
    if (select) {
        window.aiDifficulty = parseInt(select.value, 10);
        aiDifficulty = window.aiDifficulty;
    }
};

window.exportHistory = () => {
    if (!activeProfile) return;
    const key = `chess_games_${activeProfile.id}`;
    const gamesJson = getStorageItem(key);
    const games = gamesJson ? JSON.parse(gamesJson) : [];
    const exportData = {
        version: 1,
        profile: activeProfile,
        games: games
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

window.importHistory = (input) => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.version !== 1 || !data.games) {
                alert('Invalid import file');
                return;
            }
            const importedProfile = data.profile;
            const importedGames = data.games;
            
            if (!activeProfile || activeProfile.id !== importedProfile.id) {
                const profilesJson = getStorageItem(STORAGE_KEY_PROFILES);
                let profiles = profilesJson ? JSON.parse(profilesJson) : [];
                const existing = profiles.find(p => p.id === importedProfile.id);
                if (!existing) {
                    profiles.push(importedProfile);
                    setStorageItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
                }
                setStorageItem(STORAGE_KEY_ACTIVE_PROFILE, importedProfile.id);
                activeProfile = importedProfile;
            }
            
            const key = `chess_games_${activeProfile.id}`;
            const existingJson = getStorageItem(key);
            let existingGames = existingJson ? JSON.parse(existingJson) : [];
            
            for (const game of importedGames) {
                const existingIdx = existingGames.findIndex(g => g.game_id === game.game_id);
                if (existingIdx >= 0) {
                    existingGames[existingIdx] = game;
                } else {
                    existingGames.push(game);
                }
            }
            
            setStorageItem(key, JSON.stringify(existingGames));
            alert(`Imported ${importedGames.length} games`);
            resetGame();
        } catch (err) {
            alert('Failed to import: ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
};

window.updateMoveHistoryCard = updateMoveHistoryCard;
window.getAllProfiles = getAllProfiles;
window.switchProfile = (id) => { switchProfile(id); location.reload(); };
window.createProfile = (name) => { createProfile(name); location.reload(); };
window.deleteProfile = (id) => { deleteProfile(id); location.reload(); };
window.activeProfile = activeProfile;

start();