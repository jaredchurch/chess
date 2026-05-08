# Research: Configurable Skins System

## Overview
The goal is to implement a unified system for visual themes (skins) in the chess application. This system should support traditional 2D themes, enhanced 2D themes with custom assets (like Pokemon), and provide a hook for the upcoming 3D mode.

## Current State
- **Rendering**: The board is rendered as a CSS grid of `div` elements in `www/js/board.js`.
- **Assets**: Pieces are currently rendered using Unicode characters defined in `www/js/ui.js`.
- **Styling**: Colors for squares and pieces are hardcoded in `www/css/styles.css`.
- **Persistence**: `www/js/storage.js` provides utility functions for `localStorage`.
- **3D Mode**: Planned (Feature 008) but not yet implemented. No existing 3D infrastructure in the codebase.

## Decision: CSS Variable Based Theming
We will move hardcoded colors in `styles.css` to CSS variables defined on the `:root` element.

### Proposed Variables
- `--board-white`: Light square color.
- `--board-black`: Dark square color.
- `--board-highlight`: Highlight color for selected/legal moves.
- `--piece-white`: Color for white pieces (if using Unicode).
- `--piece-black`: Color for black pieces (if using Unicode).
- `--piece-shadow`: Text shadow for white pieces.

## Decision: Skin Registry
A new module `www/js/skins.js` will manage the available skins and provide the logic for applying them.

### Skin Structure
```javascript
{
    id: "pokemon",
    name: "Pokemon",
    type: "2d",
    theme: {
        whiteSquare: "#78C850", // Grass type green
        blackSquare: "#A8B820", // Bug type green
        highlight: "#F8D030"  // Electric type yellow
    },
    pieceSet: {
        type: "image", // "unicode" or "image"
        mapping: {
            'K': 'assets/skins/pokemon/pikachu_king.png',
            'Q': 'assets/skins/pokemon/mewtwo_queen.png',
            // ... etc
        }
    }
}
```

## Research Tasks & Findings

### Q1: How to handle 3D skin transition?
**Finding**: Since 3D mode (Feature 008) will likely use a different rendering engine (e.g., Three.js), the skin system should act as a "Mode Selector". When a 3D skin is chosen, the `SkinRegistry` will signal the `Board` module to switch from the DOM-based 2D renderer to the 3D renderer.

### Q2: Where to store skin assets?
**Finding**: We should create a directory `www/assets/skins/` to organize piece images and textures.

### Q3: Impact on performance?
**Finding**: CSS variables are highly performant for color changes. For image-based skins, we should ensure assets are preloaded or appropriately sized to avoid flickering during the first render.

## Summary of Decisions
- **Decision**: Use CSS variables for 2D color theming.
- **Rationale**: Cleanest integration with existing CSS grid layout.
- **Decision**: Centralized `SkinRegistry` in `www/js/skins.js`.
- **Rationale**: Separation of concerns between UI logic and visual data.
- **Decision**: Support both Unicode and Image piece sets.
- **Rationale**: Necessary for "Pokemon" and other high-fidelity themes.
