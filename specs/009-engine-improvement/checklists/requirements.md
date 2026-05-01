# Requirements Checklist: Engine Difficulty Levels

## R1: Tiered Difficulty System
- [ ] Level 1 (Novice): 1-ply search with high randomness.
- [ ] Level 2 (Beginner): 1-ply search (current greedy baseline).
- [ ] Level 3 (Casual): 2-ply search with Alpha-Beta and PST.
- [ ] Level 4 (Intermediate): 3-ply search with Alpha-Beta and PST.
- [ ] Level 5 (Advanced): 4-ply search with Alpha-Beta, PST, and Mobility.
- [ ] Level 6 (Skilled): 5-ply search with Alpha-Beta, PST, Mobility, and King Safety.
- [ ] Level 7 (Expert): 6-ply search with Quiescence Search and Pawn Structure.
- [ ] Level 8 (Master): 7-ply search with Transposition Tables.
- [ ] Level 9 (Grandmaster): 8-ply search with Iterative Deepening.
- [ ] Level 10 (Engine): 10+ ply search with all optimizations.

## R2: Search Logic
- [ ] Implement Minimax algorithm.
- [ ] Implement Alpha-Beta pruning.
- [ ] Implement Quiescence search to handle tactical exchanges.
- [ ] Implement Transposition Tables using Zobrist hashing.
- [ ] Implement Move Ordering (MVV-LVA, Killer Heuristic).
- [ ] Implement Iterative Deepening for time-limited searches.

## R3: Evaluation Function
- [ ] Implement Piece-Square Tables for positional bonuses.
- [ ] Implement Mobility evaluation.
- [ ] Implement King Safety evaluation.
- [ ] Implement Pawn Structure evaluation (doubled, isolated, passed pawns).

## R4: API & Integration
- [ ] Update `DifficultyLevel` enum and `get_best_move` in `src/ai`.
- [ ] Update WASM bridge to accept level parameter.
- [ ] Ensure backward compatibility with existing JS calls (default to level 2).

## R5: Performance & Verification
- [ ] Nodes per second (NPS) benchmark.
- [ ] Level vs. Level automated testing.
- [ ] Verification of Alpha-Beta pruning efficiency.
