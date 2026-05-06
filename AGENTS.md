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

**CRITICAL RULE: NEVER COMMIT WITHOUT EXPLICIT USER PERMISSION FOR THAT SPECIFIC COMMIT**

- **NEVER commit code unless the user explicitly says "commit" or "please commit" for that specific set of changes**
- **NEVER assume that finishing a task means you can commit**
- **NEVER commit because "all tests pass" or "work is done"**
- **ALWAYS wait for explicit "commit" command from the user before running `git commit`**
- **If you make changes, present them to the user and wait for "commit" permission**
- When user says "commit", include a clear message explaining what and why
- Stage and prepare commits when asked, but do NOT commit until explicitly told with "commit"

**Examples:**
- ✅ User says: "fix this bug" → You fix it → You say "Fixed! Ready to commit?" → User says "commit" → You commit
- ❌ User says: "fix this bug" → You fix it → You commit immediately (WRONG!)
- ❌ Tests pass → You commit (WRONG - no explicit permission!)
- ❌ "work is done" → You commit (WRONG - no explicit permission!)

## Task and Bug Tracking

- When you complete a task or fix a bug, update the corresponding tracking file
- For bugs: Update `specs/bugs.md` by changing `- [ ]` to `- [x]` for the completed bug
- For todo items: Update `specs/todo.md` by changing `- [ ]` to `- [x]` for completed items
- Always mark items as complete immediately after verifying the fix works, before committing

## Testing Before Completing Work

**CRITICAL: NEVER declare work "done" or attempt a commit until ALL checks pass!**

### Tests to Run BEFORE Declaring Work Done:

1. **JavaScript Syntax Check** (Catches syntax errors):
   ```bash
   node -e "
   const acorn = require('acorn');
   const fs = require('fs');
   const files = ['www/js/timer.js', 'www/js/board.js', 'www/js/game.js', 
                   'www/js/ai.js', 'www/js/ui-cards.js', 'www/js/dialogs-newgame.js', 
                   'www/js/dialogs.js', 'www/js/index.js', 'www/js/chess-wasm.js', 
                   'www/js/storage.js'];
   let allGood = true;
   files.forEach(f => {
       try {
           const code = fs.readFileSync(f, 'utf8');
           acorn.parse(code, {sourceType: 'module', ecmaVersion: 2022});
       } catch(e) { allGood = false; console.error('Syntax error:', f, e.message); }
   });
   if (!allGood) process.exit(1);
   "
   ```

2. **JavaScript Module Export Check** (Catches missing imports like `generateUUID`):
   ```bash
   node tests/js/module_test.js
   ```

3. **Regression Tests** (Ensures no functional changes):
   ```bash
   node tests/js/regression_test.js
   ```

4. **Rust Compilation Check** (Catches type errors):
   ```bash
   cargo check
   ```

5. **WASM Build** (Ensures web deployment works):
   ```bash
   wasm-pack build --target web --out-dir www/pkg
   ```

### Example Workflow:
1. Make code changes
2. Run JavaScript syntax check → Fix if fails
3. Run module export check → Fix if fails (e.g., missing imports)
4. Run regression tests → Fix if fails
5. Run Rust compilation check → Fix if fails
6. Run WASM build → Fix if fails
7. Update `specs/bugs.md` or `specs/todo.md` to mark task complete
8. NOW you can commit

**Key Rule: If ANY test fails, DO NOT commit! Fix the errors first.**