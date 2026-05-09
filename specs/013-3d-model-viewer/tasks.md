# Tasks: Fix 3D Model Viewer

**Input**: Design documents from `/specs/013-3d-model-viewer/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: Not requested in spec — test tasks excluded.

**Organization**: Tasks grouped by user story for independent testing. This is a
bug-fix feature on an already-partially-implemented viewer — most code is already
written. Tasks focus on fixing remaining issues and completing the implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Foundational (Prerequisites)

**Purpose**: Bug fixes and infrastructure that blocks all user stories

- [ ] T001 Make `resetCamera()` mode-aware in `www/js/renderer-3d.js` — use (0, 10, 15) FOV 28 for full/board mode, (0, 4, 5) FOV 28 for piece mode. Read `this._viewMode` to determine defaults.
- [ ] T002 [P] Reset `_boardWrap.rotation` in `resetCamera()` in `www/js/renderer-3d.js` so drag rotation is cleared on camera reset
- [ ] T003 Wire camera reset in `switchViewMode('piece')` in `www/js/model-viewer.js` — call `resetCamera()` when switching TO piece mode too (currently only called when switching away from piece)

**Checkpoint**: Foundation ready — mode-aware camera reset works, drag rotation resets.

---

## Phase 2: User Story 1 — View Mode Switching (Priority: P1) 🎯 MVP

**Goal**: Full/Board/Piece buttons switch the rendered scene correctly.

**Independent Test**: Open viewer. Click Full → Board → Piece → Full. Each click
changes what's visible (full board+pieces, board only, single piece, back to full).

- [ ] T004 [P] [US1] Verify `setViewMode('full')` shows `boardGroup` and `pieceGroup`, hides `_singlePieceGroup` in `www/js/renderer-3d.js`
- [ ] T005 [P] [US1] Verify `setViewMode('board')` shows `boardGroup`, hides `pieceGroup` and `_singlePieceGroup`
- [ ] T006 [P] [US1] Verify `setViewMode('piece')` shows `_singlePieceGroup`, hides `boardGroup` and `pieceGroup`
- [ ] T007 [P] [US1] Add `resetCamera()` call when switching TO piece mode in `www/js/model-viewer.js` `switchViewMode()`
- [ ] T008 [US1] Verify buttons set active class correctly in `www/js/model-viewer.js` — button with `data-mode` matching current mode gets `.active` class

**Checkpoint**: View mode buttons work. Full shows all, Board shows only board, Piece shows single piece.

---

## Phase 3: User Story 2 — Camera Control (Priority: P1)

**Goal**: Camera X/Y/Z/FOV sliders move the camera in real time. Reset returns to defaults.

**Independent Test**: Move each slider, verify the scene updates and the numeric
readout changes. Click Reset Camera, verify view returns to default.

- [ ] T009 [P] [US2] Verify camera slider `input` handlers call `setCameraPosition(x, y, z)` and `setCameraFov(fov)` in `www/js/model-viewer.js` `onCamSlider()`
- [ ] T010 [P] [US2] Verify `syncCameraSliders()` reads `renderer.getCameraPosition()` and updates all slider values and readout spans
- [ ] T011 [P] [US2] Verify Reset Camera button calls `renderer.resetCamera()` then `syncCameraSliders()` in `www/js/model-viewer.js`
- [ ] T012 [US2] Verify mode-aware reset: Full/Board → (0, 10, 15), Piece → (0, 4, 5) in `www/js/renderer-3d.js` `resetCamera()`

**Checkpoint**: Camera sliders control the view. Reset restores mode-appropriate defaults.

---

## Phase 4: User Story 3 — Lighting Control (Priority: P1)

**Goal**: Light position/intensity sliders adjust scene lighting in real time.

**Independent Test**: Move each light slider, verify the scene illumination changes.
Slider readouts update as values change.

- [ ] T013 [P] [US3] Verify light slider `input` handlers call `setMainLightPosition()`, `setMainLightIntensity()`, and `setAmbientIntensity()` in `www/js/model-viewer.js` `onLightSlider()`
- [ ] T014 [P] [US3] Verify `syncLightSliders()` reads `renderer.getLightState()` and updates all slider values and readout spans
- [ ] T015 [US3] Verify setter methods update light properties on `this.mainLight` and `this.ambientLight` in `www/js/renderer-3d.js`

**Checkpoint**: Light sliders control scene illumination. Initial defaults match spec.

---

## Phase 5: User Story 4 — Mouse & Touch Interaction (Priority: P1)

**Goal**: Drag-to-rotate and scroll-to-zoom on the viewport.

**Independent Test**: Drag on viewport → scene rotates. Scroll → camera zooms in/out.
Camera sliders do NOT change during drag.

- [ ] T016 [P] [US4] Verify `mousedown`/`mousemove`/`mouseup` handlers on `#renderer-3d-container` rotate `_boardWrap` in `www/js/model-viewer.js` `setupDragControls()`
- [ ] T017 [P] [US4] Verify touch event handlers (`touchstart`/`touchmove`/`touchend`) rotate `_boardWrap` in `www/js/model-viewer.js` `setupDragControls()`
- [ ] T018 [P] [US4] Verify `wheel` handler zooms camera (clamped between 5-30 units from origin) in `www/js/model-viewer.js` `setupDragControls()`
- [ ] T019 [US4] Verify drag rotation does NOT update camera position sliders — `syncCameraSliders()` is not called during drag (decoupled per clarification)
- [ ] T020 [US4] Verify cursor changes to `grabbing` during drag and `grab` when idle in `www/js/model-viewer.js`

