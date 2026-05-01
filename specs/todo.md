# All these items need some work to specify them and fit into features (either new or existing)
Once we have worked through doing the spec for them, they should be marked as done in this file.

- [x] 1. Add specs to store history of games in local storage - should store full move history for the game as well as win/loss result.
- [x] 2. Use the game history to allow a replay of a game.
- [x] 3. On a wide screen Add a card on right hand side of screen that shows scores for the current game based on taking pieces using standard scoring mechanisms. On a small screen this should be available from a global context menu. a second card (also accessible through global context menu should display the move history for the current game, with ability to select a specific move and have a dialog that shows the board immediately before the move and highlights the piece that made the move and the destination square).
- [x] 4. When game ends the ending result should show as a dialog box over the board including an explanation of the result, when thid dialog is closed it just shows the board, with highlights around key pieces that contribute to the checkmate or the stalemate. If the game ends in some other method than checkmate or stalemate there are no special highlights.
- [] 5. Add a 3D display mode where angle of view is more like a real-world board.
- [x] 6. Improve the engine that selects moves and have it's skill level configurable from novice to expert with 10 steps.
- [] 7. Use play history to recommend the level for you on the skill level, by default games should start with that recommended level, recommendation should be based on a % configurable likelihood to win (default to 75% likely).
- [] 8. Support mulitple profiles for users in the play history for people who share a single environment that they play in.
- [x] 9. Make play history exportable & importable to end user to support portability and backup.
- [] 10. add a teaching module to help users learn about each piece, what it can do, and also special moves like en pasant.
- [x] 11. give user option to play as white or black, or random selection (50:50 odds on the calculation) - note that game history should tell which side the user was playing.
- [] 12. add card that shows number of games in history as well as number that ended in each way a game can end (win, loss etc)
- [x] 13. Most recent moves taken should be on-screen in the move history when the move is taken.
- [x] 14. add a timer for moves on both sides, I want to see "time for current move selection", "total time per player" and "total time for this game". This should be included between the score card and the move history card.
- [] 15. reset, colour selection, move engine level & indication of who's turn it is should all move into the right side column (please propose how the ordering should be done)