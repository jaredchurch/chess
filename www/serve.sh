#!/usr/bin/env bash


cd "${CODESPACE_VSCODE_FOLDER:-/workspaces/${DEVPOD_WORKSPACE_ID}}"
wasm-pack build --target web --out-dir www/pkg

cd www
npx serve .

### End of File
