// Benchmark Notes:
// - Focus optimization efforts on operations that take >10s
// - Operations under 10s are not a priority for optimization
// - Use generous 300s timeout to get stable baseline measurements
// - Valid FEN strings are critical (invalid FEN will cause panics)

use chrono::Local;
use chess_core::serialization::fen::parse_fen;
use chess_core::ai::search::get_best_move_with_depth;
use criterion::{criterion_group, criterion_main, Criterion, BenchmarkId};

fn bench_move_generation(c: &mut Criterion) {
    let start = std::time::Instant::now();
    let now = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] Starting move_generation benchmarks...", now);
    
    let start_pos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(start_pos).unwrap();

    c.bench_function("generate_legal_moves_start_pos", |b| {
        b.iter(|| board.generate_legal_moves())
    });

    let kiwipete = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    let board = parse_fen(kiwipete).unwrap();

    c.bench_function("generate_legal_moves_kiwipete", |b| {
        b.iter(|| board.generate_legal_moves())
    });
    
    let now = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] Finished move_generation benchmarks", now);
}

fn bench_engine_levels(c: &mut Criterion) {
    let start = std::time::Instant::now();
    let now = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] Starting engine_levels benchmarks...", now);
    
    let start_pos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(start_pos).unwrap();
    
    let mut group = c.benchmark_group("engine_levels");
    group.sample_size(10);
    group.measurement_time(std::time::Duration::from_secs(300));
    
    // Map difficulty levels to search depths
    let levels = vec![
        ("Casual", 2),
        ("Intermediate", 3),
    ];
    
    for (name, depth) in levels {
        group.bench_with_input(
            BenchmarkId::new("get_best_move", name),
            &depth,
            |b, &depth| {
                b.iter(|| get_best_move_with_depth(&board, depth))
            },
        );
    }
    
    group.finish();
    let now = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] Finished engine_levels benchmarks", now);
}

fn bench_engine_depth(c: &mut Criterion) {
    let start = std::time::Instant::now();
    let now = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] Starting engine_depth benchmarks...", now);
    
    let positions = vec![
        ("start_pos", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
        ("middlegame", "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"),
        ("endgame", "8/8/8/8/8/8/PPPPPPPP/RNBQKBNR w - 0 1"),
    ];
    
    let mut group = c.benchmark_group("engine_depth");
    group.sample_size(10);
    group.measurement_time(std::time::Duration::from_secs(300));
    
    for (name, fen) in positions {
        let board = parse_fen(fen).unwrap();
        // Use depth 4 for all positions (generous 300s timeout allows deeper search)
        let depth = 4;
        group.bench_with_input(
            BenchmarkId::new("depth_4", name),
            &(board, depth),
            |b, (board, depth)| {
                b.iter(|| get_best_move_with_depth(board, *depth))
            },
        );
    }
    
    group.finish();
    let now = chrono::Local::now().format("%H:%M:%S");
    println!("[{}] Finished engine_depth benchmarks", now);
}

criterion_group!(benches, bench_move_generation, bench_engine_levels, bench_engine_depth);
criterion_main!(benches);
