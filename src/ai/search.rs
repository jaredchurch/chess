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

// Only use console on WASM targets
#[cfg(target_arch = "wasm32")]
use web_sys::console;

/// Conditionally logs a message (only on WASM, no-op on native)
#[cfg(target_arch = "wasm32")]
fn log_message(msg: &str) {
    console::log_1(&msg.into());
}

#[cfg(not(target_arch = "wasm32"))]
fn log_message(_msg: &str) {
    // No-op on native targets
}

// Only import js_sys when targeting WASM
#[cfg(target_arch = "wasm32")]
use js_sys;

/// Maximum time allowed for engine search (in milliseconds)
const MAX_SEARCH_TIME_MS: f64 = 30000.0; // 30 seconds

/// Maximum nodes to evaluate before stopping (safety check)
const MAX_NODES: u32 = 5_000_000; // 5 million nodes

/// Global node counter (reset at start of each search)
static NODE_COUNT: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);

/// Checks if we've exceeded the maximum node count
fn is_node_limit_reached() -> bool {
    NODE_COUNT.fetch_add(1, std::sync::atomic::Ordering::SeqCst) > MAX_NODES
}

/// Gets current time in milliseconds (platform-specific)
#[cfg(target_arch = "wasm32")]
fn get_time_ms() -> f64 {
    js_sys::Date::now()
}

#[cfg(not(target_arch = "wasm32"))]
fn get_time_ms() -> f64 {
    // For benchmarks, we don't need real timing
    0.0
}

/// Checks if the search has exceeded the maximum allowed time or node limit.
/// Returns true if timeout occurred, false otherwise.
#[cfg(target_arch = "wasm32")]
fn is_timeout(start_time: f64) -> bool {
    let elapsed = get_time_ms() - start_time;
    elapsed > MAX_SEARCH_TIME_MS || is_node_limit_reached()
}

#[cfg(not(target_arch = "wasm32"))]
fn is_timeout(_start_time: f64) -> bool {
    is_node_limit_reached()
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
        log_message("Level 1 (Novice): Choosing random move (50% blunder chance)");
        moves.shuffle(&mut rng);
        return Some(moves[0]);
    }

    // Otherwise pick the best move using greedy evaluation
    log_message("Level 1 (Novice): Evaluating moves greedily...");
    let side = board.side_to_move;
    let mut best_move = None;
    let mut best_score = if side == Color::White {
        i32::MIN
    } else {
        i32::MAX
    };
    let start = get_time_ms();

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

    let elapsed = get_time_ms() - start;
    log_message(&format!("Level 1 (Novice): Selected best move from {} options in {:.0}ms", moves.len(), elapsed));
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

    #[allow(unused_variables)]
    let side = board.side_to_move;
    let mut best_move: Option<Move> = None;
    let total_start = get_time_ms();
    
    log_message(&format!("Engine: Starting iterative deepening search (max depth: {}, max time: {}ms)", max_depth, MAX_SEARCH_TIME_MS));
    
    // Iterative deepening: search at increasing depths
    for depth in 1..=max_depth {
        // Clear transposition table and ordering tables for new search
        if depth == 1 {
            crate::clear_tt();
            crate::ai::move_ordering::clear_ordering_tables();
            NODE_COUNT.store(0, std::sync::atomic::Ordering::SeqCst);
        }
        
        if is_timeout(total_start) {
            log_message(&format!("Engine: Timeout reached after {}ms, returning best move found", MAX_SEARCH_TIME_MS));
            break;
        }
        
        let depth_start = get_time_ms();
        log_message(&format!("Engine: depth {}/{} searching...", depth, max_depth));
        
        let mut current_best = None;
        let mut best_score = i32::MIN + 1;
        let mut alpha = i32::MIN + 1;
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
                log_message("Engine: Timeout reached during move evaluation");
                break;
            }
            
            let mut board_copy = board.clone();
            board_copy.make_move(*m);
            // Negamax: score is from perspective of side to move after the move
            // So we negate the result, and the opponent's alpha/beta become our -beta/-alpha
            let score = -alpha_beta(&board_copy, depth - 1, -beta, -alpha, total_start);
            
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
            let depth_elapsed = get_time_ms() - depth_start;
            log_message(&format!("Engine: depth {}/{} [{}ms] score={}", depth, max_depth, depth_elapsed as u32, best_score));
        } else {
            // Timeout occurred, don't update best_move
            break;
        }
    }

    let total_elapsed = get_time_ms() - total_start;
    log_message(&format!("Engine: Search complete in {:.0}ms", total_elapsed));
    
    best_move
}

