// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use crate::board::bitboard::Bitboard;
use crate::board::move_struct::{Move, MoveFlag};
use crate::board::types::Square;
use crate::board::Board;

pub fn generate_rook_moves(board: &Board, square: Square, moves: &mut Vec<Move>) {
    let attacks = get_rook_attacks(square, board.occupancy[2]);
    let own_occupancy = match board.side_to_move {
        crate::board::types::Color::White => board.occupancy[0],
        crate::board::types::Color::Black => board.occupancy[1],
    };
    let enemy_occupancy = match board.side_to_move {
        crate::board::types::Color::White => board.occupancy[1],
        crate::board::types::Color::Black => board.occupancy[0],
    };

    let mut bits = attacks.0 & !own_occupancy.0;
    while bits != 0 {
        let to_idx = bits.trailing_zeros();
        let to_sq = Square::from_u8_unchecked(to_idx as u8);
        let flag = if enemy_occupancy.get(to_idx) {
            MoveFlag::Capture
        } else {
            MoveFlag::Quiet
        };
        moves.push(Move::new(square, to_sq, flag));
        bits &= bits - 1;
    }
}

pub fn generate_bishop_moves(board: &Board, square: Square, moves: &mut Vec<Move>) {
    let attacks = get_bishop_attacks(square, board.occupancy[2]);
    let own_occupancy = match board.side_to_move {
        crate::board::types::Color::White => board.occupancy[0],
        crate::board::types::Color::Black => board.occupancy[1],
    };
    let enemy_occupancy = match board.side_to_move {
        crate::board::types::Color::White => board.occupancy[1],
        crate::board::types::Color::Black => board.occupancy[0],
    };

    let mut bits = attacks.0 & !own_occupancy.0;
    while bits != 0 {
        let to_idx = bits.trailing_zeros();
        let to_sq = Square::from_u8_unchecked(to_idx as u8);
        let flag = if enemy_occupancy.get(to_idx) {
            MoveFlag::Capture
        } else {
            MoveFlag::Quiet
        };
        moves.push(Move::new(square, to_sq, flag));
        bits &= bits - 1;
    }
}

pub fn generate_queen_moves(board: &Board, square: Square, moves: &mut Vec<Move>) {
    generate_rook_moves(board, square, moves);
    generate_bishop_moves(board, square, moves);
}

pub fn get_rook_attacks(square: Square, occupancy: Bitboard) -> Bitboard {
    get_sliding_attacks(square, occupancy, &[(0, 1), (0, -1), (1, 0), (-1, 0)])
}

pub fn get_bishop_attacks(square: Square, occupancy: Bitboard) -> Bitboard {
    get_sliding_attacks(square, occupancy, &[(1, 1), (1, -1), (-1, 1), (-1, -1)])
}

fn get_sliding_attacks(square: Square, occupancy: Bitboard, directions: &[(i32, i32)]) -> Bitboard {
    let bit_index = square.as_u32() as i32;
    let file = bit_index % 8;
    let rank = bit_index / 8;
    let mut attacks = 0u64;

    for (dr, df) in directions {
        let mut nr = rank + dr;
        let mut nf = file + df;

        while (0..8).contains(&nr) && (0..8).contains(&nf) {
            let to_index = (nr * 8 + nf) as u32;
            attacks |= 1 << to_index;
            if occupancy.get(to_index) {
                break; // Blocked
            }
            nr += dr;
            nf += df;
        }
    }
    Bitboard(attacks)
}
