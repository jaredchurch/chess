// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GameResult {
    WinWhite,
    WinBlack,
    Draw,
    InProgress,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConclusionMethod {
    Checkmate,
    Resignation,
    Stalemate,
    Timeout,
    Agreement,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MoveRecord {
    pub coords: String,
    #[serde(rename = "durationMs")]
    pub duration_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GameRecord {
    #[serde(rename = "gameId")]
    pub game_id: String,
    #[serde(rename = "profileId")]
    pub profile_id: String,
    pub timestamp: u64,
    #[serde(rename = "lastModified")]
    pub last_modified: u64,
    pub moves: Vec<MoveRecord>,
    pub result: GameResult,
    pub method: Option<ConclusionMethod>,
    pub initial_fen: String,
}

impl GameRecord {
    pub fn new(profile_id: &str, game_id: &str, initial_fen: &str) -> Self {
        let now = current_timestamp_ms();
        GameRecord {
            game_id: game_id.to_string(),
            profile_id: profile_id.to_string(),
            timestamp: now,
            last_modified: now,
            moves: Vec::new(),
            result: GameResult::InProgress,
            method: None,
            initial_fen: initial_fen.to_string(),
        }
    }

    pub fn add_move(&mut self, from: &str, to: &str, duration_ms: u64) {
        let coords = format!("{}{}", from, to);
        self.moves.push(MoveRecord {
            coords,
            duration_ms,
        });
        self.last_modified = current_timestamp_ms();
    }

    pub fn finish(&mut self, result: GameResult, method: ConclusionMethod) {
        self.result = result;
        self.method = Some(method);
        self.last_modified = current_timestamp_ms();
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub created_at: u64,
}

impl Profile {
    pub fn new(name: &str, id: &str) -> Self {
        Profile {
            id: id.to_string(),
            name: name.to_string(),
            created_at: current_timestamp_ms(),
        }
    }
}

fn current_timestamp_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
