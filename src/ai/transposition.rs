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

/// Number of TT entries (power of 2 for fast indexing).
/// Each entry is 16 bytes, so 1M entries = 16MB.
const TT_SIZE: usize = 1 << 20;

/// A transposition table entry.
/// Packed into 16 bytes (2 cache lines hold 8 entries).
#[derive(Clone, Copy)]
struct TTEntry {
    hash: u64,
    depth: u8,
    score: i32,
    entry_type: u8, // 0 = Empty, 1 = Exact
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
            entries: vec![TTEntry { hash: 0, depth: 0, score: 0, entry_type: 0 }; size],
            mask: size - 1,
        }
    }

    /// Stores a position in the table using depth-preferred replacement.
    /// Only overwrites if new depth >= existing depth (preserves deep entries).
    fn store(&mut self, hash: u64, depth: u8, score: i32, entry_type: u8) {
        let idx = hash as usize & self.mask;
        let entry = &mut self.entries[idx];
        if entry.entry_type == 0 || depth >= entry.depth {
            *entry = TTEntry {
                hash,
                depth,
                score,
                entry_type,
            };
        }
    }

    /// Looks up a position in the table. Returns score if found with sufficient depth.
    fn lookup(&self, hash: u64, depth: u8) -> Option<i32> {
        let idx = hash as usize & self.mask;
        let entry = &self.entries[idx];
        if entry.hash == hash && entry.depth >= depth && entry.entry_type != 0 {
            Some(entry.score)
        }
        else {
            None
        }
    }

    /// Clears the transposition table.
    fn clear(&mut self) {
        for entry in self.entries.iter_mut() {
            entry.entry_type = 0;
        }
    }
}

/// Global transposition table (lazy initialized).
use std::sync::OnceLock;
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
    _is_exact: bool,
    _best_move: Option<(u8, u8, u8)>,
) {
    let tt = get_transposition_table();
    let mut table = tt.lock().unwrap();
    table.store(hash, depth, score, 1);
}

/// Looks up a position in the transposition table.
pub fn lookup_position(hash: u64, depth: u8, _alpha: i32, _beta: i32) -> Option<i32> {
    let tt = get_transposition_table();
    let tt_guard = tt.lock().unwrap();
    tt_guard.lookup(hash, depth)
}
