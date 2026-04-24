// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.


use crate::board::Board;
use crate::board::bitboard::Bitboard;
use crate::board::types::{Color, Square};
use crate::board::move_struct::{Move, MoveFlag};

pub fn generate_king_moves(board: &Board, square: Square, moves: &mut Vec<Move>) {
    let king_attacks = get_king_attacks(square);
    let mut bits = king_attacks.0;
    
    let own_occupancy_index = match board.side_to_move {
        Color::White => 0,
        Color::Black => 1,
    };
    let enemy_occupancy_index = 1 - own_occupancy_index;

    // Filter out our own pieces
    bits &= !board.occupancy[own_occupancy_index].0;
    
    while bits != 0 {
        let to_index = bits.trailing_zeros();
        let to_square: Square = unsafe { std::mem::transmute(to_index as u8) };
        let flag = if board.occupancy[enemy_occupancy_index].get(to_index) {
            MoveFlag::Capture
        } else {
            MoveFlag::Quiet
        };
        moves.push(Move::new(square, to_square, flag));
        bits &= bits - 1;
    }

    // Castling
    let color = board.side_to_move;
    if color == Color::White && square == Square::E1 {
        // Kingside
        if (board.castling_rights & 0x1) != 0 {
            if !board.occupancy[2].get(Square::F1.as_u32()) && !board.occupancy[2].get(Square::G1.as_u32()) {
                if !crate::move_gen::is_in_check(board, Color::White) && 
                   !crate::move_gen::is_square_attacked(board, Square::F1, Color::Black) {
                    moves.push(Move::new(Square::E1, Square::G1, MoveFlag::KingsideCastling));
                }
            }
        }
        // Queenside
        if (board.castling_rights & 0x2) != 0 {
            if !board.occupancy[2].get(Square::D1.as_u32()) && !board.occupancy[2].get(Square::C1.as_u32()) && !board.occupancy[2].get(Square::B1.as_u32()) {
                if !crate::move_gen::is_in_check(board, Color::White) && 
                   !crate::move_gen::is_square_attacked(board, Square::D1, Color::Black) {
                    moves.push(Move::new(Square::E1, Square::C1, MoveFlag::QueensideCastling));
                }
            }
        }
    } else if color == Color::Black && square == Square::E8 {
        // Black Kingside
        if (board.castling_rights & 0x4) != 0 {
            if !board.occupancy[2].get(Square::F8.as_u32()) && !board.occupancy[2].get(Square::G8.as_u32()) {
                if !crate::move_gen::is_in_check(board, Color::Black) && 
                   !crate::move_gen::is_square_attacked(board, Square::F8, Color::White) {
                    moves.push(Move::new(Square::E8, Square::G8, MoveFlag::KingsideCastling));
                }
            }
        }
        // Black Queenside
        if (board.castling_rights & 0x8) != 0 {
            if !board.occupancy[2].get(Square::D8.as_u32()) && !board.occupancy[2].get(Square::C8.as_u32()) && !board.occupancy[2].get(Square::B8.as_u32()) {
                if !crate::move_gen::is_in_check(board, Color::Black) && 
                   !crate::move_gen::is_square_attacked(board, Square::D8, Color::White) {
                    moves.push(Move::new(Square::E8, Square::C8, MoveFlag::QueensideCastling));
                }
            }
        }
    }
}

pub fn get_king_attacks(square: Square) -> Bitboard {
    let bit_index = square.as_u32() as i32;
    let file = bit_index % 8;
    let rank = bit_index / 8;
    
    let mut attacks = 0u64;
    let king_moves = [
        (-1, -1), (-1, 0), (-1, 1),
        (0, -1), (0, 1),
        (1, -1), (1, 0), (1, 1)
    ];
    
    for (dr, df) in king_moves {
        let nr = rank + dr;
        let nf = file + df;
        
        if nr >= 0 && nr < 8 && nf >= 0 && nf < 8 {
            let to_index = (nr * 8 + nf) as u32;
            attacks |= 1 << to_index;
        }
    }
    Bitboard(attacks)
}
