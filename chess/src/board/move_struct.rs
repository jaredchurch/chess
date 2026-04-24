// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.


use crate::board::piece::PieceType;
use crate::board::types::Square;

/// Represents a move flags for special moves.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoveFlag {
    Quiet,
    DoublePawnPush,
    KingsideCastling,
    QueensideCastling,
    Capture,
    EnPassantCapture,
    Promotion(PieceType),
}

/// Represents a chess move.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Move {
    pub from: Square,
    pub to: Square,
    pub flag: MoveFlag,
}

impl Move {
    /// Creates a new move.
    pub fn new(from: Square, to: Square, flag: MoveFlag) -> Self {
        Self { from, to, flag }
    }
}
