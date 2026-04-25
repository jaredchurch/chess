# Feature Specification: Game Info Cards & Move History

**Feature Branch**: `006-game-info-cards`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "On a wide screen Add a card on right hand side of screen that shows scores for the current game based on taking pieces using standard scoring mechanisms. On a small screen this should be available from a global context menu. a second card (also accessible through global context menu should display the move history for the current game, with ability to select a specific move and have a dialog that shows the board immediately before the move and highlights the piece that made the move and the destination square. Include captured piece icons."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-time Scoring & Material Display (Priority: P1)

As a player, I want to see the current material balance and the specific pieces captured, so that I can quickly assess the state of the game.

**Why this priority**: Core game information that helps players understand material advantage.

**Independent Test**: Capture a Queen and verify the score card shows +9 and adds a Queen icon to the "Captured Pieces" section for the capturing player.

**Acceptance Scenarios**:

1. **Given** a piece is captured, **When** the board state updates, **Then** the score card reflects the updated point totals AND displays the icon of the captured piece.
2. **Given** a wide screen, **Then** the score card is visible on the right-hand side of the board.
3. **Given** a small screen, **Then** the score card is accessible via the global context menu.

---

### User Story 2 - Move History Drill-down (Priority: P2)

As a player, I want to review previous moves in coordinate notation and see a preview of the board state, so that I can verify past plays.

**Why this priority**: Enhances analysis capabilities during and after the game.

**Independent Test**: Open the move history, click on a past move (e.g., "e2e4"), and verify a dialog appears showing the board state *immediately before* that move.

**Acceptance Scenarios**:

1. **Given** the move history card is open, **When** the user selects a move, **Then** a dialog appears showing a static preview of the board.
2. **Given** the move preview dialog is open, **Then** the piece that moved is highlighted on its starting square, and the destination square is also highlighted.
3. **Given** the main board is flipped (Black perspective), **When** the dialog opens, **Then** the preview board orientation matches the main board.

---

### User Story 3 - Responsive Layout (Priority: P2)

As a user on a mobile device, I want to access game information via a menu, so that the UI remains clean.

**Why this priority**: Essential for usability across different device types.

**Independent Test**: Resize the browser window and verify the transition from sidebar cards to menu-driven access.

**Acceptance Scenarios**:

1. **Given** a small screen, **Then** the Score and History cards are moved to a "Game Info" menu.

### Edge Cases

- **Large Number of Captures**: The captured pieces section should wrap or scroll if one player captures many pieces (e.g., all 8 pawns).
- **Coordinate Notation Formatting**: Moves should be displayed clearly (e.g., "1. e2e4 e7e5").
- **Dialog Closing**: Users should be able to close the preview dialog by clicking an "X" or clicking outside the dialog.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate scores using standard piece values: Pawn=1, Knight=3, Bishop=3, Rook=5, Queen=9.
- **FR-002**: System MUST display a **Score Card** showing point totals and **icons of captured pieces** for each side.
- **FR-003**: System MUST display a **Move History Card** listing all moves using **Coordinate Notation** (e.g., "e2e4").
- **FR-004**: System MUST implement a **Responsive Layout** (Sidebar for wide screens, Global Menu for small screens).
- **FR-005**: System MUST allow users to click any move in history to open a **Move Preview Dialog**.
- **FR-006**: The **Move Preview Dialog** MUST:
    - Show the board state *before* the selected move.
    - Highlight the "from" and "to" squares.
    - Match the **orientation/perspective** of the main board.

### Key Entities *(include if feature involves data)*

- **Captured List**: A collection of piece types captured by each player.
- **Score**: The sum of values of the opponent's pieces in the Captured List.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Score and icons update within 100ms of a capture event.
- **SC-002**: Move Preview Dialog board orientation matches main board 100% of the time.
- **SC-003**: UI remains usable on screens as narrow as 320px.

## Assumptions

- **Icon Set**: The existing piece icons used on the board will be reused for the score card.
- **Coordinate Notation**: This is the primary format; algebraic notation is out of scope for v1.
