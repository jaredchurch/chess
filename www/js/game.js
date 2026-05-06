// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Game Module - Core game logic including initialization, state management,
// game saving/loading, and move history tracking.
//

import { applyMove, getGameState, isWasmReady } from './chess-wasm.js';
import { isWhitePiece, INITIAL_FEN } from './ui.js';
import { get_build_timestamp, get_build_profile } from '../pkg/chess_core.js';
import { 
    getStorageItem, 
    setStorageItem,
    generateUUID
} from './storage.js';

window.currentFen = INITIAL_FEN;
window.currentGame = null;
window.moveStartTime = Date.now();
window.playerColor = window.playerColor || 'random';
window.aiDifficulty = window.aiDifficulty || 1; // Default to Level 1
window.capturedPieces = { white: [], black: [] };
window.cloudDepth = 12;
window.cloudMaxThinkingTime = 50;

/**
 * Determines the player's side (white/black) based on selection
 * If 'random' is selected, randomly assigns white or black
 * @returns {string} 'white' or 'black'
 */
export function determinePlayerSide() {
    if (window.playerColor === 'random') {
        return Math.random() < 0.5 ? 'white' : 'black';
    }
    return window.playerColor;
}

/**
 * Checks if it's the player's turn based on current game state
 * Handles 'random' color selection where player could be either side
 * @param {Object} gameState - Current game state from WASM
 * @returns {boolean} True if it's the player's turn
 */
export function isPlayerTurn(gameState) {
    if (window.playerColor === 'random') {
        return true;
    }
    return gameState.side_to_move === (window.playerColor === 'white' ? 'w' : 'b');
}

/**
 * Determines which piece was captured (if any) during a move
 * Compares the piece at destination square before the move
 * @param {string} oldFen - FEN before the move
 * @param {Object} move - Move object with 'from' and 'to' properties
 * @returns {string|null} Captured piece character or null
 */
