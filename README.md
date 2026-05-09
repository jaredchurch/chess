# High-Performance Chess Engine

A robust, library-first chess move generation and logic engine built with Rust. Designed for performance, strict FIDE compliance, and ease of integration.

## Key Features

- **Strict FIDE Compliance**: 100% adherence to official laws of chess, including special moves (castling, en passant, promotion).
- **High Performance**: Optimized using bitboard representations for ultra-fast move generation.
- **Standalone Library**: Zero-dependency core logic, making it easy to integrate into GUIs, web services, or analysis tools.
- **Standardized I/O**: Full support for FEN (Forsyth–Edwards Notation). PGN support is planned.
- **Test-Driven Design**: Verified via comprehensive perft suites and unit testing.

## Documentation

- [Project Constitution](.specify/memory/constitution.md): Our architectural and governance principles.
- [Development Guide](GEMINI.md): Instructions for developers working on this repository.

## Installation

```bash
cargo add chess_core
```

## Quick Start

```rust
use chess_core::{Board, Move};

let mut board = Board::default();
let legal_moves = board.generate_legal_moves();
println!("Found {} legal moves", legal_moves.len());
```

## Development

### Running Tests
To run the full test suite, including unit tests and integration tests:
```bash
cargo test
```

### Running Perft Tests
To run the perft (performance test) suite:
```bash
cargo test perft
```

### Running Benchmarks
The project includes Criterion benchmarks for move generation and engine performance:
```bash
cargo bench
```

This will run benchmarks for:
- **Move generation** - Start position and Kiwipete position
- **Engine levels** - Levels 1-10
- **Engine depth** - Different positions at fixed depth

Benchmark results are saved to `target/criterion/` and can be compared across runs:
```bash
cargo bench --allow-dirty  # Run without requiring clean working tree
```

### Search Profiling

The engine includes an optional phase-level profiler to identify performance bottlenecks
in the search algorithm. It measures time spent in each major phase (move generation,
evaluation, sorting, transposition table ops, quiescence, etc.) using atomic counters.

Enable with the `profiling` feature:

```bash
# Profile a depth-4 search from the starting position
cargo run --release --features profiling --example profile_search -- 4

# Custom depth and FEN
cargo run --release --features profiling --example profile_search -- 5 startpos
cargo run --release --features profiling --example profile_search -- 3 "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
```

The profile report shows call counts, wall time, percentage of total, and average
nanoseconds per call for each phase:

```
======= SEARCH PROFILE =======
Phase            Calls     Time(ms)     %Total    ns/call
------------------------------------------------------------
MoveGen            853       2.77ms     16.9%       3245
Eval               832       0.57ms      3.5%        682
Sort               851       1.43ms      8.7%       1682
TTLookup          5392       2.24ms     13.6%        415
TTStore            851       2.98ms     18.2%       3506
IsInCheck         5242       0.00ms      0.0%          0
CloneBoard        5773       0.00ms      0.0%          0
MakeMove          5753       0.00ms      0.0%          0
NullMove            20       0.00ms      0.0%          0
Quiescence        4390       4.18ms     25.4%        951
Total                0       0.00ms      0.0%          0
Other/Overhd         -       2.25ms     13.7%          -
------------------------------------------------------------
Total: 5392 nodes | 328 nodes/ms | 328412 nodes/s | 0.02s wall
```

**Note**: The profiling feature adds measurement overhead (atomic ops + `Instant::now()`
calls). Times are relative, not absolute. Use `--release` for realistic ratios.

### Running WASM Prototype
The project includes a WebAssembly bridge and a basic web prototype in the `www/` directory.

To build the WASM module, you need `wasm-pack` installed:
```bash
wasm-pack build --target web --out-dir www/pkg
```

Then, you can serve the `www/` directory using any local web server:
```bash
cd www
npx serve .
```

The prototype includes several features:
- **Main chess interface** at `index.html`
- **3D Model Viewer** at `pages/3d-model-viewer.html` - A dedicated page for examining and adjusting 3D chess piece models, useful for skin development
- URL parameter support for enabling board outline (`?board_outline`)

## License

This project is licensed under the [MIT License](LICENSE).
