// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

pub mod king;
pub mod knight;
pub mod pawn;
pub mod sliding;
pub mod termination;
pub mod lookup;

use crate::board::move_struct::Move;
use crate::board::piece::PieceType;
use crate::board::types::{Color, Square};
use crate::board::Board;

pub fn generate_pseudo_legal_moves(board: &Board) -> Vec<Move> {
    let mut moves = Vec::with_capacity(256);
    let color_offset = match board.side_to_move {
        Color::White => 0,
        Color::Black => 6,
    };

    for piece_type_idx in 0..6 {
        let piece_type = match piece_type_idx {
            0 => PieceType::Pawn,
            1 => PieceType::Knight,
            2 => PieceType::Bishop,
            3 => PieceType::Rook,
            4 => PieceType::Queen,
            5 => PieceType::King,
            _ => unreachable!(),
        };

        let bitboard = board.pieces[color_offset + piece_type_idx];
        let mut bits = bitboard.0;

        while bits != 0 {
            let square_idx = bits.trailing_zeros();
            let square = Square::from_u8_unchecked(square_idx as u8);
            match piece_type {
                PieceType::Pawn => pawn::generate_pawn_moves(board, square, &mut moves),
                PieceType::Knight => knight::generate_knight_moves(board, square, &mut moves),
                PieceType::Bishop => sliding::generate_bishop_moves(board, square, &mut moves),
                PieceType::Rook => sliding::generate_rook_moves(board, square, &mut moves),
                PieceType::Queen => sliding::generate_queen_moves(board, square, &mut moves),
                PieceType::King => king::generate_king_moves(board, square, &mut moves),
            }

            bits &= bits - 1; // Clear least significant set bit
        }
    }

    moves
}

/// Returns true if the king of the given color is in check.
pub fn is_in_check(board: &Board, color: Color) -> bool {
    let king_idx = match color {
        Color::White => 5,
        Color::Black => 11,
    };

    let king_bitboard = board.pieces[king_idx];
    if king_bitboard.0 == 0 {
        return false; // No king on the board
    }

    let king_square_idx = king_bitboard.0.trailing_zeros() as u8;
    let king_square = Square::from_u8_unchecked(king_square_idx);

    is_square_attacked(board, king_square, color.opposite())
}

/// Returns true if the given square is attacked by any piece of the given attacker color.
pub fn is_square_attacked(board: &Board, square: Square, attacker_color: Color) -> bool {
    let attacker_offset = match attacker_color {
        Color::White => 0,
        Color::Black => 6,
    };

    // Attacked by Pawns
    let pawns = board.pieces[attacker_offset];
    let pawn_attacks = pawn::get_pawn_attacks(square, attacker_color.opposite());
    if (pawn_attacks.0 & pawns.0) != 0 {
        return true;
    }

    // Attacked by Knights
    let knights = board.pieces[attacker_offset + 1];
    let knight_attacks = knight::get_knight_attacks(square);
    if (knight_attacks.0 & knights.0) != 0 {
        return true;
    }

    // Attacked by King
    let king = board.pieces[attacker_offset + 5];
    let king_attacks = king::get_king_attacks(square);
    if (king_attacks.0 & king.0) != 0 {
        return true;
    }

    // Attacked by Sliding Pieces (Bishop, Rook, Queen)
    let bishops = board.pieces[attacker_offset + 2];
    let rooks = board.pieces[attacker_offset + 3];
    let queens = board.pieces[attacker_offset + 4];

    let bishop_attacks = sliding::get_bishop_attacks(square, board.occupancy[2]);
    if (bishop_attacks.0 & (bishops.0 | queens.0)) != 0 {
        return true;
    }

    let rook_attacks = sliding::get_rook_attacks(square, board.occupancy[2]);
    if (rook_attacks.0 & (rooks.0 | queens.0)) != 0 {
        return true;
    }

    false
}

/// Generates only pseudo-legal capture moves for the current side to move.
pub fn generate_pseudo_legal_captures(board: &Board) -> Vec<Move> {
    let mut moves = Vec::with_capacity(64);
    let color_offset = match board.side_to_move {
        Color::White => 0,
        Color::Black => 6,
    };

    for piece_type_idx in 0..6 {
        let piece_type = match piece_type_idx {
            0 => PieceType::Pawn,
            1 => PieceType::Knight,
            2 => PieceType::Bishop,
            3 => PieceType::Rook,
            4 => PieceType::Queen,
            5 => PieceType::King,
            _ => unreachable!(),
        };

        let bitboard = board.pieces[color_offset + piece_type_idx];
        let mut bits = bitboard.0;

        while bits != 0 {
            let square_idx = bits.trailing_zeros();
            let square = Square::from_u8_unchecked(square_idx as u8);
            
            // For now, we use the same generators but filter them.
            // A more optimized version would pass a 'captures_only' flag down.
            let mut all_piece_moves = Vec::with_capacity(32);
            match piece_type {
                PieceType::Pawn => pawn::generate_pawn_moves(board, square, &mut all_piece_moves),
                PieceType::Knight => knight::generate_knight_moves(board, square, &mut all_piece_moves),
                PieceType::Bishop => sliding::generate_bishop_moves(board, square, &mut all_piece_moves),
                PieceType::Rook => sliding::generate_rook_moves(board, square, &mut all_piece_moves),
                PieceType::Queen => sliding::generate_queen_moves(board, square, &mut all_piece_moves),
                PieceType::King => king::generate_king_moves(board, square, &mut all_piece_moves),
            }

            for m in all_piece_moves {
                if board.get_piece_at(m.to).is_some() || m.flag == crate::board::move_struct::MoveFlag::EnPassantCapture {
                    moves.push(m);
                }
            }

            bits &= bits - 1;
        }
    }

    moves
}
