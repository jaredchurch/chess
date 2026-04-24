# Bug Report: WASM Module 404 in Browser

**Status**: Reproduced / Identified
**Component**: WASM Bridge / Web UI
**Priority**: P1 (Blocks playability)

## Description
The browser fails to load the WASM module, resulting in a 404 error for `/pkg/chess_core.js`.

## Logs
```
index.js:2  GET http://localhost:3001/pkg/chess_core.js net::ERR_ABORTED 404 (Not Found)
favicon.ico:1  GET http://localhost:3001/favicon.ico 404 (Not Found)
```

## Root Cause
The `index.js` file attempts to import from `../pkg/chess_core.js`. When the `www/` directory is served as the web root (e.g., via `npx serve www`), the web server correctly restricts access to files outside that root for security. Therefore, `../pkg/` is unreachable by the browser.

## Proposed Fix
1. Move or symlink the `pkg/` directory into the `www/` directory.
2. Update `index.js` to import from `./pkg/chess_core.js`.
3. Update build instructions to output directly to `www/pkg`.

## Temporary Workaround
Serve from the project root and navigate to `/www/`, though this may still face path resolution issues depending on the server configuration.
