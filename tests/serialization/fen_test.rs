use chess_core::serialization::fen::{parse_fen, to_fen};

#[test]
fn test_starting_position_fen() {
    let start_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(start_fen).unwrap();
    let exported_fen = to_fen(&board);
    assert_eq!(exported_fen, start_fen);
}

#[test]
fn test_kiwipete_fen() {
    let kiwipete = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    let board = parse_fen(kiwipete).unwrap();
    let exported_fen = to_fen(&board);
    assert_eq!(exported_fen, kiwipete);
}

#[test]
fn test_fen_with_en_passant() {
    let fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    let board = parse_fen(fen).unwrap();
    let exported_fen = to_fen(&board);
    assert_eq!(exported_fen, fen);
}

#[test]
fn test_fen_with_no_castling() {
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1";
    let board = parse_fen(fen).unwrap();
    let exported_fen = to_fen(&board);
    assert_eq!(exported_fen, fen);
}