**Checkpoint**: Drag rotates, scroll zooms. Sliders stay decoupled from drag.

---

## Phase 6: User Story 5 — Measurement & Annotation (Priority: P2) ⭐ Stretch

**Goal**: Piece dimensions displayed in Piece mode. Board coordinates visible in
Full/Board modes.

**Independent Test**: Switch to Piece mode → height/width shown. Switch to Full →
rank/file labels visible.

- [ ] T021 [P] [US5] Add HTML elements for piece dimension display in `www/pages/3d-model-viewer.html` — add measurement div inside `#piece-controls`
- [ ] T022 [P] [US5] Add CSS for measurement display in `www/css/styles.css`
- [ ] T023 [US5] Implement dimension reading in `www/js/model-viewer.js` — compute piece bounding box height/width from `Box3` and display when piece type changes
- [ ] T024 [US5] Verify rank/file labels are visible in Full/Board mode in `www/js/renderer-3d.js` — existing sprite labels should appear; verify visibility toggles match view mode

**Checkpoint**: Piece mode shows dimensions. Board modes show coordinate labels.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error handling, and final verification

- [ ] T025 Add WebGL detection in `www/js/model-viewer.js` — show error message in `#status-text` if WebGL unavailable
- [ ] T026 [P] Add `#model-container` sizing verification — confirm CSS `position: relative` and `flex: 1` are present in `www/css/styles.css`
- [ ] T027 Run all quality checks: JS syntax, module exports, regression tests, `cargo clippy`, `cargo test`, WASM build
- [ ] T028 Update bug tracker `specs/bugs.md` — mark BUG35 and BUG46 items as `[?]` needing validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — can start immediately
- **Phase 2-5 (US1-US4)**: Depend on Phase 1 — can run in parallel after foundation
- **Phase 6 (US5)**: Dependent on Phase 1 but independent of US1-US4 — stretch goal
- **Phase 7 (Polish)**: Depends on all other phases

### User Story Dependencies

- **US1 (View Mode)**: Depends on T001-T003 (no story dependencies)
- **US2 (Camera)**: Depends on T001 (mode-aware resetCamera) — independent of US1/US3/US4
- **US3 (Lighting)**: No dependencies on other stories — independent
- **US4 (Drag/Zoom)**: No dependencies on other stories — independent
- **US5 (Stretch)**: No dependencies on other stories — independent

### Within Each User Story

- Verification tasks marked [P] can run in parallel
- Implementation tasks follow verification
- Story complete before moving to next phase

### Parallel Opportunities

- T002, T003 (Phase 1) — parallel [P]
- All verification tasks within a story are [P] — can verify in parallel
- US1, US2, US3, US4 can all proceed in parallel after T001-T003
- US5 is entirely independent of US1-US4

### Parallel Example: User Story 2

```bash
# Launch all verification tasks for US2 together:
Task: "Verify camera slider input handlers in www/js/model-viewer.js"
Task: "Verify syncCameraSliders in www/js/model-viewer.js"
Task: "Verify Reset Camera button in www/js/model-viewer.js"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: T001-T003 (mode-aware reset, drag rotation reset, piece mode wiring)
2. Complete Phase 2: T004-T008 (view mode switching)
3. **STOP and VALIDATE**: Open viewer, click Full/Board/Piece, verify mode switching
4. Ready for demo

### Incremental Delivery

1. Phase 1 complete → camera reset is mode-aware
2. Phase 2 complete → view mode switching works (MVP!)
3. Phase 3 complete → camera controls work
4. Phase 4 complete → lighting controls work
5. Phase 5 complete → drag/zoom works
6. Phase 6 complete → measurements visible (stretch)
7. Phase 7 complete → all checks pass

### Sequential Strategy

Recommended for single developer:

1. Phase 1: T001 → T002 → T003
2. Phase 2: T004-T008 (US1 — MVP)
3. Phase 3: T009-T012 (US2)
4. Phase 4: T013-T015 (US3)
5. Phase 5: T016-T020 (US4)
6. Phase 6: T021-T024 (US5 — stretch, can skip)
7. Phase 7: T025-T028 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- US5 is P2 (stretch) — can be deferred without affecting core functionality
- No test tasks generated — spec does not request TDD approach
- All tasks target edits to existing files — no new directories needed
