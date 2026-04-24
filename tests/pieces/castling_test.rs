use chess_core::Board;
use chess_core::board::types::{Color, Square};
use chess_core::board::piece::{Piece, PieceType};
use chess_core::board::move_struct::MoveFlag;

#[test]
fn test_white_kingside_castling() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::H1, Piece::new(PieceType::Rook, Color::White));
    board.castling_rights = 0x1; // White Kingside
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    let moves = board.generate_legal_moves();
    let castling_move = moves.iter().find(|m| m.flag == MoveFlag::KingsideCastling);
    assert!(castling_move.is_some(), "White kingside castling should be available");
}

#[test]
fn test_castling_blocked_by_piece() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::H1, Piece::new(PieceType::Rook, Color::White));
    board.add_piece(Square::F1, Piece::new(PieceType::Bishop, Color::White)); // Blocks castling
    board.castling_rights = 0x1;
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    let moves = board.generate_legal_moves();
    let castling_move = moves.iter().find(|m| m.flag == MoveFlag::KingsideCastling);
    assert!(castling_move.is_none(), "Castling should be blocked by piece at F1");
}

#[test]
fn test_castling_blocked_by_attack() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::H1, Piece::new(PieceType::Rook, Color::White));
    board.add_piece(Square::F8, Piece::new(PieceType::Rook, Color::Black)); // Attacks F1
    board.castling_rights = 0x1;
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    let moves = board.generate_legal_moves();
    let castling_move = moves.iter().find(|m| m.flag == MoveFlag::KingsideCastling);
    assert!(castling_move.is_none(), "Castling should be blocked by attack on F1");
}
