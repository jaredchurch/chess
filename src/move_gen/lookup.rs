// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use crate::board::bitboard::Bitboard;
use crate::board::types::{Color, Square};
use std::sync::OnceLock;

pub struct LookupTables {
    pub knight_attacks: [Bitboard; 64],
    pub king_attacks: [Bitboard; 64],
    pub pawn_attacks: [[Bitboard; 64]; 2], // [Color][Square]
    pub rays: [[u64; 8]; 64],             // [Square][Direction]
}

// Direction indices
pub const DIR_N: usize = 0;
pub const DIR_S: usize = 1;
pub const DIR_E: usize = 2;
pub const DIR_W: usize = 3;
pub const DIR_NE: usize = 4;
pub const DIR_NW: usize = 5;
pub const DIR_SE: usize = 6;
pub const DIR_SW: usize = 7;

impl LookupTables {
    fn new() -> Self {
        let mut tables = LookupTables {
            knight_attacks: [Bitboard(0); 64],
            king_attacks: [Bitboard(0); 64],
            pawn_attacks: [[Bitboard(0); 64]; 2],
            rays: [[0; 8]; 64],
        };

        for i in 0..64 {
            let square = Square::from_u8_unchecked(i as u8);
            tables.knight_attacks[i] = super::knight::get_knight_attacks_slow(square);
            tables.king_attacks[i] = super::king::get_king_attacks_slow(square);
            tables.pawn_attacks[0][i] = super::pawn::get_pawn_attacks_slow(square, Color::White);
            tables.pawn_attacks[1][i] = super::pawn::get_pawn_attacks_slow(square, Color::Black);

            // Compute rays
            let file = (i % 8) as i32;
            let rank = (i / 8) as i32;

            let directions = [
                (1, 0),   // N
                (-1, 0),  // S
                (0, 1),   // E
                (0, -1),  // W
                (1, 1),   // NE
                (1, -1),  // NW
                (-1, 1),  // SE
                (-1, -1), // SW
            ];

            for (dir_idx, (dr, df)) in directions.iter().enumerate() {
                let mut r = rank + dr;
                let mut f = file + df;
                let mut ray = 0u64;
                while (0..8).contains(&r) && (0..8).contains(&f) {
                    ray |= 1 << (r * 8 + f);
                    r += dr;
                    f += df;
                }
                tables.rays[i][dir_idx] = ray;
            }
        }

        tables
    }
}

pub fn get_lookup_tables() -> &'static LookupTables {
    static TABLES: OnceLock<LookupTables> = OnceLock::new();
    TABLES.get_or_init(LookupTables::new)
}
