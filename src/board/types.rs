// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use std::debug_assert;

/// Represents one of the 64 squares on a chess board.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Square {
    A1, B1, C1, D1, E1, F1, G1, H1,
    A2, B2, C2, D2, E2, F2, G2, H2,
    A3, B3, C3, D3, E3, F3, G3, H3,
    A4, B4, C4, D4, E4, F4, G4, H4,
    A5, B5, C5, D5, E5, F5, G5, H5,
    A6, B6, C6, D6, E6, F6, G6, H6,
    A7, B7, C7, D7, E7, F7, G7, H7,
    A8, B8, C8, D8, E8, F8, G8, H8,
}

impl Square {
    pub fn as_u32(&self) -> u32 {
        *self as u32
    }

    pub fn from_u8(index: u8) -> Option<Square> {
        match index {
            0 => Some(Square::A1), 1 => Some(Square::B1), 2 => Some(Square::C1), 3 => Some(Square::D1),
            4 => Some(Square::E1), 5 => Some(Square::F1), 6 => Some(Square::G1), 7 => Some(Square::H1),
            8 => Some(Square::A2), 9 => Some(Square::B2), 10 => Some(Square::C2), 11 => Some(Square::D2),
            12 => Some(Square::E2), 13 => Some(Square::F2), 14 => Some(Square::G2), 15 => Some(Square::H2),
            16 => Some(Square::A3), 17 => Some(Square::B3), 18 => Some(Square::C3), 19 => Some(Square::D3),
            20 => Some(Square::E3), 21 => Some(Square::F3), 22 => Some(Square::G3), 23 => Some(Square::H3),
            24 => Some(Square::A4), 25 => Some(Square::B4), 26 => Some(Square::C4), 27 => Some(Square::D4),
            28 => Some(Square::E4), 29 => Some(Square::F4), 30 => Some(Square::G4), 31 => Some(Square::H4),
            32 => Some(Square::A5), 33 => Some(Square::B5), 34 => Some(Square::C5), 35 => Some(Square::D5),
            36 => Some(Square::E5), 37 => Some(Square::F5), 38 => Some(Square::G5), 39 => Some(Square::H5),
            40 => Some(Square::A6), 41 => Some(Square::B6), 42 => Some(Square::C6), 43 => Some(Square::D6),
            44 => Some(Square::E6), 45 => Some(Square::F6), 46 => Some(Square::G6), 47 => Some(Square::H6),
            48 => Some(Square::A7), 49 => Some(Square::B7), 50 => Some(Square::C7), 51 => Some(Square::D7),
            52 => Some(Square::E7), 53 => Some(Square::F7), 54 => Some(Square::G7), 55 => Some(Square::H7),
            56 => Some(Square::A8), 57 => Some(Square::B8), 58 => Some(Square::C8), 59 => Some(Square::D8),
            60 => Some(Square::E8), 61 => Some(Square::F8), 62 => Some(Square::G8), 63 => Some(Square::H8),
            _ => None,
        }
    }

    pub fn from_u8_unchecked(index: u8) -> Square {
        debug_assert!(index < 64, "Square index must be 0-63");
        unsafe { std::mem::transmute(index) }
    }
}


/// Represents the two players in a game of chess.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Color {
    White,
    Black,
}

impl Color {
    /// Returns the opposite color.
    pub fn opposite(&self) -> Self {
        match self {
            Color::White => Color::Black,
            Color::Black => Color::White,
        }
    }
}