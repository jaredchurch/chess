// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Transposition Table - Caches previously evaluated positions using Zobrist hashing.
// Uses replacement scheme to maintain quality entries.

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
/// Uses a hash map with replacement strategy based on depth.
struct TranspositionTable {
    table: HashMap<u64, TTEntry>,
    max_size: usize,
    accesses: u64,
    hits: u64,
}

impl TranspositionTable {
    fn new(max_size: usize) -> Self {
        TranspositionTable {
            table: HashMap::with_capacity(max_size),
            max_size,
            accesses: 0,
            hits: 0,
        }
    }
    
    /// Stores a position in the table.
    /// Uses replacement strategy: replace if new depth >= existing depth, or random replacement if full.
    fn store(&mut self, hash: u64, depth: u8, score: i32, entry_type: EntryType) {
        self.accesses += 1;
        
        // Check if we need to make room
        if self.table.len() >= self.max_size {
            // Simple strategy: clear half the table when full
            if self.table.len() >= self.max_size {
                // Keep only entries with depth >= 4 (more likely to be useful)
                let to_remove: Vec<u64> = self.table.iter()
                    .filter(|(_, entry)| entry.depth < 4)
                    .map(|(k, _)| *k)
                    .take(self.max_size / 2)
                    .collect();
                
                for k in to_remove {
                    self.table.remove(&k);
                }
                
                // If still full, clear everything (should be rare)
                if self.table.len() >= self.max_size {
                    self.table.clear();
                }
            }
        }
        
        // Insert or replace based on depth
        let should_insert = match self.table.get(&hash) {
            Some(existing) => depth >= existing.depth,
            None => true,
        };
        
        if should_insert {
            self.table.insert(hash, TTEntry {
                depth,
                score,
                entry_type,
            });
        }
    }
    
    /// Retrieves a position from the table.
    fn lookup(&mut self, hash: u64, depth: u8, _alpha: i32, _beta: i32) -> Option<i32> {
        self.accesses += 1;
        
        if let Some(entry) = self.table.get(&hash) {
            self.hits += 1;
            
            if entry.depth >= depth {
                match entry.entry_type {
                    EntryType::Exact => return Some(entry.score),
                }
            }
        }
        None
    }
    
    /// Clears the transposition table.
    fn clear(&mut self) {
        self.table.clear();
        self.accesses = 0;
        self.hits = 0;
    }
    
    /// Returns hit rate for diagnostics.
    #[allow(dead_code)]
    fn hit_rate(&self) -> f64 {
        if self.accesses == 0 {
            0.0
        } else {
            self.hits as f64 / self.accesses as f64
        }
    }
}

/// Global transposition table (lazy initialized).
use std::sync::OnceLock;
static TT: OnceLock<Mutex<TranspositionTable>> = OnceLock::new();

fn get_transposition_table() -> &'static Mutex<TranspositionTable> {
    TT.get_or_init(|| Mutex::new(TranspositionTable::new(500000)))
}

/// Clears the transposition table.
pub fn clear_tt() {
    if let Some(tt) = TT.get() {
        let mut table = tt.lock().unwrap();
        table.clear();
    }
}

/// Stores a position in the transposition table.
pub fn store_position(hash: u64, depth: u8, score: i32, _is_exact: bool, _best_move: Option<(u8, u8, u8)>) {
    let tt = get_transposition_table();
    let mut table = tt.lock().unwrap();
    table.store(hash, depth, score, EntryType::Exact);
}

/// Looks up a position in the transposition table.
pub fn lookup_position(hash: u64, depth: u8, alpha: i32, beta: i32) -> Option<i32> {
    let tt = get_transposition_table();
    let mut tt_guard = tt.lock().unwrap();
    tt_guard.lookup(hash, depth, alpha, beta)
}
