// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Timer Module - Manages game timers including move timer, total game time,
// and formatting time displays for the UI.
//

// Timer variables - exported via window object
window.gameStartTime = Date.now();
window.whiteTotalTime = 0;
window.blackTotalTime = 0;
window.currentMoveTimer = null;
window.isWhitesTurn = true;
window.lastMoveTimestamp = Date.now();
window.gameActive = true;

/**
 * Formats milliseconds into a human-readable time string
 * Format: H:MM:SS.t (hours optional, tenths of seconds shown)
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    
    let timeStr = '';
    if (hours > 0) timeStr += hours + ':';
    if (hours > 0 || minutes > 0) timeStr += String(minutes).padStart(hours > 0 ? 2 : 1, '0') + ':';
    timeStr += String(seconds).padStart(minutes > 0 || hours > 0 ? 2 : 1, '0') + '.' + tenths;
    
    return timeStr;
}

/**
 * Updates the timer display in the UI with current game time and move time
 * Also triggers score card update to refresh timer displays there
 */
export function updateTimerDisplay() {
    const now = Date.now();
    const gameTotal = now - window.gameStartTime;
    const currentMoveElapsed = now - window.lastMoveTimestamp;
    
    // Update compact timer display (to the right of status text)
    const currentMoveEl = document.getElementById('current-move-display');
    const gameTotalEl = document.getElementById('game-total-display');
    
    if (currentMoveEl) currentMoveEl.textContent = formatTime(currentMoveElapsed);
    if (gameTotalEl) gameTotalEl.textContent = formatTime(gameTotal);
    
    // Also update score card for white/black timers
    if (typeof window.updateScoreCard === 'function') {
        window.updateScoreCard();
    }
}

/**
 * Starts the move timer that updates every 100ms
 * Only starts if the game is active
 */
export function startMoveTimer() {
    if (!window.gameActive) return;
    stopMoveTimer();
    window.lastMoveTimestamp = Date.now();
    window.currentMoveTimer = setInterval(() => {
        if (typeof updateTimerDisplay === 'function') {
            updateTimerDisplay();
        }
    }, 100);
}

/**
 * Stops the current move timer if running
 */
export function stopMoveTimer() {
    if (window.currentMoveTimer) {
        clearInterval(window.currentMoveTimer);
        window.currentMoveTimer = null;
    }
}

/**
 * Records the time spent on the current move and switches the active player
 * Updates total time for the appropriate player (white or black)
 */
export function recordMoveTime() {
    const now = Date.now();
    const elapsed = now - window.lastMoveTimestamp;
    
    if (window.isWhitesTurn) {
        window.whiteTotalTime += elapsed;
    } else {
        window.blackTotalTime += elapsed;
    }
    
    window.isWhitesTurn = !window.isWhitesTurn;
    window.lastMoveTimestamp = now;
    updateTimerDisplay();
}
