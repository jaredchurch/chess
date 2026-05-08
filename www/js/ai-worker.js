// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// AI Web Worker - Runs WASM chess search off the main thread so the UI
// stays responsive during AI thinking. Communicates via postMessage.
//
// Usage:
//   worker.postMessage({ fen: '...', level: 4, id: 1 })
//   worker.onmessage = (e) => { e.data.result, e.data.id }

import init, { get_best_move_wasm } from '../pkg/chess_core.js';

let initialized = false;

self.onmessage = async function (e) {
    if (!initialized) {
        try {
            await init();
            initialized = true;
        } catch (err) {
            self.postMessage({ id: e.data.id, error: err.message });
            return;
        }
    }
    try {
        const { fen, level, id } = e.data;
        const result = get_best_move_wasm(fen, level);
        self.postMessage({ id, result });
    } catch (err) {
        self.postMessage({ id: e.data.id, error: err.message });
    }
};
