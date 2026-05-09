# QA Readiness Checklist: Fix 3D Model Viewer

**Purpose**: Formal QA gate — validate that requirements are complete, clear, consistent, measurable, and risk-adequate before implementation sign-off
**Created**: 2026-05-09
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md), [tasks.md](../tasks.md)

## Requirement Completeness

- [ ] CHK001 Are view mode transition requirements defined for ALL five transitions (Full→Board, Full→Piece, Board→Full, Board→Piece, Piece→Full)? [Completeness, Spec §US1]
- [ ] CHK002 Are camera default position requirements defined for ALL three view modes, including the initial startup default? [Completeness, Spec §US2, Clarifications]
- [ ] CHK003 Is the Reset Camera behavior specified for all interaction states (after drag-rotate, after slider adjustment, after mode switch)? [Completeness, Spec §FR-005]
- [ ] CHK004 Are lighting requirements specified for ALL three light components (main directional, fill directional, ambient) including their independent defaults? [Completeness, Spec §US3, Data Model §Lighting]
- [ ] CHK005 Are touch interaction requirements defined for multi-touch gestures (pinch zoom) or is single-touch-only the intended scope? [Completeness, Spec §US4]
- [ ] CHK006 Are WebGL detection requirements specified — what constitutes "no WebGL" (WebGL1 vs WebGL2, software renderer fallback)? [Completeness, Spec §Edge Cases]
- [ ] CHK007 Are CDN/Three.js load failure requirements defined — what happens when the import map URL is unreachable? [Completeness, Gap]
- [ ] CHK008 Are the measurement display requirements (US5, P2) specified with enough detail to implement — units, precision, positioning relative to the piece? [Completeness, Spec §US5]

## Requirement Clarity

- [ ] CHK009 Is the view mode transition timing requirement explicit — is scene change required to be instant (<1 frame) or can it have a transition animation? [Clarity, Spec §US1, SC-001]
- [ ] CHK010 Is "real time" for slider updates quantified with a specific latency threshold or is it implied by SC-002's 100ms? [Clarity, Spec §FR-003–FR-008, SC-002]
- [ ] CHK011 Is the drag rotation speed specified or left to implementation discretion? 0.005 rad/px is currently hardcoded. [Clarity, Spec §US4]
- [ ] CHK012 Is the zoom speed and distance range (currently clamped 5–30 units) documented as a requirement or implementation detail? [Clarity, Spec §US4]
- [ ] CHK013 Is "clear error message" for no-WebGL specified with concrete content, placement, and dismissal behavior? [Clarity, Spec §Edge Cases]
- [ ] CHK014 Are piece dimensions (US5) specified in real-world units or relative to the existing procedural model scale? [Clarity, Spec §US5]

## Requirement Consistency

- [ ] CHK015 Does the camera reset behavior (FR-005: per-mode defaults) conflict with the Edge Cases statement "Camera resets when switching to Full/Board mode" but not when switching TO Piece mode? [Consistency, Spec §FR-005 vs Edge Cases]
- [ ] CHK016 Are slider step values (defined in Data Model) consistent with the precision of displayed readout values? E.g., cam-x step 0.1 displays 0.1 precision; light-intensity step 0.05 displays 0.01 precision. [Consistency, Data Model §Slider Ranges]
- [ ] CHK017 Do the "see piece details under different lighting conditions" (US3 goal) requirements align with "model inspection" (Assumptions — existing procedural models are acceptable)? A procedural model inspection need differs from a detailed inspection. [Consistency, Spec §US3 vs §Assumptions]
- [ ] CHK018 Is SC-006's 500ms target consistent with SC-002's 100ms target when both could apply during slider drag with piece mode changes? [Consistency, Spec §SC-002, SC-006]

## Acceptance Criteria Quality

- [ ] CHK019 Can SC-001 ("no dead clicks") be objectively verified in testing — what constitutes a "dead click" (click not registered, click registered but no visible change, or change visible after a delay)? [Measurability, Spec §SC-001]
- [ ] CHK020 Is SC-003 ("drag-to-rotate ... across the entire viewport area") precisely scoped — does it include the margins, or only the 3D canvas area? [Measurability, Spec §SC-003]
- [ ] CHK021 Can SC-005 ("same default position every time") be verified deterministically given that drag rotation (US4) modifies `_boardWrap.rotation` but resetCamera does not reset it per T002? [Measurability, Spec §SC-005, Tasks T002]
- [ ] CHK022 Are SC-002's "under 100ms" and NFR-003's "at least 30 FPS" independently verifiable without instrumentation requirements being defined? [Measurability, Spec §SC-002, NFR-003]

## Scenario Coverage

