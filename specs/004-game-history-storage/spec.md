# Feature Specification: Game History Storage

**Feature Branch**: `004-game-history-storage`  
**Created**: 2026-04-25  
**Status**: Draft  
**Input**: User description: "Add specs to store history of games in local storage - should store full move history for the game as well as win/loss result. Must be profile-aware, support live-saving, record move timing, and include conclusion methods."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Game Archiving (Priority: P1)

As a player, I want my finished games to be automatically saved to my profile so that I can keep a record of my performance and review my games later.

**Why this priority**: Core requirement for tracking progress and the foundation for the replay feature.

**Independent Test**: Complete a game and verify that a new entry appears in local storage associated with the active profile ID, containing the correct move sequence, the conclusion method (e.g., Checkmate), and the final result.

**Acceptance Scenarios**:

1. **Given** a game ends via checkmate, **When** the result is declared, **Then** the system finalizes the record with `result: WIN_WHITE` and `method: CHECKMATE`.

---

### User Story 2 - Mid-Game Recovery (Priority: P1)

As a player, I want my current game state to be saved after every move, so that if my browser crashes or I refresh the page, I can resume exactly where I left off.

**Why this priority**: Prevents frustration from lost progress and ensures high reliability.

**Independent Test**: Make 5 moves, refresh the browser, and verify the game state (board and move history) is restored automatically.

**Acceptance Scenarios**:

1. **Given** an active game, **When** a move is made, **Then** the move coordinates and the time taken are immediately appended to the persistent storage.
2. **Given** the application starts, **When** an "In Progress" game exists for the active profile, **Then** the system automatically restores that game state.

---

### User Story 3 - Multi-Profile Support (Priority: P2)

As a user sharing a device, I want my game history to be stored separately from other users, so that our statistics and replays don't get mixed up.

**Why this priority**: Essential for shared environments (Item #8 in todo list).

**Independent Test**: Switch between Profile A and Profile B; verify that history retrieved only shows games belonging to the active profile.

**Acceptance Scenarios**:

1. **Given** games exist for multiple profiles, **When** Profile A is active, **Then** only games with `profileId: "A"` are visible/accessible.

### Edge Cases

- **Storage Limit**: When `localStorage` is full, the system should prioritize the "Current Game" persistence over old history.
- **Profile Deletion**: If a profile is deleted, all associated game history should be purged to save space.
- **Time Sync**: If the system clock changes mid-game, move durations should still be calculated relative to the start of the move.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store game history in the browser's `localStorage`.
- **FR-002**: Each history entry MUST include the full sequence of moves in **coordinate notation** (e.g., "e2e4").
- **FR-003**: System MUST record the **duration** (in milliseconds) of every move to support analysis.
- **FR-004**: System MUST record the final game result (White Win, Black Win, Draw, or In Progress).
- **FR-005**: System MUST record the **conclusion method** (Checkmate, Resignation, Stalemate, Timeout, or Agreement).
- **FR-006**: Each history entry MUST be tagged with a `profileId` to support multi-user environments.
- **FR-007**: System MUST include a unique `gameId` and a `lastModified` timestamp for every record.
- **FR-008**: System MUST persist every move **immediately** after it is validated and applied to the board (Live Saving).
- **FR-009**: System MUST provide a "Restore" capability to load an "In Progress" game for the current profile upon application start.

### Key Entities *(include if feature involves data)*

- **Profile**: Represents a user (ID, name, settings).
- **Game Record**:
  - `gameId`: UUID
  - `profileId`: String (ID of the profile owner)
  - `timestamp`: Creation time
  - `lastModified`: Last move time
  - `moves`: Array of Move objects `{ coords: string, durationMs: number }`
  - `result`: Enum (WIN_WHITE, WIN_BLACK, DRAW, IN_PROGRESS)
  - `method`: Enum (CHECKMATE, RESIGNATION, STALEMATE, TIMEOUT, AGREEMENT)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of moves and their durations are persisted to storage within 50ms of the move being made.
- **SC-002**: "In Progress" games are successfully recovered in 100% of page refresh scenarios.
- **SC-003**: History retrieval for a specific profile excludes 100% of data belonging to other profiles.
- **SC-004**: Storage efficiency: A 40-move game with timing data occupies less than 5KB of storage.

## Assumptions

- **Reconstruction Performance**: Board state reconstruction from move sequences is assumed to be fast enough (<100ms) that FEN storage is unnecessary.
- **Single Active Game**: Each profile can only have one "In Progress" game at a time.
