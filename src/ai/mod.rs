// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// AI Engine Module - Provides difficulty-based move selection for the chess engine.
// Implements tiered difficulty from Novice (Level 1) to Engine (Level 10).

pub mod greedy;
pub mod evaluation;
pub mod search;
pub mod transposition;
pub mod move_ordering;

use crate::board::Board;
use crate::board::move_struct::Move;

/// Difficulty levels for the chess engine, ranging from Novice (1) to Engine (10).
///
/// Each level increases search depth, evaluation complexity, and optimization techniques.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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

impl From<u8> for DifficultyLevel {
    fn from(value: u8) -> Self {
        match value {
            1 => DifficultyLevel::Novice,
            2 => DifficultyLevel::Beginner,
            3 => DifficultyLevel::Casual,
            4 => DifficultyLevel::Intermediate,
            5 => DifficultyLevel::Advanced,
            6 => DifficultyLevel::Skilled,
            7 => DifficultyLevel::Expert,
            8 => DifficultyLevel::Master,
            9 => DifficultyLevel::Grandmaster,
            _ => DifficultyLevel::Engine,
        }
    }
}

impl DifficultyLevel {
    /// Returns the search depth for this difficulty level.
    pub fn search_depth(&self) -> u8 {
        match self {
            DifficultyLevel::Novice => 1,
            DifficultyLevel::Beginner => 1,
            DifficultyLevel::Casual => 2,
            DifficultyLevel::Intermediate => 3,
            DifficultyLevel::Advanced => 4,
            DifficultyLevel::Skilled => 5,
            DifficultyLevel::Expert => 6,
            DifficultyLevel::Master => 7,
            DifficultyLevel::Grandmaster => 8,
            DifficultyLevel::Engine => 10,
        }
    }
}

/// Finds the best move for the current side to move based on the given difficulty level.
///
/// # Arguments
/// * `board` - The current board position
/// * `level` - The difficulty level to use for move selection
///
/// # Returns
/// The best move according to the engine at the given difficulty, or None if no legal moves exist.
pub fn get_best_move(board: &Board, level: DifficultyLevel) -> Option<Move> {
    match level {
        DifficultyLevel::Novice => search::get_best_move_novice(board),
        DifficultyLevel::Beginner => greedy::get_best_move(board),
        _ => search::get_best_move_with_depth(board, level.search_depth()),
    }
}
