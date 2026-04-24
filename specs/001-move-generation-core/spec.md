# Feature Specification: Move Generation Core

**Feature Branch**: `001-move-generation-core`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "Implement the core board representation and legal move generation for all pieces, including special moves like castling and en passant."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standard Piece Movement (Priority: P1)

As a chess engine developer, I want to generate all legal moves for every standard piece on the board so that the game can progress according to basic chess rules.

**Why this priority**: Fundamental requirement for any chess logic; blocks all higher-level features.

**Independent Test**: Can be tested by loading a board state with standard pieces and verifying that the generated moves match the expected set of legal moves for those pieces.

**Acceptance Scenarios**:

1. **Given** a board with a white rook at a1 and no other pieces, **When** moves are generated, **Then** 14 legal moves are identified (a2-a8 and b1-h1).
2. **Given** a board with a pawn at its starting position, **When** moves are generated, **Then** it can move one or two squares forward (if unobstructed).

---

### User Story 2 - Special Moves (Priority: P2)

As a chess player, I want the system to handle castling, en passant, and pawn promotion so that I can utilize all tactical options defined in the official rules.

**Why this priority**: Necessary for full FIDE compliance and competitive play.

**Independent Test**: Can be tested by setting up specific triggers (e.g., a pawn reaching the 8th rank) and verifying the specialized move options are available.

**Acceptance Scenarios**:

1. **Given** a board where the white king and kingside rook haven't moved and the path is clear, **When** moves are generated, **Then** kingside castling is listed as a legal move.
2. **Given** a pawn reaching the last rank, **When** a move is made, **Then** the pawn is replaced by a selected piece (Queen, Rook, Bishop, or Knight).

---

### User Story 3 - Move Validation and Check Detection (Priority: P1)

As a system, I must ensure that no generated move leaves the king in check or is otherwise illegal under FIDE rules.

**Why this priority**: Prevents invalid game states and ensures the integrity of the engine.

**Independent Test**: Can be tested by attempting to generate moves in a "pin" situation and verifying that illegal moves (exposing the king) are excluded.

**Acceptance Scenarios**:

1. **Given** a king in check, **When** moves are generated, **Then** only moves that remove the king from check are produced.
2. **Given** a piece pinned against the king, **When** moves are generated, **Then** moves that would leave the king in check are excluded.

### Edge Cases

- **Double Check**: Only the king can move, or a piece must capture/block one of the checkers (if possible, though impossible in double check unless one is captured while blocking the other).
- **Stalemate/Checkmate**: No legal moves are available; system must correctly distinguish between the two based on whether the king is currently in check.
- **Insufficient Material**: Game ends when neither player can checkmate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST represent the 8x8 chess board and the positions of all pieces.
- **FR-002**: System MUST track side to move, castling rights, and en passant target square.
- **FR-003**: System MUST generate all pseudo-legal moves for a given position.
- **FR-004**: System MUST filter pseudo-legal moves to ensure only strictly legal moves are returned (King is not in check after move).
- **FR-005**: System MUST implement Pawn Promotion to Queen, Rook, Bishop, or Knight.
- **FR-006**: System MUST implement Castling (Kingside and Queenside) with all legality checks (no pieces between, king not passing through check, rights not lost).
- **FR-007**: System MUST implement En Passant capturing logic.

- **FR-008**: System MUST detect Draw by Insufficient Material (e.g., King vs King, King and Knight vs King, King and Bishop vs King).

### Key Entities *(include if feature involves data)*

- **Board**: Represents the current state of the game (piece positions, metadata).
- **Piece**: Represents a chess piece (Type: Pawn, Knight, Bishop, Rook, Queen, King; Color: White, Black).
- **Move**: Represents a transition from one board state to another (From square, To square, Flag for special moves).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% compliance with FIDE Laws of Chess regarding move legality.
- **SC-002**: System passes "perft" (performance test) validation against known results for standard positions up to depth 5.
- **SC-003**: Move generation for a standard middle-game position completes in under 1 millisecond.
- **SC-004**: Zero invalid board states are reached during a million-move random simulation.
- **SC-005**: 100% of public API functions include doc-test examples that pass `cargo test`.

## Assumptions

- FIDE Laws of Chess (current version) are the source of truth for all rules.
- The initial scope focuses on the logic engine, not the user interface.
- 50-move rule and 3-fold repetition tracking are handled by the game state manager (may be outside the immediate move generator scope but metadata must be supported).
- [NEEDS CLARIFICATION: Should the move generator also handle Draw by Insufficient Material detection?]
