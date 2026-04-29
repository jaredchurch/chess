// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Search Module - Implements Minimax with Alpha-Beta pruning for chess engine.
// Supports configurable search depth and includes Novice-level random move selection.
use crate::board::Board;
use crate::board::move_struct::Move;
use crate::board::types::Color;
use crate::ai::evaluation::evaluate;
use rand::seq::SliceRandom;
use rand::Rng;
use rand::thread_rng;

/// Returns a random legal move (Level 1 - Novice).
/// Includes 50% randomness - may pick a sub-optimal move.
pub fn get_best_move_novice(board: &Board) -> Option<Move> {
    let mut moves = board.generate_legal_moves();
    if moves.is_empty() {
        return None;
    }

    let mut rng = thread_rng();

    // 50% chance of picking a random move (blunder)
    if rng.gen_bool(0.5) {
        moves.shuffle(&mut rng);
        return Some(moves[0]);
    }

    // Otherwise pick the best move using greedy evaluation
    let side = board.side_to_move;
    let mut best_move = None;
    let mut best_score = if side == Color::White {
        i32::MIN
    } else {
        i32::MAX
    };

    for m in &moves {
        let mut board_copy = board.clone();
        board_copy.make_move(*m);
        let score = evaluate(&board_copy);

        if side == Color::White {
            if score > best_score {
                best_score = score;
                best_move = Some(*m);
            }
        } else {
            if score < best_score {
                best_score = score;
                best_move = Some(*m);
            }
        }
    }

    best_move
}

/// Finds the best move using Minimax with Alpha-Beta pruning at a given depth.
/// Used for Levels 3+ (Casual and above).
pub fn get_best_move_with_depth(board: &Board, depth: u8) -> Option<Move> {
    let moves = board.generate_legal_moves();
    if moves.is_empty() {
        return None;
    }

    let side = board.side_to_move;
    let mut best_move = None;
    let mut best_score = i32::MIN;

    for m in &moves {
        let mut board_copy = board.clone();
        board_copy.make_move(*m);
        let score = -alpha_beta(&board_copy, depth - 1, i32::MIN, i32::MAX, side);

        if score > best_score {
            best_score = score;
            best_move = Some(*m);
        }
    }

    best_move
}

/// Alpha-Beta pruning implementation.
/// Returns the evaluated score for the position from the perspective of `maximizing_side`.
fn alpha_beta(board: &Board, depth: u8, mut alpha: i32, mut beta: i32, maximizing_side: Color) -> i32 {
    if depth == 0 {
        return evaluate(board);
    }

    let moves = board.generate_legal_moves();
    if moves.is_empty() {
        // Check if it's checkmate or stalemate
        if crate::move_gen::is_in_check(board, board.side_to_move) {
            // Checkmate: return a large negative score (bad for side to move)
            return if board.side_to_move == maximizing_side {
                -20000 - depth as i32
            } else {
                20000 + depth as i32
            };
        }
        // Stalemate: return 0
        return 0;
    }

    let is_maximizing = board.side_to_move == maximizing_side;

    if is_maximizing {
        let mut max_eval = i32::MIN;
        for m in &moves {
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            let eval = alpha_beta(&board_copy, depth - 1, alpha, beta, maximizing_side);
            max_eval = max_eval.max(eval);
            alpha = alpha.max(eval);
            if beta <= alpha {
                break;
            }
        }
        max_eval
    } else {
        let mut min_eval = i32::MAX;
        for m in &moves {
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            let eval = alpha_beta(&board_copy, depth - 1, alpha, beta, maximizing_side);
            min_eval = min_eval.min(eval);
            beta = beta.min(eval);
            if beta <= alpha {
                break;
            }
        }
        min_eval
    }
}
