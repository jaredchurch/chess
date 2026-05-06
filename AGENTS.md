Instructions from: /workspaces/chess/AGENTS.md

# Agent Guidelines for Chess Project

## File Organization

### CSS and JavaScript Separation
- **Never** mix CSS into HTML files (no `<style>` tags in HTML)
- **Never** mix JavaScript into HTML files (no `<script>` tags with inline code in HTML)
- All CSS goes in `./www/css/` directory as `.css` files
- All JavaScript goes in `./www/js/` directory as `.js` files
- HTML files should only contain markup and `<script src="...">` or `<link rel="stylesheet">` tags

### Source Code Organization
- Source files in `src/` should be kept small and focused
- Split large modules into smaller, specialized files
- Each file should have a single responsibility

## Code Quality

### File Headers
Every source file must include a header comment explaining:
- Copyright and license information
- Brief description of what the file does
- Any important notes about usage

Example:
```javascript
// Copyright (c) 2026 Chess Core Team
// Licensed under the MIT License. See LICENSE file in the project root for details.
//
// Chess WASM Bridge - Handles communication between the Rust WASM module
// and the web UI. Manages game state, moves, and AI interactions.
//
```

### Code Comments
- Comment **why**, not what (the code shows what, comments explain why)
- Explain non-obvious decisions, workarounds, or business logic
- Complex algorithms need detailed explanation of approach
- TODOs and FIXMEs should reference issues when possible

Bad example:
```javascript
// Increment counter
counter++;
```

Good example:
```javascript
// Player selected "random" - AI always goes second in chess
// so random means player could be white (AI=black) or black (AI=white)
```

## Module Structure

### HTML
```
www/index.html          - Minimal markup only
www/css/*.css           - Stylesheets
www/js/*.js             - JavaScript modules
```

### Rust/WASM
```
src/
  ai/                   - AI logic
  board/                - Board representation
  game_storage/         - Game persistence
  move_gen/             - Move generation
  serialization/        - FEN, PGN handling
  wasm.rs               - WASM exports (keep minimal)
  lib.rs                - Module declarations
```

## General Principles

1. **Single Responsibility**: Each file does one thing well
2. **Consistency**: Follow existing code patterns
3. **Clarity over Cleverness**: Write readable, maintainable code
4. **No Magic Numbers**: Use named constants with explanation

## Commit Discipline

- **Never commit without explicit instruction**
- Wait for the user to explicitly say "commit", "push", or similar
- Stage and prepare commits when asked, but do not commit until told
- When user says "commit", include a clear message explaining what and why

## Task and Bug Tracking

- When you complete a task or fix a bug, update the corresponding tracking file
- For bugs: Update `specs/bugs.md` by changing `- [ ]` to `- [x]` for the completed bug
- For todo items: Update `specs/todo.md` by changing `- [ ]` to `- [x]` for completed items
- Always mark items as complete immediately after verifying the fix works, before committing