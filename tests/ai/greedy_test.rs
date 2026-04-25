// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use chess_core::ai::greedy::{evaluate, get_best_move};
use chess_core::board::Board;
use chess_core::serialization::fen::parse_fen;

#[test]
fn test_greedy_ai_capture_queen() {
    // White to move, can capture Black queen with a pawn or move elsewhere.
    // Greedy AI should capture the queen.
    let fen = "rnb1kbnr/pppp1ppp/8/4p3/3P4/4q3/PPP1PPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    let best_move = get_best_move(&board).expect("Should find a move");

    // The move should be d4xe3
    assert_eq!(best_move.to.as_u32(), 20); // E3 is index 20 (2*8 + 4)
}

#[test]
fn test_greedy_ai_prefer_higher_value() {
    // White can capture a Rook or a Pawn. Should prefer Rook.
    let fen = "rnb1kbnr/pppp1ppp/8/4p3/3P4/4r3/PPP1PPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    let best_move = get_best_move(&board).expect("Should find a move");

    assert_eq!(best_move.to.as_u32(), 20); // Capture the rook at E3
}

#[test]
fn test_evaluate_starting_pos() {
    let _board = Board::default();
    // In a balanced starting position, score should be 0.
    // Wait, Board::default() is empty. We need to set it up or use parse_fen.
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(evaluate(&board), 0);
}
