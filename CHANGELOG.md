## v0.4.1 (2026-09-01)

### Fix

- guard the PR step on a string so an empty output cannot throw

## v0.4.0 (2026-09-01)

### Feat

- **doneram**: install the pinned release, pin the dev tools, drop Dependabot

## v0.3.0 (2026-08-31)

### Feat

- **ci**: track tool and action pins with doneram
- **ci**: serialize Bump Version and guard the no-release case
- template-owned AGENTS.md with AGENTS.local.md for project guidance
- ship AGENTS.md with CLAUDE.md pointer, preserve per-directory AGENTS.md

## v0.2.1 (2026-08-01)

### Fix

- **ctt**: keep the demo output dir, ctt 3.0.0 now empties it

## v0.2.0 (2026-07-26)

### Feat

- convert the repo into a copier template
- **comments**: demo more htmx tricks (oob swap, delete, custom confirm)
- implement browser console fixture
- prototype mutable context
- share server-side JS
- add comments HTMX demo

### Fix

- **ci**: point mise-action at the generated case's working directory
- update ventojs for escaping patch
- correct background height
- resolve crypto type error from hono with skipLibCheck
- root and path were conflicting
- return mimetype for static files

### Refactor

- improve screenshots determinism and other small changes
- don't track built styles.css
- split up CSS for better maintainability
- bind error to context rather than log
- use zod for env
