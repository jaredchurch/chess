use chess_core::board::piece::{Piece, PieceType};
use chess_core::board::types::{Color, Square};
use chess_core::Board;

#[test]
fn test_king_moves() {
    let mut board = Board::default();
    board.add_piece(Square::E4, Piece::new(PieceType::King, Color::White));

    let moves = board.generate_legal_moves();

    // King at e4 should have 8 moves on empty board.
    assert_eq!(moves.len(), 8);
}
