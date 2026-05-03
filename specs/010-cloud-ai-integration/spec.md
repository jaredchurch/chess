# Spec 010: Cloud AI Integration (chess-api.com)

## Overview
Integrate a remote chess engine (Stockfish 18 via `chess-api.com`) to provide advanced AI difficulty and professional-grade position evaluation within the web interface.

## Goals
- Provide a "Cloud AI" difficulty level that surpasses local WASM engine capabilities.
- Display real-time position evaluation (Win Chance) to the player.
- Ensure the interface remains responsive during remote API calls.

## Requirements

### 1. API Integration
- **Endpoint:** `https://chess-api.com/v1` (POST)
- **Payload:** JSON containing `fen`, `depth`, and optionally `maxThinkingTime`.
- **Search Depth:** 
    - The depth should be configurable by the user (API supports 12-18 for free users).
    - Default depth should be 12.
- **Response Handling:**
    - Parse `winChance` (percentage).
    - Parse `text` (human-readable evaluation).
    - Parse `move` (for AI turns).

### 2. User Interface
- **Difficulty Selection:** Add a "Cloud AI (Stockfish 18)" option to the AI difficulty dropdown.
- **Depth Configuration:** 
    - Add a UI control (e.g., a numeric input or slider) to set the preferred search depth.
    - This control should only be visible or active when "Cloud AI" is selected.
- **Evaluation Card:** 
    - A dedicated card in the info panel titled "Cloud Evaluation".
    - Display the win chance percentage.
    - Display the human-readable summary (e.g., "White is slightly better").
- **Tooltip:**
    - Add a tooltip over the Win Chance value.
    - **Tooltip Text:** "Winning probability calculated by Stockfish based on centipawn evaluation using the Lichess formula."

### 3. Behavioral Constraints
- **Human Players:** The API's recommended move **MUST NOT** be shown or suggested to the human player. The "Cloud Evaluation" card should only show the score/text, not the `move` or `san` fields when it is the player's turn.
- **AI Turn:** When "Cloud AI" is selected, the system should use the API's recommended move to play for the computer side.
- **Fallback:** If the API is unreachable or returns an error, the system must fallback to a high-level local AI (e.g., Level 3 or 4) and log a warning to the console.

## Technical Considerations
- **CORS:** The API supports CORS, so standard `fetch` can be used.
- **Persistence:** The preferred search depth must be stored in `localStorage` and associated with the current game/profile so it persists across sessions.
- **Latency:** Show a "Thinking..." or "Fetching..." state in the evaluation card while the request is in flight.
- **Throttling:** Avoid redundant API calls. Only fetch when the position (FEN) changes.
