# Feature Specification: WASM Web Bridge & Basic AI

**Feature Branch**: `002-wasm-web-bridge`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "Implement a WebAssembly (WASM) bridge to expose the Rust move generation logic to JavaScript, along with a basic 'greedy' AI opponent to enable a playable browser prototype."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Web Integration (Priority: P1)

As a web developer, I want to call the Rust move generation logic from JavaScript so that I can display legal moves and update the board in a browser.

**Why this priority**: Essential bridge for any web-based interaction; without this, the engine remains CLI-only.

**Independent Test**: Can be tested by importing the WASM module into a simple HTML page and calling a function to get legal moves for a given FEN.

**Acceptance Scenarios**:

1. **Given** a FEN string in JavaScript, **When** passed to the WASM `get_moves` function, **Then** an array of legal moves is returned.
2. **Given** a move made in JavaScript, **When** passed to the WASM `make_move` function, **Then** the updated FEN is returned.

---

### User Story 2 - "Greedy" AI Opponent (Priority: P1)

As a player, I want to play against a simple computer opponent so that I can test the game flow and have a basic interactive experience.

**Why this priority**: Required for a "playable" prototype; provides the first level of interactivity.

**Independent Test**: Can be tested by triggering the AI to make a move and verifying it selects a legal move (ideally a capture if available).

**Acceptance Scenarios**:

1. **Given** a board state, **When** the AI's `get_best_move` is called, **Then** a legal move is returned.
2. **Given** multiple legal moves including a capture, **When** the greedy AI plays, **Then** it prioritizes the move that captures the highest-value piece.

---

### User Story 3 - Browser Game Flow (Priority: P2)

As a player, I want the system to manage the turn-based flow (Player vs. AI) in the browser so that the game progresses automatically after I make a move.

**Why this priority**: Automates the user experience and completes the "prototype" loop.

**Independent Test**: Can be tested by making a move as a player and observing the system automatically trigger the AI turn and update the board.

**Acceptance Scenarios**:

1. **Given** it's the player's turn, **When** the player makes a move, **Then** the game state updates and it becomes the AI's turn.
2. **Given** it's the AI's turn, **When** the AI move is calculated, **Then** the board is updated and it becomes the player's turn again.

### Edge Cases

- **Invalid FEN from JS**: WASM bridge must handle and return a clear error to the JavaScript layer.
- **AI in Checkmate**: AI must recognize it has no legal moves and trigger a "Game Over" state.
- **WASM Memory Limits**: Ensure the bridge doesn't leak memory over long games (though unlikely with simple board states).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `get_legal_moves(fen: string)` to JavaScript via WASM.
- **FR-002**: System MUST expose `apply_move(fen: string, move: Move)` to JavaScript via WASM.
- **FR-003**: System MUST implement a "greedy" evaluation function (Material: P=1, N/B=3, R=5, Q=9, K=1000).
- **FR-004**: System MUST implement a 1-ply search to find the move that maximizes material gain for the current side.
- **FR-005**: System MUST track the game state (active turn, winner, draw) in the browser-accessible layer.
- **FR-006**: System MUST return moves in a format easily parsed by JavaScript (e.g., an array of objects or strings).

### Key Entities *(include if feature involves data)*

- **WasmBridge**: The interface layer between Rust and JS.
- **GreedyAI**: The simple 1-ply search and evaluation engine.
- **GameState**: Manages the current game turn and status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: WASM module initializes in the browser in under 500ms.
- **SC-002**: AI move selection (1-ply) takes less than 100ms in the browser.
- **SC-003**: 100% of moves made in the browser are validated by the Rust engine as legal.
- **SC-004**: System correctly handles game termination (Checkmate/Draw) and communicates it to the browser layer.

## Assumptions

- We will use `wasm-bindgen` as the primary tool for bridging Rust and JavaScript.
- The initial UI will be minimal (HTML/CSS/Vanilla JS) to focus on the bridge logic.
- Assets (piece icons, etc.) are outside the scope of the WASM bridge logic but will be used in the final prototype.
- The AI evaluation focuses on pure material values (greedy approach) for the initial prototype to prioritize performance and implementation speed.
