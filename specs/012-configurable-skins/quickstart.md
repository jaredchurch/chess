# Quickstart: Configurable Skins System

## Development Setup

1. **Add CSS Variables**: Update `www/css/styles.css` to use variables for all themed colors.
   ```css
   :root {
       --board-white: #f0d9b5;
       --board-black: #b58863;
       --board-highlight: #f1c40f;
       --piece-white: #ffffff;
       --piece-black: #000000;
       --piece-shadow: 0 0 2px rgba(0,0,0,0.8);
   }
   ```

2. **Define Skins**: Create `www/js/skins.js` and export the `SkinRegistry`.
   ```javascript
   export const skins = [
       { id: 'classic', name: 'Classic', ... },
       { id: 'wood', name: 'Wood', ... }
   ];
   ```

3. **Update Board Rendering**: Modify `www/js/board.js` to check the active skin before rendering pieces.
   ```javascript
   const activeSkin = getActiveSkin();
   if (activeSkin.pieceSet.type === 'image') {
       // use <img> tags with activeSkin.pieceSet.mapping[piece]
   } else {
       // use Unicode as before
   }
   ```

4. **Add UI Menu**: Add a skin selector to the settings dialog in `www/index.html` and `www/js/dialogs.js`.

## Adding a New Skin

1. Open `www/js/skins.js`.
2. Add a new `SkinDefinition` object to the `SKIN_DEFINITIONS` array.
3. If using images, place assets in `www/assets/skins/[skin-id]/`.
4. Refresh the application; the new skin will automatically appear in the settings menu.

### SkinDefinition Format

```javascript
{
    id: 'my-skin',           // Unique identifier
    name: 'My Skin',         // Display name in UI
    type: '2d',              // '2d' or '3d'
    theme: {
        whiteSquare: '#f0d9b5',   // Light square color
        blackSquare: '#b58863',   // Dark square color
        highlight: '#f1c40f',     // Highlight color
        pieceWhite: '#ffffff',    // White piece color
        pieceBlack: '#000000'     // Black piece color
    },
    pieceSet: {
        type: 'unicode',          // 'unicode' or 'image'
        mapping: {                // Required if type is 'image'
            'K': 'assets/skins/my-skin/king.png',
            'Q': 'assets/skins/my-skin/queen.png',
            'R': 'assets/skins/my-skin/rook.png',
            'B': 'assets/skins/my-skin/bishop.png',
            'N': 'assets/skins/my-skin/knight.png',
            'P': 'assets/skins/my-skin/pawn.png',
            'k': 'assets/skins/my-skin/king_black.png',
            'q': 'assets/skins/my-skin/queen_black.png',
            'r': 'assets/skins/my-skin/rook_black.png',
            'b': 'assets/skins/my-skin/bishop_black.png',
            'n': 'assets/skins/my-skin/knight_black.png',
            'p': 'assets/skins/my-skin/pawn_black.png'
        }
    }
}
```

### Adding a 3D Skin

To add a 3D skin placeholder:
1. Set `type: '3d'` in the skin definition.
2. The board will show a "3D Mode" placeholder when selected.
3. Implement the 3D rendering engine separately and integrate via the `window.renderBoard` hook.

## Testing

- **Switching**: Select different skins and verify board/piece appearance.
- **Persistence**: Change skin, refresh browser, and ensure the selection remains.
- **Fallbacks**: Temporarily remove a skin's assets and verify the system falls back to the "Classic" theme.
- **3D Mode**: Select a 3D skin and verify the placeholder message is displayed and game UI is hidden.

## Available Skins

| ID | Name | Type | Description |
|----|------|------|-------------|
| `classic` | Classic | 2D | Default brown/cream theme |
| `wood` | Wood | 2D | Dark wood grain theme |
| `3d-classic` | 3D Classic | 3D | Placeholder for 3D rendering |
| `pokemon` | Pokemon | 2D | Image-based Pokemon piece set |
