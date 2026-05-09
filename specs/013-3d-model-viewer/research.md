# Phase 0 Research: 3D Model Viewer

## Root Cause Analysis

### Issue 1: Import scoping (ReferenceErrors)
`model-viewer.js` was calling `skinRegistry` and `renderBoard3d` without importing
them. These were accessed as globals from `index.js`, but after migrating to ES
modules, they became module-scoped and inaccessible.

**Fix**: Added `import { skinRegistry } from './skins.js'` and
`import { renderBoard3d } from './board.js'` at the top of `model-viewer.js`.

### Issue 2: `setSinglePiece` coupling with view mode
`setSinglePiece()` was calling `setViewMode('piece')` internally, which meant
selecting a piece would force Piece mode even if the user wanted to stay in
Full/Board mode. Works fine for the main game page but breaks the viewer's
Piece mode: the pre-build on line 84 would override whatever mode the user
selected.

**Fix**: Removed `setViewMode('piece')` from `setSinglePiece()`. View mode
switching is now exclusively managed by button handlers in `setupViewerControls()`.

### Issue 3: Light references not stored
The `_setupLights()` method in `renderer-3d.js` created lights but didn't store
them as instance properties. `setMainLightPosition()`, `setMainLightIntensity()`,
and `setAmbientIntensity()` were no-ops.

**Fix**: Changed local variables `ambientLight`, `mainLight`, `fillLight` to
instance properties (`this.ambientLight`, `this.mainLight`, `this.fillLight`).

### Issue 4: Container positioning
The renderer container used `position: absolute` but the nearest positioned ancestor
was the viewport on the viewer page. This caused the 3D canvas to be positioned
relative to the wrong element.

**Fix**: Added `position: relative` to `#model-container` on the viewer page
(and `#board-container` on the main page) in `styles.css` and `board.js`.

## Codebase Architecture

### Module dependency graph
```
index.js (entry)
  ├── chess-wasm.js     → WASM wrapper
  ├── ui.js             → Piece unicode, FEN constants
  ├── storage.js        → localStorage persistence
  ├── timer.js          → Move timers
  ├── board.js          → Board rendering (2D + 3D)
  │     └── renderer-3d.js → Three.js scene (ChessRenderer3D)
  ├── game.js           → Game state logic
  ├── ai.js             → AI move computation
  ├── ui-cards.js       → Score/move history cards
  ├── dialogs-newgame.js → New game dialog
  └── skins.js          → Skin/theming + 3D mode toggle

model-viewer.js (viewer page)
  └── board.js → renderBoard3d
  └── skins.js → skinRegistry
  └── three    → THREE (for drag/zoom)
```

### Renderer API completeness
`ChessRenderer3D` exposes all methods needed by the viewer:
- `setViewMode(mode)` — full/board/piece
- `setSinglePiece(type, color)` — rebuild single piece
- `setCameraPosition(x, y, z)` / `setCameraFov(fov)` — camera control
- `resetCamera()` — restore defaults
- `getCameraPosition()` — read camera state
- `setMainLightPosition(x, y, z)` / `setMainLightIntensity(i)` / `setAmbientIntensity(i)` — lighting
- `getLightState()` — read light state

## CSS/Layout Analysis

The viewer page uses `#viewer-layout` (flexbox row) with:
- `#model-container` (flex: 1, position: relative) — holds the 3D scene
- `#viewer-controls` (300px fixed width) — control panel

The absolute-positioned `#renderer-3d-container` inside `#board` fills `#model-container`
via `width: 100%; height: 100%`.

## Test Results

All existing tests pass (as of last run):
- JS syntax: all files parse clean
- Module exports: 9/9 pass
- Regression: 11/11 pass
- Rust clippy: no warnings
- Rust tests: 32/32 pass
- WASM build: succeeds
