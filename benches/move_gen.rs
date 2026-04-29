use chess_core::serialization::fen::parse_fen;
use criterion::{criterion_group, criterion_main, Criterion};

fn bench_move_generation(c: &mut Criterion) {
    let start_pos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let board = parse_fen(start_pos).unwrap();

    c.bench_function("generate_legal_moves_start_pos", |b| {
        b.iter(|| board.generate_legal_moves())
    });

    let kiwipete = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    let board = parse_fen(kiwipete).unwrap();

    c.bench_function("generate_legal_moves_kiwipete", |b| {
        b.iter(|| board.generate_legal_moves())
    });
}

criterion_group!(benches, bench_move_generation);
criterion_main!(benches);
