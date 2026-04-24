# Implementation Plan: WASM Web Bridge & Basic AI

**Branch**: `002-wasm-web-bridge` | **Date**: 2026-04-24 | **Spec**: [specs/002-wasm-web-bridge/spec.md](spec.md)

## Summary
Implement a WASM bridge using `wasm-bindgen` to expose the chess engine to the web. Additionally, implement a "greedy" 1-ply AI opponent and a simple web-based game flow.

## Technical Context

**Language/Version**: Rust 1.75+
**Primary Dependencies**: `wasm-bindgen`, `serde`, `serde_json`
**Target Platform**: Web (WASM)
**AI Strategy**: Greedy 1-ply search (maximize material)
**WASM Strategy**: `wasm-bindgen` for JS/Rust interoperability, `serde` for complex data transfer (moves/board state).

## Proposed Architecture

### WASM Layer (`src/wasm.rs`)
- Wrapper functions for `parse_fen`, `generate_legal_moves`, and `make_move`.
- JS-friendly data structures for Moves and Board states.
- Error handling that returns strings/objects to JS.

### AI Layer (`src/ai/mod.rs`, `src/ai/greedy.rs`)
- `evaluate(board: &Board) -> i32`: Material-based evaluation.
- `get_best_move(board: &Board) -> Option<Move>`: 1-ply search maximizing `evaluate`.

### Serialization
- Use `serde-wasm-bindgen` or `serde_json` to pass complex objects like `Vec<Move>` to JS as JSON objects.

## Implementation Steps

### Phase 1: Infrastructure & AI
1. Add `wasm-bindgen` and `serde` dependencies to `Cargo.toml`.
2. Implement the material evaluation function in `src/ai/greedy.rs`.
3. Implement the 1-ply search in `src/ai/greedy.rs`.
4. Unit tests for AI move selection.

### Phase 2: WASM Bridge
1. Create `src/wasm.rs` and expose it in `lib.rs`.
2. Implement WASM-exported functions:
    - `wasm_get_moves(fen: &str) -> JsValue`
    - `wasm_apply_move(fen: &str, move_json: &str) -> JsValue`
    - `wasm_get_ai_move(fen: &str) -> JsValue`
3. Setup `wasm-pack` configuration if needed, or simple build script.

### Phase 3: Web Prototype (Demo)
1. Create `www/` directory with a simple `index.html` and `index.js`.
2. Use a basic chess board visualization (could be text-based or simple icons).
3. Integrate the WASM module and implement the game loop (Player Move -> AI Move).

## Verification Plan

### Automated Tests
- **AI Tests**: Verify Greedy AI selects captures when available.
- **WASM Tests**: Use `wasm-bindgen-test` to verify bridge functions.

### Manual Verification
- **Web Demo**: Play a full game in the browser against the AI.
- **Checkmate/Draw**: Verify the game correctly ends in the browser.

## Migration & Rollback
- Feature is isolated to new modules (`ai`, `wasm`) and dependencies.
- Rollback involves removing these modules and dependencies.
