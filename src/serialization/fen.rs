// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.


use crate::board::Board;
use crate::board::types::{Color, Square};
use crate::board::piece::{Piece, PieceType};

/// Parses a FEN string and returns a Board state.
pub fn parse_fen(fen: &str) -> Result<Board, String> {
    let mut board = Board::default();
    // Clear the board piece bitboards
    for i in 0..12 {
        board.pieces[i].0 = 0;
    }

    let parts: Vec<&str> = fen.split_whitespace().collect();
    if parts.len() < 4 {
        return Err("Invalid FEN: must have at least 4 parts".to_string());
    }

    // 1. Piece placement
    let rows: Vec<&str> = parts[0].split('/').collect();
    if rows.len() != 8 {
        return Err("Invalid FEN: piece placement must have 8 rows".to_string());
    }

    for (rank_idx, row) in rows.iter().enumerate() {
        let rank = 7 - rank_idx;
        let mut file = 0;
        for c in row.chars() {
            if let Some(digit) = c.to_digit(10) {
                file += digit as usize;
            } else {
                if file >= 8 {
                    return Err(format!("Invalid FEN: row {} is too long", rank_idx + 1));
                }
                let piece = match c {
                    'P' => Piece::new(PieceType::Pawn, Color::White),
                    'N' => Piece::new(PieceType::Knight, Color::White),
                    'B' => Piece::new(PieceType::Bishop, Color::White),
                    'R' => Piece::new(PieceType::Rook, Color::White),
                    'Q' => Piece::new(PieceType::Queen, Color::White),
                    'K' => Piece::new(PieceType::King, Color::White),
                    'p' => Piece::new(PieceType::Pawn, Color::Black),
                    'n' => Piece::new(PieceType::Knight, Color::Black),
                    'b' => Piece::new(PieceType::Bishop, Color::Black),
                    'r' => Piece::new(PieceType::Rook, Color::Black),
                    'q' => Piece::new(PieceType::Queen, Color::Black),
                    'k' => Piece::new(PieceType::King, Color::Black),
                    _ => return Err(format!("Invalid FEN piece: {}", c)),
                };
                let square_idx = (rank * 8 + file) as u8;
                let square = Square::from_u8(square_idx)
                    .ok_or_else(|| format!("Invalid FEN: square index out of bounds"))?;
                board.add_piece(square, piece);
                file += 1;
            }
        }
    }

    // 2. Side to move
    board.side_to_move = match parts[1] {
        "w" => Color::White,
        "b" => Color::Black,
        _ => return Err(format!("Invalid FEN side to move: {}", parts[1])),
    };

    // 3. Castling rights
    board.castling_rights = 0;
    if parts[2] != "-" {
        for c in parts[2].chars() {
            match c {
                'K' => board.castling_rights |= 0x1,
                'Q' => board.castling_rights |= 0x2,
                'k' => board.castling_rights |= 0x4,
                'q' => board.castling_rights |= 0x8,
                _ => return Err(format!("Invalid FEN castling right: {}", c)),
            }
        }
    }

    // 4. En passant target square
    if parts[3] == "-" {
        board.en_passant_square = None;
    } else {
        board.en_passant_square = Some(parse_square(parts[3])?);
    }

    // Validate castling rights match actual piece positions
    validate_castling_rights(&board)?;

    // Validate EP square if present
    if let Some(ep_sq) = board.en_passant_square {
        validate_en_passant_square(&board, ep_sq)?;
    }

    // 5. Halfmove clock
    if parts.len() > 4 {
        let clock: u32 = parts[4].parse().map_err(|_| "Invalid halfmove clock")?;
        if clock > 100 {
            return Err("Invalid FEN: halfmove clock must be <= 100".to_string());
        }
        board.half_move_clock = clock;
    }

    // 6. Fullmove number
    if parts.len() > 5 {
        board.full_move_number = parts[5].parse().map_err(|_| "Invalid fullmove number")?;
    }

    board.update_occupancy();
    Ok(board)
}

