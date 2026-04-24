<!--
<sync_impact_report>
Version change: 1.0.0 → 1.1.0
List of modified principles:
- Added: VI. Distribution & Quality
Added sections: None
Removed sections: None
Templates requiring updates: None
Follow-up TODOs: Create root README and LICENSE.
</sync_impact_report>
-->

# Chess Constitution

## Core Principles

### I. Engine Isolation
The core chess logic (move generation, validation, state management) must remain strictly decoupled from I/O, UI, and external dependencies. This ensures the engine is independently testable and portable.

### II. Move Integrity (NON-NEGOTIABLE)
Every move must be validated against the official FIDE Laws of Chess. No "half-valid" states are permitted; a move is either legal and applied, or illegal and rejected.

### III. Test-Driven Engine Logic
TDD is mandatory for all core engine components. New move types or rules must be preceded by failing tests covering both legal and illegal scenarios.

### IV. Standardized State Serialization
The system must support FEN (Forsyth–Edwards Notation) for board snapshots and PGN (Portable Game Notation) for full game histories to ensure interoperability.

### V. Performance-Conscious Evaluation
Move generation and position evaluation must be optimized for speed. Algorithmic complexity must be considered to allow for deep search trees in future iterations.

### VI. Distribution & Quality
The project is intended for public release. All code must be documented using industry-standard doc-comments. Semantic versioning (SemVer) is mandatory. The repository must maintain a professional README and a clear open-source license.

## Technology and Performance Standards
The project prioritizes efficiency and type safety. Memory management should be explicit where possible, and the system should aim to process thousands of nodes per second during evaluation.

## Quality and Review
All pull requests must pass the comprehensive test suite, including a set of "standard test positions" to verify move generation correctness (perft).

## Governance
The Constitution is the foundational document for all architectural decisions. Amendments require documentation of the rationale and a version bump. All PRs and reviews must verify compliance with these principles. Complexity must be justified in the implementation plan. Use `GEMINI.md` for runtime development guidance.

**Version**: 1.1.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
