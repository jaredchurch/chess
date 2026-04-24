# Interface: Move Generation Library

This contract defines the public API for the core chess move generation library.

## Move Generation

### `generate_moves(board: Board) -> Vec<Move>`
- **Description**: Generates all pseudo-legal moves for the current side to move.
- **Rules**: Includes moves that might leave the king in check.

### `generate_legal_moves(board: Board) -> Vec<Move>`
- **Description**: Generates all strictly legal moves for the current side to move.
- **Rules**: Filters pseudo-legal moves to ensure king is not in check.

## State Management

### `make_move(board: Board, move: Move) -> Result<Board, Error>`
- **Description**: Applies a move to the board and returns the new board state.
- **Rules**: Must handle all special moves (castling, promotion, en passant).

### `is_check(board: Board, side: Color) -> bool`
- **Description**: Returns true if the specified king is under attack.

### `detect_termination(board: Board) -> TerminationState`
- **Description**: Detects Checkmate, Stalemate, or Draw by Insufficient Material.

## Serialization

### `from_fen(fen: String) -> Result<Board, Error>`
- **Description**: Parses a FEN string into a Board structure.

### `to_fen(board: Board) -> String`
- **Description**: Converts a Board structure to its FEN representation.