- [ ] CHK023 Are requirements specified for the PRIMARY flow: page load → default full mode → slider adjustments → drag rotation → mode switching → camera reset? [Coverage, Spec §US1–US4]
- [ ] CHK024 Are ALTERNATE flow requirements specified: page loads while 3D mode is already persisted from a previous session? [Coverage, Gap]
- [ ] CHK025 Are EXCEPTION flow requirements specified for when WebGL context is lost mid-session (not just on initial load)? [Coverage, Spec §Edge Cases]
- [ ] CHK026 Are RECOVERY flow requirements specified for navigating away from the viewer page and back (NFR-001 — no interference with main game)? [Coverage, Spec §NFR-001]
- [ ] CHK027 Are concurrent interaction requirements specified — e.g., user holds drag while moving a slider, or changes view mode mid-drag? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK028 Is the "rapid slider changes" edge case defined with a specific rate threshold (e.g., 10 changes/second) or implementation-dependent? [Coverage, Spec §Edge Cases]
- [ ] CHK029 Are viewport requirements specified for extreme aspect ratios (ultrawide 21:9, or very narrow <900px where SC-004 doesn't apply)? [Coverage, Spec §SC-004]
- [ ] CHK030 Are requirements specified for the window resize transition from above 900px to below 900px and back? [Coverage, Spec §SC-004]
- [ ] CHK031 Is the behavior specified when a user interacts with both mouse drag AND touch events simultaneously (e.g., hybrid laptop)? [Coverage, Gap]
- [ ] CHK032 Are requirements defined for the initial empty/loading state before Three.js scene is created? Currently the `#status-text` says "Loading 3D models..." [Coverage, Spec §US4, Gap]
- [ ] CHK033 Is the behavior specified when `skinRegistry.getActive()` returns null or the active skin does not support 3D (supports3d: false) on the viewer page? [Coverage, Gap]

## Non-Functional Requirements

- [ ] CHK034 Is NFR-002's "under 3 seconds" specified for cold cache (first visit) or warm cache (subsequent visits) — these differ significantly for CDN-loaded Three.js? [Clarity, Spec §NFR-002]
- [ ] CHK035 Is NFR-003's "30 FPS" requirement specified for the worst case (full board with 32 pieces + slider adjustments) or the average case? [Clarity, Spec §NFR-003]
- [ ] CHK036 Are memory leak requirements defined — specifically that disposing the renderer (switch from 3D to 2D and back) does not accumulate Three.js objects? [Gap]
- [ ] CHK037 Are console error/warning requirements specified — should the viewer operate without any console errors in normal use? [Gap]
- [ ] CHK038 Are browser compatibility requirements specified for the viewer's specific Three.js version (0.170.0) across Chrome/Firefox/Edge? [Coverage, Spec §NFR-004]
- [ ] CHK039 Are accessibility requirements defined for the slider controls — ARIA labels, keyboard-accessible range inputs? [Gap]
- [ ] CHK040 Are dark-mode / system-theme requirements defined for the viewer page background color (currently hardcoded 0x2c3e50 in renderer)? [Gap]

## Dependencies & Assumptions

- [ ] CHK041 Is the assumption that "procedural models are acceptable" validated against the US5 measurement requirement — dimensions of procedural pieces may differ from intended real-world proportions? [Assumption, Spec §Assumptions vs US5]
- [ ] CHK042 Is the Three.js CDN URL (jsdelivr) documented as a dependency with availability expectations? [Dependency, Spec §Assumptions]
- [ ] CHK043 Are the browser WebGL capability assumptions documented with specific minimum requirements (WebGL1 vs WebGL2, specific GPU features)? [Assumption, Spec §Assumptions]
- [ ] CHK044 Is the assumption that the main game page uses the same `board.js`/`renderer-3d.js` modules validated for backward compatibility — new viewer changes do not break 2D mode? [Assumption, Spec §NFR-001]

## Ambiguities & Conflicts

- [ ] CHK045 Is there an ambiguity in FR-005: "Reset Camera ... for the current view mode" — but the current implementation only resets camera when switching TO full/board, not when TO piece? (Clarification session partially addressed this.) [Ambiguity, Spec §FR-005, Clarifications]
- [ ] CHK046 Is the term "sensible default" (from original spec) fully replaced by the clarified coordinates (0,10,15) and (0,4,5) in all locations? [Ambiguity, Spec §Edge Cases, FR-005]
- [ ] CHK047 Does the drag decoupling (clarification: sliders do NOT update during drag) conflict with the "slider readouts update in real time as the slider is dragged" (FR-012)? "Real time" for sliders and "not updated" for drag need clear boundary documentation. [Conflict, Spec §FR-012 vs Clarifications]
- [ ] CHK48 Is there a potential conflict between mode switching camera reset and drag rotation — when switching from piece to full, resetCamera sets position but does NOT reset `_boardWrap.rotation` (T002 addresses this)? [Conflict, Spec §FR-005, Tasks T002]

## Notes

- Items CHK001–CHK048 created for QA readiness gate
- Risk emphasis: edge cases, dependency failure modes, measurement ambiguity
- This checklist tests REQUIREMENTS QUALITY, not implementation behavior