export function getCapturedPiece(oldFen, move) {
    const oldPieces = parseFenPieces(oldFen);
    const toSquare = move.to;
    return oldPieces[toSquare] || null;
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
 * Saves the current move to the game record and persists to storage
 * Also tracks captured pieces for score display
 * @param {string} from - Origin square (e.g., 'e2')
 * @param {string} to - Destination square (e.g., 'e4')
 * @param {string} [promotion] - Promotion piece (q, r, b, n) if applicable
 */
export function saveCurrentGame(from, to, promotion = null) {
    if (!window.currentGame) return;
    
    try {
        const durationMs = Date.now() - window.moveStartTime;
        
        if (!window.currentGame.game_id) {
            window.currentGame.game_id = generateUUID();
        }
        
        const captured = getCapturedPiece(window.currentFen, { from, to });
        if (captured) {
            const isWhite = captured === captured.toUpperCase();
            if (isWhite) window.capturedPieces.black.push(captured);
            else window.capturedPieces.white.push(captured);
        }
        
        const coords = from + to + (promotion || '');
        window.currentGame.moves.push({
            coords: coords,
            durationMs: durationMs
        });
        window.currentGame.last_modified = Date.now();
        window.currentGame.result = "in_progress";
        
        const key = `chess_games_${window.currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];
        
        const existingIdx = games.findIndex(g => g.game_id === window.currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = window.currentGame;
        } else {
            games.push(window.currentGame);
        }
        
        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Save game failed:", e);
    }
}

/**
 * Saves the current game state to localStorage
 * Ensures only one in-progress game exists per profile
 */
export function saveCurrentGameState() {
    if (!window.currentGame) return;
    try {
        const key = `chess_games_${window.currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];
        
        // Remove any other in_progress games for this profile (only one at a time)
        games = games.filter(g => g.result !== "in_progress" || g.game_id === window.currentGame.game_id);
        
        const existingIdx = games.findIndex(g => g.game_id === window.currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = window.currentGame;
        } else {
            games.push(window.currentGame);
        }
        
        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Save game state failed:", e);
    }
}

/**
 * Marks the current game as finished and saves the result
 * Stops timers and records final move time
 * @param {string} result - Game result (e.g., 'win_white', 'draw')
 * @param {string} method - How the game ended (e.g., 'checkmate', 'stalemate')
 */
export function finishGame(result, method) {
    if (!window.currentGame) return;
    
    // Mark game as inactive to prevent timer restarts
    window.gameActive = false;
    
    // Stop timer and record final move time
    if (typeof window.stopMoveTimer === 'function') window.stopMoveTimer();
    if (typeof window.recordMoveTime === 'function') window.recordMoveTime();
    if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
    
    try {
        window.currentGame.result = result;
        window.currentGame.method = method;
        window.currentGame.last_modified = Date.now();
        
        const key = `chess_games_${window.currentGame.profile_id}`;
        let gamesJson = getStorageItem(key);
        let games = gamesJson ? JSON.parse(gamesJson) : [];
        
        const existingIdx = games.findIndex(g => g.game_id === window.currentGame.game_id);
        if (existingIdx >= 0) {
            games[existingIdx] = window.currentGame;
        } else {
            games.push(window.currentGame);
        }
        
        setStorageItem(key, JSON.stringify(games));
    } catch (e) {
        console.warn("Finish game failed:", e);
    }
}

/**
 * Starts a new game with current settings
 * Resets timers, captured pieces, and board state
 */
export function startNewGame() {
    const playerSide = window.playerColor === 'random' 
        ? (Math.random() < 0.5 ? 'white' : 'black') 
        : window.playerColor;
    
    window.currentGame = {
        game_id: generateUUID(),
        profile_id: window.activeProfile ? window.activeProfile.id : null,
        player_side: playerSide,
        ai_difficulty: window.aiDifficulty,
        cloud_depth: window.aiDifficulty === 'stockfish_18' ? window.cloudDepth : null,
        cloud_max_time: window.aiDifficulty === 'stockfish_18' ? window.cloudMaxThinkingTime : null,
        timestamp: Date.now(),
        last_modified: Date.now(),
        moves: [],
        result: "in_progress",
        method: null,
        initial_fen: INITIAL_FEN
    };
    window.capturedPieces = { white: [], black: [] };
    
    // Reset timers
    window.gameStartTime = Date.now();
    window.whiteTotalTime = 0;
    window.blackTotalTime = 0;
    window.isWhitesTurn = true;
    window.lastMoveTimestamp = Date.now();
    window.gameActive = true;
    if (typeof window.stopMoveTimer === 'function') window.stopMoveTimer();
    
    // Always start with white to move (standard chess rule)
    window.currentFen = INITIAL_FEN;
    
    // But orient the board based on player choice
    if (playerSide === 'black') {
        window.boardOrientation = 'black';
    } else {
        window.boardOrientation = 'white';
    }
    
    // Only update dropdown if user explicitly chose white or black
    const select = document.getElementById('player-color');
    if (select && window.playerColor !== 'random') {
        select.value = window.playerColor;
    }
    
    // Immediately save the new game to localStorage
    saveCurrentGameState();
}

/**
 * Restores an in-progress game from localStorage
 * Replays all moves to reach the current position
 */
export function restoreInProgressGame() {
    try {
        if (!window.activeProfile) {
            startNewGame();
            return;
        }
        
        const key = `chess_games_${window.activeProfile.id}`;
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
            
            window.currentGame = inProgress;
            
            // Restore settings from saved game
            if (inProgress.ai_difficulty !== undefined) {
                if (inProgress.ai_difficulty === 'stockfish_18') {
                    window.aiDifficulty = 'stockfish_18';
                    window.aiDifficulty = 'stockfish_18';
                } else {
                    window.aiDifficulty = inProgress.ai_difficulty;
                    window.aiDifficulty = window.aiDifficulty;
                }
            }
            if (inProgress.cloud_depth !== undefined && inProgress.cloud_depth !== null) {
                window.cloudDepth = inProgress.cloud_depth;
            }
            if (inProgress.cloud_max_time !== undefined && inProgress.cloud_max_time !== null) {
                const time = parseFloat(inProgress.cloud_max_time);
                if (time >= 1 && time <= 100) {
                    window.cloudMaxThinkingTime = time;
                }
            }
            
            // Always start from standard position (white to move first)
            let fen = INITIAL_FEN;
            window.capturedPieces = { white: [], black: [] };
            
            if (inProgress.moves) {
                for (const moveRecord of inProgress.moves) {
                    const moveObj = {
                        from: moveRecord.coords.substring(0, 2),
                        to: moveRecord.coords.substring(2, 4)
                    };
                    const nextFen = applyMove(fen, moveObj);
                    if (nextFen) {
                        const captured = getCapturedPiece(fen, moveObj);
                        if (captured) {
                            const isWhitePiece = captured === captured.toUpperCase();
                            if (isWhitePiece) window.capturedPieces.black.push(captured);
                            else window.capturedPieces.white.push(captured);
                        }
                        fen = nextFen;
                    }
                }
            }
            window.currentFen = fen;
            
            const playerSide = inProgress.player_side || 'white';
            // Orient board based on player, but white always moves first
            window.boardOrientation = playerSide;
            
            // Update board labels to match orientation (fix BUG22)
            if (typeof window.updateBoardLabels === 'function') {
                window.updateBoardLabels();
            }
            
            console.log("Restored to FEN:", window.currentFen);
        } else {
            console.log("No in-progress game found");
            startNewGame();
        }
    } catch (e) {
        console.warn("Game restore failed:", e);
        startNewGame();
    }
}

