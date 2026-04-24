use chess_core::Board;
use chess_core::board::types::{Color, Square};
use chess_core::board::piece::{Piece, PieceType};
use chess_core::move_gen::is_in_check;

#[test]
fn test_not_in_check() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.side_to_move = Color::White;
    
    assert!(!is_in_check(&board, Color::White));
}

#[test]
fn test_in_check_by_rook() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::E8, Piece::new(PieceType::Rook, Color::Black));
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    assert!(is_in_check(&board, Color::White));
}

#[test]
fn test_in_check_by_knight() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::D3, Piece::new(PieceType::Knight, Color::Black));
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    assert!(is_in_check(&board, Color::White));
}

#[test]
fn test_in_check_by_pawn() {
    let mut board = Board::default();
    board.add_piece(Square::E4, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::D5, Piece::new(PieceType::Pawn, Color::Black));
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    assert!(is_in_check(&board, Color::White));
}

#[test]
fn test_in_check_by_bishop() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::B4, Piece::new(PieceType::Bishop, Color::Black));
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    assert!(is_in_check(&board, Color::White));
}

#[test]
fn test_double_check() {
    let mut board = Board::default();
    board.add_piece(Square::E1, Piece::new(PieceType::King, Color::White));
    board.add_piece(Square::E8, Piece::new(PieceType::Rook, Color::Black));
    board.add_piece(Square::B4, Piece::new(PieceType::Bishop, Color::Black));
    board.side_to_move = Color::White;
    board.update_occupancy();
    
    assert!(is_in_check(&board, Color::White));
}
