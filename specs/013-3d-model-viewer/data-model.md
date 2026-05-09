# Phase 1 Design: Data Model & Contracts

## Scene State

The 3D scene state is managed as a combination of mutable properties on the
`ChessRenderer3D` instance and the DOM state of the viewer controls.

```javascript
{
  viewMode: 'full' | 'board' | 'piece',
  camera: {
    position: { x, y, z },  // world coordinates
    fov: number,             // degrees
  },
  lights: {
    mainPosition: { x, y, z },
    mainIntensity: number,
    ambientIntensity: number,
  },
  pieceSelection: {
    type: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P',
    color: 'white' | 'black',
  },
}
```

### View mode transitions

| From \ To | Full | Board | Piece |
|-----------|------|-------|-------|
| Full | — | Show board, hide pieces, camera defaults | Hide board, show single piece, piece defaults |
| Board | Show pieces | — | Hide board, show single piece, piece defaults |
| Piece | Show board+pieces, reset camera | Show board only, reset camera | — |

**Rules**:
1. `setViewMode('piece')` shows `_singlePieceGroup`, hides `boardGroup` and `pieceGroup`.
2. `setViewMode('board')` shows `boardGroup`, hides `pieceGroup` and `_singlePieceGroup`.
3. `setViewMode('full')` shows `boardGroup` and `pieceGroup`, hides `_singlePieceGroup`.
4. On viewer page, switching to/from 'piece' resets camera to single-piece defaults.
5. On viewer page, switching between 'full'/'board' resets camera to board defaults.

### Camera defaults

| Mode | Position | FOV |
|------|----------|-----|
| Full / Board | (0, 11.8, 16.5) | 28° |
| Piece | (0, 4, 5) | 28° |

### Lighting defaults

| Light | Position | Intensity |
|-------|----------|-----------|
| Main directional | (5, 15, 10) | 1.8 |
| Fill directional | (-3, 5, -5) | 0.3 |
| Ambient | — | 0.7 |

## UI Contracts

### Control → Renderer mapping

| DOM Element(s) | Event | Renderer Method |
|----------------|-------|-----------------|
| `.view-mode-btn` | click | `setViewMode(mode)` |
| `#piece-type`, `#piece-color` | change | `setSinglePiece(type, color)` |
| `#cam-x`, `#cam-y`, `#cam-z` | input | `setCameraPosition(x, y, z)` |
| `#cam-fov` | input | `setCameraFov(fov)` |
| `#reset-camera` | click | `resetCamera()` |
| `#light-x`, `#light-y`, `#light-z` | input | `setMainLightPosition(x, y, z)` |
| `#light-intensity` | input | `setMainLightIntensity(i)` |
| `#ambient-intensity` | input | `setAmbientIntensity(i)` |
| `#renderer-3d-container` | mousedown+mousemove | Drag → `_boardWrap.rotation` |
| `#renderer-3d-container` | wheel | Zoom → `camera.position` |

### Slider ranges

| Slider | Min | Max | Step |
|--------|-----|-----|------|
| Camera X | -20 | 20 | 0.1 |
| Camera Y | 1 | 30 | 0.1 |
| Camera Z | -20 | 20 | 0.1 |
| Camera FOV | 5 | 80 | 1 |
| Light X | -20 | 20 | 0.5 |
| Light Y | 1 | 30 | 0.5 |
| Light Z | -20 | 20 | 0.5 |
| Light Intensity | 0 | 5 | 0.05 |
| Ambient Intensity | 0 | 2 | 0.05 |
