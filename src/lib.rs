// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

include!(concat!(env!("OUT_DIR"), "/build_info.rs"));

pub mod ai;
pub mod board;
pub mod game_storage;
pub mod move_gen;
pub mod serialization;
pub mod wasm;

// Re-export for convenience
pub use crate::ai::transposition::{clear_tt, lookup_position, store_position};
pub use crate::board::zobrist::compute_zobrist_hash;

pub use crate::board::bitboard::Bitboard;
pub use crate::board::move_struct::{Move, MoveFlag};
pub use crate::board::piece::{Piece, PieceType};
pub use crate::board::types::{Color, Square};
pub use crate::board::Board;
pub use crate::game_storage::{ConclusionMethod, GameRecord, GameResult, MoveRecord, Profile};
