// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Profiler Module - Phase timing and counting for search performance analysis.
//
// All counters use global atomics so they can be accumulated across recursive
// calls without threading a &mut Profiler through the call stack.
//
// Enabled with FEATURE `profiling` (see Cargo.toml).
//
// Phases measured:
//   MoveGen    - generate_legal_moves (incl. legality filtering)
//   Eval       - evaluate() static evaluation
//   Sort       - sort_moves() move ordering
//   TTLookup   - transposition table lookup
//   TTStore    - transposition table store
//   IsInCheck  - is_in_check detection
//   CloneBoard - board.clone()
//   MakeMove   - board.make_move()
//   NullMove   - null-move pruning search call
//   Quiescence - quiescence search subtree
//   Total      - overall search time (wall clock)

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::Instant;

// ---------------------------------------------------------------------------
// Phase identifiers
// ---------------------------------------------------------------------------
pub const MOVE_GEN: usize = 0;
pub const EVAL: usize = 1;
pub const SORT: usize = 2;
pub const TT_LOOKUP: usize = 3;
pub const TT_STORE: usize = 4;
pub const IS_IN_CHECK: usize = 5;
pub const CLONE: usize = 6;
pub const MAKE_MOVE: usize = 7;
pub const NULL_MOVE: usize = 8;
pub const QUIESCENCE: usize = 9;
pub const TOTAL: usize = 10;
pub const NUM_PHASES: usize = 11;

static PHASE_NAMES: [&str; NUM_PHASES] = [
    "MoveGen   ",
    "Eval      ",
    "Sort      ",
    "TTLookup  ",
    "TTStore   ",
    "IsInCheck ",
    "CloneBoard",
    "MakeMove  ",
    "NullMove  ",
    "Quiescence",
    "Total     ",
];

/// Nanoseconds accumulated per phase
static PHASE_NS: [AtomicU64; NUM_PHASES] = [
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0),
];

/// Call count per phase
static PHASE_COUNT: [AtomicU64; NUM_PHASES] = [
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0),
];

/// Total search nodes visited
static TOTAL_NODES: AtomicU64 = AtomicU64::new(0);

/// Whether profiling is active (0=inactive, 1=active)
static ACTIVE: AtomicU64 = AtomicU64::new(0);

/// Search start instant (set by begin(), consumed by end())
static SEARCH_START: Mutex<Option<Instant>> = Mutex::new(None);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Reset all counters. Call before a profiling run.
pub fn reset() {
    for i in 0..NUM_PHASES {
        PHASE_NS[i].store(0, Ordering::Relaxed);
        PHASE_COUNT[i].store(0, Ordering::Relaxed);
    }
    TOTAL_NODES.store(0, Ordering::Relaxed);
}

/// Mark the search as active so timed sections actually measure.
/// Stores wall-clock start time for total tracking.
pub fn begin() {
    ACTIVE.store(1, Ordering::Relaxed);
    reset();
    *SEARCH_START.lock().unwrap() = Some(Instant::now());
}

/// Mark search as done and print report.
pub fn end(total_nodes: u64, _caller_time_ms: f64) {
    let wall_ms = SEARCH_START
        .lock()
        .unwrap()
        .take()
        .map(|start| start.elapsed().as_secs_f64() * 1000.0)
        .unwrap_or(0.0);

    ACTIVE.store(0, Ordering::Relaxed);
    TOTAL_NODES.store(total_nodes, Ordering::Relaxed);
    report(wall_ms);
}

/// Check if profiling is active (fast path).
#[inline]
pub fn is_active() -> bool {
    ACTIVE.load(Ordering::Relaxed) != 0
}

/// Record a single phase invocation with elapsed nanoseconds.
#[inline]
pub fn record(phase: usize, elapsed_ns: u64) {
    PHASE_NS[phase].fetch_add(elapsed_ns, Ordering::Relaxed);
    PHASE_COUNT[phase].fetch_add(1, Ordering::Relaxed);
}

/// Record a count-only operation (no timing).
#[inline]
pub fn count_incr(phase: usize) {
    PHASE_COUNT[phase].fetch_add(1, Ordering::Relaxed);
}

// ---------------------------------------------------------------------------
// Timer helpers
// ---------------------------------------------------------------------------

/// Measure elapsed ns of a closure and record under `phase`.
/// If profiling is inactive, just calls f() with no overhead.
#[inline]
pub fn time<T, F>(phase: usize, f: F) -> T
where
    F: FnOnce() -> T,
{
    if is_active() {
        let start = Instant::now();
        let result = f();
        let elapsed = start.elapsed().as_nanos() as u64;
        record(phase, elapsed);
        result
    } else {
        f()
    }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

fn report(total_time_ms: f64) {
    let total_ns = total_time_ms * 1_000_000.0;
    let total_nodes = TOTAL_NODES.load(Ordering::Relaxed);

    println!("\n======= SEARCH PROFILE =======");
    println!("{:<12} {:>12} {:>12} {:>10} {:>10}", "Phase", "Calls", "Time(ms)", "%Total", "ns/call");
    println!("{}", "-".repeat(60));

    let mut accounted_ns = 0u64;
    let phase_data: Vec<(u64, u64)> = (0..NUM_PHASES)
        .map(|i| {
            let ns = PHASE_NS[i].load(Ordering::Relaxed);
            let cnt = PHASE_COUNT[i].load(Ordering::Relaxed);
            (ns, cnt)
        })
        .collect();

    for i in 0..NUM_PHASES {
        let (ns, cnt) = phase_data[i];
        if i != TOTAL {
            accounted_ns += ns;
        }
        let pct = if total_ns > 0.0 {
            ns as f64 / total_ns * 100.0
        } else {
            0.0
        };
        let avg_ns = if cnt > 0 { ns / cnt } else { 0 };
        println!(
            "{:<12} {:>12} {:>10.2}ms {:>8.1}% {:>10}",
            PHASE_NAMES[i],
            cnt,
            ns as f64 / 1_000_000.0,
            pct,
            avg_ns
        );
    }

    let other_ns = (total_ns as u64).saturating_sub(accounted_ns);
    let other_pct = if total_ns > 0.0 {
        other_ns as f64 / total_ns * 100.0
    } else {
        0.0
    };
    println!(
        "{:<12} {:>12} {:>10.2}ms {:>8.1}% {:>10}",
        "Other/Overhd", "-", other_ns as f64 / 1_000_000.0, other_pct, "-"
    );
    println!("{}", "-".repeat(60));
    if total_nodes >= 1_000_000 {
        println!(
            "Total: {:.1}M nodes | {:.0} nodes/ms | {:.0} nodes/s | {:.2}s wall",
            total_nodes as f64 / 1_000_000.0,
            total_nodes as f64 / total_time_ms.max(1.0),
            total_nodes as f64 / (total_time_ms.max(1.0) / 1000.0),
            total_time_ms / 1000.0
        );
    } else {
        println!(
            "Total: {} nodes | {:.0} nodes/ms | {:.0} nodes/s | {:.2}s wall",
            total_nodes,
            total_nodes as f64 / total_time_ms.max(1.0),
            total_nodes as f64 / (total_time_ms.max(1.0) / 1000.0),
            total_time_ms / 1000.0
        );
    }
    println!("==============================\n");
}
