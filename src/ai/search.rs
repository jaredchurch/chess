// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Search Module - Implements Minimax with Alpha-Beta pruning for chess engine.
// Supports configurable search depth and includes Level 1 random move selection.
use crate::ai::evaluation::evaluate;
#[cfg(feature = "profiling")]
use crate::ai::profiler;
use crate::board::move_struct::{Move, MoveFlag};
use crate::board::piece::PieceType;
use crate::board::types::{Color, Square};
use crate::board::Board;
use rand::seq::SliceRandom;
use rand::thread_rng;
use rand::Rng;

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
/// Time-based cutoff at 5 minutes to prevent indefinite searches
const MAX_SEARCH_TIME_MS: f64 = 300_000.0; // 5 minutes

/// Maximum nodes to evaluate before stopping (safety check)
const MAX_NODES: u32 = 1_000_000_000; // 1 billion nodes

/// Check elapsed time every N nodes (avoids JS boundary call per node)
#[allow(dead_code)]
const TIME_CHECK_INTERVAL: u32 = 1024;

/// Global node counter (reset at start of each search)
static NODE_COUNT: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);

/// Tracks last logged node milestone for progress reporting
static LAST_PROGRESS_MILESTONE: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);

/// Logs search progress every 100 million nodes
#[cfg(target_arch = "wasm32")]
fn log_node_progress(start_time: f64) {
    let count = NODE_COUNT.load(std::sync::atomic::Ordering::Relaxed);
    let milestone = count / 100_000_000;
    let last = LAST_PROGRESS_MILESTONE.load(std::sync::atomic::Ordering::Relaxed);
    if milestone > last {
        if LAST_PROGRESS_MILESTONE
            .compare_exchange(
                last,
                milestone,
                std::sync::atomic::Ordering::Relaxed,
                std::sync::atomic::Ordering::Relaxed,
            )
            .is_ok()
        {
            let elapsed = get_time_ms() - start_time;
            log_message(&format!(
                "Engine: searched {}M nodes in {:.0}ms ({:.0} nodes/ms)",
                milestone * 100,
                elapsed,
                (count as f64) / elapsed.max(1.0)
            ));
        }
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn log_node_progress(_start_time: f64) {}

/// Checks if node limit has been exceeded (fast relaxed load)
fn is_node_limit_reached() -> bool {
    NODE_COUNT.load(std::sync::atomic::Ordering::Relaxed) > MAX_NODES
}

/// Gets current time in milliseconds (platform-specific)
#[cfg(target_arch = "wasm32")]
fn get_time_ms() -> f64 {
    js_sys::Date::now()
}

#[cfg(not(target_arch = "wasm32"))]
fn get_time_ms() -> f64 {
    0.0
}

/// Periodically checks time limit (every 1024 nodes to avoid JS boundary cost).
/// Always checks node limit (fast relaxed atomic load).
#[cfg(target_arch = "wasm32")]
fn check_timeout(node_count: u32, start_time: f64) -> Option<TimeoutReason> {
    if node_count & (TIME_CHECK_INTERVAL - 1) == 0 {
        let elapsed = get_time_ms() - start_time;
        if elapsed > MAX_SEARCH_TIME_MS {
            return Some(TimeoutReason::TimeLimit);
        }
    }
    if is_node_limit_reached() {
        Some(TimeoutReason::NodeLimit(MAX_NODES))
    } else {
        None
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn check_timeout(_node_count: u32, _start_time: f64) -> Option<TimeoutReason> {
    if is_node_limit_reached() {
        Some(TimeoutReason::NodeLimit(MAX_NODES))
    } else {
        None
    }
}

/// Full timeout check (always checks time, not just periodic).
/// Used in non-hot paths (between depths, quiescence entry).
#[cfg(target_arch = "wasm32")]
fn check_timeout_full(start_time: f64) -> Option<TimeoutReason> {
    let elapsed = get_time_ms() - start_time;
    if elapsed > MAX_SEARCH_TIME_MS {
        Some(TimeoutReason::TimeLimit)
    } else if is_node_limit_reached() {
        Some(TimeoutReason::NodeLimit(MAX_NODES))
    } else {
        None
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn check_timeout_full(_start_time: f64) -> Option<TimeoutReason> {
    if is_node_limit_reached() {
        Some(TimeoutReason::NodeLimit(MAX_NODES))
    } else {
        None
    }
}

/// Reason for search timeout
enum TimeoutReason {
    #[allow(dead_code)]
    TimeLimit,
    NodeLimit(u32),
}

impl std::fmt::Display for TimeoutReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TimeoutReason::TimeLimit => write!(f, "time limit ({}ms) reached", MAX_SEARCH_TIME_MS),
            TimeoutReason::NodeLimit(limit) => write!(f, "node limit ({}) reached", limit),
        }
    }
}

/// Returns a random legal move (Level 1).
/// Includes 50% randomness - may pick a sub-optimal move.
pub fn get_best_move_novice(board: &Board) -> Option<Move> {
    let mut moves = board.generate_legal_moves();
    if moves.is_empty() {
        return None;
    }

    let mut rng = thread_rng();

    // 50% chance of picking a random move (blunder)
    if rng.gen_bool(0.5) {
        log_message("Level 1: Choosing random move (50% blunder chance)");
        moves.shuffle(&mut rng);
        return Some(moves[0]);
    }

    // Otherwise pick the best move using greedy evaluation
    log_message("Level 1: Evaluating moves greedily...");
    let mut best_move = None;
    let mut best_score = i32::MIN + 1;
    let start = get_time_ms();

    for m in moves.iter() {
        let mut board_copy = board.clone();
        board_copy.make_move(*m);
        // evaluate() is now relative to side to move. After make_move, it's opponent's turn.
        // So we negate it to get our score.
        let score = -evaluate(&board_copy);

        if score > best_score {
            best_score = score;
            best_move = Some(*m);
        }
    }

    let elapsed = get_time_ms() - start;
    log_message(&format!(
        "Level 1 (Novice): Selected best move from {} options in {:.0}ms ({:.0} nodes/ms)",
        moves.len(),
        elapsed,
        (moves.len() as f64) / elapsed.max(1.0)
    ));
    best_move
}

/// Finds the best move using Iterative Deepening with Alpha-Beta pruning.
/// Used for Levels 3+ (Casual and above).
/// Gradually increases search depth, keeping the best move from each iteration.
pub fn get_best_move_with_depth(board: &Board, max_depth: u8) -> Option<Move> {
    #[cfg(feature = "profiling")]
    profiler::begin();
    #[cfg(feature = "profiling")]
    let moves = profiler::time(profiler::MOVE_GEN, || board.generate_legal_moves());
    #[cfg(not(feature = "profiling"))]
    let moves = board.generate_legal_moves();
    if moves.is_empty() {
        return None;
    }

    #[allow(unused_variables)]
    let side = board.side_to_move;
    let mut best_move: Option<Move> = None;
    let total_start = get_time_ms();

    log_message(&format!(
        "Engine: Starting iterative deepening search (max depth: {}, max time: {}ms)",
        max_depth, MAX_SEARCH_TIME_MS
    ));

    // Iterative deepening: search at increasing depths
    for depth in 1..=max_depth {
        // Clear transposition table and ordering tables for new search
        if depth == 1 {
            crate::clear_tt();
            crate::ai::move_ordering::clear_ordering_tables();
            NODE_COUNT.store(0, std::sync::atomic::Ordering::SeqCst);
            LAST_PROGRESS_MILESTONE.store(0, std::sync::atomic::Ordering::Relaxed);
        }

        if let Some(reason) = check_timeout_full(total_start) {
            log_message(&format!(
                "Engine: Stopping search ({}), returning best move found",
                reason
            ));
            break;
        }

        let depth_start = get_time_ms();
        log_message(&format!(
            "Engine: depth {}/{} searching...",
            depth, max_depth
        ));

        let mut current_best = None;
        let mut best_score = i32::MIN + 1;
        let mut alpha = i32::MIN + 1;
        let beta = i32::MAX;

        // Re-sort moves with the previous best move first
        let mut depth_moves = moves.clone();
        if let Some(prev_move) = best_move {
            if let Some(pos) = depth_moves
                .iter()
                .position(|m| m.from == prev_move.from && m.to == prev_move.to)
            {
                depth_moves.swap(0, pos);
            }
        }

        for m in &depth_moves {
            // Check timeout during move evaluation
            if let Some(reason) = check_timeout_full(total_start) {
                log_message(&format!("Engine: Stopping move evaluation ({})", reason));
                break;
            }

            #[cfg(feature = "profiling")]
            profiler::count_incr(profiler::CLONE);
            let mut board_copy = board.clone();
            #[cfg(feature = "profiling")]
            profiler::count_incr(profiler::MAKE_MOVE);
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
            log_message(&format!(
                "Engine: depth {}/{} [{}ms] score={}",
                depth, max_depth, depth_elapsed as u32, best_score
            ));
        } else {
            // Timeout occurred, don't update best_move
            break;
        }
    }

    let total_elapsed = get_time_ms() - total_start;
    let total_nodes = NODE_COUNT.load(std::sync::atomic::Ordering::Relaxed);
    log_message(&format!(
        "Engine: Search complete in {:.0}ms ({} nodes, {:.0} nodes/ms)",
        total_elapsed,
        total_nodes,
        (total_nodes as f64) / total_elapsed.max(1.0)
    ));

    #[cfg(feature = "profiling")]
    profiler::end(total_nodes as u64, total_elapsed);

    best_move
}

/// Alpha-Beta pruning implementation using Negamax formulation.
/// Returns the evaluated score for the position from the perspective of the side to move.
/// Optimizations: single node counter, periodic time checks, null-move pruning,
/// check extensions, and futility pruning at shallow depths.
fn alpha_beta(board: &Board, depth: u8, mut alpha: i32, beta: i32, start_time: f64) -> i32 {
    let old_alpha = alpha;
    // Single node count increment per node
    let node_count = NODE_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    if check_timeout(node_count, start_time).is_some() {
        #[cfg(feature = "profiling")]
        if profiler::is_active() {
            return profiler::time(profiler::EVAL, || evaluate(board));
        }
        return evaluate(board);
    }
    log_node_progress(start_time);

    let board_hash = board.zobrist_hash;

    // Check transposition table
    let tt_move;
    #[cfg(feature = "profiling")]
    if profiler::is_active() {
        let (cached_score, m) = profiler::time(profiler::TT_LOOKUP, || {
            crate::ai::transposition::lookup_position(board_hash, depth, alpha, beta)
        });
        tt_move = m;
        if let Some(score) = cached_score {
            return score;
        }
    } else {
        let (cached_score, m) =
            crate::ai::transposition::lookup_position(board_hash, depth, alpha, beta);
        tt_move = m;
        if let Some(score) = cached_score {
            return score;
        }
    }
    #[cfg(not(feature = "profiling"))]
    {
        let (cached_score, m) =
            crate::ai::transposition::lookup_position(board_hash, depth, alpha, beta);
        tt_move = m;
        if let Some(score) = cached_score {
            return score;
        }
    }

    #[cfg(feature = "profiling")]
    let in_check = {
        profiler::count_incr(profiler::IS_IN_CHECK);
        crate::move_gen::is_in_check(board, board.side_to_move)
    };
    #[cfg(not(feature = "profiling"))]
    let in_check = crate::move_gen::is_in_check(board, board.side_to_move);

    if depth == 0 && !in_check {
        #[cfg(feature = "profiling")]
        if profiler::is_active() {
            return profiler::time(profiler::QUIESCENCE, || {
                quiescence(board, alpha, beta, start_time, 0)
            });
        }
        return quiescence(board, alpha, beta, start_time, 0);
    }

    // Generate pseudo-legal moves
    #[cfg(feature = "profiling")]
    let mut moves = if profiler::is_active() {
        profiler::time(profiler::MOVE_GEN, || {
            crate::move_gen::generate_pseudo_legal_moves(board)
        })
    } else {
        crate::move_gen::generate_pseudo_legal_moves(board)
    };
    #[cfg(not(feature = "profiling"))]
    let mut moves = crate::move_gen::generate_pseudo_legal_moves(board);

    // Null-move pruning: if side to move is clearly ahead, skip a turn
    // Only at depth >= 3 and when not in check
    if depth >= 3 && !in_check {
        #[cfg(feature = "profiling")]
        profiler::count_incr(profiler::NULL_MOVE);
        #[cfg(feature = "profiling")]
        profiler::count_incr(profiler::CLONE);
        let mut null_board = board.clone();
        null_board.side_to_move = board.side_to_move.opposite();
        null_board.zobrist_hash ^= crate::board::zobrist::zobrist_tables().side_to_move_key;
        if let Some(ep) = null_board.en_passant_square {
            let file = ep as usize % 8;
            null_board.zobrist_hash ^= crate::board::zobrist::zobrist_tables().en_passant_keys[file];
            null_board.en_passant_square = None;
        }
        null_board.half_move_clock = 0;
        // Search with reduced depth (R=2) at a minimal window
        let null_score = -alpha_beta(&null_board, depth - 3, -beta, -beta + 1, start_time);
        if null_score >= beta {
            return beta;
        }
    }

    let mut best_move = None;
    let mut best_value = i32::MIN + 1;
    let mut legal_move_count = 0;

    // Sort moves using improved ordering (MVV-LVA + Killer + History + Hash move)
    #[cfg(feature = "profiling")]
    if profiler::is_active() {
        profiler::time(profiler::SORT, || {
            crate::ai::move_ordering::sort_moves(&mut moves, board, depth, tt_move)
        });
    } else {
        crate::ai::move_ordering::sort_moves(&mut moves, board, depth, tt_move);
    }
    #[cfg(not(feature = "profiling"))]
    crate::ai::move_ordering::sort_moves(&mut moves, board, depth, tt_move);

    // Static evaluation for futility pruning at shallow depths
    #[cfg(feature = "profiling")]
    let static_eval = if depth <= 2 {
        if profiler::is_active() {
            profiler::time(profiler::EVAL, || evaluate(board))
        } else {
            evaluate(board)
        }
    } else {
        0
    };
    #[cfg(not(feature = "profiling"))]
    let static_eval = if depth <= 2 { evaluate(board) } else { 0 };

    for (i, m) in moves.iter().enumerate() {
        // Futility pruning at depth 1: skip quiet moves that can't raise alpha
        if depth <= 2 && i > 0 {
            let is_capture = board.get_piece_at(m.to).is_some()
                || matches!(m.flag, crate::board::move_struct::MoveFlag::EnPassantCapture);
            let is_promotion = matches!(m.flag, crate::board::move_struct::MoveFlag::Promotion(_));
            if !is_capture && !is_promotion {
                let margin = if depth == 1 { 250 } else { 450 };
                if static_eval + margin < alpha {
                    continue;
                }
            }
        }

        #[cfg(feature = "profiling")]
        profiler::count_incr(profiler::CLONE);
        let mut board_copy = board.clone();
        #[cfg(feature = "profiling")]
        profiler::count_incr(profiler::MAKE_MOVE);
        board_copy.make_move(*m);

        // Check legality: if move leaves king in check, it's illegal
        if crate::move_gen::is_in_check(&board_copy, board.side_to_move) {
            continue;
        }
        legal_move_count += 1;

        // Check extension: when in check, search one ply deeper
        let new_depth = if in_check { depth } else { depth - 1 };

        let eval = -alpha_beta(&board_copy, new_depth, -beta, -alpha, start_time);

        if eval > best_value {
            best_value = eval;
            best_move = Some((m.from as u8, m.to as u8, move_flag_to_u8(&m.flag)));
            if board.get_piece_at(m.to).is_none()
                && !matches!(m.flag, crate::board::move_struct::MoveFlag::Promotion(_))
            {
                crate::ai::move_ordering::record_history(m, depth);
            }
        }

        alpha = alpha.max(eval);
        if alpha >= beta {
            crate::ai::move_ordering::record_killer(depth, m);
            break;
        }
    }

    if legal_move_count == 0 {
        if in_check {
            let score = -20000 - depth as i32;
            crate::store_position(board_hash, depth, score, crate::ai::transposition::TT_EXACT, None);
            return score;
        }
        crate::store_position(board_hash, depth, 0, crate::ai::transposition::TT_EXACT, None);
        return 0;
    }

    let entry_type = if best_value >= beta {
        crate::ai::transposition::TT_LOWER_BOUND
    } else if best_value > old_alpha {
        crate::ai::transposition::TT_EXACT
    } else {
        crate::ai::transposition::TT_UPPER_BOUND
    };

    #[cfg(feature = "profiling")]
    if profiler::is_active() {
        profiler::time(profiler::TT_STORE, || {
            crate::ai::transposition::store_position(
                board_hash,
                depth,
                best_value,
                entry_type,
                best_move,
            )
        });
    } else {
        crate::ai::transposition::store_position(
            board_hash,
            depth,
            best_value,
            entry_type,
            best_move,
        );
    }
    #[cfg(not(feature = "profiling"))]
    crate::ai::transposition::store_position(board_hash, depth, best_value, entry_type, best_move);
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

/// Piece value for MVV-LVA scoring (centipawns).
#[inline]
fn piece_value(pt: PieceType) -> i32 {
    match pt {
        PieceType::Pawn => 100,
        PieceType::Knight => 320,
        PieceType::Bishop => 330,
        PieceType::Rook => 500,
        PieceType::Queen => 900,
        PieceType::King => 20000,
    }
}

/// Generate capture moves directly from attack bitboards.
///
/// Instead of generating ALL pseudo-legal moves and filtering to captures
/// (which allocates intermediate Vecs for every piece), this function
/// computes attack bitboards for each friendly piece and intersects with
/// enemy occupancy to get only capture targets.
///
/// This is significantly faster for quiescence where we only need captures.
fn generate_captures_fast(board: &Board, out: &mut Vec<Move>) {
    let side = board.side_to_move;
    let enemy = side.opposite();
    let friendly_offset = if side == Color::White { 0 } else { 6 };
    let enemy_occ = board.occupancy[if enemy == Color::White { 0 } else { 1 }].0;
    let all_occ = board.occupancy[2];

    // Helper: for each attack target on `attack_bb` from `from_sq`, push a capture move.
    // Handles pawn promotion on the back rank.
    macro_rules! push_captures {
        ($from:expr, $attack_bb:expr, $is_pawn:expr) => {
            let mut atk = ($attack_bb).0 & enemy_occ;
            while atk != 0 {
                let t = atk.trailing_zeros() as u8;
                let to_sq = Square::from_u8_unchecked(t);
                if $is_pawn && ((side == Color::White && t >= 56) || (side == Color::Black && t <= 7))
                {
                    // Pawn promotion capture: generate all 4 promotions
                    out.push(Move::new($from, to_sq, MoveFlag::Promotion(PieceType::Queen)));
                    out.push(Move::new($from, to_sq, MoveFlag::Promotion(PieceType::Rook)));
                    out.push(Move::new($from, to_sq, MoveFlag::Promotion(PieceType::Bishop)));
                    out.push(Move::new($from, to_sq, MoveFlag::Promotion(PieceType::Knight)));
                } else {
                    out.push(Move::new($from, to_sq, MoveFlag::Capture));
                }
                atk &= atk - 1;
            }
        };
    }

    // --- Pawn captures ---
    {
        let pawns = board.pieces[friendly_offset].0;
        let mut bits = pawns;
        while bits != 0 {
            let sq = bits.trailing_zeros() as u8;
            let from = Square::from_u8_unchecked(sq);
            let attacks = crate::move_gen::pawn::get_pawn_attacks(from, side);
            push_captures!(from, attacks, true);
            bits &= bits - 1;
        }
    }

    // --- En passant ---
    if let Some(ep_sq) = board.en_passant_square {
        let ep_attacks = crate::move_gen::pawn::get_pawn_attacks(ep_sq, enemy);
        let ep_attackers = ep_attacks.0 & board.pieces[friendly_offset].0;
        let mut bits = ep_attackers;
        while bits != 0 {
            let sq = bits.trailing_zeros() as u8;
            let from = Square::from_u8_unchecked(sq);
            out.push(Move::new(from, ep_sq, MoveFlag::EnPassantCapture));
            bits &= bits - 1;
        }
    }

    // --- Knight captures ---
    {
        let knights = board.pieces[friendly_offset + 1].0;
        let mut bits = knights;
        while bits != 0 {
            let sq = bits.trailing_zeros() as u8;
            let from = Square::from_u8_unchecked(sq);
            let attacks = crate::move_gen::knight::get_knight_attacks(from);
            push_captures!(from, attacks, false);
            bits &= bits - 1;
        }
    }

    // --- Bishop captures (diagonal slides) ---
    {
        let bishops = board.pieces[friendly_offset + 2].0;
        let mut bits = bishops;
        while bits != 0 {
            let sq = bits.trailing_zeros() as u8;
            let from = Square::from_u8_unchecked(sq);
            let attacks = crate::move_gen::sliding::get_bishop_attacks(from, all_occ);
            push_captures!(from, attacks, false);
            bits &= bits - 1;
        }
    }

    // --- Rook captures (orthogonal slides) ---
    {
        let rooks = board.pieces[friendly_offset + 3].0;
        let mut bits = rooks;
        while bits != 0 {
            let sq = bits.trailing_zeros() as u8;
            let from = Square::from_u8_unchecked(sq);
            let attacks = crate::move_gen::sliding::get_rook_attacks(from, all_occ);
            push_captures!(from, attacks, false);
            bits &= bits - 1;
        }
    }

    // --- Queen captures (bishop + rook slides) ---
    {
        let queens = board.pieces[friendly_offset + 4].0;
        let mut bits = queens;
        while bits != 0 {
            let sq = bits.trailing_zeros() as u8;
            let from = Square::from_u8_unchecked(sq);
            let diag = crate::move_gen::sliding::get_bishop_attacks(from, all_occ);
            let orth = crate::move_gen::sliding::get_rook_attacks(from, all_occ);
            let attacks = crate::Bitboard(diag.0 | orth.0);
            push_captures!(from, attacks, false);
            bits &= bits - 1;
        }
    }

    // --- King captures ---
    {
        let kings = board.pieces[friendly_offset + 5].0;
        if kings != 0 {
            let sq = kings.trailing_zeros() as u8;
            let from = Square::from_u8_unchecked(sq);
            let attacks = crate::move_gen::king::get_king_attacks(from);
            push_captures!(from, attacks, false);
        }
    }
}

/// Score a capture for MVV-LVA ordering (higher is better).
/// Victim value dominates, attacker value breaks ties (cheapest attacker first).
#[inline]
fn score_capture(m: &Move, board: &Board) -> i32 {
    let victim_value = match board.get_piece_at(m.to) {
        Some(p) => piece_value(p.piece_type),
        None => 100, // En passant captures a pawn
    };
    let attacker_value = match board.get_piece_at(m.from) {
        Some(p) => piece_value(p.piece_type),
        None => 0,
    };
    victim_value * 100 - attacker_value
}

/// Quiescence search to evaluate "quiet" positions at depth 0.
/// Only explores capture moves to avoid the horizon effect.
/// Uses Negamax formulation - returns score from perspective of side to move.
/// Includes timeout checking to prevent excessive capture sequence searches.
///
/// Optimizations:
///   1. Direct capture generation from attack bitboards (avoids generating
///      non-capture moves and intermediate per-piece Vec allocations)
///   2. Deferred legality check: only check legality for top-N captures we
///      actually try (avoids cloning every pseudo-legal capture)
///   3. Delta pruning: skip all captures when stand_pat + max gain < alpha
///   4. Inline selection sort for top-N MVV-LVA ordering (no allocation)
fn quiescence(board: &Board, mut alpha: i32, beta: i32, start_time: f64, q_depth: u8) -> i32 {
    // Check timeout
    if check_timeout_full(start_time).is_some() || q_depth > 4 {
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

    // Delta pruning: if best possible capture (queen=900cp + margin) can't reach
    // alpha, skip all capture search. This prunes large subtrees in losing positions.
    if stand_pat + 1100 < alpha {
        return alpha;
    }

    // Generate captures directly from attack bitboards (skips non-capture generation)
    let mut captures = Vec::with_capacity(64);
    generate_captures_fast(board, &mut captures);
    if captures.is_empty() {
        return stand_pat;
    }

    // Selection sort: bring top-N captures to front by MVV-LVA
    let max = if q_depth > 2 { 4 } else { 8 };
    let limit = captures.len().min(max);
    for i in 0..limit {
        let mut best = i;
        let mut best_score = score_capture(&captures[i], board);
        for j in (i + 1)..captures.len() {
            let s = score_capture(&captures[j], board);
            if s > best_score {
                best_score = s;
                best = j;
            }
        }
        if best != i {
            captures.swap(i, best);
        }
    }

    let mut best_value = stand_pat;
    for i in 0..limit {
        // Check timeout during quiescence search
        if check_timeout_full(start_time).is_some() {
            return best_value;
        }

        let m = captures[i];

        // Legality check: clone, make move, ensure king not in check.
        // We defer this from move generation to avoid cloning every
        // pseudo-legal capture - only the top-N we actually try.
        #[cfg(feature = "profiling")]
        profiler::count_incr(profiler::CLONE);
        let mut board_copy = board.clone();
        #[cfg(feature = "profiling")]
        profiler::count_incr(profiler::MAKE_MOVE);
        board_copy.make_move(m);
        if crate::move_gen::is_in_check(&board_copy, board.side_to_move) {
            continue; // Illegal capture (e.g. pinned piece or en passant that exposes king)
        }

        // Negamax: negate the score and swap alpha/beta
        let eval = -quiescence(&board_copy, -beta, -alpha, start_time, q_depth + 1);
        best_value = best_value.max(eval);
        alpha = alpha.max(eval);
        if alpha >= beta {
            break;
        }
    }
    best_value
}
