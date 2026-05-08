// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Transposition Table - Caches previously evaluated positions using Zobrist hashing.
//
// Uses a direct-mapped array indexed by (hash & mask) for O(1) access without
// heap allocation, hashing overhead, or lock contention. This is the standard
// approach in modern chess engines and is significantly faster than HashMap.
//
// Replacement strategy: depth-preferred. Only replace if new depth >= existing
// depth. This preserves deep entries from later iterative deepening iterations.

use std::sync::Mutex;
use std::sync::OnceLock;

/// Number of TT entries (power of 2 for fast indexing).
/// Each entry is 16 bytes, so 1M entries = 16MB.
const TT_SIZE: usize = 1 << 20;

/// Entry types for the transposition table
pub const TT_EXACT: u8 = 1;
pub const TT_LOWER_BOUND: u8 = 2; // Fail-high (beta cutoff)
pub const TT_UPPER_BOUND: u8 = 3; // Fail-low (alpha)

/// A transposition table entry.
/// Packed into 16 bytes.
#[derive(Clone, Copy)]
struct TTEntry {
    hash: u64,
    score: i32,
    best_move: u16, // Packed: 6 bits from, 6 bits to, 4 bits flag
    depth: u8,
    entry_type: u8,
}

/// Transposition table using a fixed-size array indexed by hash & mask.
struct TranspositionTable {
    entries: Vec<TTEntry>,
    mask: usize,
}

impl TranspositionTable {
    fn new() -> Self {
        let size = TT_SIZE;
        TranspositionTable {
            entries: vec![TTEntry { hash: 0, depth: 0, score: 0, entry_type: 0, best_move: 0 }; size],
            mask: size - 1,
        }
    }

    /// Stores a position in the table using depth-preferred replacement.
    fn store(&mut self, hash: u64, depth: u8, score: i32, entry_type: u8, best_move: u16) {
        let idx = hash as usize & self.mask;
        let entry = &mut self.entries[idx];
        
        // Always replace if new depth is greater, or if it's the same hash
        // Depth-preferred replacement keeps deeper (more valuable) entries.
        if entry.entry_type == 0 || depth >= entry.depth || hash == entry.hash {
            *entry = TTEntry {
                hash,
                depth,
                score,
                entry_type,
                best_move,
            };
        }
    }

    /// Looks up a position in the table.
    fn lookup(&self, hash: u64, depth: u8, alpha: i32, beta: i32) -> (Option<i32>, Option<u16>) {
        let idx = hash as usize & self.mask;
        let entry = &self.entries[idx];
        
        if entry.hash == hash {
            let mut best_move = None;
            if entry.best_move != 0 {
                best_move = Some(entry.best_move);
            }

            if entry.depth >= depth {
                match entry.entry_type {
                    TT_EXACT => return (Some(entry.score), best_move),
                    TT_LOWER_BOUND => {
                        if entry.score >= beta {
                            return (Some(entry.score), best_move);
                        }
                    }
                    TT_UPPER_BOUND => {
                        if entry.score <= alpha {
                            return (Some(entry.score), best_move);
                        }
                    }
                    _ => {}
                }
            }
            return (None, best_move);
        }
        (None, None)
    }

    /// Clears the transposition table.
    fn clear(&mut self) {
        for entry in self.entries.iter_mut() {
            entry.entry_type = 0;
        }
    }
}

/// Global transposition table (lazy initialized).
static TT: OnceLock<Mutex<TranspositionTable>> = OnceLock::new();

fn get_transposition_table() -> &'static Mutex<TranspositionTable> {
    TT.get_or_init(|| Mutex::new(TranspositionTable::new()))
}

/// Clears the transposition table.
pub fn clear_tt() {
    if let Some(tt) = TT.get() {
        let mut table = tt.lock().unwrap();
        table.clear();
    }
}

/// Stores a position in the transposition table.
pub fn store_position(
    hash: u64,
    depth: u8,
    score: i32,
    entry_type: u8,
    best_move: Option<(u8, u8, u8)>,
) {
    let packed_move = if let Some((from, to, flag)) = best_move {
        (from as u16) | ((to as u16) << 6) | ((flag as u16) << 12)
    } else {
        0
    };

    let tt = get_transposition_table();
    let mut table = tt.lock().unwrap();
    table.store(hash, depth, score, entry_type, packed_move);
}

/// Looks up a position in the transposition table.
/// Returns (score, best_move).
pub fn lookup_position(hash: u64, depth: u8, alpha: i32, beta: i32) -> (Option<i32>, Option<u16>) {
    let tt = get_transposition_table();
    let tt_guard = tt.lock().unwrap();
    tt_guard.lookup(hash, depth, alpha, beta)
}
