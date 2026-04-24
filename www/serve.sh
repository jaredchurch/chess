#!/usr/bin/env bash


cd "${CODESPACE_VSCODE_FOLDER}"
wasm-pack build --target web --out-dir www/pkg

cd www
npx serve .

### End of File
