// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Transposition Table - Caches previously evaluated positions using Zobrist hashing.
// Avoids redundant calculations and improves search efficiency.

use std::collections::HashMap;
use std::sync::Mutex;

/// A transposition table entry.
#[derive(Clone, Copy)]
struct TTEntry {
    depth: u8,
    score: i32,
    entry_type: EntryType,
}

/// Entry type for transposition table entries.
#[derive(Clone, Copy, PartialEq)]
enum EntryType {
    Exact,   // Exact evaluation
}

/// Transposition table for caching board evaluations.
struct TranspositionTable {
    table: HashMap<u64, TTEntry>,
    max_size: usize,
}

impl TranspositionTable {
    fn new(max_size: usize) -> Self {
        TranspositionTable {
            table: HashMap::with_capacity(max_size),
            max_size,
        }
    }
    
    /// Stores a position in the table.
    fn store(&mut self, hash: u64, depth: u8, score: i32, entry_type: EntryType) {
        // Simple size management: clear if too large
        if self.table.len() >= self.max_size {
            self.table.clear();
        }
        
        self.table.insert(hash, TTEntry {
            depth,
            score,
            entry_type,
        });
    }
    
    /// Retrieves a position from the table.
    fn lookup(&self, hash: u64, depth: u8, _alpha: i32, _beta: i32) -> Option<i32> {
        if let Some(entry) = self.table.get(&hash) {
            if entry.depth >= depth
                && entry.entry_type == EntryType::Exact {
                    return Some(entry.score);
                }
        }
        None
    }
}

/// Global transposition table (lazy initialized).
use std::sync::OnceLock;
static TT: OnceLock<Mutex<TranspositionTable>> = OnceLock::new();

fn get_transposition_table() -> &'static Mutex<TranspositionTable> {
    TT.get_or_init(|| Mutex::new(TranspositionTable::new(1000000)))
}

/// Clears the transposition table.
pub fn clear_tt() {
    if let Some(tt) = TT.get() {
        let mut table = tt.lock().unwrap();
        table.table.clear();
    }
}

/// Stores a position in the transposition table.
/// For simplicity, stores as Exact type (full window search).
pub fn store_position(hash: u64, depth: u8, score: i32, _is_exact: bool, _best_move: Option<(u8, u8, u8)>) {
    let tt = get_transposition_table();
    let mut table = tt.lock().unwrap();
    table.store(hash, depth, score, EntryType::Exact);
}

/// Looks up a position in the transposition table.
pub fn lookup_position(hash: u64, depth: u8, _alpha: i32, _beta: i32) -> Option<i32> {
    let tt = get_transposition_table();
    let tt_guard = tt.lock().unwrap();
    tt_guard.lookup(hash, depth, _alpha, _beta)
}
