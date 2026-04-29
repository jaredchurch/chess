# Spec 009: Engine Difficulty Levels

## 1. Overview
This specification outlines the improvement of the chess engine to support 10 distinct difficulty levels, ranging from Novice (Level 1) to Expert (Level 10). The goal is to provide a progressive challenge for players of all skill levels.

## 2. Goals
- Implement a tiered difficulty system with 10 levels.
- Move beyond simple 1-ply greedy search to deep search algorithms.
- Introduce advanced evaluation metrics (positional, mobility, safety).
- Optimize search performance to maintain responsiveness in the browser.

## 3. Tiered Difficulty Structure

| Level | Search Depth | Evaluation Complexity | Search Optimizations | Description |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 1-ply | Basic Material | Randomness (50%) | **Novice**: Frequently makes blunders and picks sub-optimal moves. |
| 2 | 1-ply | Basic Material | None | **Beginner**: Basic greedy play (current implementation). |
| 3 | 2-ply | Material + PST | Alpha-Beta Pruning | **Casual**: Basic positional awareness using Piece-Square Tables. |
| 4 | 3-ply | Material + PST | Alpha-Beta Pruning | **Intermediate**: Deeper search, more solid positional play. |
| 5 | 4-ply | Material + PST + Mobility | Alpha-Beta Pruning | **Advanced**: Considers piece activity and mobility. |
| 6 | 5-ply | All above + King Safety | Alpha-Beta Pruning | **Skilled**: Protects the king and avoids obvious traps. |
| 7 | 6-ply | All above + Pawn Structure | Quiescence Search | **Expert**: Handles tactical exchanges properly; understands pawn structure. |
| 8 | 7-ply | All above | Transposition Tables | **Master**: Uses memory to avoid redundant calculations. |
| 9 | 8-ply | All above | Iterative Deepening | **Grandmaster**: Highly optimized search with better move ordering. |
| 10 | 10+ ply | Full Evaluation | All Optimizations | **Engine**: Maximum strength for high-level play. |

## 4. Technical Requirements

### 4.1 Search Algorithms
- **Minimax with Alpha-Beta Pruning**: The core search algorithm for levels 3-10.
- **Quiescence Search**: Needed for levels 7-10 to search until a "quiet" position is reached, avoiding the horizon effect during captures.
- **Iterative Deepening**: Required for levels 9-10 to improve move ordering and time management.

### 4.2 Evaluation Function
The evaluation function will be expanded to include:
- **Piece-Square Tables (PST)**: Bonus/penalty based on piece position (e.g., center control).
- **Mobility**: Number of legal moves available for each piece.
- **King Safety**: Evaluation of pawn shield and proximity of enemy pieces.
- **Pawn Structure**: Doubled pawns, isolated pawns, and passed pawns.

### 4.3 Optimizations
- **Transposition Table (Zobrist Hashing)**: To store and retrieve previously evaluated positions.
- **Move Ordering**: Heuristics like MVV-LVA (Most Valuable Victim - Least Valuable Aggressor) and Killer Heuristic to prune branches faster.

## 5. Proposed API Changes

### Rust (src/ai/mod.rs)
```rust
pub enum DifficultyLevel {
    Novice = 1,
    Beginner = 2,
    Casual = 3,
    Intermediate = 4,
    Advanced = 5,
    Skilled = 6,
    Expert = 7,
    Master = 8,
    Grandmaster = 9,
    Engine = 10,
}

pub fn get_best_move(board: &Board, level: DifficultyLevel) -> Option<Move>;
```

### WASM (src/wasm.rs)
```rust
#[wasm_bindgen]
pub fn get_best_move_wasm(fen: &str, level: u8) -> JsValue;
```

## 6. Verification Plan
- **Unit Tests**: Test each search optimization (Alpha-Beta, PST, Quiescence) individually.
- **Perft Tests**: Ensure search doesn't introduce move generation regressions.
- **Engine vs. Engine**: Run matches between different levels to verify that Level N consistently beats Level N-1.
- **Performance Benchmarks**: Measure nodes searched per second to ensure real-time playability in WASM.