/// Alpha-Beta pruning implementation using Negamax formulation.
/// Returns the evaluated score for the position from the perspective of the side to move.
/// Checks for timeout at each node to prevent excessively long searches.
fn alpha_beta(board: &Board, depth: u8, mut alpha: i32, beta: i32, start_time: f64) -> i32 {
    // Check timeout and node limit at each node
    if is_timeout(start_time) {
        return evaluate(board);
    }
    NODE_COUNT.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
    
    let board_hash = board.zobrist_hash;

    // Check transposition table
    if let Some(cached_score) = lookup_position(board_hash, depth, alpha, beta) {
        return cached_score;
    }

    if depth == 0 {
        return quiescence(board, alpha, beta, start_time);
    }

    let mut moves = board.generate_legal_moves();
    if moves.is_empty() {
        // Check if it's checkmate or stalemate
        if crate::move_gen::is_in_check(board, board.side_to_move) {
            // Checkmate: return a large negative score (bad for side to move)
            let score = -20000 - depth as i32;
            crate::store_position(board_hash, depth, score, true, None);
            return score;
        }
        // Stalemate: return 0
        crate::store_position(board_hash, depth, 0, true, None);
        return 0;
    }

    let mut best_move = None;
    let mut best_value = i32::MIN + 1;

    // Sort moves using improved ordering (MVV-LVA + Killer + History)
    crate::ai::move_ordering::sort_moves(&mut moves, board, depth);
    
    for m in &moves {
        let mut board_copy = board.clone();
        board_copy.make_move(*m);
        // Negamax: negate the returned score and swap alpha/beta
        let eval = -alpha_beta(&board_copy, depth - 1, -beta, -alpha, start_time);
        
        if eval > best_value {
            best_value = eval;
            best_move = Some((m.from as u8, m.to as u8, move_flag_to_u8(&m.flag)));
            // Record successful quiet moves in history table
            if board.get_piece_at(m.to).is_none() && !matches!(m.flag, crate::board::move_struct::MoveFlag::Promotion(_)) {
                crate::ai::move_ordering::record_history(m, depth);
            }
        }
        
        alpha = alpha.max(eval);
        if alpha >= beta {
            // Beta cutoff - record killer move
            crate::ai::move_ordering::record_killer(depth, m);
            break;
        }
    }
    
    crate::store_position(board_hash, depth, best_value, true, best_move);
    best_value
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
/// Uses Negamax formulation - returns score from perspective of side to move.
/// Includes timeout checking to prevent excessive capture sequence searches.
fn quiescence(board: &Board, mut alpha: i32, beta: i32, start_time: f64) -> i32 {
    // Check timeout
    if is_timeout(start_time) {
        return evaluate(board);
    }
    
    // Stand pat: evaluate current position from perspective of side to move
    let stand_pat = evaluate(board);
    
    if stand_pat > alpha {
        alpha = stand_pat;
    }
    if alpha >= beta {
        return alpha;
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
    // Reduce further for deeper searches to prevent exponential blowup
    let max_captures = if stand_pat.abs() > 5000 { 8 } else { 15 };
    let capture_moves: Vec<_> = capture_moves.into_iter().take(max_captures).collect();
    
    let mut best_value = stand_pat;
    for m in &capture_moves {
        // Check timeout during quiescence search
        if is_timeout(start_time) {
            return best_value;
        }
        
        let mut board_copy = board.clone();
        board_copy.make_move(*m);
        // Negamax: negate the score and swap alpha/beta
        let eval = -quiescence(&board_copy, -beta, -alpha, start_time);
        best_value = best_value.max(eval);
        alpha = alpha.max(eval);
        if alpha >= beta {
            break;
        }
    }
    best_value
}
