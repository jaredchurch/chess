# Feature Specification: Game End Dialog & Highlights

**Feature Branch**: `007-game-end-dialog`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "Game end dialog with 'New Game' and 'Replay' actions. Highlights for checkmate/stalemate. Stalemate highlights should use paired colors for pieces and the squares they block."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Game End Announcement (Priority: P1)

As a player, I want to be clearly notified when the game ends and have quick options to start again or analyze the game.

**Why this priority**: Core feedback and flow mechanism.

**Independent Test**: Achieve checkmate and verify the dialog shows "White Wins - Checkmate" with buttons for "New Game", "Replay", and "View Board".

**Acceptance Scenarios**:

1. **Given** the game ends, **When** the dialog appears, **Then** it must provide a "New Game" action to reset the board and a "Replay" action to enter replay mode for the current game.

---

### User Story 2 - Post-Game Highlights (Checkmate) (Priority: P2)

As a player, I want to see the pieces that delivered checkmate clearly highlighted on the board.

**Why this priority**: Visual confirmation of the win/loss condition.

**Independent Test**: Close the dialog after checkmate and verify the checkmated King and the attacking piece(s) are highlighted in a high-contrast color (e.g., Red).

---

### User Story 3 - Educational Stalemate Highlights (Priority: P2)

As a player, I want to understand exactly why a stalemate occurred by seeing which pieces are blocking which squares, using color-coded pairs.

**Why this priority**: High educational value for learning why a position is a draw.

**Independent Test**: Trigger a stalemate and verify that if a Rook is blocking the King's path to square 'a1', both the Rook and square 'a1' are highlighted in the same unique color (e.g., both Yellow).

**Acceptance Scenarios**:

1. **Given** a Stalemate has occurred, **When** the dialog is closed, **Then** the board displays the King and all empty squares it could otherwise move to.
2. **Given** an empty square the King is blocked from, **Then** that square AND the piece(s) attacking it are highlighted in a matching color, unique to that square-piece relationship.

### Edge Cases

- **Multiple Pieces Blocking One Square**: If two pieces attack the same square, both pieces and the square should share the same color.
- **Dialog Dismissal**: Clicking "New Game" should bypass the highlight phase and reset the game immediately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a modal dialog immediately upon game termination with actions: "New Game", "Replay", and "View Board".
- **FR-002**: The dialog MUST include the result (e.g., "Draw") and a clear explanation (e.g., "Stalemate").
- **FR-003**: For **Checkmate**, system MUST highlight the checkmated King and all checking pieces in a uniform "Danger" color.
- **FR-004**: For **Stalemate**, system MUST implement **Paired Color Highlighting**:
    - Identify all empty squares adjacent to the King.
    - For each square, identify the opponent piece(s) attacking it.
    - Assign a unique color to each "Square + Attacking Piece(s)" group.
    - Highlight the King in a distinct neutral color (e.g., Gray).
- **FR-005**: Closing the dialog with "View Board" MUST preserve these highlights until a new game or replay is started.

### Key Entities *(include if feature involves data)*

- **Color Pair Map**: A mapping of pieces to the specific squares they are restricting during a stalemate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of stalemate "blocked square" pairs are correctly color-matched.
- **SC-002**: Dialog actions (New Game/Replay) respond within 50ms of a click.
- **SC-003**: Highlights remain visible and accurate after the dialog is dismissed.

## Assumptions

- **Color Palette**: The system will have a palette of at least 8 distinct colors to handle complex stalemate positions.
- **Replay Integration**: The "Replay" button triggers the `005-game-replay` feature logic.
