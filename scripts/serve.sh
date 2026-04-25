#!/usr/bin/env bash
#
# serve.sh - Build WASM and serve the chess web app
#
# Usage:
#   ./scripts/serve.sh          # Default: use Codespace/DevPod environment
#   ./scripts/serve.sh /path   # Serve from custom directory
#
# This script:
#   1. Builds the Rust WASM package
#   2. Starts a local HTTP server in the www directory
#
# Requirements:
#   - wasm-pack installed
#   - npx (Node.js) for serve
#
# Environment Variables:
#   CODESPACE_VSCODE_FOLDER - Codespace project root
#   DEVPOD_WORKSPACE_ID    - DevPod workspace ID
#

set -e

# Determine project root
if [ -n "$1" ]; then
    PROJECT_ROOT="$1"
else
    PROJECT_ROOT="${CODESPACE_VSCODE_FOLDER:-/workspaces/${DEVPOD_WORKSPACE_ID}}"
fi

cd "$PROJECT_ROOT"

echo "Building WASM package..."
wasm-pack build --target web --out-dir www/pkg

echo "Starting server on http://localhost:3000"
cd www
npx serve . -l 3000

### End of File