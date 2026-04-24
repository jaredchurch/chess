# Research: Move Generation Core

## Decision 1: Board Representation
**Decision**: Bitboards (u64)
**Rationale**: 
- High performance for move generation and evaluation.
- Naturally represents 64 squares in a single CPU register.
- Allows for extremely fast bitwise operations for move calculation.
- Memory efficient.
**Alternatives considered**: 
- **Mailbox (8x8 or 10x12 array)**: Simpler to implement but significantly slower and less cache-efficient for modern chess engines.

## Decision 2: Sliding Piece Move Generation
**Decision**: Magic Bitboards
**Rationale**: 
- Provides near-instant lookups for sliding piece attacks using precomputed tables.
- Standard approach in high-performance engines.
- Well-documented and highly reliable.
**Alternatives considered**: 
- **Classical bitboard rotation**: More complex and generally slower than magic bitboards.

## Decision 3: Move Validation Strategy
**Decision**: Pseudo-legal generation followed by legality filter.
**Rationale**: 
- Simplifies move generation logic.
- A move is "strictly legal" if it doesn't leave the king in check. This is easily checked by applying the move and verifying if the king square is attacked by the opponent.
**Alternatives considered**: 
- **Strictly legal generation**: Extremely complex for sliding pieces and pins.

## Decision 4: Serialization
**Decision**: FEN (Forsyth–Edwards Notation) and PGN (Portable Game Notation).
**Rationale**: 
- Industry standards for chess position and game history.
- Essential for interoperability with other chess software and GUI.
**Alternatives considered**: None (required by Constitution Principle IV).

## Best Practices
- Use "perft" (Performance Test) to verify move generation correctness at various depths.
- Maintain a strict separation between board state and the move generator.
- Implement move "undo" (either by copying the board or using a state history stack) for efficient tree searching.
