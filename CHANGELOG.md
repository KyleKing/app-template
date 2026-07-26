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
