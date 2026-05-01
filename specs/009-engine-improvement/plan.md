# Implementation Plan: Engine Difficulty Levels

**Branch**: `009-engine-improvement` | **Date**: 2026-04-29 | **Spec**: [specs/009-engine-improvement/spec.md](spec.md)

## Summary
Improve the existing greedy 1-ply engine to support 10 difficulty levels. This involves implementing a tiered search and evaluation system, ranging from simple material-based randomness to deep Alpha-Beta search with advanced positional evaluation and optimizations like Transposition Tables and Iterative Deepening.

## Technical Context

**Language/Version**: Rust 1.75+, WASM
**Primary Dependencies**: None (Standard Library)
**Storage**: N/A (In-memory search)
**Testing**: `cargo test`, Level-vs-Level benchmarks
**Target Platform**: WASM (Browser)
**Performance Goals**: Support depth 6+ in < 2 seconds in the browser for Level 10.

## Constitution Check

- **Principle I (Engine Isolation)**: ✅ DESIGNED. AI logic remains isolated in `src/ai/`.
- **Principle II (Move Integrity)**: ✅ DESIGNED. Search uses the verified move generation core.
- **Principle III (Test-First)**: ✅ PLANNED. Search optimizations will be verified via unit tests and automated engine matches.
- **Principle V (Performance)**: ✅ DESIGNED. Alpha-Beta, Transposition Tables, and Move Ordering are selected for efficiency.

## Project Structure

### Documentation

```text
specs/009-engine-improvement/
├── plan.md              # This file
├── spec.md              # Feature specification
├── tasks.md             # Implementation tasks
└── checklists/
    └── requirements.md  # Requirements checklist
```

### Source Code Impact

```text
src/
├── ai/
│   ├── mod.rs           # Updated API and Level dispatch
│   ├── greedy.rs        # Baseline (Level 2)
│   ├── search.rs        # NEW: Minimax, Alpha-Beta, Quiescence
│   ├── evaluation.rs    # NEW: Advanced scoring (PST, Mobility)
│   ├── transposition.rs # NEW: Zobrist hashing and TT
│   └── move_ordering.rs # NEW: MVV-LVA, Killer Heuristic
├── wasm.rs              # Updated WASM bridge
```

## Implementation Phases

### Phase 1: Infrastructure & Positional Evaluation
- Refactor `src/ai/` to support multiple levels.
- Implement **Piece-Square Tables (PST)** for positional scoring.
- Implement **Alpha-Beta Pruning** for more efficient search.

### Phase 2: Tactical Refinement
- Implement **Quiescence Search** to stabilize evaluations in tactical positions.
- Implement **Mobility** and **King Safety** evaluation factors.

### Phase 3: Search Optimizations
- Implement **Zobrist Hashing** and **Transposition Tables**.
- Implement **Move Ordering** heuristics (MVV-LVA).

### Phase 4: Advanced Control & WASM
- Implement **Iterative Deepening** for flexible search control.
- Update WASM bridge and integrate with the frontend.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | | |
