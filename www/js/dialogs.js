// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Dialogs Module - Game menu, FEN display, and panel management dialogs.
//

import { getGameStats } from './storage.js';
import { skinRegistry, switchSkin } from './skins/skins.js';

window.moveHistoryCollapsed = window.moveHistoryCollapsed || false;
window.getGameStats = getGameStats;

/**
 * Shows the game menu dialog with settings and game options
 * Pre-fills form fields with current settings
 */
window.showGameMenu = function() {
    const existing = document.getElementById('game-menu-dialog');
    if (existing) { existing.remove(); return; }
    
    const scoreWrapper = document.getElementById('score-card-wrapper');
    const historyWrapper = document.getElementById('history-card-wrapper');
    const scoreChecked = scoreWrapper && window.isPanelVisible('score-card-wrapper') ? 'checked' : '';
    const historyChecked = historyWrapper && window.isPanelVisible('history-card-wrapper') ? 'checked' : '';
    const profiles = window.getAllProfiles() || [];
    const activeId = window.activeProfile?.id || '';
    let profileOptions = profiles.map(p => 
        `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
    
    const dialog = document.createElement('div');
    dialog.id = 'game-menu-dialog';
    dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';
    dialog.innerHTML = `
        <div style="background:#34495e;border-radius:10px;padding:20px;display:flex;gap:20px;min-width:500px;">
            <div style="flex:1;min-width:200px;">
                <div style="margin-bottom:15px;font-size:1.2em;font-weight:bold;">Settings</div>
                <label style="display:block;margin:10px 0;cursor:pointer;">
                    <input type="checkbox" id="show-score" ${scoreChecked} onchange="togglePanelDisplay('score-card-wrapper', this.checked)"> Show Score
                </label>
                <label style="display:block;margin:10px 0;cursor:pointer;">
                    <input type="checkbox" id="show-history" ${historyChecked} onchange="togglePanelDisplay('history-card-wrapper', this.checked)"> Show Move History
                </label>
                <label style="display:block;margin:10px 0;cursor:pointer;">
                    <input type="checkbox" id="show-board-labels" ${localStorage.getItem('chess_show_board_labels') !== 'false' ? 'checked' : ''} onchange="toggleBoardLabels(this.checked)"> Show Board Labels
                </label>
                 <div style="margin:15px 0;">
                     <label style="display:block;margin-bottom:5px;font-weight:bold;">Skin</label>
                     <select id="skin-select" style="width:100%;padding:8px;border-radius:5px;border:1px solid #4a5f7f;background:#2c3e50;color:white;" onchange="window.onSkinChange(this.value)">
                         ${skinRegistry.getAll().filter(s => s.id !== 'classic2').map(s => `<option value="${s.id}" ${s.id === skinRegistry.activeSkinId ? 'selected' : ''}>${s.name}</option>`).join('')}
                     </select>
                 </div>
                <label style="display:block;margin:10px 0;cursor:pointer;" id="mode-3d-label">
                    <input type="checkbox" id="mode-3d" ${skinRegistry.get3dMode() ? 'checked' : ''} onchange="window.toggle3dMode(this.checked)"> 3D Mode
                </label>
                <hr style="border-color:#4a5f7f;margin:15px 0;">
                <div style="margin-bottom:10px;font-weight:bold;">Profile</div>
                <select id="profile-select" style="width:100%;padding:8px;margin-bottom:10px;" onchange="window.switchProfile(this.value)">
                    ${profileOptions}
                </select>
                <hr style="border-color:#4a5f7f;margin:15px 0;">
                <div style="font-size:0.75em;color:#bdc3c7;text-align:center;"><span id="build-info"></span></div>
            </div>
            <div style="flex:1;min-width:200px;">
                <div style="margin-bottom:15px;font-size:1.2em;font-weight:bold;">Game</div>
                <button onclick="exportHistory();" style="display:block;width:100%;margin:8px 0;padding:10px;">Export</button>
                <button onclick="document.getElementById('import-file').click();" style="display:block;width:100%;margin:8px 0;padding:10px;">Import</button>
                <input type="file" id="import-file" style="display:none" onchange="importHistory(this)">
                <hr style="border-color:#4a5f7f;margin:15px 0;">
                <button onclick="showFenDialog();" style="display:block;width:100%;margin:8px 0;padding:10px;">Show FEN</button>
                <button onclick="showGameStats();" style="display:block;width:100%;margin:8px 0;padding:10px;">Game Statistics</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    let buildLabel = window.buildTimestamp || '?';
    if (window.buildProfile === 'dev') {
        buildLabel = 'dev ' + buildLabel;
    }
    const buildInfo = document.getElementById('build-info');
    if (buildInfo) buildInfo.textContent = buildLabel;

    // Show/hide 3D mode checkbox based on active skin support
    const mode3dLabel = document.getElementById('mode-3d-label');
    const skin = skinRegistry.getActive();
    if (mode3dLabel) {
        mode3dLabel.style.display = (skin && skin.supports3d) ? '' : 'none';
    }

    dialog.onclick = (e) => { if (e.target === dialog) closeGameMenu(); };
};

/**
 * Handles skin selection change from the settings dialog
 * Updates the active skin, persists it, closes the menu, and re-renders the board
 */
window.onSkinChange = function(skinId) {
    switchSkin(skinId);
    // Update dialog to reflect new skin's options (e.g. 3D mode visibility)
    const mode3dLabel = document.getElementById('mode-3d-label');
    if (mode3dLabel) {
        const skin = skinRegistry.getActive();
        mode3dLabel.style.display = (skin && skin.supports3d) ? '' : 'none';
    }
};

/**
 * Closes the game menu dialog
 */
window.closeGameMenu = function() {
    const dialog = document.getElementById('game-menu-dialog');
    if (dialog) dialog.remove();
};

/**
 * Toggles visibility of a panel (score card or move history)
 * Also triggers board resize to adjust layout
 * @param {string} id - Panel element ID
 * @param {boolean} visible - Whether to show or hide the panel
 */
window.togglePanelDisplay = function(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) {
        el.classList.remove('panel-hidden');
    } else {
        el.classList.add('panel-hidden');
    }
    requestAnimationFrame(() => {
        if (typeof window.updateBoardSize === 'function') window.updateBoardSize();
    });
};