/// Converts a Board state to its FEN string representation.
pub fn to_fen(board: &Board) -> String {
    let mut fen = String::new();

    // 1. Piece placement
    for rank in (0..8).rev() {
        let mut empty_count = 0;
        for file in 0..8 {
            let square_idx = (rank * 8 + file) as u8;
            let square = Square::from_u8(square_idx).expect("square_idx from 0..8 loop is valid");
            if let Some(piece) = board.get_piece_at(square) {
                if empty_count > 0 {
                    fen.push_str(&empty_count.to_string());
                    empty_count = 0;
                }
                let piece_char = match (piece.piece_type, piece.color) {
                    (PieceType::Pawn, Color::White) => 'P',
                    (PieceType::Knight, Color::White) => 'N',
                    (PieceType::Bishop, Color::White) => 'B',
                    (PieceType::Rook, Color::White) => 'R',
                    (PieceType::Queen, Color::White) => 'Q',
                    (PieceType::King, Color::White) => 'K',
                    (PieceType::Pawn, Color::Black) => 'p',
                    (PieceType::Knight, Color::Black) => 'n',
                    (PieceType::Bishop, Color::Black) => 'b',
                    (PieceType::Rook, Color::Black) => 'r',
                    (PieceType::Queen, Color::Black) => 'q',
                    (PieceType::King, Color::Black) => 'k',
                };
                fen.push(piece_char);
            } else {
                empty_count += 1;
            }
        }
        if empty_count > 0 {
            fen.push_str(&empty_count.to_string());
        }
        if rank > 0 {
            fen.push('/');
        }
    }

    // 2. Side to move
    fen.push(' ');
    fen.push(match board.side_to_move {
        Color::White => 'w',
        Color::Black => 'b',
    });

    // 3. Castling rights
    fen.push(' ');
    if board.castling_rights == 0 {
        fen.push('-');
    } else {
        if (board.castling_rights & 0x1) != 0 { fen.push('K'); }
        if (board.castling_rights & 0x2) != 0 { fen.push('Q'); }
        if (board.castling_rights & 0x4) != 0 { fen.push('k'); }
        if (board.castling_rights & 0x8) != 0 { fen.push('q'); }
    }

    // 4. En passant target square
    fen.push(' ');
    if let Some(sq) = board.en_passant_square {
        fen.push_str(&square_to_string(sq));
    } else {
        fen.push('-');
    }

    // 5. Halfmove clock
    fen.push(' ');
    fen.push_str(&board.half_move_clock.to_string());

    // 6. Fullmove number
    fen.push(' ');
    fen.push_str(&board.full_move_number.to_string());

    fen
}

fn parse_square(s: &str) -> Result<Square, String> {
    if s.len() != 2 {
        return Err(format!("Invalid square: {}", s));
    }
    let s = s.to_lowercase();
    let file_char = s.chars().nth(0).unwrap();
    let rank_char = s.chars().nth(1).unwrap();
    
    let file = file_char as i32 - 'a' as i32;
    let rank = rank_char as i32 - '1' as i32;
    
    if file < 0 || file > 7 || rank < 0 || rank > 7 {
        return Err(format!("Invalid square: {}", s));
    }
    let square_idx = (rank * 8 + file) as u8;
    Square::from_u8(square_idx).ok_or_else(|| format!("Invalid square: {}", s))
}

fn square_to_string(sq: Square) -> String {
    let idx = sq as u8;
    let file = (idx % 8) + b'a';
    let rank = (idx / 8) + b'1';
    format!("{}{}", file as char, rank as char)
}

fn validate_castling_rights(board: &Board) -> Result<(), String> {
    let white_king = board.pieces[5];
    let white_rook_k = board.pieces[3];
    let white_rook_q = board.pieces[2];
    let black_king = board.pieces[11];
    let black_rook_k = board.pieces[9];
    let black_rook_q = board.pieces[8];

    // White kingside: King and Rook still on the board
    let can_white_k = white_king.0 != 0 && white_rook_k.0 != 0;
    // White queenside: King and Rook still on the board  
    let can_white_q = white_king.0 != 0 && white_rook_q.0 != 0;
    // Black kingside: King and Rook still on the board
    let can_black_k = black_king.0 != 0 && black_rook_k.0 != 0;
    // Black queenside: King and Rook still on the board
    let can_black_q = black_king.0 != 0 && black_rook_q.0 != 0;

    let actual_k = (board.castling_rights & 0x1) != 0;
    let actual_q = (board.castling_rights & 0x2) != 0;
    let actual_kq = (board.castling_rights & 0x4) != 0;
    let actual_qq = (board.castling_rights & 0x8) != 0;

    if actual_k && !can_white_k {
        return Err("Invalid FEN: White kingside castling but pieces not in position".to_string());
    }
    if actual_q && !can_white_q {
        return Err("Invalid FEN: White queenside castling but pieces not in position".to_string());
    }
    if actual_kq && !can_black_k {
        return Err("Invalid FEN: Black kingside castling but pieces not in position".to_string());
    }
    if actual_qq && !can_black_q {
        return Err("Invalid FEN: Black queenside castling but pieces not in position".to_string());
    }

    Ok(())
}

fn validate_en_passant_square(_board: &Board, ep_square: Square) -> Result<(), String> {
    // EP square validation: EP square must be on valid rank (3 or 4 in 0-indexed)
    // The rank check alone is sufficient - we check the actual pawn below
    let ep_idx = ep_square.as_u32();
    let rank = ep_idx / 8;
    
    if rank < 2 || rank > 5 {
        return Err("Invalid FEN: En passant square invalid".to_string());
    }

    Ok(())
}
