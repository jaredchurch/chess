// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Search Module - Implements Minimax with Alpha-Beta pruning for chess engine.
// Supports configurable search depth and includes Novice-level random move selection.
use crate::board::Board;
use crate::board::move_struct::Move;
use crate::board::types::Color;
use crate::ai::evaluation::evaluate;
use crate::lookup_position;
use rand::seq::SliceRandom;
use rand::Rng;
use rand::thread_rng;
use web_sys::console;

/// Maximum time allowed for engine search (in milliseconds)
const MAX_SEARCH_TIME_MS: f64 = 30000.0; // 30 seconds

/// Checks if the search has exceeded the maximum allowed time.
/// Returns true if timeout occurred, false otherwise.
fn is_timeout(start_time: f64) -> bool {
    let elapsed = js_sys::Date::now() - start_time;
    elapsed > MAX_SEARCH_TIME_MS
}

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
        console::log_1(&"Level 1 (Novice): Choosing random move (50% blunder chance)".into());
        moves.shuffle(&mut rng);
        return Some(moves[0]);
    }

    // Otherwise pick the best move using greedy evaluation
    console::log_1(&"Level 1 (Novice): Evaluating moves greedily...".into());
    let side = board.side_to_move;
    let mut best_move = None;
    let mut best_score = if side == Color::White {
        i32::MIN
    } else {
        i32::MAX
    };
    let start = web_sys::js_sys::Date::now();

    for (_i, m) in moves.iter().enumerate() {
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

    let elapsed = web_sys::js_sys::Date::now() - start;
    console::log_1(&format!("Level 1 (Novice): Selected best move from {} options in {:.0}ms", moves.len(), elapsed).into());
    best_move
}

/// Finds the best move using Iterative Deepening with Alpha-Beta pruning.
/// Used for Levels 3+ (Casual and above).
/// Gradually increases search depth, keeping the best move from each iteration.
pub fn get_best_move_with_depth(board: &Board, max_depth: u8) -> Option<Move> {
    let moves = board.generate_legal_moves();
    if moves.is_empty() {
        return None;
    }

    let side = board.side_to_move;
    let mut best_move: Option<Move> = None;
    let total_start = js_sys::Date::now();
    
    console::log_1(&format!("Engine: Starting iterative deepening search (max depth: {}, max time: {}ms)", max_depth, MAX_SEARCH_TIME_MS).into());
    
    // Iterative deepening: search at increasing depths
    for depth in 1..=max_depth {
        // Clear transposition table for new search
        if depth == 1 {
            crate::clear_tt();
        }
        
        // Check timeout before starting new depth
        if is_timeout(total_start) {
            console::log_1(&format!("Engine: Timeout reached after {}ms, returning best move found", MAX_SEARCH_TIME_MS).into());
            break;
        }
        
        let depth_start = js_sys::Date::now();
        console::log_1(&format!("Engine: depth {}/{} searching...", depth, max_depth).into());
        
        let mut current_best = None;
        let mut best_score = i32::MIN;
        let mut alpha = i32::MIN;
        let beta = i32::MAX;
        
        // Re-sort moves with the previous best move first
        let mut depth_moves = moves.clone();
        if let Some(prev_move) = best_move {
            if let Some(pos) = depth_moves.iter().position(|m| m.from == prev_move.from && m.to == prev_move.to) {
                depth_moves.swap(0, pos);
            }
        }
        
        for m in &depth_moves {
            // Check timeout during move evaluation
            if is_timeout(total_start) {
                console::log_1(&"Engine: Timeout reached during move evaluation".into());
                break;
            }
            
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            let score = -alpha_beta(&board_copy, depth - 1, -beta, -alpha, side, total_start);

            if score > best_score {
                best_score = score;
                current_best = Some(*m);
            }
            
            // Update alpha for root pruning
            if score > alpha {
                alpha = score;
            }
            
            // Beta cutoff at root
            if alpha >= beta {
                break;
            }
        }
        
        // Update best move found so far (only if we completed the depth)
        if let Some(m) = current_best {
            best_move = Some(m);
            let depth_elapsed = js_sys::Date::now() - depth_start;
            console::log_1(&format!("Engine: depth {}/{} [{}ms] score={}", depth, max_depth, depth_elapsed as u32, best_score).into());
        } else {
            // Timeout occurred, don't update best_move
            break;
        }
    }

    let total_elapsed = js_sys::Date::now() - total_start;
    console::log_1(&format!("Engine: Search complete in {:.0}ms", total_elapsed).into());
    
    best_move
}

