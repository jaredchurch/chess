use chess_core::Board;
use chess_core::board::types::{Color, Square};
use chess_core::board::piece::{Piece, PieceType};

#[test]
fn test_pawn_single_push() {
    let mut board = Board::default();
    board.add_piece(Square::E2, Piece::new(PieceType::Pawn, Color::White));
    
    let moves = board.generate_legal_moves();
    
    // In TDD, this should fail because we haven't implemented pawn logic yet.
    assert!(moves.iter().any(|m| m.from == Square::E2 && m.to == Square::E3));
}
