// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Module Test - Verifies all JS modules load correctly and exports are defined.
// Run with: node --input-type=module < tests/js/module_test.js
//

// Mock browser APIs for Node.js environment
global.window = global;
global.document = {
    getElementById: () => null,
    createElement: () => {
        return {
            className: '',
            innerText: '',
            innerHTML: '',
            onclick: null,
            appendChild: () => {},
            classList: { add: () => {}, remove: () => {}, contains: () => false }
        };
    }
};
global.navigator = { clipboard: { writeText: async () => {} } };
global.requestAnimationFrame = (fn) => fn();
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (e) {
        console.log(`✗ ${name}: ${e.message}`);
        failed++;
    }
}

// Test that all modules can be imported
test('timer.js exports', async () => {
    const module = await import('../../www/js/timer.js');
    const required = ['formatTime', 'updateTimerDisplay', 'startMoveTimer', 'stopMoveTimer', 'recordMoveTime'];
    required.forEach(exp => {
        if (typeof module[exp] !== 'function') {
            throw new Error(`Missing export: ${exp}`);
        }
    });
});

test('board.js exports', async () => {
    // Mock addEventListener to avoid runtime error
    const origAddEventListener = global.addEventListener;
    global.addEventListener = () => {};
    
    let module;
    try {
        module = await import('../../www/js/board.js');
    } catch (e) {
        if (e.code === 'ERR_MODULE_NOT_FOUND' && e.message.includes('three')) {
            console.log('  (board.js skipped - three.js CDN dep not available in Node.js test env)');
            global.addEventListener = origAddEventListener;
            return;
        }
        throw e;
    }
    
    const required = ['renderBoard', 'handleSquareClick', 'renderPreviewBoard', 'showMovePreview', 'parseFenPieces'];
    required.forEach(exp => {
        if (typeof module[exp] !== 'function') {
            throw new Error(`Missing export: ${exp}`);
        }
    });
    
    global.addEventListener = origAddEventListener;
});

test('game.js exports', async () => {
    const module = await import('../../www/js/game.js');
    const required = ['start', 'startNewGame', 'saveCurrentGame', 'finishGame', 'determinePlayerSide', 'isPlayerTurn', 'updateUI', 'getBoardStateAtMove', 'getCapturedPiece'];
    required.forEach(exp => {
        if (typeof module[exp] !== 'function') {
            throw new Error(`Missing export: ${exp}`);
        }
    });
});

test('ai.js exports', async () => {
    const module = await import('../../www/js/ai.js');
    const required = ['getCloudBestMove', 'makeAiMove'];
    required.forEach(exp => {
        if (typeof module[exp] !== 'function') {
            throw new Error(`Missing export: ${exp}`);
        }
    });
});

test('ui-cards.js exports', async () => {
    let module;
    try {
        module = await import('../../www/js/ui-cards.js');
    } catch (e) {
        if (e.code === 'ERR_MODULE_NOT_FOUND' && e.message.includes('three')) {
            console.log('  (ui-cards.js skipped - three.js CDN dep not available in Node.js test env)');
            return;
        }
        throw e;
    }
    const required = ['updateScoreCard', 'updateMoveHistoryCard'];
    required.forEach(exp => {
        if (typeof module[exp] !== 'function') {
            throw new Error(`Missing export: ${exp}`);
        }
    });
});

test('dialogs-newgame.js exports', async () => {
    const module = await import('../../www/js/dialogs-newgame.js');
    // This module sets window functions, so just verify it loads without error
    console.log('  (dialogs-newgame.js loaded)');
});

test('dialogs.js exports', async () => {
    const module = await import('../../www/js/dialogs.js');
    // This module sets window functions, so just verify it loads without error
    console.log('  (dialogs.js loaded)');
});

test('storage.js exports', async () => {
    const module = await import('../../www/js/storage.js');
    const required = ['getStorageItem', 'setStorageItem', 'initializeProfile', 'saveGame', 'loadInProgressGame', 'exportHistory', 'getAllProfiles', 'switchProfile', 'createProfile', 'deleteProfile', 'generateUUID', 'STORAGE_KEY_PROFILES', 'STORAGE_KEY_ACTIVE_PROFILE'];
    required.forEach(exp => {
        if (module[exp] === undefined) {
            throw new Error(`Missing export: ${exp}`);
        }
    });
});

// Test generateUUID specifically (this was the bug that caused runtime error)
test('generateUUID is defined and works', async () => {
    const storage = await import('../../www/js/storage.js');
    if (typeof storage.generateUUID !== 'function') {
        throw new Error('generateUUID is not exported from storage.js');
    }
    const uuid = storage.generateUUID();
    if (typeof uuid !== 'string' || uuid.length < 10) {
        throw new Error('generateUUID returns invalid value');
    }
});

// Delay to let all async tests complete before checking results
setTimeout(() => {
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        process.exit(1);
    }
}, 100);
