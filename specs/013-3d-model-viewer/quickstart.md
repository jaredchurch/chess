# Quickstart: 3D Model Viewer

## Running the viewer

1. Serve the project root:
   ```bash
   python3 -m http.server 8080
   ```
   or any static file server.

2. Open in browser:
   ```
   http://localhost:8080/www/pages/3d-model-viewer.html
   ```

## Troubleshooting

### 3D scene doesn't appear
1. Open DevTools console — check for import errors or ReferenceErrors.
2. Verify WebGL is supported: run `document.createElement('canvas').getContext('webgl2')`
   in the console.
3. Check that Three.js loaded: `typeof THREE !== 'undefined'` should be `true`.

### Controls don't respond
1. Run `window._chessRenderer` in console — should be a `ChessRenderer3D` instance.
2. If `undefined`, check the `renderBoard3d` call in `model-viewer.js`.
3. Check that `model-viewer.js` loaded (it's a separate module script in the HTML).

### Slider values don't update
1. Verify the renderer methods exist: `window._chessRenderer.setCameraPosition`.
2. Check that event listeners are attached (look for `addEventListener` calls in
   `setupViewerControls()` and `setupLightControls()`).
