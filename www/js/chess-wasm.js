// chess-wasm.js - WASM interface wrapper
import init, { 
    get_legal_moves, 
    apply_move, 
    get_best_move_wasm, 
    get_game_state
} from '../pkg/chess_core.js';

let wasmReady = false;

export async function initWasm() {
    if (!wasmReady) {
        await init();
        wasmReady = true;
    }
}

export function isWasmReady() {
    return wasmReady;
}

export function getLegalMoves(fen) {
    return get_legal_moves(fen);
}

export function applyMove(fen, move) {
    return apply_move(fen, move);
}

export function getBestMove(fen, level = 2) {
    return get_best_move_wasm(fen, level);
}

export function getGameState(fen) {
    return get_game_state(fen);
}