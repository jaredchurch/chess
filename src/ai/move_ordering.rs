// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Move Ordering - Implements heuristics to improve Alpha-Beta search efficiency.
// Includes MVV-LVA, Killer Moves, and History Heuristic.

use crate::board::move_struct::{Move, MoveFlag};
use crate::board::piece::PieceType;

/// Killer move slots per depth (2 slots per depth)
const KILLER_SLOTS: usize = 2;
const MAX_DEPTH: usize = 64;

/// Killer move table: stores moves that caused beta cutoffs
struct KillerTable {
    killers: [[Option<(u8, u8)>; KILLER_SLOTS]; MAX_DEPTH],
}

impl KillerTable {
    fn new() -> Self {
        KillerTable {
            killers: [[None; KILLER_SLOTS]; MAX_DEPTH],
        }
    }

    /// Records a killer move at a given depth
    fn record(&mut self, depth: u8, m: &Move) {
        let idx = depth as usize;
        if idx >= MAX_DEPTH {
            return;
        }

        let entry = (m.from as u8, m.to as u8);

        // Don't add duplicates
        if self.killers[idx][0] == Some(entry) {
            return;
        }

        // Shift existing killers down and add new one at front
        for i in (1..KILLER_SLOTS).rev() {
            self.killers[idx][i] = self.killers[idx][i - 1];
        }
        self.killers[idx][0] = Some(entry);
    }

    /// Checks if a move is a killer at the given depth
    fn is_killer(&self, depth: u8, m: &Move) -> bool {
        let idx = depth as usize;
        if idx >= MAX_DEPTH {
            return false;
        }

        let entry = (m.from as u8, m.to as u8);
        self.killers[idx].iter().any(|k| k == &Some(entry))
    }

    /// Clears the killer table
    fn clear(&mut self) {
        self.killers = [[None; KILLER_SLOTS]; MAX_DEPTH];
    }
}

/// History heuristic table: tracks success of quiet moves
struct HistoryTable {
    // [piece_type][to_square] -> score
    scores: [[i32; 64]; 6],
}

impl HistoryTable {
    fn new() -> Self {
        HistoryTable {
            scores: [[0; 64]; 6],
        }
    }

    /// Records a successful quiet move with bonus proportional to depth
    fn record(&mut self, m: &Move, depth: u8) {
        // Get piece type from the move flag (for promotions) or we'd need board access
        // For simplicity, use the destination square for history
        let to = m.to as usize;
        if to < 64 {
            let bonus = (depth as i32) * (depth as i32);
            // Use a generic index - we don't have piece type readily available
            let idx = 0; // Generic index for all pieces
            self.scores[idx][to] = (self.scores[idx][to] + bonus).min(10000);
        }
    }

    /// Gets the history score for a move
    fn get_score(&self, m: &Move) -> i32 {
        let to = m.to as usize;
        if to < 64 {
            // Use generic index since we don't track per-piece-type history
            self.scores[0][to]
        } else {
            0
        }
    }

    /// Clears the history table
    fn clear(&mut self) {
        self.scores = [[0; 64]; 6];
    }
}

/// Global killer and history tables
use std::sync::Mutex;
use std::sync::OnceLock;

static KILLER_TABLE: OnceLock<Mutex<KillerTable>> = OnceLock::new();
static HISTORY_TABLE: OnceLock<Mutex<HistoryTable>> = OnceLock::new();

fn get_killer_table() -> &'static Mutex<KillerTable> {
    KILLER_TABLE.get_or_init(|| Mutex::new(KillerTable::new()))
}

fn get_history_table() -> &'static Mutex<HistoryTable> {
    HISTORY_TABLE.get_or_init(|| Mutex::new(HistoryTable::new()))
}

/// Clears all move ordering tables (call at start of new search)
pub fn clear_ordering_tables() {
    if let Some(kt) = KILLER_TABLE.get() {
        kt.lock().unwrap().clear();
    }
    if let Some(ht) = HISTORY_TABLE.get() {
        ht.lock().unwrap().clear();
    }
}

/// Records a killer move (caused beta cutoff)
pub fn record_killer(depth: u8, m: &Move) {
    let kt = get_killer_table();
    kt.lock().unwrap().record(depth, m);
}

/// Records a successful quiet move in history table
pub fn record_history(m: &Move, depth: u8) {
    let ht = get_history_table();
    ht.lock().unwrap().record(m, depth);
}

/// Scores moves for ordering in Alpha-Beta search.
/// Higher scores are searched first.
/// Priority: Hash move > Captures (MVV-LVA) > Killer moves > History > Promotions
pub fn score_move(m: &Move, board: &crate::board::Board, depth: u8) -> i32 {
    let mut score = 0;

    // 1. Captures (MVV-LVA)
    if let Some(captured) = board.get_piece_at(m.to) {
        let victim_value = get_piece_value(&captured.piece_type);
        let attacker_value = if let MoveFlag::Promotion(pt) = m.flag {
            get_piece_value(&pt)
        } else if let Some(piece) = board.get_piece_at(m.from) {
            get_piece_value(&piece.piece_type)
        } else {
            0
        };
        // MVV-LVA: high victim value, low attacker value = high score
        score += 100000 + victim_value * 100 - attacker_value;
    }

    // 2. Promotions (without capture)
    if matches!(m.flag, MoveFlag::Promotion(_)) && board.get_piece_at(m.to).is_none() {
        score += 90000;
    }

    // 3. Killer moves
    let kt = get_killer_table();
    if kt.lock().unwrap().is_killer(depth, m) {
        score += 80000;
    }

    // 4. History heuristic
    let ht = get_history_table();
    score += ht.lock().unwrap().get_score(m);

    score
}

/// Sorts moves in place for Alpha-Beta search order (best first).
pub fn sort_moves(moves: &mut [Move], board: &crate::board::Board, depth: u8) {
    let mut scored_moves: Vec<(Move, i32)> = moves
        .iter()
        .map(|&m| (m, score_move(&m, board, depth)))
        .collect();

    scored_moves.sort_by_key(|b| std::cmp::Reverse(b.1)); // Descending order

    for (i, (m, _)) in scored_moves.into_iter().enumerate() {
        moves[i] = m;
    }
}

/// Returns the piece value for MVV-LVA scoring.
fn get_piece_value(piece_type: &PieceType) -> i32 {
    match piece_type {
        PieceType::Pawn => 100,
        PieceType::Knight => 320,
        PieceType::Bishop => 330,
        PieceType::Rook => 500,
        PieceType::Queen => 900,
        PieceType::King => 20000,
    }
}

/// Converts PieceType to index for history table
#[allow(dead_code)]
fn piece_type_to_idx(pt: &PieceType) -> usize {
    match pt {
        PieceType::Pawn => 0,
        PieceType::Knight => 1,
        PieceType::Bishop => 2,
        PieceType::Rook => 3,
        PieceType::Queen => 4,
        PieceType::King => 5,
    }
}
