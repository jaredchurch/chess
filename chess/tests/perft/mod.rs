use chess_core::Board;
use chess_core::serialization::fen::parse_fen;

pub fn perft(board: &Board, depth: u32) -> u64 {
    if depth == 0 {
        return 1;
    }

    let mut nodes = 0;
    let moves = board.generate_legal_moves();

    for m in moves {
        let mut board_copy = board.clone();
        board_copy.make_move(m);
        nodes += perft(&board_copy, depth - 1);
    }

    nodes
}

#[test]
fn test_perft_start_pos_depth_1() {
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(perft(&board, 1), 20);
}

#[test]
fn test_perft_start_pos_depth_2() {
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(perft(&board, 2), 400);
}

#[test]
fn test_perft_kiwipete_depth_1() {
    let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(perft(&board, 1), 48);
}

#[test]
fn test_perft_kiwipete_depth_2() {
    let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    let board = parse_fen(fen).unwrap();
    assert_eq!(perft(&board, 2), 2039);
}
