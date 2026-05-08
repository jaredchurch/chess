# Quickstart: Configurable Skins System

## Development Setup

1. **Add CSS Variables**: Update `www/css/styles.css` to use variables for all themed colors.
   ```css
   :root {
       --board-white: #f0d9b5;
       --board-black: #b58863;
       /* ... etc */
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
2. Add a new `SkinDefinition` object to the `SKINS` array.
3. If using images, place assets in `www/assets/skins/[skin-id]/`.
4. Refresh the application; the new skin will automatically appear in the settings menu.

## Testing

- **Switching**: Select different skins and verify board/piece appearance.
- **Persistence**: Change skin, refresh browser, and ensure the selection remains.
- **Fallbacks**: Temporarily remove a skin's assets and verify the system falls back to the "Classic" theme.
