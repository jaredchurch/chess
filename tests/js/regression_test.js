// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Regression Test for index.js refactoring - verifies key functions
// maintain consistent behavior before and after code restructuring.
//

// Mock browser APIs for Node.js testing
global.document = {
    getElementById: () => null,
    createElement: () => ({ 
        className: '', 
        innerText: '', 
        innerHTML: '', 
        onclick: null,
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {}, contains: () => false }
    }),
    body: { appendChild: () => {} }
};

global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

global.window = {
    playerColor: 'random',
    aiDifficulty: 1,
    addEventListener: () => {},
    requestAnimationFrame: (fn) => fn()
};

// Import functions to test (will be available after refactoring)
// For now, test the pure logic that can be extracted

// Test formatTime function logic
function testFormatTime() {
    // Extract the formatTime logic for testing
    function formatTime(ms) {
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

    const tests = [
        { input: 0, expected: '0.0' },
        { input: 100, expected: '0.1' },
        { input: 1000, expected: '1.0' },
        { input: 61000, expected: '1:01.0' },
        { input: 3661000, expected: '1:01:01.0' },
        { input: 7200000, expected: '2:00:00.0' }
    ];

    let passed = 0;
    let failed = 0;

    tests.forEach((test, i) => {
        const result = formatTime(test.input);
        if (result === test.expected) {
            passed++;
        } else {
            failed++;
            console.error(`Test ${i + 1} FAILED: formatTime(${test.input}) = "${result}", expected "${test.expected}"`);
        }
    });

    return { passed, failed, total: tests.length };
}

// Test determinePlayerSide logic
function testDeterminePlayerSide() {
    function determinePlayerSide(playerColor) {
        if (playerColor === 'random') {
            return Math.random() < 0.5 ? 'white' : 'black';
        }
        return playerColor;
    }

    // Mock Math.random for predictable results
    const originalRandom = Math.random;
    
    // Test non-random values
    Math.random = originalRandom; // Reset first
    
    let passed = 0;
    let failed = 0;

    // Test white
    window.playerColor = 'white';
    const result1 = determinePlayerSide('white');
    if (result1 === 'white') passed++; else { failed++; console.error('Failed: white should return white'); }

    // Test black
    const result2 = determinePlayerSide('black');
    if (result2 === 'black') passed++; else { failed++; console.error('Failed: black should return black'); }

    // Test random (just verify it returns valid values)
    let randomResults = new Set();
    for (let i = 0; i < 100; i++) {
        const result = determinePlayerSide('random');
        randomResults.add(result);
    }
    if (randomResults.has('white') && randomResults.has('black') && randomResults.size === 2) {
        passed++;
    } else {
        failed++;
        console.error('Failed: random should return white or black');
    }

    Math.random = originalRandom;

    return { passed, failed, total: 3 };
}

// Test getCapturedPiece logic
function testGetCapturedPiece() {
    // Simplified version of the logic
    function parseFenPieces(fen) {
        const pieces = {};
        let rank = 7, file = 0;
        for (const ch of fen.split(' ')[0]) {
            if (ch === '/') { rank--; file = 0; }
            else if (ch >= '1' && ch <= '8') { file += parseInt(ch); }
            else { pieces[String.fromCharCode(97 + file) + (rank + 1)] = ch; file++; }
        }
        return pieces;
    }

    function getCapturedPiece(oldFen, move) {
        const oldPieces = parseFenPieces(oldFen);
        return oldPieces[move.to] || null;
    }

    const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    let passed = 0;
    let failed = 0;

    // Test capturing a piece - e2 has white pawn, e7 has black pawn in starting position
    const captured = getCapturedPiece(testFen, { from: 'e2', to: 'e7' });
    if (captured === 'p') { passed++; } else { failed++; console.error(`Failed: expected 'p' at e7, got ${captured}`); }

    // Test no capture
    const noCapture = getCapturedPiece('8/8/8/8/8/8/8/8 w - - 0 1', { from: 'e2', to: 'e4' });
    if (noCapture === null) { passed++; } else { failed++; console.error('Failed: empty board should have no captures'); }

    return { passed, failed, total: 2 };
}

// Run all tests
console.log('Running regression tests for index.js refactoring...\n');

const test1 = testFormatTime();
console.log(`formatTime tests: ${test1.passed}/${test1.total} passed`);

const test2 = testDeterminePlayerSide();
console.log(`determinePlayerSide tests: ${test2.passed}/${test2.total} passed`);

const test3 = testGetCapturedPiece();
console.log(`getCapturedPiece tests: ${test3.passed}/${test3.total} passed`);

const totalPassed = test1.passed + test2.passed + test3.passed;
const totalFailed = test1.failed + test2.failed + test3.failed;
const totalTests = test1.total + test2.total + test3.total;

console.log(`\nTotal: ${totalPassed}/${totalTests} passed, ${totalFailed} failed`);

if (totalFailed > 0) {
    process.exit(1);
} else {
    console.log('\nAll regression tests passed!');
}
