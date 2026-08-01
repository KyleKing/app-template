# Agent guidelines

## Commands

- `deno task check` type checks; `deno task fmt` formats; `deno task biome check .` lints
- `deno task test` runs unit tests (co-located `*_test.ts`); `deno task test:e2e` runs Playwright
- `mise run dev` starts the dev server with CSS and shared builds; `mise run build` builds everything
- `hk check --all` runs the git-hook checks against the whole tree

Run `deno task check` and `deno task test` before reporting work as done.

## Layout

- `src/app.ts` wires the Hono app; routes register in `src/routes.ts`
- Templates are Vento under `src/templates/{layouts,pages,partials}`; a new page is a `.vto` under `pages/` plus a registration in `src/routes.ts`
- Styles live in `styles/`, static assets in `public/`, e2e specs in `tests/e2e/`

## Conventions

- Server-rendered semantic HTML with htmx for interactivity; prefer server-side rendering when all else is equal
- Vento autoescaping stays on; pass pre-rendered HTML through `|> safe` explicitly and never disable autoescape
- Accessibility is tested, not asserted: axe-core runs against `wcag2aa` plus `color-contrast` in the e2e suite
- Deno permissions are explicit in each task; do not broaden them without need

A directory may add its own `AGENTS.md` to extend or override this file for the code under it. Template updates never overwrite any `AGENTS.md`.
