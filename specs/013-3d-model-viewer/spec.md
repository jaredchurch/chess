# Feature Specification: Fix 3D Model Viewer

**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "Fix the 3D model viewer page - it's already partly implemented but not well. Controls don't work reliably. The page should serve as a design/debugging tool for developers/artists to inspect 3D chess models."

## Clarifications

### Session 2026-05-09

- Q: Should camera position sliders update to reflect drag-to-rotate interactions? → A: No. Drag rotates the board group, not the camera. Sliders always show world-space camera position. Decoupled behavior.
- Q: Should "Reset Camera" use the same default position for all view modes, or different defaults per mode? → A: Different defaults. Full/Board use (0, 10, 15) with FOV 28. Piece mode uses closer camera (0, 4, 5) with FOV 28.

## User Scenarios & Testing

### User Story 1 - View Mode Switching (Priority: P1)

As a developer or artist, I want to switch between viewing the full board with pieces, the board alone, and individual pieces so that I can inspect different aspects of the 3D scene.

**Why this priority**: Core navigation of the viewer; without reliable view switching the tool is unusable.

**Independent Test**: Click each view mode button (Full, Board, Piece) and verify the displayed scene changes correctly and immediately.

**Acceptance Scenarios**:

1. **Given** the viewer is in Full mode, **When** the user clicks "Board", **Then** all pieces disappear and only the chess board is visible.
2. **Given** the viewer is in Board mode, **When** the user clicks "Piece", **Then** the board disappears and a single chess piece is displayed in isolation.
3. **Given** the viewer is in Piece mode, **When** the user changes the piece type or color dropdown, **Then** the displayed piece updates immediately.
4. **Given** the viewer is in Piece mode, **When** the user clicks "Full", **Then** the board and all pieces are restored.
5. **Given** the viewer starts for the first time, **Then** it opens in Full mode by default.

---

### User Story 2 - Camera Control (Priority: P1)

As a developer or artist, I want to adjust the camera position and field of view using sliders so that I can examine the scene from any angle.

**Why this priority**: Essential for inspecting models at different perspectives.

**Independent Test**: Move each camera slider and verify the view updates in real time.

**Acceptance Scenarios**:

1. **Given** the viewer is open, **When** the user drags the X slider, **Then** the camera moves left/right accordingly and the slider value readout updates.
2. **Given** the viewer is open, **When** the user drags the Y slider, **Then** the camera moves up/down accordingly.
3. **Given** the viewer is open, **When** the user drags the Z slider, **Then** the camera moves forward/backward accordingly.
4. **Given** the viewer is open, **When** the user drags the FOV slider, **Then** the field of view changes and the scene updates perspectively.
5. **Given** the user has adjusted the camera, **When** they click "Reset Camera", **Then** the view returns to the default position and FOV.

---

### User Story 3 - Lighting Control (Priority: P1)

As a developer or artist, I want to adjust the direction and intensity of scene lighting so that I can see piece details under different lighting conditions.

**Why this priority**: Important for model inspection, especially for spotting geometry issues.

**Independent Test**: Move each lighting slider and verify the scene illumination changes.

**Acceptance Scenarios**:

1. **Given** the viewer is open, **When** the user drags the Light X/Y/Z sliders, **Then** the main directional light moves to the specified position and shadows/highlights shift accordingly.
2. **Given** the viewer is open, **When** the user drags the Intensity slider, **Then** the main light brightens or dims.
3. **Given** the viewer is open, **When** the user drags the Ambient slider, **Then** the ambient fill light brightens or dims.

---

### User Story 4 - Mouse and Touch Interaction (Priority: P1)

As a developer or artist, I want to rotate the view by dragging and zoom with scroll so that I can quickly explore the scene without using sliders.

**Why this priority**: Natural 3D viewer behavior; users expect direct manipulation.

**Independent Test**: Drag on the 3D viewport and verify the scene rotates. Scroll to verify zoom.

**Acceptance Scenarios**:

1. **Given** the viewer is open, **When** the user clicks and drags on the 3D viewport, **Then** the scene rotates following the drag direction.
2. **Given** the viewer is open, **When** the user scrolls up/down on the 3D viewport, **Then** the camera zooms in/out.
3. **Given** the viewer is open, **When** the user drag-rotates the view, **Then** the camera position sliders (X/Y/Z) do NOT update — drag rotates the board group, not the camera.

---

### User Story 5 - Measurement and Annotation (Priority: P2)

As a developer or artist, I want to see dimensional measurements for each piece type and coordinate annotations on the board so that I can assess piece proportions and board layout.

**Why this priority**: Stretch goal; valuable for model debugging but not required for basic functionality.

