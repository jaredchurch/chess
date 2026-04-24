// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.


use crate::board::Board;
use crate::board::bitboard::Bitboard;
use crate::board::types::Square;
use crate::board::move_struct::{Move, MoveFlag};

pub fn generate_knight_moves(board: &Board, square: Square, moves: &mut Vec<Move>) {
    let knight_attacks = get_knight_attacks(square);
    let mut bits = knight_attacks.0;
    
    let own_occupancy_index = match board.side_to_move {
        crate::board::types::Color::White => 0,
        crate::board::types::Color::Black => 1,
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
}

pub fn get_knight_attacks(square: Square) -> Bitboard {
    let bit_index = square.as_u32() as i32;
    let file = bit_index % 8;
    let rank = bit_index / 8;
    
    let mut attacks = 0u64;
    let knight_jumps = [
        (-2, -1), (-2, 1), (-1, -2), (-1, 2),
        (1, -2), (1, 2), (2, -1), (2, 1)
    ];
    
    for (dr, df) in knight_jumps {
        let nr = rank + dr;
        let nf = file + df;
        
        if nr >= 0 && nr < 8 && nf >= 0 && nf < 8 {
            let to_index = (nr * 8 + nf) as u32;
            attacks |= 1 << to_index;
        }
    }
    Bitboard(attacks)
}
