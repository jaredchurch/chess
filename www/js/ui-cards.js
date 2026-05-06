// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// UI Cards Module - Manages the score card and move history card displays.
// Handles rendering captured pieces, scores, timers, and move navigation.
//

import { calculateScore, isWhitePiece } from './ui.js';
import { getBoardStateAtMove } from './game.js';

window.moveHistoryCollapsed = window.moveHistoryCollapsed || false;

/**
 * Updates the score card with current scores, captured pieces, and timers
 * Displays white and black sections with piece icons and time spent
 */
export function updateScoreCard() {
    const scoreCard = document.getElementById('score-card');
    if (!scoreCard) return;
    
    const whiteScore = calculateScore(window.capturedPieces.white);
    const blackScore = calculateScore(window.capturedPieces.black);
    
    const now = Date.now();
    const whiteTime = (window.isWhitesTurn ? window.whiteTotalTime + (now - window.lastMoveTimestamp) : window.whiteTotalTime);
    const blackTime = (!window.isWhitesTurn ? window.blackTotalTime + (now - window.lastMoveTimestamp) : window.blackTotalTime);
    
    scoreCard.innerHTML = `
        <div class="score-section">
            <div class="score-title">White</div>
            <div class="score-value">+${whiteScore}<span class="score-timer"> (${window.formatTime ? window.formatTime(whiteTime) : '0:00.0'})</span></div>
            <div class="captured-pieces">${window.capturedPieces.white.map(p => 
                `<span class="${isWhitePiece(p) ? 'piece-white' : 'piece-black'}">${window.pieceUnicode ? window.pieceUnicode[p] : p}</span>`
            ).join('')}</div>
        </div>
        <div class="score-section">
            <div class="score-title">Black</div>
            <div class="score-value">+${blackScore}<span class="score-timer"> (${window.formatTime ? window.formatTime(blackTime) : '0:00.0'})</span></div>
            <div class="captured-pieces">${window.capturedPieces.black.map(p => 
                `<span class="${isWhitePiece(p) ? 'piece-white' : 'piece-black'}">${window.pieceUnicode ? window.pieceUnicode[p] : p}</span>`
            ).join('')}</div>
        </div>
    `;
}

/**
 * Updates the move history card with all moves in the current game
 * Allows clicking on moves to preview past positions
 * Auto-scrolls to show the latest move
 */
export function updateMoveHistoryCard() {
    const historyCard = document.getElementById('move-history');
    if (!historyCard || !window.currentGame) return;
    
    if (window.moveHistoryCollapsed) {
        historyCard.style.display = 'none';
        return;
    }
    
    historyCard.style.display = 'block';
    
    const moves = window.currentGame.moves;
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
            if (typeof showMovePreview === 'function') {
                showMovePreview(idx);
            }
        };
    });
    
    // Auto-scroll to show the latest move
    historyCard.scrollTop = historyCard.scrollHeight;
}

// Export for use in other modules
window.updateScoreCard = updateScoreCard;
window.updateMoveHistoryCard = updateMoveHistoryCard;
