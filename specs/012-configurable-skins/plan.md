# Implementation Plan: Configurable Skins System

**Branch**: `012-configurable-skins` | **Date**: 2026-05-08 | **Spec**: [specs/012-configurable-skins/spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-configurable-skins/spec.md`

## Summary
Implement a themeable UI system that allows users to switch between different visual skins, including standard 2D color themes, image-based themes (e.g., Pokemon), and a placeholder for 3D rendering. The approach uses CSS variables for color themes and a central `SkinRegistry` for asset management and mode switching.

## Technical Context

**Language/Version**: JavaScript (ES6+), CSS3  
**Primary Dependencies**: None (Vanilla JS/CSS)  
**Storage**: `localStorage` (via `www/js/storage.js`)  
**Testing**: Browser-based regression tests (JS)  
**Target Platform**: Web (Modern Browsers)
**Project Type**: Web Application  
**Performance Goals**: <200ms skin transition time, 60fps rendering  
**Constraints**: Must not modify core Rust/WASM engine logic (Principle I: Engine Isolation)  
**Scale/Scope**: ~10-15 themed assets per skin, 3-4 initial skins  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Engine Isolation | Skins must only affect the UI layer (`www/`). No changes to `src/`. | PASS |
| VI. Distribution & Quality | New skins and registry must be documented with doc-comments. | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/012-configurable-skins/
├── plan.md              # This file
├── research.md          # Research findings and decisions
├── data-model.md        # SkinDefinition and UserSettings model
├── quickstart.md        # Dev guide and adding new skins
└── tasks.md             # Implementation tasks (generated later)
```

### Source Code (repository root)

```text
www/
├── assets/
│   └── skins/           # New: Image assets for skins
├── css/
│   └── styles.css       # Modified: Use CSS variables
└── js/
    ├── skins.js         # New: SkinRegistry and definitions
    ├── board.js         # Modified: Integrated skin-aware rendering
    ├── dialogs.js       # Modified: Skin selection UI
    └── storage.js       # Modified: Persistence for skin settings
```

**Structure Decision**: Single project web application structure. Enhancing the existing `www/` directory with a new `assets/skins/` folder and `skins.js` module.

## Complexity Tracking

*No violations identified.*
