# Tasks: WASM Web Bridge & Basic AI

**Input**: Design documents from `specs/002-wasm-web-bridge/`
**Prerequisites**: Core move generation library (`src/board/`, `src/move_gen/`, `src/serialization/`)

**Tests**: TDD approach is MANDATORY per Chess Constitution Principle III.

## Phase 1: AI & Infrastructure

- [x] T001 Add `wasm-bindgen`, `serde`, `serde-wasm-bindgen`, and `serde_derive` to `Cargo.toml`
- [x] T002 Create `src/ai/mod.rs` and `src/ai/greedy.rs`
- [x] T003 Implement material evaluation function `evaluate(board: &Board) -> i32` in `src/ai/greedy.rs`
- [x] T004 Implement 1-ply search `get_best_move(board: &Board) -> Option<Move>` in `src/ai/greedy.rs`
- [x] T005 Create unit tests for Greedy AI in `tests/ai/greedy_test.rs`
- [x] T006 Ensure AI prioritizes captures (highest value first)

## Phase 2: WASM Bridge Implementation

- [x] T007 Create `src/wasm.rs` and update `src/lib.rs` to expose it
- [x] T008 Implement `WasmMove` and `WasmBoard` serializable structs for JS interop
- [x] T009 Implement `get_legal_moves(fen: String) -> JsValue` WASM export
- [x] T010 Implement `apply_move(fen: String, move_obj: JsValue) -> JsValue` WASM export
- [x] T011 Implement `get_best_move_wasm(fen: String) -> JsValue` WASM export
- [x] T012 Implement error handling and FEN validation in WASM layer

## Phase 3: Web Demo & Game Loop

- [x] T013 Create `www/` directory with `index.html` and `index.js`
- [x] T014 Setup build script or `wasm-pack` for local development (Instructions added to README)
- [x] T015 Implement `index.js` to load WASM and initialize the game
- [x] T016 Implement basic board rendering (could be simple SVG or Unicode)
- [x] T017 Implement Player vs AI game loop in JavaScript
- [x] T018 Handle game termination (Checkmate/Draw) in UI

## Phase 4: Verification & Polish

- [x] T019 Run all tests (`cargo test`)
- [x] T020 Verify performance targets (AI move < 100ms) - (Verified via cargo bench)
- [x] T021 Ensure all new source files have appropriate license headers
- [x] T022 Update `README.md` with instructions for web demo
