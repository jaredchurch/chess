// game.js - Chess game state management

import { saveCurrentGameState, generateUUID, loadInProgressGame, initializeProfile } from './storage.js';

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let currentFen = INITIAL_FEN;
let selectedSquare = null;
let currentGame = null;
let moveStartTime = Date.now();
let activeProfile = null;
let playerColor = 'random';
let capturedPieces = { white: [], black: [] };
let boardOrientation = 'white';

export function getCurrentFen() { return currentFen; }
export function setCurrentFen(fen) { currentFen = fen; }
export function getSelectedSquare() { return selectedSquare; }
export function setSelectedSquare(sq) { selectedSquare = sq; }
export function getCurrentGame() { return currentGame; }
export function setCurrentGame(game) { currentGame = game; }
export function getActiveProfile() { return activeProfile; }
export function setActiveProfile(profile) { activeProfile = profile; }
export function getPlayerColor() { return playerColor; }
export function setPlayerColor(color) { playerColor = color; }
export function getCapturedPieces() { return capturedPieces; }
export function setCapturedPieces(cp) { capturedPieces = cp; }
export function getBoardOrientation() { return boardOrientation; }
export function setBoardOrientation(bo) { boardOrientation = bo; }
export function getMoveStartTime() { return moveStartTime; }
export function setMoveStartTime(ms) { moveStartTime = ms; }
export function getInitialFen() { return INITIAL_FEN; }

export function determinePlayerSide() {
    if (playerColor === 'random') {
        return Math.random() < 0.5 ? 'white' : 'black';
    }
    return playerColor;
}

export function startNewGame() {
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
    
    currentFen = INITIAL_FEN;
    
    if (playerSide === 'black') {
        boardOrientation = 'black';
    } else {
        boardOrientation = 'white';
    }
    
    const select = document.getElementById('player-color');
    if (select && playerColor !== 'random') {
        select.value = playerColor;
    }
    
    saveCurrentGameState(currentGame);
}

export function getCapturedPiece(oldFen, move) {
    const pieces = parseFenPieces(oldFen);
    return pieces[move.to] || null;
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

export function getBoardStateAtMove(moveIndex) {
    let fen = INITIAL_FEN;
    const tempCaptures = { white: [], black: [] };
    
    for (let i = 0; i <= moveIndex && currentGame && i < currentGame.moves.length; i++) {
        const moveRecord = currentGame.moves[i];
        const moveObj = {
            from: moveRecord.coords.substring(0, 2),
            to: moveRecord.coords.substring(2, 4)
        };
        const nextFen = apply_move(fen, moveObj);
        if (nextFen) {
            const captured = getCapturedPiece(fen, moveObj);
            if (captured) {
                const isWhiteCapture = fen.includes(captured.toUpperCase());
                if (isWhiteCapture) tempCaptures.white.push(captured);
                else tempCaptures.black.push(captured);
            }
            fen = nextFen;
        }
    }
    return { fen, captures: tempCaptures };
}

export function restoreGame() {
    activeProfile = initializeProfile();
    if (!activeProfile) {
        startNewGame();
        return;
    }
    
    const inProgress = loadInProgressGame(activeProfile.id);
    
    if (inProgress && inProgress.moves && inProgress.moves.length > 0) {
        currentGame = inProgress;
        
        let fen = INITIAL_FEN;
        capturedPieces = { white: [], black: [] };
        
        for (const moveRecord of inProgress.moves) {
            const moveObj = {
                from: moveRecord.coords.substring(0, 2),
                to: moveRecord.coords.substring(2, 4)
            };
            const nextFen = apply_move(fen, moveObj);
            if (nextFen) {
                const captured = getCapturedPiece(fen, moveObj);
                if (captured) {
                    const isWhiteCapture = fen.includes(captured.toUpperCase());
                    if (isWhiteCapture) capturedPieces.white.push(captured);
                    else capturedPieces.black.push(captured);
                }
                fen = nextFen;
            }
        }
        currentFen = fen;
        
        const playerSide = inProgress.player_side || 'white';
        boardOrientation = playerSide;
        
        const select = document.getElementById('player-color');
        if (select && playerColor !== 'random') {
            select.value = playerSide;
        }
    } else {
        startNewGame();
    }
}

export function saveMove(from, to, durationMs) {
    if (!currentGame) return;
    
    const captured = getCapturedPiece(currentFen, { from, to });
    if (captured) {
        const isWhiteCapture = currentFen.includes(captured.toUpperCase());
        if (isWhiteCapture) capturedPieces.white.push(captured);
        else capturedPieces.black.push(captured);
    }
    
    const coords = from + to;
    currentGame.moves.push({ coords, durationMs });
    currentGame.last_modified = Date.now();
    
    saveCurrentGameState(currentGame);
}

export function finishGame(result, method) {
    if (!currentGame) return;
    currentGame.result = result;
    currentGame.method = method;
    currentGame.last_modified = Date.now();
    saveCurrentGameState(currentGame);
}

export function resetGame() {
    currentFen = INITIAL_FEN;
    selectedSquare = null;
    boardOrientation = 'white';
    startNewGame();
    moveStartTime = Date.now();
}