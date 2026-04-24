# Implementation Plan: Move Generation Core

**Branch**: `001-move-generation-core` | **Date**: 2026-04-21 | **Spec**: [specs/001-move-generation-core/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-move-generation-core/spec.md`

## Summary
Implement a high-performance chess move generation library using Bitboards. The engine will support all FIDE rules, including special moves (castling, en passant, promotion), and provide standardized FEN/PGN serialization. The core logic will be strictly isolated from I/O and UI.

## Technical Context

**Language/Version**: Rust 1.75+
**Primary Dependencies**: None (Standard Library)
**Storage**: N/A (In-memory bitboards)
**Testing**: `cargo test`, perft suite
**Target Platform**: Any (Standard Rust)
**Project Type**: Library
**Performance Goals**: < 1ms for full legal move generation in complex middle-game positions.
**Constraints**: Zero-dependency core logic for maximum portability.
**Scale/Scope**: Support all legal moves and termination states (Checkmate, Stalemate, Insufficient Material).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Engine Isolation)**: ✅ DESIGNED. The core logic is a standalone library with no I/O dependencies.
- **Principle II (Move Integrity)**: ✅ DESIGNED. Pseudo-legal generation followed by strict legality filtering ensures FIDE compliance.
- **Principle III (Test-First)**: ✅ PLANNED. Perft tests and unit tests for each piece type will be implemented.
- **Principle IV (Serialization)**: ✅ DESIGNED. FEN/PGN support is explicitly defined in the contract.
- **Principle V (Performance)**: ✅ DESIGNED. Bitboards and Magic Bitboards selected for high performance.
- **Principle VI (Distribution)**: ✅ DESIGNED. Public APIs will use Rust doc-comments (SC-005) and SemVer will be followed.

## Project Structure

### Documentation (this feature)

```text
specs/001-move-generation-core/
├── plan.md              # This file
├── research.md          # Research into bitboards and magic bitboards
├── data-model.md        # Bitboard structures and Move entities
├── quickstart.md        # Rust usage examples
├── contracts/           # Public API definitions
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

```text
src/
├── board/               # Bitboard and game state logic
├── move_gen/            # Pseudo-legal and legal generation
├── serialization/      # FEN and PGN parsing/output
└── lib.rs               # Public interface

tests/
├── perft/               # Performance and correctness tests
└── pieces/              # Unit tests for individual piece types
```

**Structure Decision**: Single library project for maximum isolation and performance.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | | |
