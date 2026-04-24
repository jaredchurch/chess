# Quickstart: Move Generation Library

## Installation
Add the library as a dependency to your Rust project:
```toml
[dependencies]
chess_core = { path = "../chess_core" }
```

## Basic Usage

### Load a position and generate moves
```rust
use chess_core::{Board, Color};

fn main() {
    // Initialize from starting position
    let board = Board::default();
    
    // Generate all legal moves
    let legal_moves = board.generate_legal_moves();
    
    println!("Found {} legal moves", legal_moves.len());
    
    // Inspect a move
    for m in legal_moves {
        println!("Move: {} to {}", m.from(), m.to());
    }
}
```

### Check for termination
```rust
use chess_core::{Board, TerminationState};

fn check_game(board: &Board) {
    match board.detect_termination() {
        TerminationState::Checkmate(winner) => println!("Checkmate! {:?} wins", winner),
        TerminationState::Stalemate => println!("Stalemate!"),
        TerminationState::InsufficientMaterial => println!("Draw by insufficient material"),
        TerminationState::Ongoing => println!("Game continues"),
    }
}
```

### Serialization
```rust
let fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
let board = Board::from_fen(fen).expect("Valid FEN");
assert_eq!(board.to_fen(), fen);
```
