# Tasks: Engine Difficulty Levels

**Input**: Design documents from `/specs/009-engine-improvement/`
**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Infrastructure & Positional Evaluation

- [ ] T001 Define `DifficultyLevel` enum and update `get_best_move` signature in `src/ai/mod.rs`
- [ ] T002 Implement Piece-Square Tables (PST) for all pieces in `src/ai/evaluation.rs`
- [ ] T003 Implement basic Minimax search with Alpha-Beta pruning in `src/ai/search.rs`
- [ ] T004 Implement Level 1 (Novice) with randomness in `src/ai/mod.rs`
- [ ] T005 Implement Levels 3 & 4 (Casual, Intermediate) using Alpha-Beta and PST

## Phase 2: Tactical Refinement & Mobility

- [ ] T006 Implement Quiescence Search in `src/ai/search.rs` to handle captures
- [ ] T007 Implement Mobility evaluation in `src/ai/evaluation.rs`
- [ ] T008 Implement King Safety evaluation in `src/ai/evaluation.rs`
- [ ] T009 Implement Level 5 & 6 (Advanced, Skilled) with Mobility and King Safety
- [ ] T010 Implement Level 7 (Expert) with Quiescence Search and Pawn Structure

## Phase 3: Search Optimizations

- [ ] T011 Implement Zobrist Hashing for board positions in `src/board/mod.rs`
- [ ] T012 Implement Transposition Tables in `src/ai/transposition.rs`
- [ ] T013 Implement Move Ordering (MVV-LVA) in `src/ai/move_ordering.rs`
- [ ] T014 Implement Level 8 (Master) with Transposition Tables

## Phase 4: Advanced Control & WASM

- [ ] T015 Implement Iterative Deepening in `src/ai/search.rs`
- [ ] T016 Implement Level 9 & 10 (Grandmaster, Engine) with Iterative Deepening
- [ ] T017 Update WASM bridge in `src/wasm.rs` to expose difficulty levels
- [ ] T018 Integrate difficulty selector in the web UI (`www/js/ui.js` and `www/index.html`)

## Phase 5: Verification & Tuning

- [ ] T019 Create automated benchmark script for Level vs. Level matches
- [ ] T020 Tune evaluation weights and PST values based on match results
- [ ] T021 Verify performance in browser via WASM
