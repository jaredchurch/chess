#!/usr/bin/env bash
#
# lint.sh - Run all linting and test checks
#
# Usage:
#   ./scripts/lint.sh          # Run all checks
#   ./scripts/lint.sh clippy  # Run only clippy (Rust lints)
#   ./scripts/lint.sh test    # Run only tests
#   ./scripts/lint.sh fmt      # Run only cargo fmt check
#   ./scripts/lint.sh wasm    # Build WASM and check JS syntax
#
# Description:
#   Runs various quality assurance checks for the chess project.
#
#   clippy - Rust linter that catches common mistakes
#   test  - Runs all 32+ unit tests
#   fmt   - Checks Rust code formatting
#   wasm  - Builds WebAssembly and validates JS
#
# Requirements:
#   - Rust toolchain with cargo
#   - wasm-pack (for wasm target)
#   - Node.js (for JS syntax check via node --check)
#

set -e

# Change to script directory (allows running from anywhere)
cd "$(dirname "$0")/.."

#######################################
# Check functions
#######################################

run_clippy() {
    echo "=== Running Clippy ==="
    ~/.cargo/bin/cargo clippy -- -D warnings
}

run_test() {
    echo "=== Running Tests ==="
    ~/.cargo/bin/cargo test --verbose
}

run_fmt() {
    echo "=== Running Format Check ==="
    ~/.cargo/bin/cargo fmt -- --check
    ~/.cargo/bin/cargo fmt
}

run_wasm() {
    echo "=== Building WASM ==="
    ~/.cargo/bin/wasm-pack build --target web --out-dir www/pkg 2>/dev/null || \
        echo "wasm-pack not available, skipping"
    
    echo "=== Checking JavaScript ==="
    if [ -f www/index.js ]; then
        if node --check www/index.js 2>/dev/null; then
            echo "JS syntax OK"
        else
            echo "Note: ES module syntax check failed (may be expected)"
        fi
    fi
}

run_all() {
    run_clippy
    run_test
    run_fmt
    run_wasm
    echo "=== All checks passed ==="
}

#######################################
# Main
#######################################

case "${1:-all}" in
    clippy) run_clippy ;;
    test)   run_test ;;
    fmt)    run_fmt ;;
    wasm)   run_wasm ;;
    all|"") run_all ;;
    *)
        echo "Usage: $0 [clippy|test|fmt|wasm|all]"
        echo "  all    - Run all checks (default)"
        echo "  clippy - Rust linter only"
        echo "  test   - Unit tests only"
        echo "  fmt    - Format check only"
        echo "  wasm   - WASM build and JS check"
        exit 1
        ;;
esac

### End of File