// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

pub mod bitboard;
pub mod move_struct;
pub mod piece;
pub mod types;
pub mod zobrist;

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
    /// Zobrist hash for transposition table lookups.
    pub zobrist_hash: u64,
}

impl Default for Board {
    fn default() -> Self {
        let mut board = Self {
            pieces: [Bitboard::default(); 12],
            occupancy: [Bitboard::default(); 3],
            side_to_move: Color::White,
            castling_rights: 0xF, // All rights by default
            en_passant_square: None,
            half_move_clock: 0,
            full_move_number: 1,
            zobrist_hash: 0,
        };
        board.zobrist_hash = crate::board::zobrist::compute_zobrist_hash(&board);
        board
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
        if !self.occupancy[2].get(bit_index) {
            return;
        }
        for i in 0..12 {
            self.pieces[i].clear(bit_index);
        }
        self.update_occupancy();
    }

    /// Gets the piece at the given square, if any.
    pub fn get_piece_at(&self, square: Square) -> Option<Piece> {
        let bit_index = square.as_u32();
        if !self.occupancy[2].get(bit_index) {
            return None;
        }
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
            let capture_idx = if piece.color == Color::White {
                m.to.as_u32() - 8
            } else {
                m.to.as_u32() + 8
            };
            let capture_sq = Square::from_u8_unchecked(capture_idx as u8);
            self.remove_piece(capture_sq);
        } else if let Some(target_piece) = self.get_piece_at(m.to) {
            self.remove_piece(m.to);
            // Update castling rights if a rook is captured
            if target_piece.piece_type == PieceType::Rook {
                if m.to == Square::A1 {
                    self.castling_rights &= !0x2;
                }
                if m.to == Square::H1 {
                    self.castling_rights &= !0x1;
                }
                if m.to == Square::A8 {
                    self.castling_rights &= !0x8;
                }
                if m.to == Square::H8 {
                    self.castling_rights &= !0x4;
                }
            }
        }

        // 2. Remove moving piece
        self.remove_piece(m.from);

        // 3. Add piece at destination (handling promotion)
        if let MoveFlag::Promotion(pt) = m.flag {
            if piece.piece_type == PieceType::Pawn {
                self.add_piece(m.to, Piece::new(pt, piece.color));
            } else {
                // Should not happen with legal moves, but for safety:
                self.add_piece(m.to, piece);
            }
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
                if m.from == Square::A1 {
                    self.castling_rights &= !0x2;
                }
                if m.from == Square::H1 {
                    self.castling_rights &= !0x1;
                }
            } else {
                if m.from == Square::A8 {
                    self.castling_rights &= !0x8;
                }
                if m.from == Square::H8 {
                    self.castling_rights &= !0x4;
                }
            }
        }

        // 6. Update EP square - only set if opposing pawn can capture
        self.en_passant_square = None;
        if m.flag == MoveFlag::DoublePawnPush {
            // Calculate the en passant square (the square the pawn skipped over)
            let ep_idx = if piece.color == Color::White {
                m.from.as_u32() + 8  // White moved up, EP is one square forward
            } else {
                m.from.as_u32() - 8  // Black moved down, EP is one square back
            };
            let ep_sq = Square::from_u8_unchecked(ep_idx as u8);
            
            // Check if there's an opposing pawn on an adjacent file that can capture.
            // The capturing pawn sits on the DESTINATION rank of the double push,
            // which is one rank above (white) or below (black) the EP square.
            // Checking ep_idx ± 1 would be wrong — that's the EP square's own rank.
            let ep_file = (ep_idx % 8) as i8;
            let capture_rank_offset: i32 = if piece.color == Color::White { 8 } else { -8 };
            let mut can_capture = false;
            
            // Check left file (if not on file a)
            if ep_file > 0 {
                let check_idx = (ep_idx as i32 + capture_rank_offset - 1) as u32;
                let check_sq = Square::from_u8_unchecked(check_idx as u8);
                if let Some(piece_at) = self.get_piece_at(check_sq) {
                    if piece_at.piece_type == PieceType::Pawn && piece_at.color != piece.color {
                        can_capture = true;
                    }
                }
            }
            
            // Check right file (if not on file h)
            if ep_file < 7 {
                let check_idx = (ep_idx as i32 + capture_rank_offset + 1) as u32;
                let check_sq = Square::from_u8_unchecked(check_idx as u8);
                if let Some(piece_at) = self.get_piece_at(check_sq) {
                    if piece_at.piece_type == PieceType::Pawn && piece_at.color != piece.color {
                        can_capture = true;
                    }
                }
            }
            
            // Only set EP square if there's a pawn that can capture
            if can_capture {
                self.en_passant_square = Some(ep_sq);
            }
        }

        // 7. Update side to move and clocks
        self.side_to_move = self.side_to_move.opposite();
        // (Half-move clock and full-move number updates could be added here)

        // 8. Update Zobrist hash
        self.update_zobrist_hash(&m, &piece);
    }

    /// Updates the Zobrist hash incrementally after a move.
    fn update_zobrist_hash(&mut self, m: &Move, piece: &Piece) {
        let tables = crate::board::zobrist::zobrist_tables();

        // Remove piece from source square
        let piece_idx = self.get_piece_index(piece);
        self.zobrist_hash ^= tables.piece_keys[piece_idx][m.from as usize];

        // Add piece at destination (handle promotion)
        let dest_piece = if let MoveFlag::Promotion(pt) = m.flag {
            Piece::new(pt, piece.color)
        } else {
            *piece
        };
        let dest_piece_idx = self.get_piece_index(&dest_piece);
        self.zobrist_hash ^= tables.piece_keys[dest_piece_idx][m.to as usize];

        // Handle captures (remove captured piece)
        if m.flag == MoveFlag::EnPassantCapture {
            let capture_sq = if piece.color == Color::White {
                m.to as u32 - 8
            } else {
                m.to as u32 + 8
            };
            let captured_piece_idx = if piece.color == Color::White { 6 } else { 0 };
            self.zobrist_hash ^= tables.piece_keys[captured_piece_idx][capture_sq as usize];
        } else if let Some(captured) = self.get_piece_at(m.to) {
            if captured.piece_type != dest_piece.piece_type || captured.color != dest_piece.color {
                let captured_idx = self.get_piece_index(&captured);
                self.zobrist_hash ^= tables.piece_keys[captured_idx][m.to as usize];
            }
        }

        // Side to move
        self.zobrist_hash ^= tables.side_to_move_key;

        // Castling rights (simplified - would need full update)
        // This is a simplified version; full implementation would track changes
    }

    /// Gets the piece index for the piece array.
    fn get_piece_index(&self, piece: &Piece) -> usize {
        let color_offset = if piece.color == Color::White { 0 } else { 6 };
        let type_idx = match piece.piece_type {
            PieceType::Pawn => 0,
            PieceType::Knight => 1,
            PieceType::Bishop => 2,
            PieceType::Rook => 3,
            PieceType::Queen => 4,
            PieceType::King => 5,
        };
        color_offset + type_idx
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

    /// Generates all strictly legal capture moves for the current side to move.
    pub fn generate_legal_captures(&self) -> Vec<Move> {
        let pseudo_captures = crate::move_gen::generate_pseudo_legal_captures(self);
        let mut legal_captures = Vec::with_capacity(pseudo_captures.len());

        for m in pseudo_captures {
            let mut board_copy = self.clone();
            board_copy.make_move(m);
            if !crate::move_gen::is_in_check(&board_copy, self.side_to_move) {
                legal_captures.push(m);
            }
        }

        legal_captures
    }
}
