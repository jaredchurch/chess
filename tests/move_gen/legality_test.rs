use chess_core::Board;
use chess_core::board::types::{Color, Square};
use chess_core::board::piece::{Piece, PieceType};

#[test]
fn test_pinned_piece_cannot_move() {
    let mut board = Board::default();
    // White King at E1
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    // White Knight at E2 (pinned)
    board.add_piece(Square::E2, Piece::new(PieceType::Knight, Color::White));
    // Black Rook at E8 (pinning the knight)
    board.add_piece(Square::E8, Piece::new(PieceType::Rook, Color::Black));
    
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    let legal_moves = board.generate_legal_moves();
    
    // Knight at E2 is pinned to the king on the E-file.
    // It should have 0 legal moves.
    // The King might have some moves (D1, F1, D2, F2 if not attacked).
    
    let knight_moves: Vec<_> = legal_moves.iter().filter(|m| m.from == Square::E2).collect();
    assert_eq!(knight_moves.len(), 0, "Pinned knight should have no legal moves");
}

#[test]
fn test_king_must_escape_check() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::E8, Piece::new(PieceType::Rook, Color::Black));
    
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    let legal_moves = board.generate_legal_moves();
    
    // King is in check by rook at E8.
    // King must move out of E-file or capture (not possible here).
    for m in legal_moves {
        let mut board_copy = board.clone();
        board_copy.make_move(m);
        assert!(!chess_core::move_gen::is_in_check(&board_copy, Color::White), "Move {:?} left king in check", m);
    }
}
