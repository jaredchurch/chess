use chess_core::board::piece::{Piece, PieceType};
use chess_core::board::types::{Color, Square};
use chess_core::Board;

#[test]
fn test_knight_moves() {
    let mut board = Board::default();
    board.add_piece(Square::E4, Piece::new(PieceType::Knight, Color::White));

    let moves = board.generate_legal_moves();

    // Knight at e4 should have 8 moves.
    // In TDD, this fails as empty vector.
    assert_eq!(moves.len(), 8);
}
