// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use crate::board::Board;
use crate::board::move_struct::Move;
use crate::board::piece::PieceType;
use crate::board::types::Color;

/// Evaluates the board based on material value.
/// Positive values are better for White, negative values are better for Black.
pub fn evaluate(board: &Board) -> i32 {
    let mut score = 0;
    
    for i in 0..6 {
        let piece_type = match i {
            0 => PieceType::Pawn,
            1 => PieceType::Knight,
            2 => PieceType::Bishop,
            3 => PieceType::Rook,
            4 => PieceType::Queen,
            5 => PieceType::King,
            _ => unreachable!(),
        };
        
        let value = get_piece_value(piece_type);
        
        // White pieces
        score += board.pieces[i].0.count_ones() as i32 * value;
        // Black pieces
        score -= board.pieces[i + 6].0.count_ones() as i32 * value;
    }
    
    score
}

fn get_piece_value(piece_type: PieceType) -> i32 {
    match piece_type {
        PieceType::Pawn => 100,
        PieceType::Knight => 320,
        PieceType::Bishop => 330,
        PieceType::Rook => 500,
        PieceType::Queen => 900,
        PieceType::King => 20000,
    }
}

/// Finds the best move for the current side to move using a greedy 1-ply search.
pub fn get_best_move(board: &Board) -> Option<Move> {
    let moves = board.generate_legal_moves();
    if moves.is_empty() {
        return None;
    }

    let side = board.side_to_move;
    let mut best_move = None;
    let mut best_score = if side == Color::White { i32::MIN } else { i32::MAX };

    for m in moves {
        let mut board_copy = board.clone();
        board_copy.make_move(m);
        let score = evaluate(&board_copy);

        if side == Color::White {
            if score > best_score {
                best_score = score;
                best_move = Some(m);
            }
        } else {
            if score < best_score {
                best_score = score;
                best_move = Some(m);
            }
        }
    }

    best_move
}
