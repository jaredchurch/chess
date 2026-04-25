#!/usr/bin/env bash

~/.cargo/bin/cargo clippy -- -D warnings
~/.cargo/bin/cargo test --verbose
~/.cargo/bin/cargo fmt -- --check