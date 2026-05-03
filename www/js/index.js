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

window.currentFen = INITIAL_FEN;
let selectedSquare = null;
let legalMoves = [];
let currentGame = null;
let moveStartTime = Date.now();
let activeProfile = null;
let playerColor = window.playerColor || 'random';
let aiDifficulty = window.aiDifficulty || 1; // Default to Level 1
let capturedPieces = { white: [], black: [] };
let boardOrientation = 'white';
let cloudDepth = 12;
let cloudMaxThinkingTime = 5000;

// Timer variables
let gameStartTime = Date.now();
let whiteTotalTime = 0;
let blackTotalTime = 0;
let currentMoveTimer = null;
let isWhitesTurn = true;
let lastMoveTimestamp = Date.now();
let gameActive = true;

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    
    let timeStr = '';
    if (hours > 0) timeStr += hours + ':';
    if (hours > 0 || minutes > 0) timeStr += String(minutes).padStart(hours > 0 ? 2 : 1, '0') + ':';
    timeStr += String(seconds).padStart(minutes > 0 ? 2 : 1, '0') + '.' + tenths;
    
    return timeStr;
}

function updateTimerDisplay() {
    const now = Date.now();
    const gameTotal = now - gameStartTime;
    const currentMoveElapsed = now - lastMoveTimestamp;
    
    // Update compact timer display (to the right of status text)
    const currentMoveEl = document.getElementById('current-move-display');
    const gameTotalEl = document.getElementById('game-total-display');
    
    if (currentMoveEl) currentMoveEl.textContent = formatTime(currentMoveElapsed);
    if (gameTotalEl) gameTotalEl.textContent = formatTime(gameTotal);
    
    // Also update score card for white/black timers
    updateScoreCard();
}

function startMoveTimer() {
    if (!gameActive) return;
    stopMoveTimer();
    lastMoveTimestamp = Date.now();
    currentMoveTimer = setInterval(updateTimerDisplay, 100);
}

function stopMoveTimer() {
    if (currentMoveTimer) {
        clearInterval(currentMoveTimer);
        currentMoveTimer = null;
    }
}

function recordMoveTime() {
    const now = Date.now();
    const elapsed = now - lastMoveTimestamp;
    
    if (isWhitesTurn) {
        whiteTotalTime += elapsed;
    } else {
        blackTotalTime += elapsed;
    }
    
    isWhitesTurn = !isWhitesTurn;
    lastMoveTimestamp = now;
    updateTimerDisplay();
}

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
    if (typeof updateBoardLabels === 'function') {
        updateBoardLabels();
    }
};

