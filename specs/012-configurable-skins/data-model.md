# Data Model: Configurable Skins System

## Entities

### SkinDefinition
Represents a visual theme for the game.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier (e.g., "classic", "wood", "pokemon"). |
| `name` | `string` | Display name for the UI. |
| `type` | `enum` | `2d` or `3d`. Determines the rendering engine. |
| `theme` | `object` | Map of CSS variables to color values. |
| `pieceSet` | `object` | Asset mapping for pieces. |

**PieceSet Object:**
- `type`: `unicode` | `image`.
- `mapping`: (Optional) Map of piece characters (K, Q, R, B, N, P, k, q, r, b, n, p) to asset paths.

### UserSettings (Persistence)
Stored in `localStorage` under `chess_config`.

| Field | Type | Description |
|-------|------|-------------|
| `activeSkinId` | `string` | The ID of the currently selected skin. |

## Relationships
- `SkinRegistry` holds a collection of `SkinDefinition` entities.
- `BoardRenderer` queries the `SkinRegistry` for the current `SkinDefinition` to determine colors and piece assets.

## Validation Rules
- `id` must be unique across all registered skins.
- `type` must be supported by the current platform/browser (e.g., check for WebGL support for `3d`).
- `pieceSet.mapping` must contain entries for all 12 standard chess pieces if `type` is `image`.

## State Transitions
1. **Initialize**: Load `activeSkinId` from `localStorage`. Apply default if missing.
2. **Switch Skin**: User selects new skin -> Update `localStorage` -> Signal renderer to refresh.
3. **Toggle 3D**: Handled as a specific `SkinDefinition` with `type: '3d'`.
