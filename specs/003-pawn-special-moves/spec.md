# Feature Specification: Pawn special moves (Double push, En passant)

**Feature Branch**: `003-pawn-special-moves`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "Pawn special moves (Double push, En passant)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pawn Double Push (Priority: P1)

As a player, I want to move my pawn two squares forward from its starting position so that I can control the center of the board more quickly.

**Why this priority**: Fundamental chess rule that impacts opening theory and pawn structure.

**Independent Test**: Can be tested by placing a pawn on its starting square and verifying it can move two squares forward if both destination squares are empty.

**Acceptance Scenarios**:

1. **Given** a White pawn is on rank 2, **When** the player moves it to rank 4 and rank 3 is empty, **Then** the move is valid and the board state updates.
2. **Given** a Black pawn is on rank 7, **When** the player moves it to rank 5 and rank 6 is empty, **Then** the move is valid and the board state updates.
3. **Given** a White pawn is on rank 2 but rank 3 is occupied, **When** the player attempts to move it to rank 4, **Then** the move is rejected as invalid.

---

### User Story 2 - En Passant Capture (Priority: P2)

As a player, I want to capture an opponent's pawn "en passant" after they have performed a double push, so that I don't lose the advantage of my pawn's position.

**Why this priority**: Core chess rule that prevents pawns from "sneaking past" opponent pawns using the double push.

**Independent Test**: Can be tested by performing a double push with one pawn and immediately capturing it with an adjacent opponent pawn on the next move.

**Acceptance Scenarios**:

1. **Given** a White pawn is on rank 5 and a Black pawn just moved from rank 7 to rank 5 on an adjacent file, **When** the White pawn moves to rank 6 on that file, **Then** the Black pawn is captured and removed from the board.
2. **Given** a Black pawn is on rank 4 and a White pawn just moved from rank 2 to rank 4 on an adjacent file, **When** the Black pawn moves to rank 3 on that file, **Then** the White pawn is captured and removed from the board.

---

### User Story 3 - En Passant Expiration (Priority: P3)

As a player, I want the en passant capture to be available only on the move immediately following the double push, to comply with chess rules.

**Why this priority**: Prevents delayed en passant captures which are illegal in chess.

**Independent Test**: Can be tested by performing a double push, making a different move with another piece, and then trying to perform en passant.

**Acceptance Scenarios**:

1. **Given** a Black pawn just double-pushed to rank 5, **When** White makes a move with a Knight instead of capturing en passant, **Then** the en passant capture is no longer available for that pawn on subsequent moves.

### Edge Cases

- **Capture at Destination**: What happens if a piece is already at the destination square of the double push? (Handled: Move should be invalid).
- **Blocking Square**: What if a piece is on the square skipped by the double push? (Handled: Move should be invalid).
- **Check Evasion/Delivery**: Can a double push or en passant capture deliver check or move out of check? (Handled: Yes, standard legality rules apply).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow pawns on their starting rank (rank 2 for White, rank 7 for Black) to move two squares forward.
- **FR-002**: System MUST validate that both the skipped square and the destination square are empty for a double push.
- **FR-003**: System MUST record the "en passant target square" (the square skipped) when a pawn performs a double push.
- **FR-004**: System MUST allow a pawn on rank 5 (White) or rank 4 (Black) to capture an opponent's pawn that just double-pushed to an adjacent file.
- **FR-005**: System MUST remove the captured pawn from the board during an en passant capture.
- **FR-006**: System MUST clear the en passant target square after any move that is not the immediate follow-up to a double push.

### Key Entities *(include if feature involves data)*

- **Board State**: Includes the positions of all pieces and the optional en passant target square.
- **Pawn**: A piece with specific movement rules (single push, double push, diagonal capture, en passant).
- **En Passant Target Square**: The square over which a pawn just passed during a double push, available for capture by an opponent's pawn.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of legal pawn double-push moves are correctly identified as valid in move generation.
- **SC-002**: 100% of legal en passant captures are correctly identified and executed.
- **SC-003**: 0% of illegal en passant captures (e.g., delayed captures) are permitted.
- **SC-004**: Board state (FEN or internal representation) correctly tracks and updates the en passant target square according to FIDE rules.

## Assumptions

- **FIDE Compliance**: The implementation follows the Laws of Chess as defined by FIDE.
- **Starting Position**: Pawns always start on rank 2 (White) and rank 7 (Black) in a standard game.
- **Move Sequence**: En passant is strictly a "one-time offer" immediately following the double push.