window.updateBoardLabels = function() {
    const board = document.getElementById('board');
    if (!board) return;
    
    const boardWidth = parseInt(board.style.width);
    if (!boardWidth || isNaN(boardWidth)) return;
    
    const squareSize = Math.floor(boardWidth / 8);
    const fontSize = Math.max(Math.floor(squareSize * 0.25), 10);
    const labelsVisible = localStorage.getItem('chess_show_board_labels') !== 'false';
    
    // Files (a-h) top and bottom
    const files = boardOrientation === 'white' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
    ['board-labels-top', 'board-labels-bottom'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = labelsVisible ? 'flex' : 'none';
        el.style.fontSize = fontSize + 'px';
        el.innerHTML = files.map(f => `<div style="width:${squareSize}px;text-align:center;">${f}</div>`).join('');
    });
    
    // Ranks (1-8) left and right
    const ranks = boardOrientation === 'white' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
    ['board-labels-left', 'board-labels-right'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = labelsVisible ? 'flex' : 'none';
        el.style.fontSize = fontSize + 'px';
        el.innerHTML = ranks.map(r => `<div style="height:${squareSize}px;display:flex;align-items:center;">${r}</div>`).join('');
    });
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
    updateBoardLabels();
    
    // Load saved player color
    try {
        const savedColor = localStorage.getItem('chess_player_color');
        if (savedColor && ['random', 'white', 'black'].includes(savedColor)) {
            playerColor = savedColor;
            window.playerColor = savedColor;
        }
    } catch (e) {
        console.warn('Failed to load player color:', e);
    }
    
    // Load saved AI difficulty
    try {
        const savedDifficulty = localStorage.getItem('chess_ai_difficulty');
        if (savedDifficulty) {
            if (savedDifficulty === 'stockfish_18') {
                aiDifficulty = 'stockfish_18';
                window.aiDifficulty = 'stockfish_18';
            } else {
                const level = parseInt(savedDifficulty, 10);
                if (level >= 1 && level <= 10) {
                    aiDifficulty = level;
                    window.aiDifficulty = level;
                }
            }
        }
    } catch (e) {
        console.warn('Failed to load AI difficulty:', e);
    }
    
    // Load saved cloud depth
    try {
        const savedDepth = localStorage.getItem('chess_cloud_depth');
        if (savedDepth) {
            const depth = parseInt(savedDepth, 10);
            if (depth >= 12 && depth <= 18) {
                cloudDepth = depth;
            }
        }
    } catch (e) {
        console.warn('Failed to load cloud depth:', e);
    }
    
    // Load saved cloud max thinking time
    try {
        const savedMaxTime = localStorage.getItem('chess_cloud_max_time');
        if (savedMaxTime) {
            const maxTime = parseFloat(savedMaxTime);
            if (maxTime >= 0) {
                cloudMaxThinkingTime = maxTime;
            }
        }
    } catch (e) {
        console.warn('Failed to load cloud max thinking time:', e);
    }
    
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
            const storedGameId = localStorage.getItem('chess_current_game');
            
            // If there's a current game reference and it matches, restore it
            if (storedGameId && storedGameId === inProgress.game_id) {
                console.log("Restoring game:", inProgress.game_id, "moves:", inProgress.moves?.length);
            } else {
                console.log("No current game reference, using latest in-progress");
            }
            
            // Store current game ID for next reload
            localStorage.setItem('chess_current_game', inProgress.game_id);
            
            currentGame = inProgress;
            
            // Restore settings from saved game
            if (inProgress.ai_difficulty !== undefined) {
                if (inProgress.ai_difficulty === 'stockfish_18') {
                    aiDifficulty = 'stockfish_18';
                    window.aiDifficulty = 'stockfish_18';
                } else {
                    aiDifficulty = inProgress.ai_difficulty;
                    window.aiDifficulty = aiDifficulty;
                }
            }
            if (inProgress.cloud_depth !== undefined && inProgress.cloud_depth !== null) {
                cloudDepth = inProgress.cloud_depth;
            }
            if (inProgress.cloud_max_time !== undefined && inProgress.cloud_max_time !== null) {
                cloudMaxThinkingTime = inProgress.cloud_max_time;
            }
            
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
    const playerSide = playerColor === 'random' 
        ? (Math.random() < 0.5 ? 'white' : 'black') 
        : playerColor;
    
    currentGame = {
        game_id: generateUUID(),
        profile_id: activeProfile ? activeProfile.id : null,
        player_side: playerSide,
        ai_difficulty: aiDifficulty,
        cloud_depth: aiDifficulty === 'stockfish_18' ? cloudDepth : null,
        cloud_max_time: aiDifficulty === 'stockfish_18' ? cloudMaxThinkingTime : null,
        timestamp: Date.now(),
        last_modified: Date.now(),
        moves: [],
        result: "in_progress",
        method: null,
        initial_fen: INITIAL_FEN
    };
    capturedPieces = { white: [], black: [] };
    
    // Reset timers
    gameStartTime = Date.now();
    whiteTotalTime = 0;
    blackTotalTime = 0;
    isWhitesTurn = true;
    lastMoveTimestamp = Date.now();
    gameActive = true;
    stopMoveTimer();
    
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
    
    // Mark game as inactive to prevent timer restarts
    gameActive = false;
    
    // Stop timer and record final move time
    stopMoveTimer();
    recordMoveTime();
    updateTimerDisplay();
    
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
    const statusText = document.getElementById('status-text');
    const statusEl = document.getElementById('status');
    const fenEl = document.getElementById('fen');
    const playerSide = currentGame?.player_side || determinePlayerSide();
    
    fenEl.innerText = currentFen;

    if (gameState.is_checkmate) {
        const winner = gameState.side_to_move === 'w' ? 'Black' : 'White';
        if (statusText) statusText.textContent = `Checkmate! ${winner} wins.`;
        finishGame(gameState.side_to_move === 'w' ? 'win_black' : 'win_white', 'checkmate');
    } else if (gameState.is_draw) {
        if (statusText) statusText.textContent = "Draw!";
        finishGame('draw', 'stalemate');
    } else {
        if (statusText) statusText.textContent = `${gameState.side_to_move === 'w' ? 'White' : 'Black'}'s turn${gameState.is_check ? ' (Check!)' : ''}`;
        
        // AI moves when it's NOT player's turn
        const playerIsWhite = playerSide === 'white';
        const isWhiteTurn = gameState.side_to_move === 'w';
        const isAiTurn = playerIsWhite ? !isWhiteTurn : isWhiteTurn;
        
        if (isAiTurn && !gameState.is_checkmate && !gameState.is_draw) {
            setTimeout(makeAiMove, 500);
        } else {
            startMoveTimer();
        }
    }

    renderBoard();
    updateScoreCard();
    updateMoveHistoryCard();
    updateTimerDisplay();
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    if (!boardEl) {
        console.warn('Board element not found');
        return;
    }
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
            recordMoveTime();
            stopMoveTimer();
            
            const nextFen = apply_move(currentFen, move);
            if (nextFen) {
                saveCurrentGame(selectedSquare, square);
                currentFen = nextFen;
                selectedSquare = null;
                moveStartTime = Date.now();
                updateUI();
                startMoveTimer();
                return;
            }
        }
        selectedSquare = square;
    } else {
        selectedSquare = square;
    }
    renderBoard();
}

