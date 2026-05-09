# Implementation Plan: Fix 3D Model Viewer

**Branch**: `3d-model-viewer2` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-3d-model-viewer/spec.md`

## Summary

Fix the dedicated 3D model viewer page (`www/pages/3d-model-viewer.html`) so that its
controls (view mode switching, camera sliders, lighting sliders, drag-to-rotate,
scroll-to-zoom) work reliably. The page is a design/debugging tool for developers
and artists to inspect procedurally-generated chess pieces and the board. It builds
on the existing Three.js renderer (`www/js/renderer-3d.js`) and viewer module
(`www/js/model-viewer.js`).

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), Rust 2021 edition (WASM backend)  
**Primary Dependencies**: Three.js 0.170.0 (CDN via import map)  
**Storage**: localStorage (skin preference, 3D mode preference)  
**Testing**: JS syntax via acorn, module_test.js, regression_test.js, `cargo test`, `cargo clippy`  
**Target Platform**: Web browser — Chrome, Firefox, Edge (latest versions)  
**Project Type**: Web application (frontend with WASM backend)  
**Performance Goals**: 30+ FPS in 3D viewport, slider response under 100ms, page load under 3s  
**Constraints**: WebGL required; no fallback to 2D on viewer page  
**Scale/Scope**: Single-user local tool; no server or multi-user considerations

### Architecture

The viewer page loads two module scripts: `index.js` (main app) then `model-viewer.js`
(viewer-specific logic). The Three.js scene is created by `ChessRenderer3D` in
`renderer-3d.js`, initialized via `renderBoard3d()` (exported from `board.js`).

**Key files**:

| File | Role |
|------|------|
| `www/pages/3d-model-viewer.html` | Viewer page markup |
| `www/js/model-viewer.js` | Viewer controls wiring, drag/zoom |
| `www/js/renderer-3d.js` | Three.js scene, camera, lights, piece builders |
| `www/js/board.js` | Exports `renderBoard3d`, `parseFenPieces` |
| `www/js/skins.js` | Exports `skinRegistry`, `toggle3dMode` |
| `www/css/styles.css` | Viewer layout and controls styles |

### Known Issues (from research)

1. Import scoping — `model-viewer.js` needed imports for `skinRegistry` and `renderBoard3d`
2. `setSinglePiece` coupled with `setViewMode` — removed the coupling
3. Light references not stored — fixed by using `this.mainLight` etc.
4. Container positioning — added `position: relative` to `#model-container`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution at `.specify/memory/constitution.md` is a template with unfilled
placeholders — no enforceable gates. Standard project quality gates apply:

- JS syntax clean via acorn
- Module exports pass module_test.js
- Regression tests pass
- `cargo clippy -- -D warnings` passes
- `cargo test` passes (32/32)
- WASM build succeeds

**Status**: CONSTITUTION_NOT_CONFIGURED — proceed with standard gates.

## Project Structure

### Documentation (this feature)

```text
specs/013-3d-model-viewer/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── plan/
│   └── ...              # Prior plan working files
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── contracts/           # UI contracts (optional)
```

### Source Code

```text
www/
├── pages/
│   └── 3d-model-viewer.html   # Viewer page markup
├── js/
│   ├── model-viewer.js         # Viewer controls, drag/zoom
│   ├── renderer-3d.js          # Three.js renderer
│   ├── board.js                # Exports renderBoard3d
│   └── skins.js                # Exports skinRegistry, toggle3dMode
├── css/
│   └── styles.css              # Viewer layout styles

tests/
├── js/
│   ├── module_test.js          # Module export validation
│   └── regression_test.js      # Regression tests
```

**Structure Decision**: Single web project with JS modules. The viewer is a page
within the existing chess application reusing the same module system. No new
source directories needed — all changes are edits to existing files.

## Complexity Tracking

No constitution violations — no complexity tracking needed.

## Phase 0: Research

See [research.md](./research.md).

All technical unknowns resolved — no NEEDS CLARIFICATION after codebase analysis.

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [quickstart.md](./quickstart.md).

### Renderer API Contract

The viewer page (`model-viewer.js`) depends on `ChessRenderer3D` methods:

- `setViewMode(mode)` — 'full' | 'board' | 'piece'
- `setSinglePiece(type, color)` — rebuild single piece group
- `setCameraPosition(x, y, z)` — absolute camera position
- `setCameraFov(fov)` — field of view in degrees
- `resetCamera()` — restore defaults per current mode (Full/Board: (0,10,15) FOV28; Piece: (0,4,5) FOV28)
- `getCameraPosition()` → `{x, y, z, fov}`
- `setMainLightPosition(x, y, z)` — move directional light
- `setMainLightIntensity(i)` — main light brightness
- `setAmbientIntensity(i)` — ambient light brightness
- `getLightState()` → `{mainX, mainY, mainZ, mainIntensity, ambientIntensity}`

## Phase 2: Tasks

To be generated by `/speckit.tasks`.
