---
description: Build sprint workflow — phase-by-phase implementation with tests
---

# Build Sprint Workflow

For each phase in `docs/build-phases.md`, follow this loop for every feature:

## Loop: Build → Test → Commit

### 1. Implement
- Build the feature (component, service, route, etc.)
- Follow existing patterns in the codebase

### 2. Write Tests
- Create/update test file alongside the feature
- Unit tests for services and utilities (Vitest)
- Component tests for UI (Vitest + React Testing Library)
- Tests should serve as **regression tests** — they must continue passing as later features are added

### 3. Run All Tests
// turbo
- Run `npm test` to ensure ALL existing tests still pass (not just the new ones)
- Fix any regressions before proceeding

### 4. Browser Verification
- Start dev server with `npm run dev` if not already running
- Verify the feature works visually in the browser
- Take screenshots of key UI states for the walkthrough

### 5. Commit & Push
- `git add -A && git commit -m "<descriptive message>" && git push`
- One commit per feature or logical group of features

### 6. Update Progress
- Mark feature as complete in `docs/build-phases.md`
- Update walkthrough with verification results

## Phase Transition
- After completing all features in a phase, run the full test suite
- Verify everything works end-to-end in the browser
- Create a git tag: `git tag phase-N-complete`
- Move to the next phase
