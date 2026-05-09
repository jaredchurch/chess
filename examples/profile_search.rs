// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Profile Search - Runs a search at given depth/position and prints phase profile.
// Usage: cargo run --features profiling --example profile_search [depth] [fen]
//   depth: search depth (default: 4)
//   fen:   FEN string in quotes, or "startpos" for starting position (default)

use chess_core::ai::search::get_best_move_with_depth;
use chess_core::serialization::fen::parse_fen;
use std::time::Instant;

fn main() {
    let args: Vec<String> = std::env::args().collect();

    let depth: u8 = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(4);

    let fen_str = match args.get(2) {
        Some(s) if s == "startpos" => "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        Some(s) => s.as_str(),
        None => "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    };

    let board = parse_fen(fen_str).expect("Invalid FEN");
    let max_depth = chess_core::ai::get_search_depth(depth);

    println!(
        "Profile: level={} depth={} fen={}\n",
        depth, max_depth, fen_str
    );

    let start = Instant::now();
    let result = get_best_move_with_depth(&board, max_depth);
    let wall = start.elapsed().as_secs_f64() * 1000.0;

    if let Some(m) = result {
        println!(
            "Best move: {}{} -> {}{}",
            (b'a' + (m.from as u8 % 8)) as char,
            (b'1' + (m.from as u8 / 8)) as char,
            (b'a' + (m.to as u8 % 8)) as char,
            (b'1' + (m.to as u8 / 8)) as char,
        );
    } else {
        println!("No move found (checkmate/stalemate?)");
    }

    println!("\nWall clock: {:.1}ms", wall);
}
