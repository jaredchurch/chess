// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// AI Module - Handles AI move generation including Stockfish cloud API,
// local WASM-based AI moves, and Web Worker offloading for non-blocking search.
//
// The local AI search runs in a Web Worker to keep the main thread responsive.
// Falls back to synchronous search if workers aren't supported.

import { getBestMove as getBestMoveSync, applyMove } from './chess-wasm.js';

let aiWorker = null;
let workerCallbacks = {};
let workerIdCounter = 0;

/**
 * Creates or returns the AI Web Worker.
 * Returns null if Web Workers or module workers aren't supported.
 */
function getAiWorker() {
    if (aiWorker !== null) return aiWorker;
    try {
        aiWorker = new Worker('./js/ai-worker.js', { type: 'module' });
        aiWorker.onmessage = function (e) {
            const { id, result, error } = e.data;
            const cb = workerCallbacks[id];
            if (cb) {
                delete workerCallbacks[id];
                if (error) {
                    cb(null);
                } else {
                    cb(result);
                }
            }
        };
        aiWorker.onerror = function () {
            // Worker error — fall back to synchronous for subsequent calls
            aiWorker.terminate();
            aiWorker = null;
        };
    } catch (e) {
        aiWorker = null;
    }
    return aiWorker;
}

/**
 * Gets the best move from the local WASM AI, running in a Web Worker.
 * Falls back to synchronous search if the worker isn't available.
 * @param {string} fen - Current FEN string
 * @param {number} level - AI difficulty level (1-10)
 * @returns {Promise<Object|null>} Move object with from, to, and promotion
 */
export function getBestMoveAsync(fen, level) {
    return new Promise((resolve) => {
        const worker = getAiWorker();
        if (!worker) {
            // Worker not supported — fall back to synchronous
            resolve(getBestMoveSync(fen, level));
            return;
        }
        const id = ++workerIdCounter;
        workerCallbacks[id] = resolve;
        worker.postMessage({ fen, level, id });
    });
}

/**
 * Gets the best move from the Stockfish cloud API
 * Hides move details from console when it's the player's turn (prevents cheating)
 * Falls back to local AI if API fails
 * @param {string} fen - Current FEN string
 * @param {boolean} isPlayerTurn - Whether it's the player's turn (hides move from logs)
 * @returns {Promise<Object|null>} Move object with from, to, and promotion properties
 */
export async function getCloudBestMove(fen, isPlayerTurn = false) {
    const requestBody = { 
        fen: fen, 
        depth: window.cloudDepth, 
        maxThinkingTime: window.cloudMaxThinkingTime 
    };
    
    if (!isPlayerTurn) {
        console.log("Cloud API Request:", {
            url: "https://chess-api.com/v1",
            method: "POST",
            body: requestBody,
        });
    }

    try {
        const response = await fetch("https://chess-api.com/v1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        
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

/**
 * Makes an AI move based on current difficulty setting
 * Uses Stockfish cloud API for 'stockfish_18' or local WASM AI for levels 1-10
 * Shows "API Thinking..." status when waiting for cloud response
 * Falls back to local AI level 3 if cloud API fails
 *
 * Captures window.currentFen at call time; if it has changed when the async
 * result arrives (e.g. user started a new game), the result is discarded.
 */
export async function makeAiMove() {
    const fenAtStart = window.currentFen;
    let move;
    if (window.aiDifficulty === 'stockfish_18') {
        const statusText = document.getElementById('status-text');
        const originalText = statusText ? statusText.textContent : "";
        if (statusText) statusText.textContent = originalText + " (API Thinking...)";
        
        move = await getCloudBestMove(fenAtStart, false);
        
        if (statusText) statusText.textContent = originalText;
        
        if (!move) {
            console.log("Falling back to local AI level 3");
            move = await getBestMoveAsync(fenAtStart, 3);
        }
    } else {
        move = await getBestMoveAsync(fenAtStart, window.aiDifficulty);
    }

    // Discard stale results if the board state changed while we were searching
    if (window.currentFen !== fenAtStart) return;

    if (move) {
        if (typeof window.recordMoveTime === 'function') window.recordMoveTime();
        if (typeof window.stopMoveTimer === 'function') window.stopMoveTimer();
        
        const nextFen = applyMove(window.currentFen, move);
        if (nextFen) {
            if (typeof window.saveCurrentGame === 'function') {
                window.saveCurrentGame(move.from, move.to);
            }
            window.currentFen = nextFen;
            window.moveStartTime = Date.now();
            if (typeof window.updateUI === 'function') window.updateUI();
        }
    }
}
