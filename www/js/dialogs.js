window.moveHistoryCollapsed = window.moveHistoryCollapsed || false;

window.showGameMenu = function() {
    const existing = document.getElementById('game-menu-dialog');
    if (existing) { existing.remove(); return; }
    const dialog = document.createElement('div');
    dialog.id = 'game-menu-dialog';
    dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';
    dialog.innerHTML = `
        <div style="background:#34495e;border-radius:10px;padding:20px;min-width:200px;">
            <button onclick="exportHistory();" style="display:block;width:100%;margin:8px 0;padding:10px;">Export</button>
            <button onclick="document.getElementById('import-file').click();" style="display:block;width:100%;margin:8px 0;padding:10px;">Import</button>
            <input type="file" id="import-file" style="display:none" onchange="importHistory(this)">
            <hr style="border-color:#4a5f7f;margin:15px 0;">
            <button onclick="showFenDialog();closeGameMenu();" style="display:block;width:100%;margin:8px 0;padding:10px;">Show FEN</button>
            <hr style="border-color:#4a5f7f;margin:15px 0;">
            <button onclick="flipBoard();closeGameMenu();" style="display:block;width:100%;margin:8px 0;padding:10px;">Rotate View</button>
            <hr style="border-color:#4a5f7f;margin:15px 0;">
            <button onclick="closeGameMenu();" style="display:block;width:100%;margin:8px 0;padding:10px;">Close</button>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.onclick = (e) => { if (e.target === dialog) closeGameMenu(); };
};

window.closeGameMenu = function() {
    const dialog = document.getElementById('game-menu-dialog');
    if (dialog) dialog.remove();
};

window.showSettingsMenu = function() {
    const existing = document.getElementById('settings-menu-dialog');
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
    dialog.id = 'settings-menu-dialog';
    dialog.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';
    dialog.innerHTML = `
        <div style="background:#34495e;border-radius:10px;padding:20px;min-width:250px;">
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
            <hr style="border-color:#4a5f7f;margin:15px 0;">
            <div style="margin-bottom:10px;font-weight:bold;">Profile</div>
            <select id="profile-select" style="width:100%;padding:8px;margin-bottom:10px;" onchange="window.switchProfile(this.value)">
                ${profileOptions}
            </select>
            <hr style="border-color:#4a5f7f;margin:15px 0;">
            <div style="font-size:0.75em;color:#bdc3c7;text-align:center;"><span id="build-info"></span></div>
        </div>
    `;
    document.body.appendChild(dialog);
    let buildLabel = window.buildTimestamp || '?';
    if (window.buildProfile === 'dev') {
        buildLabel = 'dev ' + buildLabel;
    }
    const buildInfo = document.getElementById('build-info');
    if (buildInfo) buildInfo.textContent = buildLabel;
    dialog.onclick = (e) => { if (e.target === dialog) closeSettingsMenu(); };
};

window.closeSettingsMenu = function() {
    const dialog = document.getElementById('settings-menu-dialog');
    if (dialog) dialog.remove();
};

window.togglePanelDisplay = function(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    if (visible) {
        el.classList.remove('panel-hidden');
    } else {
        el.classList.add('panel-hidden');
    }
    requestAnimationFrame(() => {
        if (typeof updateBoardSize === 'function') updateBoardSize();
    });
};

// Helper to check if panel is visible
window.isPanelVisible = function(id) {
    const el = document.getElementById(id);
    if (!el) return false;
    return !el.classList.contains('panel-hidden');
};

window.toggleBoardLabels = function(visible) {
    localStorage.setItem('chess_show_board_labels', visible ? 'true' : 'false');
    if (typeof updateBoardLabels === 'function') updateBoardLabels();
    if (typeof updateBoardSize === 'function') updateBoardSize();
};

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

window.closeFenDialog = function() {
    const dialog = document.getElementById('fen-dialog');
    if (dialog) dialog.remove();
};