async function getCloudBestMove(fen, isPlayerTurn = false) {
    const requestBody = { fen: fen, depth: cloudDepth, maxThinkingTime: cloudMaxThinkingTime };
    
    // Log API request details
    console.log("Cloud API Request:", {
        url: "https://chess-api.com/v1",
        method: "POST",
        body: requestBody,
        isPlayerTurn: isPlayerTurn
    });

    try {
        const response = await fetch("https://chess-api.com/v1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        
        // Log API response (sanitized when player's turn)
        if (isPlayerTurn) {
            const sanitizedData = { ...data, move: '[HIDDEN]', from: '[HIDDEN]', to: '[HIDDEN]', san: '[HIDDEN]' };
            console.log("Cloud API Response (player turn - move hidden):", sanitizedData);
        } else {
            console.log("Cloud API Response:", data);
        }
        
        // If it's player's turn, don't return the move
        if (isPlayerTurn) return null;
        
        if (!data.from || !data.to) return null;

        // Handle promotion from LAN move (e.g., "e7e8q")
        let promotion = null;
        if (data.move && data.move.length === 5) {
            promotion = data.move[4].toLowerCase();
        }

        return { from: data.from, to: data.to, promotion: promotion };
    } catch (error) {
        console.error("Cloud AI Error:", error);
        return null;
    }
}

async function makeAiMove() {
    let move;
    if (aiDifficulty === 'stockfish_18') {
        const statusText = document.getElementById('status-text');
        const originalText = statusText ? statusText.textContent : "";
        if (statusText) statusText.textContent = originalText + " (API Thinking...)";
        
        move = await getCloudBestMove(currentFen, false);
        
        if (statusText) statusText.textContent = originalText; // Restore original text
        
        if (!move) {
            // Fallback to local AI if API fails
            console.log("Falling back to local AI level 3");
            move = get_best_move_wasm(currentFen, 3);
        }
    } else {
        move = get_best_move_wasm(currentFen, aiDifficulty);
    }

    if (move) {
        recordMoveTime();
        stopMoveTimer();
        
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
    
    const now = Date.now();
    const whiteTime = (isWhitesTurn ? whiteTotalTime + (now - lastMoveTimestamp) : whiteTotalTime);
    const blackTime = (!isWhitesTurn ? blackTotalTime + (now - lastMoveTimestamp) : blackTotalTime);
    
    scoreCard.innerHTML = `
        <div class="score-section">
            <div class="score-title">White</div>
            <div class="score-value">+${whiteScore}<span class="score-timer"> (${formatTime(whiteTime)})</span></div>
            <div class="captured-pieces">${capturedPieces.white.map(p => 
                `<span class="${isWhitePiece(p) ? 'piece-white' : 'piece-black'}">${pieceUnicode[p]}</span>`
            ).join('')}</div>
        </div>
        <div class="score-section">
            <div class="score-title">Black</div>
            <div class="score-value">+${blackScore}<span class="score-timer"> (${formatTime(blackTime)})</span></div>
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
    
    // Auto-scroll to show the latest move
    historyCard.scrollTop = historyCard.scrollHeight;
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
    updateBoardLabels();
};

window.showNewGameDialog = () => {
    const dialog = document.getElementById('new-game-dialog');
    if (dialog) {
        // Pre-fill with current settings
        const colorSelect = document.getElementById('new-game-color');
        const difficultySelect = document.getElementById('new-game-difficulty');
        const cloudDepthInput = document.getElementById('new-game-cloud-depth');
        const cloudMaxTimeInput = document.getElementById('new-game-cloud-max-time');
        
        if (colorSelect) colorSelect.value = playerColor === 'random' ? 'random' : playerColor;
        if (difficultySelect) difficultySelect.value = aiDifficulty;
        if (cloudDepthInput) cloudDepthInput.value = cloudDepth;
        if (cloudMaxTimeInput) cloudMaxTimeInput.value = cloudMaxThinkingTime;
        
        toggleNewGameCloudSettings();
        dialog.style.display = 'flex';
    }
};

window.closeNewGameDialog = () => {
    const dialog = document.getElementById('new-game-dialog');
    if (dialog) dialog.style.display = 'none';
};

window.toggleNewGameCloudSettings = () => {
    const difficultySelect = document.getElementById('new-game-difficulty');
    const cloudSettings = document.getElementById('new-game-cloud-settings');
    if (difficultySelect && cloudSettings) {
        cloudSettings.style.display = difficultySelect.value === 'stockfish_18' ? 'block' : 'none';
    }
};

window.startNewGameFromDialog = () => {
    const colorSelect = document.getElementById('new-game-color');
    const difficultySelect = document.getElementById('new-game-difficulty');
    const cloudDepthInput = document.getElementById('new-game-cloud-depth');
    const cloudMaxTimeInput = document.getElementById('new-game-cloud-max-time');
    
    if (colorSelect) {
        playerColor = colorSelect.value;
        window.playerColor = playerColor;
        try {
            localStorage.setItem('chess_player_color', playerColor);
        } catch (e) {}
    }
    
    if (difficultySelect) {
        const val = difficultySelect.value;
        if (val === 'stockfish_18') {
            aiDifficulty = 'stockfish_18';
            window.aiDifficulty = 'stockfish_18';
        } else {
            aiDifficulty = parseInt(val, 10);
            window.aiDifficulty = aiDifficulty;
        }
        try {
            localStorage.setItem('chess_ai_difficulty', val);
        } catch (e) {}
    }
    
    if (cloudDepthInput && aiDifficulty === 'stockfish_18') {
        const val = parseInt(cloudDepthInput.value, 10);
        if (val >= 12 && val <= 18) {
            cloudDepth = val;
            try {
                localStorage.setItem('chess_cloud_depth', val);
            } catch (e) {}
        }
    }
    
    if (cloudMaxTimeInput && aiDifficulty === 'stockfish_18') {
        const val = parseFloat(cloudMaxTimeInput.value);
        if (val >= 0) {
            cloudMaxThinkingTime = val;
            try {
                localStorage.setItem('chess_cloud_max_time', val);
            } catch (e) {}
        }
    }
    
    closeNewGameDialog();
    
    currentFen = INITIAL_FEN;
    selectedSquare = null;
    boardOrientation = 'white';
    startNewGame();
    moveStartTime = Date.now();
    updateUI();
};

// Keep resetGame for compatibility, but it now just shows the new game dialog
window.resetGame = () => {
    showNewGameDialog();
};

// changeAiDifficulty removed - settings now only in New Game dialog



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