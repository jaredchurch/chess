// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// New Game Dialog Module - Handles the new game dialog UI and logic
// including color selection, difficulty, and Stockfish settings.
//

/**
 * Shows the new game dialog pre-filled with current settings
 * Syncs slider values with their displayed numbers (BUG21 fix)
 */
window.showNewGameDialog = () => {
    const dialog = document.getElementById('new-game-dialog');
    if (dialog) {
        // Pre-fill with current settings
        const colorSelect = document.getElementById('new-game-color');
        const difficultySelect = document.getElementById('new-game-difficulty');
        const cloudDepthInput = document.getElementById('new-game-cloud-depth');
        const cloudMaxTimeInput = document.getElementById('new-game-cloud-max-time');
        const cloudDepthValue = document.getElementById('new-game-cloud-depth-value');
        const cloudMaxTimeValue = document.getElementById('new-game-cloud-max-time-value');
        
        if (colorSelect) colorSelect.value = window.playerColor === 'random' ? 'random' : window.playerColor;
        if (difficultySelect) difficultySelect.value = window.aiDifficulty;
        if (cloudDepthInput) {
            cloudDepthInput.value = window.cloudDepth;
            if (cloudDepthValue) cloudDepthValue.textContent = window.cloudDepth;
        }
        if (cloudMaxTimeInput) {
            cloudMaxTimeInput.value = window.cloudMaxThinkingTime;
            if (cloudMaxTimeValue) cloudMaxTimeValue.textContent = window.cloudMaxThinkingTime;
        }
        
        if (typeof window.toggleNewGameCloudSettings === 'function') {
            window.toggleNewGameCloudSettings();
        }
        dialog.style.display = 'flex';
    }
};

/**
 * Closes the new game dialog
 */
window.closeNewGameDialog = () => {
    const dialog = document.getElementById('new-game-dialog');
    if (dialog) dialog.style.display = 'none';
};

/**
 * Toggles visibility of Stockfish-specific settings
 * Only shows depth and thinking time when Stockfish 18 is selected
 */
window.toggleNewGameCloudSettings = () => {
    const difficultySelect = document.getElementById('new-game-difficulty');
    const cloudSettings = document.getElementById('new-game-cloud-settings');
    if (difficultySelect && cloudSettings) {
        cloudSettings.style.display = difficultySelect.value === 'stockfish_18' ? 'block' : 'none';
    }
};

/**
 * Starts a new game with settings from the dialog
 * Saves settings to localStorage and resets the game state
 */
window.startNewGameFromDialog = function() {
    const colorSelect = document.getElementById('new-game-color');
    const difficultySelect = document.getElementById('new-game-difficulty');
    const cloudDepthInput = document.getElementById('new-game-cloud-depth');
    const cloudMaxTimeInput = document.getElementById('new-game-cloud-max-time');
    
    if (colorSelect) {
        window.playerColor = colorSelect.value;
        window.playerColor = window.playerColor;
        try {
            localStorage.setItem('chess_player_color', window.playerColor);
        } catch (e) {}
    }
    
    if (difficultySelect) {
        const val = difficultySelect.value;
        if (val === 'stockfish_18') {
            window.aiDifficulty = 'stockfish_18';
            window.aiDifficulty = 'stockfish_18';
        } else {
            window.aiDifficulty = parseInt(val, 10);
            window.aiDifficulty = window.aiDifficulty;
        }
        try {
            localStorage.setItem('chess_ai_difficulty', val);
        } catch (e) {}
    }
    
    if (cloudDepthInput && window.aiDifficulty === 'stockfish_18') {
        const val = parseInt(cloudDepthInput.value, 10);
        if (val >= 12 && val <= 18) {
            window.cloudDepth = val;
            try {
                localStorage.setItem('chess_cloud_depth', val);
            } catch (e) {}
        }
    }
    
    if (cloudMaxTimeInput && window.aiDifficulty === 'stockfish_18') {
        const val = parseFloat(cloudMaxTimeInput.value);
        if (val >= 1 && val <= 100) {
            window.cloudMaxThinkingTime = val;
            try {
                localStorage.setItem('chess_cloud_max_time', val);
            } catch (e) {}
        }
    }
    
    if (typeof window.closeNewGameDialog === 'function') {
        window.closeNewGameDialog();
    }
    
    window.currentFen = window.INITIAL_FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    window.selectedSquare = null;
    window.boardOrientation = 'white';
    if (typeof startNewGame === 'function') startNewGame();
    window.moveStartTime = Date.now();
    if (typeof updateUI === 'function') updateUI();
};

/**
 * Shows the new game dialog (compatibility wrapper for resetGame)
 */
window.resetGame = () => {
    if (typeof window.showNewGameDialog === 'function') {
        window.showNewGameDialog();
    }
};
