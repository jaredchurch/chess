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

## License

This project is licensed under the [MIT License](LICENSE).
