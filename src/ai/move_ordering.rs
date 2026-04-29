// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Move Ordering - Implements heuristics to improve Alpha-Beta search efficiency.
// Includes MVV-LVA (Most Valuable Victim - Least Valuable Aggressor) and Killer Moves.

use crate::board::move_struct::{Move, MoveFlag};
use crate::board::piece::PieceType;

/// Scores moves for ordering in Alpha-Beta search.
/// Higher scores are searched first.
/// Returns a score where higher = better to search early.
pub fn score_move(m: &Move, board: &crate::board::Board) -> i32 {
    let mut score = 0;
    
    // 1. Captures (MVV-LVA)
    if let Some(captured) = board.get_piece_at(m.to) {
        let victim_value = get_piece_value(&captured.piece_type);
        let attacker_value = if let MoveFlag::Promotion(pt) = m.flag {
            get_piece_value(&pt)
        } else if let Some(piece) = board.get_piece_at(m.from) {
            get_piece_value(&piece.piece_type)
        } else {
            0
        };
        // MVV-LVA: high victim value, low attacker value = high score
        score += 10000 + victim_value * 10 - attacker_value;
    }
    
    // 2. Promotions
    if let MoveFlag::Promotion(_) = m.flag {
        score += 9000;
    }
    
    // 3. Killer moves (simplified - would need tracking)
    // Placeholder for future implementation
    
    score
}

/// Sorts moves in place for Alpha-Beta search order (best first).
pub fn sort_moves(moves: &mut [Move], board: &crate::board::Board) {
    moves.sort_by(|a, b| {
        let score_a = score_move(a, board);
        let score_b = score_move(b, board);
        score_b.cmp(&score_a) // Descending order
    });
}

/// Returns the piece value for MVV-LVA scoring.
fn get_piece_value(piece_type: &PieceType) -> i32 {
    match piece_type {
        PieceType::Pawn => 100,
        PieceType::Knight => 320,
        PieceType::Bishop => 330,
        PieceType::Rook => 500,
        PieceType::Queen => 900,
        PieceType::King => 20000,
    }
}
