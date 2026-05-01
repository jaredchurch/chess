// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// AI Engine Module - Provides difficulty-based move selection for the chess engine.
// Implements levels 1-10 with increasing search depth and evaluation complexity.

pub mod greedy;
pub mod evaluation;
pub mod search;
pub mod transposition;
pub mod move_ordering;

use crate::board::Board;
use crate::board::move_struct::Move;

/// Returns the search depth for the given difficulty level (1, 3-10).
pub fn get_search_depth(level: u8) -> u8 {
    match level {
        1 => 1,
        3 => 2,
        4 => 3,
        5 => 4,
        6 => 5,
        7 => 6,
        8 => 7,
        9 => 8,
        _ => 10,
    }
}

/// Finds the best move for the current side to move based on the given difficulty level.
///
/// # Arguments
/// * `board` - The current board position
/// * `level` - The difficulty level (1, 3-10) to use for move selection
///
/// # Returns
/// The best move according to the engine at the given difficulty, or None if no legal moves exist.
pub fn get_best_move(board: &Board, level: u8) -> Option<Move> {
    match level {
        1 => search::get_best_move_novice(board),
        _ => search::get_best_move_with_depth(board, get_search_depth(level)),
    }
}
