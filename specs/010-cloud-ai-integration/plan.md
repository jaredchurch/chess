# Implementation Plan: Cloud AI Integration (Spec 010)

This plan outlines the step-by-step implementation of the remote Stockfish integration via `chess-api.com`.

## Phase 1: UI & Styling
**Goal:** Prepare the interface for Cloud AI controls and feedback.

1.  **Difficulty Dropdown:**
    *   Add `<option value="cloud">Cloud AI (Stockfish 18)</option>` to `#ai-difficulty` in `index.html`.
2.  **Depth Control:**
    *   Add a labeled numeric input `#cloud-depth` in the `.controls` section.
    *   Set `min="12"`, `max="18"`, and `value="12"`.
    *   Default CSS state: `display: none`.
3.  **Evaluation Card:**
    *   Add `#cloud-eval-card` to `#info-panel`.
    *   Structure:
        ```html
        <div class="card" id="cloud-eval-card" style="display:none">
            <div class="card-title">Cloud Evaluation</div>
            <div id="cloud-eval-text"></div>
            <div id="cloud-eval-chance" title="Winning probability calculated by Stockfish based on centipawn evaluation using the Lichess formula."></div>
        </div>
        ```
4.  **Styling:**
    *   Ensure `#cloud-eval-chance` has a distinct, large font for readability.
    *   Add color-coding logic (e.g., green for >55%, red for <45%).

## Phase 2: API Service & Utility
**Goal:** Create a robust communication layer for the remote engine.

1.  **Implement `fetchCloudData(fen, depth)`:**
    *   Construct the POST request to `https://chess-api.com/v1`.
    *   Handle non-OK responses and network errors gracefully.
    *   Return the full JSON payload.
2.  **Implement `updateCloudUI(data, isPlayerTurn)`:**
    *   Update `#cloud-eval-text` with `data.text`.
    *   Update `#cloud-eval-chance` with `data.winChance`.
    *   **Crucial:** If `isPlayerTurn` is true, ensure no move suggestions (SAN/LAN) are logged or displayed anywhere.

## Phase 3: Persistence Layer
**Goal:** Ensure settings survive page reloads.

1.  **Update `storage.js`:**
    *   Add `CLOUD_DEPTH_KEY` constant.
    *   Implement `getCloudDepth()` and `setCloudDepth(value)` wrappers for `localStorage`.
2.  **Initialize on Start:**
    *   In `index.js` `start()` function, load the saved depth and update the UI input value.

## Phase 4: Game Loop Integration
**Goal:** Hook the Cloud AI into the existing game flow.

1.  **Dropdown Change Handler:**
    *   Update `changeAiDifficulty` to toggle visibility of the depth input and the evaluation card.
    *   If switched to "cloud", trigger an immediate evaluation of the current FEN.
2.  **Modify `makeAiMove`:**
    *   If `aiDifficulty === 'cloud'`:
        *   Display "API Thinking..." in the status bar.
        *   Call `fetchCloudData`.
        *   Parse the `move` (handling 5-character LAN strings for promotions).
        *   Fallback: If API fails, call `get_best_move_wasm(currentFen, 3)`.
3.  **Modify `updateUI`:**
    *   When a move is made and it becomes the player's turn:
        *   If `aiDifficulty === 'cloud'`, call `fetchCloudData` to refresh the evaluation card for the new position.

## Phase 5: Validation & Testing
1.  **Verify Move Masking:** Confirm that the engine's "best move" is never visible to the user during their turn.
2.  **Verify Persistence:** Change depth, refresh page, and confirm the value is restored.
3.  **Verify Fallback:** Temporarily block the API URL in the browser and confirm the game continues using local AI.
4.  **Verify Promotion:** Test with a FEN near promotion to ensure the API's LAN output is correctly parsed.
