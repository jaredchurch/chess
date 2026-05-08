# Tasks: Configurable Skins System

**Input**: Design documents from `/specs/012-configurable-skins/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Tests are not explicitly requested in the specification for TDD, so implementation focuses on functional delivery. Regression tests in `tests/` should be updated if core logic is affected.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `www/assets/skins/` directory for themed assets
- [X] T002 [P] Update `www/css/styles.css` to use CSS variables for board squares, highlights, and piece colors
- [X] T003 [P] Initialize `www/js/skins.js` with the `SkinRegistry` class shell and export constants

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for skin management and persistence

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Implement `SkinRegistry` logic in `www/js/skins.js` for registering and retrieving skins
- [X] T005 [P] Add `chess_active_skin` persistence logic in `www/js/storage.js`
- [X] T006 [P] Update `www/js/ui.js` constants to support extensible piece definitions (Unicode vs Image)

**Checkpoint**: Foundation ready - skin selection and application logic can now be implemented.

---

## Phase 3: User Story 1 - Changing Visual Skins (Priority: P1) 🎯 MVP

**Goal**: Allow users to switch between basic 2D color themes (Classic, Wood)

**Independent Test**: Change skin in the settings menu and verify board colors update instantly and persist after refresh.

### Implementation for User Story 1

- [X] T007 [P] [US1] Define "Classic" (default) and "Wood" skin configurations in `www/js/skins.js`
- [X] T008 [US1] Update `renderBoard` in `www/js/board.js` to apply skin-specific CSS variables to the `:root` element
- [X] T009 [US1] Add "Skin" dropdown selector to the settings dialog in `www/index.html`
- [X] T010 [US1] Implement skin change event handler in `www/js/dialogs.js` to update the active skin and re-render the board

**Checkpoint**: User Story 1 is functional. The game now supports switchable 2D color themes.

---

## Phase 4: User Story 2 - Switching to 3D Mode via Skins (Priority: P2)

**Goal**: Integrate the 3D rendering mode as a skin option

**Independent Test**: Select "3D Classic" skin and verify the rendering mode switches (using placeholder logic for Feature 008).

### Implementation for User Story 2

- [X] T011 [US2] Define "3D Classic" skin in `www/js/skins.js` with `type: '3d'`
- [X] T012 [US2] Implement rendering mode bridge in `www/js/board.js` to detect `type: '3d'` and trigger mode switching
- [X] T013 [US2] Ensure UI components (labels, coordinates) are correctly toggled when switching between 2D and 3D skins

**Checkpoint**: User Story 2 is functional. 3D mode is now accessible via the skins menu.

---

## Phase 5: User Story 3 - Custom Skin Support (Pokemon) (Priority: P3)

**Goal**: Support high-fidelity skins using custom image assets for pieces

**Independent Test**: Select "Pokemon" skin and verify pieces are rendered as images instead of Unicode characters.

### Implementation for User Story 3

- [X] T014 [P] [US3] Place Pokemon piece assets (PNG/SVG) in `www/assets/skins/pokemon/`
- [X] T015 [P] [US3] Define "Pokemon" skin in `www/js/skins.js` with `type: '2d'` and `pieceSet` mapping to image paths
- [X] T016 [US3] Update `renderBoard` in `www/js/board.js` to support image-based piece rendering (using `<img>` tags) when specified by the skin

**Checkpoint**: All user stories are functional. The system supports color themes, 3D mode, and image-based custom skins.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T017 [P] Implement asset preloading in `www/js/skins.js` to prevent flickering when switching image skins
- [X] T018 [P] Add error handling/fallback to "Classic" skin if assets fail to load or skin ID is invalid
- [X] T019 [P] Update `README.md` and `specs/012-configurable-skins/quickstart.md` with instructions for adding 3rd party skins
- [X] T020 Run full validation of `specs/012-configurable-skins/quickstart.md` testing scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on T003 (skins.js initialization).
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion. **This is the MVP**.
- **User Stories 2 & 3 (Phases 4 & 5)**: Depend on User Story 1 being functional.
- **Polish (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- T002 and T003 (CSS variables and JS init)
- T005 and T006 (Persistence and UI constants)
- T014 and T015 (Assets and data definition for US3)
- Documentation and asset preloading tasks in Phase 6

---

## Parallel Example: Setup & Foundation

```bash
# Parallel initialization:
Task: "Update www/css/styles.css to use CSS variables"
Task: "Initialize www/js/skins.js with the SkinRegistry class"

# Parallel foundation:
Task: "Add chess_active_skin persistence logic in www/js/storage.js"
Task: "Update www/js/ui.js constants to support extensible piece definitions"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (US1).
3. Validate that basic 2D color skins (Classic, Wood) work and persist.
4. Deliver MVP before proceeding to 3D and Pokemon skins.

### Incremental Delivery

- **Increment 1**: Configurable 2D themes (Classic, Wood).
- **Increment 2**: 3D Mode integration as a skin.
- **Increment 3**: Asset-based custom skins (Pokemon).
