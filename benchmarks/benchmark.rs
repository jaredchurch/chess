// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Benchmark script for engine difficulty levels.
// Runs matches between different levels and reports results.

use chess_core::board::Board;
use chess_core::ai::DifficultyLevel;
use chess_core::get_best_move_wasm;
use std::collections::HashMap;
use std::time::Duration;

/// Result of a single game
#[derive(Debug, Clone)]
struct GameResult {
    winner: Option<DifficultyLevel>,  // None = draw
    moves: usize,
    duration_ms: u64,
}

/// Runs a match between two difficulty levels
fn run_match(level1: DifficultyLevel, level2: DifficultyLevel, num_games: usize) -> Vec<GameResult> {
    let mut results = Vec::new();
    
    for game_num in 1..=num_games {
        println!("Game {}/{}: {:?} vs {:?}", game_num, num_games, level1, level2);
        
        let mut board = Board::new();
        let mut moves_played = 0;
        let start = std::time::Instant::now();
        
        loop {
            // Determine current level (alternate sides)
            let current_level = if board.side_to_move == chess_core::board::types::Color::White {
                level1
            } else {
                level2
            };
            
            // Get best move
            let best_move = get_best_move_wasm(&board.to_fen(), current_level as u8);
            
            if let Some(m) = best_move {
                let from = m.from as usize;
                let to = m.to as usize;
                let flag = m.flag;
                
                // Convert MoveFlag back to board's MoveFlag
                let move_flag = match flag {
                    0 => chess_core::board::move_struct::MoveFlag::Quiet,
                    1 => chess_core::board::move_struct::MoveFlag::Capture,
                    2 => chess_core::board::move_struct::MoveFlag::DoublePawnPush,
                    3 => chess_core::board::move_struct::MoveFlag::KingsideCastling,
                    4 => chess_core::board::move_struct::MoveFlag::QueensideCastling,
                    5 => chess_core::board::move_struct::MoveFlag::EnPassantCapture,
                    6 => {
                        // Default to Queen promotion if we don't have the piece type
                        chess_core::board::move_struct::MoveFlag::Promotion(
                            chess_core::board::piece::PieceType::Queen
                        )
                    },
                    _ => chess_core::board::move_struct::MoveFlag::Quiet,
                };
                
                let mov = chess_core::board::move_struct::Move {
                    from,
                    to,
                    flag: move_flag,
                    piece_type: None,
                };
                
                board.make_move(mov);
                moves_played += 1;
                
                // Check for game end
                if board.is_checkmate() {
                    let winner = if board.side_to_move == chess_core::board::types::Color::White {
                        level2  // Black won
                    } else {
                        level1  // White won
                    };
                    results.push(GameResult {
                        winner: Some(winner),
                        moves: moves_played,
                        duration_ms: start.elapsed().as_millis() as u64,
                    });
                    break;
                }
                
                if board.is_stalemate() || board.is_insufficient_material() {
                    results.push(GameResult {
                        winner: None,  // Draw
                        moves: moves_played,
                        duration_ms: start.elapsed().as_millis() as u64,
                    });
                    break;
                }
                
                // Safety limit
                if moves_played > 200 {
                    results.push(GameResult {
                        winner: None,  // Draw by move limit
                        moves: moves_played,
                        duration_ms: start.elapsed().as_millis() as u64,
                    });
                    break;
                }
            } else {
                // No legal moves - should be caught above, but safety
                results.push(GameResult {
                    winner: None,
                    moves: moves_played,
                    duration_ms: start.elapsed().as_millis() as u64,
                });
                break;
            }
        }
    }
    
    results
}

/// Prints a summary of match results
fn print_summary(level1: DifficultyLevel, level2: DifficultyLevel, results: &[GameResult]) {
    let total = results.len();
    let level1_wins = results.iter().filter(|r| r.winner == Some(level1)).count();
    let level2_wins = results.iter().filter(|r| r.winner == Some(level2)).count();
    let draws = results.iter().filter(|r| r.winner.is_none()).count();
    
    let avg_moves = results.iter().map(|r| r.moves).sum::<usize>() as f64 / total as f64;
    let avg_duration = results.iter().map(|r| r.duration_ms).sum::<u64>() as f64 / total as f64;
    
    println!("\n=== Match Results: {:?} vs {:?} ===", level1, level2);
    println!("Total games: {}", total);
    println!("{:?} wins: {} ({:.1}%)", level1, level1_wins, level1_wins as f64 * 100.0 / total as f64);
    println!("{:?} wins: {} ({:.1}%)", level2, level2_wins, level2_wins as f64 * 100.0 / total as f64);
    println!("Draws: {} ({:.1}%)", draws, draws as f64 * 100.0 / total as f64);
    println!("Avg moves per game: {:.1}", avg_moves);
    println!("Avg duration: {:.0}ms", avg_duration);
    println!("");
}

fn main() {
    println!("Chess Engine Benchmark");
    println!("===================\n");
    
    // Define matchups to test
    let matchups = vec![
        (DifficultyLevel::Novice, DifficultyLevel::Casual, 10),
        (DifficultyLevel::Casual, DifficultyLevel::Intermediate, 10),
        (DifficultyLevel::Intermediate, DifficultyLevel::Advanced, 10),
        (DifficultyLevel::Advanced, DifficultyLevel::Skilled, 10),
        (DifficultyLevel::Skilled, DifficultyLevel::Expert, 5),
        (DifficultyLevel::Expert, DifficultyLevel::Master, 5),
    ];
    
    let mut all_results: HashMap<String, Vec<GameResult>> = HashMap::new();
    
    for (level1, level2, num_games) in matchups {
        let results = run_match(level1, level2, num_games);
        let key = format!("{:?}_vs_{:?}", level1, level2);
        all_results.insert(key.clone(), results.clone());
        print_summary(level1, level2, &results);
    }
    
    println!("Benchmark complete!");
}
