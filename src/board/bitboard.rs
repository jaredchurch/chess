// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

/// A bitboard is a 64-bit integer where each bit represents a square on the board.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct Bitboard(pub u64);

impl Bitboard {
    /// Returns true if the bit at the given square is set.
    pub fn get(&self, square: u32) -> bool {
        (self.0 & (1 << square)) != 0
    }

    /// Sets the bit at the given square.
    pub fn set(&mut self, square: u32) {
        self.0 |= 1 << square;
    }

    /// Clears the bit at the given square.
    pub fn clear(&mut self, square: u32) {
        self.0 &= !(1 << square);
    }

    /// Returns the number of set bits (population count).
    pub fn count(&self) -> u32 {
        self.0.count_ones()
    }

    /// Returns true if the bitboard is empty.
    pub fn is_empty(&self) -> bool {
        self.0 == 0
    }
}

// Implement common bitwise operations for Bitboard...
impl std::ops::BitAnd for Bitboard {
    type Output = Self;
    fn bitand(self, rhs: Self) -> Self {
        Bitboard(self.0 & rhs.0)
    }
}

impl std::ops::BitOr for Bitboard {
    type Output = Self;
    fn bitor(self, rhs: Self) -> Self {
        Bitboard(self.0 | rhs.0)
    }
}

impl std::ops::Not for Bitboard {
    type Output = Self;
    fn not(self) -> Self {
        Bitboard(!self.0)
    }
}
