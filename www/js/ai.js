// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// AI Module - Handles AI move generation including Stockfish cloud API
// and local WASM-based AI moves.
//

import { getBestMove, applyMove } from './chess-wasm.js';

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

/**
 * Makes an AI move based on current difficulty setting
 * Uses Stockfish cloud API for 'stockfish_18' or local WASM AI for levels 1-10
 * Shows "API Thinking..." status when waiting for cloud response
 * Falls back to local AI level 3 if cloud API fails
 */
export async function makeAiMove() {
    let move;
    if (window.aiDifficulty === 'stockfish_18') {
        const statusText = document.getElementById('status-text');
        const originalText = statusText ? statusText.textContent : "";
        if (statusText) statusText.textContent = originalText + " (API Thinking...)";
        
        move = await getCloudBestMove(window.currentFen, false);
        
        if (statusText) statusText.textContent = originalText; // Restore original text
        
        if (!move) {
            // Fallback to local AI if API fails
            console.log("Falling back to local AI level 3");
            move = getBestMove(window.currentFen, 3);
        }
    } else {
        move = getBestMove(window.currentFen, window.aiDifficulty);
    }

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
