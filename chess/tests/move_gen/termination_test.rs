use chess_core::serialization::fen::parse_fen;
use chess_core::move_gen::termination::{detect_termination, GameState};

#[test]
fn test_checkmate() {
    // Fool's Mate
    let fen = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 3";
    let board = parse_fen(fen).unwrap();
    assert_eq!(detect_termination(&board), GameState::Checkmate);
}

#[test]
fn test_stalemate() {
    let fen = "k7/8/8/8/8/8/5q2/7K w - - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(detect_termination(&board), GameState::Stalemate);
}

#[test]
fn test_insufficient_material_king_vs_king() {
    let fen = "k7/8/8/8/8/8/8/7K w - - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(detect_termination(&board), GameState::InsufficientMaterial);
}

#[test]
fn test_ongoing_game() {
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(detect_termination(&board), GameState::Ongoing);
}
