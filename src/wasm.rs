// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use crate::ai::get_best_move;
use crate::board::move_struct::MoveFlag;
use crate::board::piece::PieceType;
use crate::board::types::Square;
use crate::serialization::fen::{parse_fen, to_fen};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct WasmMove {
    pub from: String,
    pub to: String,
    pub promotion: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct WasmBoard {
    pub fen: String,
    pub side_to_move: String,
    pub is_check: bool,
    pub is_checkmate: bool,
    pub is_draw: bool,
}

#[wasm_bindgen]
pub fn get_legal_moves(fen: &str) -> JsValue {
    let board = match parse_fen(fen) {
        Ok(b) => b,
        Err(_) => return JsValue::NULL,
    };

    let moves = board.generate_legal_moves();
    let wasm_moves: Vec<WasmMove> = moves
        .iter()
        .map(|m| WasmMove {
            from: square_to_string(m.from),
            to: square_to_string(m.to),
            promotion: match m.flag {
                MoveFlag::Promotion(PieceType::Queen) => Some("q".to_string()),
                MoveFlag::Promotion(PieceType::Rook) => Some("r".to_string()),
                MoveFlag::Promotion(PieceType::Bishop) => Some("b".to_string()),
                MoveFlag::Promotion(PieceType::Knight) => Some("n".to_string()),
                _ => None,
            },
        })
        .collect();

    serde_wasm_bindgen::to_value(&wasm_moves).unwrap()
}

#[wasm_bindgen]
pub fn apply_move(fen: &str, move_obj: JsValue) -> JsValue {
    let mut board = match parse_fen(fen) {
        Ok(b) => b,
        Err(_) => return JsValue::NULL,
    };

    let m_wasm: WasmMove = match serde_wasm_bindgen::from_value(move_obj) {
        Ok(m) => m,
        Err(_) => return JsValue::NULL,
    };

    let legal_moves = board.generate_legal_moves();
    let found_move = legal_moves.iter().find(|m| {
        square_to_string(m.from) == m_wasm.from
            && square_to_string(m.to) == m_wasm.to
            && match (m.flag, &m_wasm.promotion) {
                (MoveFlag::Promotion(PieceType::Queen), Some(p)) if p == "q" => true,
                (MoveFlag::Promotion(PieceType::Rook), Some(p)) if p == "r" => true,
                (MoveFlag::Promotion(PieceType::Bishop), Some(p)) if p == "b" => true,
                (MoveFlag::Promotion(PieceType::Knight), Some(p)) if p == "n" => true,
                (MoveFlag::Promotion(_), _) => false,
                (_, None) => true,
                _ => false,
            }
    });

    if let Some(m) = found_move {
        board.make_move(*m);
        let new_fen = to_fen(&board);
        JsValue::from_str(&new_fen)
    } else {
        JsValue::NULL
    }
}

#[wasm_bindgen]
pub fn get_best_move_wasm(fen: &str, level: u8) -> JsValue {
    let board = match parse_fen(fen) {
        Ok(b) => b,
        Err(_) => return JsValue::NULL,
    };

    if let Some(m) = get_best_move(&board, level) {
        let wasm_move = WasmMove {
            from: square_to_string(m.from),
            to: square_to_string(m.to),
            promotion: match m.flag {
                MoveFlag::Promotion(PieceType::Queen) => Some("q".to_string()),
                MoveFlag::Promotion(PieceType::Rook) => Some("r".to_string()),
                MoveFlag::Promotion(PieceType::Bishop) => Some("b".to_string()),
                MoveFlag::Promotion(PieceType::Knight) => Some("n".to_string()),
                _ => None,
            },
        };
        serde_wasm_bindgen::to_value(&wasm_move).unwrap()
    } else {
        JsValue::NULL
    }
}

#[wasm_bindgen]
pub fn get_game_state(fen: &str) -> JsValue {
    let board = match parse_fen(fen) {
        Ok(b) => b,
        Err(_) => return JsValue::NULL,
    };

    let state = crate::move_gen::termination::detect_termination(&board);
    let wasm_state = WasmBoard {
        fen: fen.to_string(),
        side_to_move: match board.side_to_move {
            crate::board::types::Color::White => "w".to_string(),
            crate::board::types::Color::Black => "b".to_string(),
        },
        is_check: crate::move_gen::is_in_check(&board, board.side_to_move),
        is_checkmate: state == crate::move_gen::termination::GameState::Checkmate,
        is_draw: state == crate::move_gen::termination::GameState::Stalemate
            || state == crate::move_gen::termination::GameState::InsufficientMaterial,
    };

    serde_wasm_bindgen::to_value(&wasm_state).unwrap()
}

fn square_to_string(sq: Square) -> String {
    let idx = sq as u8;
    let file = (idx % 8) + b'a';
    let rank = (idx / 8) + b'1';
    format!("{}{}", file as char, rank as char)
}

#[wasm_bindgen]
pub fn get_build_timestamp() -> String {
    crate::BUILD_TIMESTAMP.to_string()
}

#[wasm_bindgen]
pub fn get_build_profile() -> String {
    crate::BUILD_PROFILE.to_string()
}
