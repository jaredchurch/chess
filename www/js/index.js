// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Chess WASM Bridge - Main entry point
// Imports and initializes all modules for the chess application.
// Handles exports to window object for backward compatibility.
//

// Import WASM wrapper
import { 
    initWasm, 
    isWasmReady, 
    getLegalMoves, 
    applyMove, 
    getBestMove, 
    getGameState 
} from './chess-wasm.js';

// Import build info from WASM
import { 
    get_build_timestamp, 
    get_build_profile 
} from '../pkg/chess_core.js';

// Import UI utilities
import { 
    pieceUnicode, 
    pieceValues, 
    calculateScore, 
    isWhitePiece, 
    INITIAL_FEN 
} from './ui.js';

// Import storage module
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

// Import timer module
import { 
    formatTime,
    updateTimerDisplay,
    startMoveTimer,
    stopMoveTimer,
    recordMoveTime
} from './timer.js';

// Import board module
import { 
    renderBoard, 
    parseFenPieces, 
    handleSquareClick, 
    renderPreviewBoard, 
    showMovePreview
} from './board.js';

// Import game module
import { 
    start as startGame,
    restoreInProgressGame,
    startNewGame,
    saveCurrentGameState,
    saveCurrentGame,
    finishGame,
    determinePlayerSide,
    isPlayerTurn,
    updateUI,
    getBoardStateAtMove,
    getCapturedPiece
} from './game.js';

// Import AI module
import { 
    getCloudBestMove, 
    makeAiMove 
} from './ai.js';

// Import UI cards module
import { 
    updateScoreCard, 
    updateMoveHistoryCard 
} from './ui-cards.js';

// Import new game dialog module
import './dialogs-newgame.js';

// Import skin module
import { initializeSkin, switchSkin, toggle3dMode } from './skins/skins.js';

// Export key functions to window object for HTML event handlers and backward compatibility
window.currentFen = INITIAL_FEN;
window.pieceUnicode = pieceUnicode;
window.isWhitePiece = isWhitePiece;
window.INITIAL_FEN = INITIAL_FEN;
window.initProfile = initProfile;
window.updateBoardSize = window.updateBoardSize;
window.updateBoardLabels = window.updateBoardLabels;
window.flipBoard = window.flipBoard;
window.closePreviewDialog = window.closePreviewDialog;
window.toggleBoardOutline = window.toggleBoardOutline;
window.showNewGameDialog = window.showNewGameDialog;
window.closeNewGameDialog = window.closeNewGameDialog;
window.toggleNewGameCloudSettings = window.toggleNewGameCloudSettings;
window.startNewGameFromDialog = window.startNewGameFromDialog;
window.resetGame = window.resetGame;
window.exportHistory = exportHistory;
window.importHistory = window.importHistory;
window.updateMoveHistoryCard = updateMoveHistoryCard;
window.getAllProfiles = getAllProfiles;
window.switchProfile = (id) => { switchProfile(id); location.reload(); };
window.createProfile = (name) => { createProfile(name); location.reload(); };
window.deleteProfile = (id) => { deleteProfile(id); location.reload(); };

// Export game functions
window.updateUI = updateUI;
window.renderBoard = renderBoard;
window.startNewGame = startNewGame;
window.saveCurrentGame = saveCurrentGame;
window.finishGame = finishGame;

// Export timer functions
window.formatTime = formatTime;
window.updateTimerDisplay = updateTimerDisplay;
window.startMoveTimer = startMoveTimer;
window.stopMoveTimer = stopMoveTimer;
window.recordMoveTime = recordMoveTime;

// Export AI functions
window.makeAiMove = makeAiMove;
window.getCloudBestMove = getCloudBestMove;

// Export skin functions
window.switchSkin = switchSkin;
window.initializeSkin = initializeSkin;
window.toggle3dMode = toggle3dMode;

// Initialize the application
initializeSkin();
startGame();
