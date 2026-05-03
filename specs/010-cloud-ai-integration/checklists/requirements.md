# Requirements: Cloud AI Integration

- [x] Add "Cloud AI (Stockfish 18)" to `ai-difficulty` select in `index.html`.
- [x] Create `#cloud-eval-card` in `index.html` info panel.
- [x] Add a UI control (e.g., `<input type="number">`) for setting search depth (12-18).
- [x] Implement `getCloudBestMove(fen, depth)` in `index.js` using `fetch`.
- [x] Ensure `getCloudBestMove` updates the UI but **does not** return the move if it's the player's turn.
- [x] Update `makeAiMove` to use `getCloudBestMove` when difficulty is "cloud".
- [x] Implement fallback to local AI in `makeAiMove` on API failure.
- [x] Add `title` attribute to win-chance display for the explanatory tooltip.
- [x] **Persistence:** Save the selected depth in `localStorage` under the active profile/game.
- [x] **Persistence:** Load the saved depth from `localStorage` on application start.
- [x] Ensure evaluation is triggered on FEN update when "Cloud AI" is selected.
- [x] Verify that human players do not see the move recommendations in the UI.
