#!/usr/bin/env bash


cd /workspaces/speckit-experiment/chess
wasm-pack build --target web --out-dir www/pkg

cd www
npx serve .