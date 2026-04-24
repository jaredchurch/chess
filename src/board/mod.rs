// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.


pub mod bitboard;
pub mod move_struct;
pub mod piece;
pub mod types;

use crate::board::bitboard::Bitboard;
use crate::board::move_struct::{Move, MoveFlag};
use crate::board::piece::{Piece, PieceType};
use crate::board::types::{Color, Square};

/// Represents the state of a chess board.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Board {
    /// 12 bitboards, one for each color and piece type.
    /// Indexing: 0-5 White (P, N, B, R, Q, K), 6-11 Black (P, N, B, R, Q, K)
    pub pieces: [Bitboard; 12],
    /// Occupancy bitboards: White, Black, Both
    pub occupancy: [Bitboard; 3],
    pub side_to_move: Color,
    pub castling_rights: u8,
    pub en_passant_square: Option<Square>,
    pub half_move_clock: u32,
    pub full_move_number: u32,
}

impl Default for Board {
    fn default() -> Self {
        Self {
            pieces: [Bitboard::default(); 12],
            occupancy: [Bitboard::default(); 3],
            side_to_move: Color::White,
            castling_rights: 0xF, // All rights by default
            en_passant_square: None,
            half_move_clock: 0,
            full_move_number: 1,
        }
    }
}

impl Board {
    /// Adds a piece to the board at the given square.
    pub fn add_piece(&mut self, square: Square, piece: Piece) {
        let bit_index = square.as_u32();
        let piece_index = match piece.color {
            Color::White => piece.piece_type as usize,
            Color::Black => 6 + piece.piece_type as usize,
        };

        self.pieces[piece_index].set(bit_index);
        self.update_occupancy();
    }

    /// Removes a piece from the board at the given square.
    pub fn remove_piece(&mut self, square: Square) {
        let bit_index = square.as_u32();
        for i in 0..12 {
            self.pieces[i].clear(bit_index);
        }
        self.update_occupancy();
    }

    /// Gets the piece at the given square, if any.
    pub fn get_piece_at(&self, square: Square) -> Option<Piece> {
        let bit_index = square.as_u32();
        for i in 0..12 {
            if self.pieces[i].get(bit_index) {
                let color = if i < 6 { Color::White } else { Color::Black };
                let piece_type = match i % 6 {
                    0 => PieceType::Pawn,
                    1 => PieceType::Knight,
                    2 => PieceType::Bishop,
                    3 => PieceType::Rook,
                    4 => PieceType::Queen,
                    5 => PieceType::King,
                    _ => unreachable!(),
                };
                return Some(Piece::new(piece_type, color));
            }
        }
        None
    }

    /// Updates occupancy bitboards based on piece bitboards.
    pub fn update_occupancy(&mut self) {
        self.occupancy[0] = Bitboard(0);
        self.occupancy[1] = Bitboard(0);

        for i in 0..6 {
            self.occupancy[0].0 |= self.pieces[i].0;
            self.occupancy[1].0 |= self.pieces[i + 6].0;
        }

        self.occupancy[2].0 = self.occupancy[0].0 | self.occupancy[1].0;
    }

    /// Makes a move on the board.
    /// Note: This is a basic implementation for legality filtering.
    /// It now handles special rules (castling, en passant, promotion).
    pub fn make_move(&mut self, m: Move) {
        let piece = self.get_piece_at(m.from).expect("No piece at from square");
        
        // 1. Handle captures
        if m.flag == MoveFlag::EnPassantCapture {
            let capture_idx = if piece.color == Color::White { m.to.as_u32() - 8 } else { m.to.as_u32() + 8 };
            let capture_sq = Square::from_u8_unchecked(capture_idx as u8);
            self.remove_piece(capture_sq);
        } else if let Some(target_piece) = self.get_piece_at(m.to) {
            self.remove_piece(m.to);
            // Update castling rights if a rook is captured
            if target_piece.piece_type == PieceType::Rook {
                if m.to == Square::A1 { self.castling_rights &= !0x2; }
                if m.to == Square::H1 { self.castling_rights &= !0x1; }
                if m.to == Square::A8 { self.castling_rights &= !0x8; }
                if m.to == Square::H8 { self.castling_rights &= !0x4; }
            }
        }

        // 2. Remove moving piece
        self.remove_piece(m.from);
        
        // 3. Add piece at destination (handling promotion)
        if let MoveFlag::Promotion(pt) = m.flag {
            self.add_piece(m.to, Piece::new(pt, piece.color));
        } else {
            self.add_piece(m.to, piece);
        }

        // 4. Handle Castling (move the rook)
        match m.flag {
            MoveFlag::KingsideCastling => {
                if piece.color == Color::White {
                    self.remove_piece(Square::H1);
                    self.add_piece(Square::F1, Piece::new(PieceType::Rook, Color::White));
                } else {
                    self.remove_piece(Square::H8);
                    self.add_piece(Square::F8, Piece::new(PieceType::Rook, Color::Black));
                }
            }
            MoveFlag::QueensideCastling => {
                if piece.color == Color::White {
                    self.remove_piece(Square::A1);
                    self.add_piece(Square::D1, Piece::new(PieceType::Rook, Color::White));
                } else {
                    self.remove_piece(Square::A8);
                    self.add_piece(Square::D8, Piece::new(PieceType::Rook, Color::Black));
                }
            }
            _ => {}
        }

        // 5. Update castling rights if king or rook moves
        if piece.piece_type == PieceType::King {
            if piece.color == Color::White {
                self.castling_rights &= !0x3;
            } else {
                self.castling_rights &= !0xC;
            }
        } else if piece.piece_type == PieceType::Rook {
            if piece.color == Color::White {
                if m.from == Square::A1 { self.castling_rights &= !0x2; }
                if m.from == Square::H1 { self.castling_rights &= !0x1; }
            } else {
                if m.from == Square::A8 { self.castling_rights &= !0x8; }
                if m.from == Square::H8 { self.castling_rights &= !0x4; }
            }
        }

        // 6. Update EP square
        self.en_passant_square = None;
        if m.flag == MoveFlag::DoublePawnPush {
            let ep_idx = if piece.color == Color::White { m.from.as_u32() + 8 } else { m.from.as_u32() - 8 };
            self.en_passant_square = Some(Square::from_u8_unchecked(ep_idx as u8));
        }

        // 7. Update side to move and clocks
        self.side_to_move = self.side_to_move.opposite();
        // (Half-move clock and full-move number updates could be added here)
    }

    /// Generates all strictly legal moves for the current side to move.
    pub fn generate_legal_moves(&self) -> Vec<Move> {
        let pseudo_moves = crate::move_gen::generate_pseudo_legal_moves(self);
        let mut legal_moves = Vec::with_capacity(pseudo_moves.len());
        
        for m in pseudo_moves {
            let mut board_copy = self.clone();
            board_copy.make_move(m);
            if !crate::move_gen::is_in_check(&board_copy, self.side_to_move) {
                legal_moves.push(m);
            }
        }
        
        legal_moves
    }
}

