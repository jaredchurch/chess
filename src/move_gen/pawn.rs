// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use crate::board::bitboard::Bitboard;
use crate::board::move_struct::{Move, MoveFlag};
use crate::board::piece::PieceType;
use crate::board::types::{Color, Square};
use crate::board::Board;

pub fn generate_pawn_moves(board: &Board, square: Square, moves: &mut Vec<Move>) {
    let bit_index = square.as_u32();
    let color = board.side_to_move;
    let occupancy = board.occupancy[2];
    let enemy_occupancy = match color {
        Color::White => board.occupancy[1],
        Color::Black => board.occupancy[0],
    };

    if color == Color::White {
        // Single push
        let to = bit_index + 8;
        if to < 64 && !occupancy.get(to) {
            let to_sq = Square::from_u8_unchecked(to as u8);
            if to / 8 == 7 {
                add_promotion_moves(square, to_sq, moves);
            } else {
                moves.push(Move::new(square, to_sq, MoveFlag::Quiet));
                // Double push
                let rank = bit_index / 8;
                if rank == 1 {
                    let to_double = bit_index + 16;
                    if !occupancy.get(to_double) {
                        let to_double_sq = Square::from_u8_unchecked(to_double as u8);
                        moves.push(Move::new(square, to_double_sq, MoveFlag::DoublePawnPush));
                    }
                }
            }
        }
    } else {
        // Black push
        if bit_index >= 8 {
            let to = bit_index - 8;
            if !occupancy.get(to) {
                let to_sq = Square::from_u8_unchecked(to as u8);
                if to / 8 == 0 {
                    add_promotion_moves(square, to_sq, moves);
                } else {
                    moves.push(Move::new(square, to_sq, MoveFlag::Quiet));
                    // Double push
                    let rank = bit_index / 8;
                    if rank == 6 {
                        let to_double = bit_index - 16;
                        if !occupancy.get(to_double) {
                            let to_double_sq = Square::from_u8_unchecked(to_double as u8);
                            moves.push(Move::new(square, to_double_sq, MoveFlag::DoublePawnPush));
                        }
                    }
                }
            }
        }
    }

    // Captures
    let attacks = get_pawn_attacks(square, color);
    let mut capture_bits = attacks.0 & enemy_occupancy.0;
    while capture_bits != 0 {
        let to_idx = capture_bits.trailing_zeros();
        let to_sq = Square::from_u8_unchecked(to_idx as u8);
        if to_idx / 8 == (if color == Color::White { 7 } else { 0 }) {
            add_promotion_capture_moves(square, to_sq, moves);
        } else {
            moves.push(Move::new(square, to_sq, MoveFlag::Capture));
        }
        capture_bits &= capture_bits - 1;
    }

    // En Passant
    if let Some(ep_sq) = board.en_passant_square {
        let ep_idx = ep_sq.as_u32();
        if (attacks.0 & (1 << ep_idx)) != 0 {
            moves.push(Move::new(square, ep_sq, MoveFlag::EnPassantCapture));
        }
    }
}

fn add_promotion_moves(from: Square, to: Square, moves: &mut Vec<Move>) {
    moves.push(Move::new(from, to, MoveFlag::Promotion(PieceType::Queen)));
    moves.push(Move::new(from, to, MoveFlag::Promotion(PieceType::Rook)));
    moves.push(Move::new(from, to, MoveFlag::Promotion(PieceType::Bishop)));
    moves.push(Move::new(from, to, MoveFlag::Promotion(PieceType::Knight)));
}

fn add_promotion_capture_moves(from: Square, to: Square, moves: &mut Vec<Move>) {
    // Note: We might want a separate flag for PromotionCapture if we want to be very specific,
    // but usually Promotion(PieceType) is enough and we know it's a capture if there's an enemy piece at 'to'.
    // For now, let's just use Promotion.
    add_promotion_moves(from, to, moves);
}

pub fn get_pawn_attacks(square: Square, color: Color) -> Bitboard {
    let bit_index = square.as_u32() as i32;
    let file = bit_index % 8;
    let mut attacks = 0u64;

    if color == Color::White {
        if file > 0 && bit_index + 7 < 64 {
            attacks |= 1 << (bit_index + 7);
        }
        if file < 7 && bit_index + 9 < 64 {
            attacks |= 1 << (bit_index + 9);
        }
    } else {
        if file > 0 && bit_index - 9 >= 0 {
            attacks |= 1 << (bit_index - 9);
        }
        if file < 7 && bit_index - 7 >= 0 {
            attacks |= 1 << (bit_index - 7);
        }
    }

    Bitboard(attacks)
}
