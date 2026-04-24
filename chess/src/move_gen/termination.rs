// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.


use crate::board::Board;

/// Possible game termination states.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameState {
    Ongoing,
    Checkmate,
    Stalemate,
    InsufficientMaterial,
}

/// Detects if the game has terminated and returns the state.
pub fn detect_termination(board: &Board) -> GameState {
    let legal_moves = board.generate_legal_moves();
    let in_check = crate::move_gen::is_in_check(board, board.side_to_move);

    if legal_moves.is_empty() {
        if in_check {
            GameState::Checkmate
        } else {
            GameState::Stalemate
        }
    } else if is_insufficient_material(board) {
        GameState::InsufficientMaterial
    } else {
        GameState::Ongoing
    }
}

/// Returns true if there is insufficient material for mate on either side.
/// FIDE rules:
/// - King vs King
/// - King vs King + Knight
/// - King vs King + Bishop
/// - King + Bishop vs King + Bishop (both bishops on same color squares) - omitted for simplicity
pub fn is_insufficient_material(board: &Board) -> bool {
    let total_pieces = board.occupancy[2].0.count_ones();
    
    // King vs King
    if total_pieces == 2 {
        return true;
    }

    // King vs King + Minor Piece
    if total_pieces == 3 {
        let white_knights = board.pieces[1].0.count_ones();
        let white_bishops = board.pieces[2].0.count_ones();
        let black_knights = board.pieces[7].0.count_ones();
        let black_bishops = board.pieces[8].0.count_ones();
        
        if white_knights == 1 || white_bishops == 1 || black_knights == 1 || black_bishops == 1 {
            return true;
        }
    }

    false
}
