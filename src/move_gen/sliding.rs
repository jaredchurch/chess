// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use crate::board::bitboard::Bitboard;
use crate::board::move_struct::{Move, MoveFlag};
use crate::board::types::Square;
use crate::board::Board;
use crate::move_gen::lookup::{DIR_E, DIR_N, DIR_NE, DIR_NW, DIR_S, DIR_SE, DIR_SW, DIR_W};

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
    let rook_attacks = get_rook_attacks(square, board.occupancy[2]);
    let bishop_attacks = get_bishop_attacks(square, board.occupancy[2]);
    let attacks = Bitboard(rook_attacks.0 | bishop_attacks.0);
    
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

pub fn get_rook_attacks(square: Square, occupancy: Bitboard) -> Bitboard {
    let sq = square as usize;
    let occ = occupancy.0;
    let mut attacks = 0u64;

    attacks |= get_ray_attacks(sq, DIR_N, occ);
    attacks |= get_ray_attacks(sq, DIR_S, occ);
    attacks |= get_ray_attacks(sq, DIR_E, occ);
    attacks |= get_ray_attacks(sq, DIR_W, occ);

    Bitboard(attacks)
}

pub fn get_bishop_attacks(square: Square, occupancy: Bitboard) -> Bitboard {
    let sq = square as usize;
    let occ = occupancy.0;
    let mut attacks = 0u64;

    attacks |= get_ray_attacks(sq, DIR_NE, occ);
    attacks |= get_ray_attacks(sq, DIR_NW, occ);
    attacks |= get_ray_attacks(sq, DIR_SE, occ);
    attacks |= get_ray_attacks(sq, DIR_SW, occ);

    Bitboard(attacks)
}

fn get_ray_attacks(sq: usize, dir: usize, occupancy: u64) -> u64 {
    let tables = super::lookup::get_lookup_tables();
    let ray = tables.rays[sq][dir];
    let blockers = ray & occupancy;
    if blockers == 0 {
        return ray;
    }

    let blocker_sq = if dir == DIR_N || dir == DIR_E || dir == DIR_NE || dir == DIR_NW {
        blockers.trailing_zeros() as usize
    } else {
        63 - blockers.leading_zeros() as usize
    };

    ray & !tables.rays[blocker_sq][dir]
}

#[allow(dead_code)]
fn get_sliding_attacks_slow(square: Square, occupancy: Bitboard, directions: &[(i32, i32)]) -> Bitboard {
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