/// Alpha-Beta pruning implementation with transposition table.
/// Returns the evaluated score for the position from the perspective of `maximizing_side`.
/// Checks for timeout at each node to prevent excessively long searches.
fn alpha_beta(board: &Board, depth: u8, mut alpha: i32, mut beta: i32, maximizing_side: Color, start_time: f64) -> i32 {
    // Check timeout at each node
    if is_timeout(start_time) {
        // Return a neutral score if timeout occurs
        return evaluate(board);
    }
    
    let board_hash = board.zobrist_hash;

    // Check transposition table
    if let Some(cached_score) = lookup_position(board_hash, depth, alpha, beta) {
        return cached_score;
    }

    if depth == 0 {
        return quiescence(board, alpha, beta, maximizing_side, start_time);
    }

    let mut moves = board.generate_legal_moves();
    if moves.is_empty() {
        // Check if it's checkmate or stalemate
        if crate::move_gen::is_in_check(board, board.side_to_move) {
            // Checkmate: return a large negative score (bad for side to move)
            let score = if board.side_to_move == maximizing_side {
                -20000 - depth as i32
            } else {
                20000 + depth as i32
            };
            crate::store_position(board_hash, depth, score, true, None);
            return score;
        }
        // Stalemate: return 0
        crate::store_position(board_hash, depth, 0, true, None);
        return 0;
    }

    let is_maximizing = board.side_to_move == maximizing_side;
    let mut best_move = None;

    // Sort moves for better pruning (MVV-LVA)
    crate::ai::move_ordering::sort_moves(&mut moves, board);
    
    if is_maximizing {
        let mut max_eval = i32::MIN;
        for m in &moves {
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            let eval = alpha_beta(&board_copy, depth - 1, alpha, beta, maximizing_side, start_time);
            if eval > max_eval {
                max_eval = eval;
                best_move = Some((m.from as u8, m.to as u8, move_flag_to_u8(&m.flag)));
            }
            alpha = alpha.max(eval);
            if beta <= alpha {
                break;
            }
        }
        crate::store_position(board_hash, depth, max_eval, true, best_move);
        max_eval
    } else {
        let mut min_eval = i32::MAX;
        for m in &moves {
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            let eval = alpha_beta(&board_copy, depth - 1, alpha, beta, maximizing_side, start_time);
            if eval < min_eval {
                min_eval = eval;
                best_move = Some((m.from as u8, m.to as u8, move_flag_to_u8(&m.flag)));
            }
            beta = beta.min(eval);
            if beta <= alpha {
                break;
            }
        }
        crate::store_position(board_hash, depth, min_eval, true, best_move);
        min_eval
    }
}

/// Converts MoveFlag to u8 for storage in transposition table.
fn move_flag_to_u8(flag: &crate::board::move_struct::MoveFlag) -> u8 {
    match flag {
        crate::board::move_struct::MoveFlag::Quiet => 0,
        crate::board::move_struct::MoveFlag::Capture => 1,
        crate::board::move_struct::MoveFlag::DoublePawnPush => 2,
        crate::board::move_struct::MoveFlag::KingsideCastling => 3,
        crate::board::move_struct::MoveFlag::QueensideCastling => 4,
        crate::board::move_struct::MoveFlag::EnPassantCapture => 5,
        crate::board::move_struct::MoveFlag::Promotion(_) => 6,
    }
}

/// Quiescence search to evaluate "quiet" positions at depth 0.
/// Only explores capture moves to avoid the horizon effect.
/// Includes timeout checking to prevent excessive capture sequence searches.
fn quiescence(board: &Board, mut alpha: i32, mut beta: i32, maximizing_side: Color, start_time: f64) -> i32 {
    // Check timeout
    if is_timeout(start_time) {
        return evaluate(board);
    }
    
    // Stand pat: evaluate current position
    let stand_pat = evaluate(board);
    
    let is_maximizing = board.side_to_move == maximizing_side;
    
    if is_maximizing {
        if stand_pat > alpha {
            alpha = stand_pat;
        }
        if alpha >= beta {
            return alpha;
        }
    } else {
        if stand_pat < beta {
            beta = stand_pat;
        }
        if beta <= alpha {
            return beta;
        }
    }
    
    // Only generate capture moves
    let moves = board.generate_legal_moves();
    let capture_moves: Vec<_> = moves.into_iter().filter(|m| {
        board.get_piece_at(m.to).is_some() || m.flag == crate::board::move_struct::MoveFlag::EnPassantCapture
    }).collect();
    
    if capture_moves.is_empty() {
        return stand_pat;
    }
    
    // Limit number of capture moves to explore (prevent explosion in late game)
    let max_captures = 15;
    let capture_moves: Vec<_> = capture_moves.into_iter().take(max_captures).collect();
    
    if is_maximizing {
        let mut max_eval = stand_pat;
        for m in &capture_moves {
            // Check timeout during quiescence search
            if is_timeout(start_time) {
                return max_eval;
            }
            
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            let eval = quiescence(&board_copy, alpha, beta, maximizing_side, start_time);
            max_eval = max_eval.max(eval);
            alpha = alpha.max(eval);
            if beta <= alpha {
                break;
            }
        }
        max_eval
    } else {
        let mut min_eval = stand_pat;
        for m in &capture_moves {
            // Check timeout during quiescence search
            if is_timeout(start_time) {
                return min_eval;
            }
            
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            let eval = quiescence(&board_copy, alpha, beta, maximizing_side, start_time);
            min_eval = min_eval.min(eval);
            beta = beta.min(eval);
            if beta <= alpha {
                break;
            }
        }
        min_eval
    }
}
