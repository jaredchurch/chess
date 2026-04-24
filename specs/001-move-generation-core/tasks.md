# Tasks: Move Generation Core

**Input**: Design documents from `/specs/001-move-generation-core/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD approach is MANDATORY per Chess Constitution Principle III.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths assume a Rust library structure as per plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Rust library project structure in root
- [x] T002 [P] Configure `Cargo.toml` with project metadata
- [x] T003 [P] Configure linting (clippy) and formatting (rustfmt) in `.rustfmt.toml`
- [x] T039 [P] Setup GitHub Actions CI for automated testing and linting in `.github/workflows/ci.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core bitboard and board structures required for all move generation

- [x] T004 Implement Square and Color enums in `src/board/types.rs`
- [x] T005 Implement Bitboard type alias and basic bitwise helpers in `src/board/bitboard.rs`
- [x] T006 Implement PieceType and Piece structures in `src/board/piece.rs`
- [x] T007 Implement core Board structure with bitboard array in `src/board/mod.rs`
- [x] T008 Implement Move structure with square and flag data in `src/board/move_struct.rs`

**Checkpoint**: Foundation ready - piece-specific move generation can now begin

---

## Phase 3: User Story 1 - Standard Piece Movement (Priority: P1) 🎯 MVP

**Goal**: Generate pseudo-legal moves for standard pieces (Pawn, Knight, Bishop, Rook, Queen, King) excluding special moves.

**Independent Test**: Perft tests at depth 1 for standard piece positions.

### Tests for User Story 1 (MANDATORY per Principle III) ⚠️

- [x] T009 [P] [US1] Unit tests for Pawn pseudo-legal moves in `tests/pieces/pawn_test.rs`
- [x] T010 [P] [US1] Unit tests for Knight pseudo-legal moves in `tests/pieces/knight_test.rs`
- [x] T011 [P] [US1] Unit tests for Sliding pieces (Bishop, Rook, Queen) in `tests/pieces/sliding_test.rs`
- [x] T012 [P] [US1] Unit tests for King pseudo-legal moves in `tests/pieces/king_test.rs`

### Implementation for User Story 1

- [x] T013 [US1] Implement Pawn move generation (single/double push, captures) in `src/move_gen/pawn.rs`
- [x] T014 [US1] Implement Knight move generation using lookup tables in `src/move_gen/knight.rs`
- [x] T015 [US1] Implement Sliding piece generation (Magic Bitboards or simple ray casting) in `src/move_gen/sliding.rs`
- [x] T016 [US1] Implement King move generation in `src/move_gen/king.rs`
- [x] T017 [US1] Implement `generate_moves` entry point in `src/move_gen/mod.rs`

**Checkpoint**: User Story 1 functional - basic moves can be generated and tested via unit tests.

---

## Phase 4: User Story 3 - Move Validation and Check Detection (Priority: P1)

**Goal**: Filter pseudo-legal moves to ensure strictly legal moves (King not in check after move).

**Independent Test**: Perft depth 2+ for positions involving pins and checks.

### Tests for User Story 3 (MANDATORY per Principle III) ⚠️

- [x] T018 [P] [US3] Unit tests for `is_check` in `tests/move_gen/check_test.rs`
- [x] T019 [P] [US3] Unit tests for legality filtering (pins, king escapes) in `tests/move_gen/legality_test.rs`

### Implementation for User Story 3

- [x] T020 [US3] Implement `is_check` detection logic in `src/move_gen/mod.rs`
- [x] T021 [US3] Implement `make_move` (and `unmake_move`) logic to simulate board changes in `src/board/mod.rs`
- [x] T022 [US3] Implement `generate_legal_moves` by filtering pseudo-legal moves in `src/move_gen/mod.rs`

**Checkpoint**: User Story 1 & 3 functional - strictly legal standard moves available.

---

## Phase 5: User Story 2 - Special Moves (Priority: P2)

**Goal**: Implement Castling, En Passant, and Pawn Promotion.

**Independent Test**: Perft tests for specific positions (e.g., Kiwipete) that heavily utilize special moves.

### Tests for User Story 2 (MANDATORY per Principle III) ⚠️

- [x] T023 [P] [US2] Unit tests for Castling legality in `tests/pieces/castling_test.rs`
- [x] T024 [P] [US2] Unit tests for En Passant in `tests/pieces/en_passant_test.rs`
- [x] T025 [P] [US2] Unit tests for Pawn Promotion in `tests/pieces/promotion_test.rs`

### Implementation for User Story 2

- [x] T026 [US2] Update Board metadata to track castling rights and EP square in `src/board/mod.rs`
- [x] T027 [US2] Implement Castling generation and validation in `src/move_gen/king.rs`
- [x] T028 [US2] Implement En Passant logic in `src/move_gen/pawn.rs`
- [x] T029 [US2] Implement Promotion logic in `src/move_gen/pawn.rs`
- [x] T030 [US2] Update `make_move` to handle all special move state updates in `src/board/mod.rs`

**Checkpoint**: Full move generation functional for all FIDE rules.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Serialization, termination detection, and performance verification

- [x] T031 Implement FEN parser in `src/serialization/fen.rs`
- [x] T032 Implement FEN exporter in `src/serialization/fen.rs`
- [x] T033 Implement Draw by Insufficient Material detection in `src/move_gen/termination.rs`
- [x] T034 Implement `detect_termination` (Checkmate/Stalemate) in `src/move_gen/termination.rs`
- [x] T035 [P] Setup Perft integration tests in `tests/perft/mod.rs`
- [x] T036 Verify SC-003 (performance target) using `cargo bench`
- [x] T037 [P] Ensure all source files have appropriate license headers
- [x] T038 Update root README.md with final feature capabilities

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Story 3 (Phase 4)**: Depends on Phase 3 (needs pseudo-legal moves to filter).
- **User Story 2 (Phase 5)**: Depends on Phase 4 (special moves also need legality filtering).
- **Polish (Phase 6)**: Depends on Phase 5.

### Parallel Opportunities

- Unit tests for different pieces in T009-T012 can be written in parallel.
- Special move tests T023-T025 can be written in parallel.
- FEN serialization T031-T032 can be done in parallel once Board structure is stable.

---

## Implementation Strategy

### MVP First (User Story 1 & 3)

1. Complete Setup and Foundational.
2. Complete Standard Movement (US1).
3. Complete Legality Filtering (US3) to ensure moves are actually legal.
4. **STOP and VALIDATE**: Run depth 1-3 perft on simple positions.

### Incremental Delivery

1. Foundation -> Core data types.
2. US1 + US3 -> Legal standard moves (Valid Engine!).
3. US2 -> Complete FIDE rules.
4. Polish -> Serialization and Performance.

---

## Notes

- [P] tasks = different files, no dependencies.
- TDD approach is strictly followed: Tests (T009-T012) precede Implementation (T013-T016).
- `make_move` and `unmake_move` are critical for the filtering approach in US3.
