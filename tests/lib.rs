pub mod pieces {
    pub mod castling_test;
    pub mod king_test;
    pub mod knight_test;
    pub mod pawn_special_test;
    pub mod pawn_test;
    pub mod sliding_test;
}

pub mod move_gen {
    pub mod check_test;
    pub mod legality_test;
    pub mod termination_test;
}

pub mod serialization {
    pub mod fen_test;
}

pub mod ai {
    pub mod greedy_test;
}

pub mod perft;
