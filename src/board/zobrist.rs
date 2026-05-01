// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Zobrist Hashing - Generates unique hash values for board positions.
// Used for transposition tables to detect previously-seen positions.

use crate::board::types::Color;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

/// Zobrist hash values for each piece on each square.
/// Indexed by [piece_index][square_index].
/// piece_index: 0-5 White (P, N, B, R, Q, K), 6-11 Black (P, N, B, R, Q, K)
pub struct ZobristTables {
    pub piece_keys: [[u64; 64]; 12],
    pub side_to_move_key: u64,
    pub castling_keys: [u64; 4],
    pub en_passant_keys: [u64; 8], // One per file
}

impl ZobristTables {
    fn new() -> Self {
        let mut tables = ZobristTables {
            piece_keys: [[0; 64]; 12],
            side_to_move_key: 0,
            castling_keys: [0; 4],
            en_passant_keys: [0; 8],
        };

        // Initialize with random values
        let mut hasher = DefaultHasher::new();

        for piece_idx in 0..12 {
            for sq in 0..64 {
                (piece_idx, sq).hash(&mut hasher);
                tables.piece_keys[piece_idx][sq] = hasher.finish();
            }
        }

        // Side to move key
        b"side_to_move".hash(&mut hasher);
        tables.side_to_move_key = hasher.finish();

        // Castling rights keys
        for i in 0..4 {
            (b"castling", i).hash(&mut hasher);
            tables.castling_keys[i] = hasher.finish();
        }

        // En passant file keys
        for file in 0..8 {
            (b"en_passant", file).hash(&mut hasher);
            tables.en_passant_keys[file] = hasher.finish();
        }

        tables
    }
}

/// Returns the static Zobrist tables (lazy initialized).
pub fn zobrist_tables() -> &'static ZobristTables {
    use std::sync::OnceLock;
    static TABLES: OnceLock<ZobristTables> = OnceLock::new();
    TABLES.get_or_init(ZobristTables::new)
}

/// Computes the Zobrist hash for a given board position.
pub fn compute_zobrist_hash(board: &crate::board::Board) -> u64 {
    let tables = zobrist_tables();
    let mut hash = 0u64;

    // Piece positions
    for piece_idx in 0..12 {
        let mut bb = board.pieces[piece_idx].0;
        while bb != 0 {
            let sq = bb.trailing_zeros() as usize;
            hash ^= tables.piece_keys[piece_idx][sq];
            bb &= bb - 1;
        }
    }

    // Side to move
    if board.side_to_move == Color::Black {
        hash ^= tables.side_to_move_key;
    }

    // Castling rights
    if board.castling_rights & 0x1 != 0 {
        hash ^= tables.castling_keys[0]; // White kingside
    }
    if board.castling_rights & 0x2 != 0 {
        hash ^= tables.castling_keys[1]; // White queenside
    }
    if board.castling_rights & 0x4 != 0 {
        hash ^= tables.castling_keys[2]; // Black kingside
    }
    if board.castling_rights & 0x8 != 0 {
        hash ^= tables.castling_keys[3]; // Black queenside
    }

    // En passant square
    if let Some(ep_sq) = board.en_passant_square {
        let file = ep_sq as usize % 8;
        hash ^= tables.en_passant_keys[file];
    }

    hash
}
