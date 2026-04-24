# Data Model: Move Generation Core

## Entities

### Board
Represents the state of a chess game at a single point in time.
- **bitboards**: `[u64; 12]` (6 types * 2 colors) representing piece positions.
- **occupancy**: `[u64; 3]` (White, Black, All) for collision detection.
- **side_to_move**: `Color` (White/Black).
- **castling_rights**: `u8` bitfield (WK, WQ, BK, BQ).
- **en_passant_square**: `Option<Square>` (e.g., e3).
- **half_move_clock**: `u32` for 50-move rule tracking.
- **full_move_number**: `u32`.

### Move
Represents a transition between board states.
- **from**: `Square` (0-63).
- **to**: `Square` (0-63).
- **promotion**: `Option<PieceType>` (Queen, Rook, Bishop, Knight).
- **flags**: `MoveFlag` (Quiet, Double Pawn Push, Castling, EnPassant, Capture).

### Piece
- **color**: `Color` (White, Black).
- **type**: `PieceType` (Pawn, Knight, Bishop, Rook, Queen, King).

## Validation Rules
- Moves must be within board boundaries (0-63).
- Castling requires empty and unattacked path for king.
- En Passant requires specific square target from previous move.
- Target square cannot be occupied by same color.
- Strictly legal moves must not leave king in check.