**Independent Test**: Switch to Piece mode and verify that height/width dimensions are displayed. Switch to Full or Board mode and verify that rank/file coordinates are visible on the board.

**Acceptance Scenarios**:

1. **Given** the viewer is in Piece mode, **Then** the piece's height and width (in relative units) are displayed alongside the model.
2. **Given** the viewer is in Full or Board mode, **Then** rank (1-8) and file (a-h) labels are visible on the board.
3. **Given** the viewer is in Piece mode, **When** switching between different piece types, **Then** the displayed dimensions update to match the current piece.

---

### Edge Cases

- **Browser without WebGL**: Show a clear error message and hide the 3D viewport.
- **Window resize**: The 3D viewport resizes proportionally with the browser window; controls panel maintains its layout.
- **Rapid slider changes**: Changes take effect without noticeable lag or visual glitches.
- **Default camera position on mode switch**: Camera resets when switching to Full/Board mode: position (0, 10, 15), FOV 28. When switching to Piece mode: position (0, 4, 5), FOV 28. Changing piece type/color in Piece mode also resets to Piece defaults.

## Requirements

### Functional Requirements

- **FR-001**: The viewer MUST display each view mode (Full, Board, Piece) accurately when the corresponding button is clicked.
- **FR-002**: The Piece mode MUST support selecting any of the 6 piece types (King, Queen, Rook, Bishop, Knight, Pawn) and both colors (White, Black).
- **FR-003**: Camera position sliders (X, Y, Z) MUST update the 3D camera position in real time.
- **FR-004**: Camera FOV slider MUST adjust the field of view in real time.
- **FR-005**: A "Reset Camera" button MUST return the camera to the configured default for the current view mode: Full/Board → (0, 10, 15), FOV 28; Piece → (0, 4, 5), FOV 28.
- **FR-006**: Light position sliders (X, Y, Z) MUST move the main directional light source in real time.
- **FR-007**: Light Intensity slider MUST adjust the main light brightness in real time.
- **FR-008**: Ambient Intensity slider MUST adjust the ambient fill light brightness in real time.
- **FR-009**: The user MUST be able to rotate the scene by clicking and dragging on the viewport.
- **FR-010**: The user MUST be able to zoom in/out using the mouse scroll wheel.
- **FR-011**: All slider values MUST display their current numeric readout alongside the slider.
- **FR-012**: Slider readouts MUST update in real time as the slider is dragged.
- **FR-013**: The viewport MUST fill the available space between the header and the controls panel.
- **FR-014**: The controls panel MUST NOT overlap or be overlapped by the 3D viewport.
- **FR-015** (Stretch): Piece dimensions (height, width) MUST be displayed when in Piece mode.
- **FR-016** (Stretch): Board coordinate labels (rank/file) MUST be visible in Full and Board modes.

### Non-Functional Requirements

- **NFR-001**: The viewer MUST NOT interfere with the main game page's functionality when navigating back.
- **NFR-002**: Page load time (until 3D scene is visible) MUST be under 3 seconds on a modern browser with a typical internet connection.
- **NFR-003**: The 3D viewport MUST maintain at least 30 FPS during slider adjustments.
- **NFR-004**: The viewer MUST work in the latest versions of Chrome, Firefox, and Edge.

## Success Criteria

- **SC-001**: All three view mode buttons (Full, Board, Piece) work on every click, every time, with no dead clicks.
- **SC-002**: All camera and light sliders respond immediately (under 100ms) when dragged.
- **SC-003**: Drag-to-rotate and scroll-to-zoom work across the entire viewport area.
- **SC-004**: The controls panel and 3D viewport maintain correct layout at window widths from 900px to 2560px.
- **SC-005**: After resetting the camera, the view returns to the same default position every time.
- **SC-006**: Switching between Piece types and colors updates the display in under 500ms.

## Key Entities

- **Scene State**: The current combination of view mode, camera position/FOV, light position/intensity, and selected piece type/color.
- **View Mode**: One of three states (Full, Board, Piece) controlling what is rendered.
- **Camera Configuration**: Position (X, Y, Z coordinates) and field of view angle.
- **Lighting Configuration**: Main light position and intensity, ambient light intensity.
- **Piece Selection**: The currently selected piece type and color (only relevant in Piece mode).

## Assumptions

- **Target users**: Developers and artists working on the chess project who need to inspect 3D models.
- **Browser support**: Modern browsers with WebGL support are expected.
- **Existing code reuse**: The fix should build upon existing Three.js rendering code, not replace it.
- **No authentication**: The viewer is a public page accessible without login.
- **No mobile optimization**: The viewer is primarily designed for desktop/laptop screen sizes; basic responsiveness is sufficient.
- **Existing procedural models**: The current procedurally-generated low-poly pieces are acceptable; GLTF model loading is out of scope.