/**
 * Gets the board state at a specific move index
 * Replays moves from the start to calculate the position
 * @param {number} moveIndex - Index of the move to get state for
 * @returns {Object} Object with 'fen' and 'captures' properties
 */
export function getBoardStateAtMove(moveIndex) {
    let fen = INITIAL_FEN;
    const tempCaptures = { white: [], black: [] };
    
    for (let i = 0; i <= moveIndex && i < window.currentGame.moves.length; i++) {
        const moveRecord = window.currentGame.moves[i];
        const coords = moveRecord.coords;
        // Coords format: from(2) + to(2) + promotion(1 if present)
        const moveObj = {
            from: coords.substring(0, 2),
            to: coords.substring(2, 4),
            promotion: coords.length > 4 ? coords.substring(4) : null
        };
        const nextFen = applyMove(fen, moveObj);
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

/**
 * Main update function - refreshes UI based on current game state
 * Handles turn display, check/checkmate/draw detection, and triggers AI moves
 */
export function updateUI() {
    if (!isWasmReady()) {
        console.warn('WASM not ready yet, skipping updateUI');
        return;
    }
    
    const gameState = getGameState(window.currentFen);
    if (!gameState) {
        console.warn('Failed to get game state for FEN:', window.currentFen);
        console.warn('This usually means the FEN is invalid or WASM parsing failed');
        return;
    }
    const statusText = document.getElementById('status-text');
    const statusEl = document.getElementById('status');
    const fenEl = document.getElementById('fen');
    const playerSide = window.currentGame?.player_side || determinePlayerSide();
    
    if (fenEl) fenEl.innerText = window.currentFen;

    if (gameState.is_checkmate) {
        const winner = gameState.side_to_move === 'w' ? 'Black' : 'White';
        if (statusText) statusText.textContent = `Checkmate! ${winner} wins.`;
        finishGame(gameState.side_to_move === 'w' ? 'win_black' : 'win_white', 'checkmate');
    } else if (gameState.is_draw) {
        if (statusText) statusText.textContent = "Draw!";
        finishGame('draw', 'stalemate');
    } else {
        if (statusText) {
            const playerSide = window.currentGame?.player_side || 'white';
            const isPlayerTurn = (gameState.side_to_move === 'w' && playerSide === 'white') || 
                                (gameState.side_to_move === 'b' && playerSide === 'black');
            const turnText = isPlayerTurn 
                ? `${window.activeProfile?.name || 'Player'}'s turn` 
                : "Computer's turn";
            statusText.textContent = `${turnText}${gameState.is_check ? ' (Check!)' : ''}`;
        }
        
        // AI moves when it's NOT player's turn
        const playerIsWhite = playerSide === 'white';
        const isWhiteTurn = gameState.side_to_move === 'w';
        const isAiTurn = playerIsWhite ? !isWhiteTurn : isWhiteTurn;
        
        if (isAiTurn && !gameState.is_checkmate && !gameState.is_draw) {
            setTimeout(() => {
                if (typeof window.makeAiMove === 'function') window.makeAiMove();
            }, 500);
        } else {
            if (typeof window.startMoveTimer === 'function') window.startMoveTimer();
        }
    }

    if (typeof renderBoard === 'function') renderBoard();
    if (typeof window.updateScoreCard === 'function') window.updateScoreCard();
    if (typeof window.updateMoveHistoryCard === 'function') window.updateMoveHistoryCard();
    if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
}

/**
 * Initializes the application - loads WASM, restores settings, and starts the game
 * Called once on page load
 */
export async function start() {
    // Initialize WASM through wrapper
    const { initWasm } = await import('./chess-wasm.js');
    await initWasm();
    
    // Get build info
    const { get_build_timestamp, get_build_profile } = await import('../pkg/chess_core.js');
    window.buildTimestamp = get_build_timestamp();
    window.buildProfile = get_build_profile();
    
    window.activeProfile = initProfile();
    window.initPanels();
    window.updateBoardLabels();
    
    // Load saved player color
    try {
        const savedColor = localStorage.getItem('chess_player_color');
        if (savedColor && ['random', 'white', 'black'].includes(savedColor)) {
            window.playerColor = savedColor;
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
                window.aiDifficulty = 'stockfish_18';
                window.aiDifficulty = 'stockfish_18';
            } else {
                const level = parseInt(savedDifficulty, 10);
                if (level >= 1 && level <= 10) {
                    window.aiDifficulty = level;
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
                window.cloudDepth = depth;
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
            if (maxTime >=0) {
                window.cloudMaxThinkingTime = maxTime;
            }
        }
    } catch (e) {
        console.warn('Failed to load cloud max thinking time:', e);
    }
    
    restoreInProgressGame();
    window.updateBoardSize();
    updateUI();
}