/**
 * Checks if a panel is currently visible
 * @param {string} id - Panel element ID
 * @returns {boolean} True if panel is visible
 */
window.isPanelVisible = function(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    return !el.classList.contains('panel-hidden');
};

/**
 * Toggles board label visibility and saves preference to localStorage
 * Also updates board display and triggers resize
 * @param {boolean} visible - Whether to show board labels
 */
window.toggleBoardLabels = function(visible) {
    localStorage.setItem('chess_show_board_labels', visible ? 'true' : 'false');
    if (typeof window.updateBoardLabels === 'function') window.updateBoardLabels();
    if (typeof window.updateBoardSize === 'function') window.updateBoardSize();
};

/**
 * Shows a dialog with the current FEN string
 * Provides option to copy FEN to clipboard
 */
window.showFenDialog = function() {
    const existing = document.getElementById('fen-dialog');
    if (existing) { existing.remove(); return; }
    const fen = window.currentFen || '';
    const dialog = document.createElement('div');
    dialog.id = 'fen-dialog';
    dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';
    dialog.innerHTML = `
        <div style="background:#34495e;border-radius:10px;padding:20px;min-width:300px;max-width:90%;">
            <div style="margin-bottom:15px;font-size:1.2em;font-weight:bold;">Current FEN</div>
            <div style="background:#2c3e50;padding:10px;border-radius:5px;font-family:monospace;word-break:break-all;margin-bottom:15px;">${fen}</div>
            <button onclick="navigator.clipboard.writeText('${fen}');" style="display:block;width:100%;margin:8px 0;padding:10px;">Copy to Clipboard</button>
            <button onclick="closeFenDialog();" style="display:block;width:100%;margin:8px 0;padding:10px;">Close</button>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.onclick = (e) => { if (e.target === dialog) closeFenDialog(); };
};

/**
 * Closes the FEN dialog
 */
window.closeFenDialog = function() {
    const dialog = document.getElementById('fen-dialog');
    if (dialog) dialog.remove();
};

/**
 * Shows game statistics dialog
 * Displays total games, wins, losses, draws, and breakdown by result type
 */
window.showGameStats = function() {
    const existing = document.getElementById('stats-dialog');
    if (existing) { existing.remove(); return; }
    
    const stats = window.getGameStats(window.activeProfile?.id);
    if (!stats) {
        alert('No game history found or failed to load statistics.');
        return;
    }
    
    // Build result breakdown HTML
    let resultRows = '';
    if (stats.by_result) {
        const resultLabels = {
            'draw': 'Draw',
            'win_white': 'White Win',
            'win_black': 'Black Win',
            'in_progress': 'In Progress'
        };
        for (const [result, count] of Object.entries(stats.by_result)) {
            const label = resultLabels[result] || result;
            resultRows += `<tr><td style="padding:5px 15px;text-align:left;">${label}</td><td style="padding:5px 15px;text-align:right;">${count}</td></tr>`;
        }
    }
    
    const dialog = document.createElement('div');
    dialog.id = 'stats-dialog';
    dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';
    dialog.innerHTML = `
        <div style="background:#34495e;border-radius:10px;padding:20px;min-width:300px;max-width:90%;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                <div style="font-size:1.2em;font-weight:bold;">Game Statistics</div>
                <button onclick="closeGameStats();" style="background:transparent;border:none;color:white;font-size:1.5em;cursor:pointer;">&times;</button>
            </div>
            <div style="background:#2c3e50;border-radius:5px;padding:15px;margin-bottom:15px;">
                <div style="display:flex;justify-content:space-between;margin:8px 0;">
                    <span>Total Games:</span>
                    <span style="font-weight:bold;">${stats.total_games}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;">
                    <span>Wins:</span>
                    <span style="font-weight:bold;color:#2ecc71;">${stats.wins}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;">
                    <span>Losses:</span>
                    <span style="font-weight:bold;color:#e74c3c;">${stats.losses}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;">
                    <span>Draws:</span>
                    <span style="font-weight:bold;color:#95a5a6;">${stats.draws}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;">
                    <span>Checkmates:</span>
                    <span>${stats.checkmates}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;">
                    <span>Stalemates:</span>
                    <span>${stats.stalemates}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin:8px 0;">
                    <span>In Progress:</span>
                    <span>${stats.in_progress}</span>
                </div>
            </div>
            <div style="font-size:0.9em;margin-bottom:10px;">Breakdown by Result:</div>
            <table style="width:100%;border-collapse:collapse;font-size:0.9em;">
                <thead>
                    <tr style="border-bottom:1px solid #4a5f7f;">
                        <th style="padding:5px 15px;text-align:left;">Result</th>
                        <th style="padding:5px 15px;text-align:right;">Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${resultRows}
                </tbody>
            </table>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.onclick = (e) => { if (e.target === dialog) closeGameStats(); };
};

/**
 * Closes the game statistics dialog
 */
window.closeGameStats = function() {
    const dialog = document.getElementById('stats-dialog');
    if (dialog) dialog.remove();
};
