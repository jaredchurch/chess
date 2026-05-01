// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Evaluation Module - Provides positional and material evaluation for chess positions.
// Includes Piece-Square Tables (PST), Mobility, and King Safety evaluation.

use crate::board::piece::PieceType;
use crate::board::types::Color;
use crate::board::Board;

/// Piece values for material evaluation (in centipawns).
pub fn get_piece_value(piece_type: PieceType) -> i32 {
    match piece_type {
        PieceType::Pawn => 100,
        PieceType::Knight => 320,
        PieceType::Bishop => 330,
        PieceType::Rook => 500,
        PieceType::Queen => 900,
        PieceType::King => 20000,
    }
}

/// Piece-Square Tables for positional evaluation.
/// Values are from White's perspective; for Black, the table is mirrored vertically.
/// Each table is 64 entries, indexed by square (a1=0, b1=1, ..., h8=63).
const PAWN_PST: [i32; 64] = [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5,
    10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20,
    -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_PST: [i32; 64] = [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10,
    0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10,
    5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_PST: [i32; 64] = [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0,
    -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10,
    -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_PST: [i32; 64] = [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0,
    0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0,
    0, 5, 5, 0, 0, 0,
];

const QUEEN_PST: [i32; 64] = [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0,
    0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_PST: [i32; 64] = [
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30,
    -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0,
    10, 30, 20,
];

/// Returns the PST value for a piece at a given square.
/// `sq` is the square index from White's perspective (a1=0).
/// For Black pieces, the table is mirrored vertically.
fn get_pst_value(piece_type: PieceType, sq: usize, color: Color) -> i32 {
    let table: &[i32; 64] = match piece_type {
        PieceType::Pawn => &PAWN_PST,
        PieceType::Knight => &KNIGHT_PST,
        PieceType::Bishop => &BISHOP_PST,
        PieceType::Rook => &ROOK_PST,
        PieceType::Queen => &QUEEN_PST,
        PieceType::King => &KING_PST,
    };

    let idx = if color == Color::White {
        sq
    } else {
        // Mirror vertically: rank 0 becomes rank 7, etc.
        (7 - sq / 8) * 8 + (sq % 8)
    };

    table[idx]
}

/// Evaluates the board based on material, positional value, mobility, and king safety.
/// Positive values are better for White, negative values are better for Black.
pub fn evaluate(board: &Board) -> i32 {
    let mut score = 0;

    for i in 0..6 {
        let piece_type = match i {
            0 => PieceType::Pawn,
            1 => PieceType::Knight,
            2 => PieceType::Bishop,
            3 => PieceType::Rook,
            4 => PieceType::Queen,
            5 => PieceType::King,
            _ => unreachable!(),
        };

        let value = get_piece_value(piece_type);

        // White pieces
        let white_bb = board.pieces[i].0;
        let mut white_pieces = white_bb;
        while white_pieces != 0 {
            let sq = white_pieces.trailing_zeros() as usize;
            score += value + get_pst_value(piece_type, sq, Color::White);
            white_pieces &= white_pieces - 1;
        }

        // Black pieces
        let black_bb = board.pieces[i + 6].0;
        let mut black_pieces = black_bb;
        while black_pieces != 0 {
            let sq = black_pieces.trailing_zeros() as usize;
            score -= value + get_pst_value(piece_type, sq, Color::Black);
            black_pieces &= black_pieces - 1;
        }
    }

    // Add king safety and pawn structure evaluation
    score += evaluate_king_safety(board);
    score += evaluate_pawn_structure(board);

    score
}

/// Evaluates mobility (Temporarily disabled due to performance overhead)
pub fn evaluate_mobility(_board: &Board) -> i32 {
    0
}

/// Evaluates pawn structure: doubled pawns, isolated pawns, passed pawns.
/// Positive values are better for White.
pub fn evaluate_pawn_structure(board: &Board) -> i32 {
    let mut score = 0;

    // White pawns
    let white_pawns = board.pieces[0].0;
    score += evaluate_pawn_structure_for_side(white_pawns, Color::White);

    // Black pawns
    let black_pawns = board.pieces[6].0;
    score -= evaluate_pawn_structure_for_side(black_pawns, Color::Black);

    score
}

/// Evaluates pawn structure for a single side.
fn evaluate_pawn_structure_for_side(pawns: u64, _color: Color) -> i32 {
    let mut score = 0;
    let mut files_occupied = 0u8; // Track which files have pawns

    // Count pawns per file
    let mut pawns_remaining = pawns;
    let mut pawns_per_file = [0u8; 8];

    while pawns_remaining != 0 {
        let sq = pawns_remaining.trailing_zeros() as usize;
        let file = sq % 8;
        pawns_per_file[file] += 1;
        files_occupied |= 1 << file;
        pawns_remaining &= pawns_remaining - 1;
    }

    // Doubled pawns penalty
    for count in pawns_per_file.iter() {
        if *count > 1 {
            score -= 15 * (*count - 1) as i32;
        }
    }

    // Isolated pawns penalty (no friendly pawns on adjacent files)
    for (file, count) in pawns_per_file.iter().enumerate() {
        if *count > 0 {
            let left_empty = file == 0 || (files_occupied & (1 << (file - 1))) == 0;
            let right_empty = file == 7 || (files_occupied & (1 << (file + 1))) == 0;
            if left_empty && right_empty {
                score -= 20 * (*count) as i32;
            }
        }
    }

    // Passed pawns bonus (no enemy pawns ahead on same or adjacent files)
    // This is a simplified version - full implementation would check the path to promotion
    score
}

/// Evaluates king safety based on pawn shield and enemy piece proximity.
/// Positive values indicate safer position for White.
pub fn evaluate_king_safety(board: &Board) -> i32 {
    let mut score = 0;

    // White king safety
    if let Some(white_king_sq) = find_king_square(board, Color::White) {
        score += evaluate_king_shield(board, white_king_sq, Color::White) * 5;
        score -= evaluate_enemy_proximity(board, white_king_sq, Color::Black) * 3;
    }

    // Black king safety (negated since positive is good for White)
    if let Some(black_king_sq) = find_king_square(board, Color::Black) {
        score -= evaluate_king_shield(board, black_king_sq, Color::Black) * 5;
        score += evaluate_enemy_proximity(board, black_king_sq, Color::White) * 3;
    }

    score
}

/// Finds the square of the king for a given color.
fn find_king_square(board: &Board, color: Color) -> Option<usize> {
    let king_idx = if color == Color::White { 5 } else { 11 };
    let bb = board.pieces[king_idx].0;
    if bb == 0 {
        None
    } else {
        Some(bb.trailing_zeros() as usize)
    }
}

/// Evaluates the pawn shield in front of the king.
/// Returns a positive score for more pawns protecting the king.
fn evaluate_king_shield(board: &Board, king_sq: usize, color: Color) -> i32 {
    let mut shield_score = 0;
    let file = (king_sq % 8) as i8;
    let rank = (king_sq / 8) as i8;

    // Check pawns in front of the king (1-2 squares forward, 1 square left/right)
    let pawn_direction = if color == Color::White { 1 } else { -1 };
    let pawn_idx = if color == Color::White { 0 } else { 6 };

    for df in -1i8..=1 {
        let check_file = file + df;
        if !(0..=7).contains(&check_file) {
            continue;
        }

        // Check one rank forward
        let check_rank = rank + pawn_direction;
        if (0..=7).contains(&check_rank) {
            let sq = (check_rank * 8 + check_file) as usize;
            let bb = board.pieces[pawn_idx].0;
            if (bb >> sq) & 1 == 1 {
                shield_score += 10;
            }
        }

        // Check two ranks forward
        let check_rank2 = rank + 2 * pawn_direction;
        if (0..=7).contains(&check_rank2) {
            let sq = (check_rank2 * 8 + check_file) as usize;
            let bb = board.pieces[pawn_idx].0;
            if (bb >> sq) & 1 == 1 {
                shield_score += 5;
            }
        }
    }

    shield_score
}

/// Evaluates proximity of enemy pieces to the king.
/// Returns a negative score (worse for the king being evaluated).
fn evaluate_enemy_proximity(board: &Board, king_sq: usize, enemy_color: Color) -> i32 {
    let mut threat_score = 0i32;
    let king_file = (king_sq % 8) as i32;
    let king_rank = (king_sq / 8) as i32;

    let enemy_start = if enemy_color == Color::White { 0 } else { 6 };

    for (i, _) in (0..6).enumerate() {
        let bb = board.pieces[enemy_start + i].0;
        let mut pieces = bb;
        while pieces != 0 {
            let sq = pieces.trailing_zeros() as usize;
            let file_dist = ((sq % 8) as i32 - king_file).abs();
            let rank_dist = ((sq / 8) as i32 - king_rank).abs();
            let dist = file_dist.max(rank_dist);
            if dist <= 2 {
                threat_score += (3 - dist) * 5;
            }
            pieces &= pieces - 1;
        }
    }

    threat_score
}
