use chess_core::Board;
use chess_core::board::types::{Color, Square};
use chess_core::board::piece::{Piece, PieceType};
use chess_core::board::move_struct::MoveFlag;

#[test]
fn test_en_passant() {
    let mut board = Board::default();
    board.add_piece(Square::E5, Piece::new(PieceType::Pawn, Color::White));
    board.add_piece(Square::F7, Piece::new(PieceType::Pawn, Color::Black));
    
    // Simulate black double push F7-F5
    board.side_to_move = Color::Black;
    board.update_occupancy();
    
    // We can't use make_move easily without a Move object, 
    // so let's just manually set the state as if F5 was pushed.
    board.remove_piece(Square::F7);
    board.add_piece(Square::F5, Piece::new(PieceType::Pawn, Color::Black));
    board.en_passant_square = Some(Square::F6);
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    let moves = board.generate_legal_moves();
    let ep_move = moves.iter().find(|m| m.flag == MoveFlag::EnPassantCapture);
    assert!(ep_move.is_some(), "En passant capture should be available at F6");
    assert_eq!(ep_move.unwrap().to, Square::F6);
    
    // Verify move execution
    board.make_move(*ep_move.unwrap());
    assert!(board.get_piece_at(Square::F5).is_none(), "Captured pawn at F5 should be removed");
    assert_eq!(board.get_piece_at(Square::F6).unwrap().piece_type, PieceType::Pawn);
}

#[test]
fn test_promotion() {
    let mut board = Board::default();
    board.add_piece(Square::E7, Piece::new(PieceType::Pawn, Color::White));
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    let moves = board.generate_legal_moves();
    let promotions: Vec<_> = moves.iter().filter(|m| m.from == Square::E7 && m.to == Square::E8).collect();
    
    // Should have 4 promotion moves (Queen, Rook, Bishop, Knight)
    assert_eq!(promotions.len(), 4);
    
    // Verify queen promotion
    let queen_promo = promotions.iter().find(|m| m.flag == MoveFlag::Promotion(PieceType::Queen)).unwrap();
    board.make_move(**queen_promo);
    assert_eq!(board.get_piece_at(Square::E8).unwrap().piece_type, PieceType::Queen);
}
