# Agent guidelines

## Commands

- `pnpm check` type checks, `pnpm fmt` formats, and `pnpm biome check .` lints
- `pnpm test` runs unit tests (co-located `*_test.ts`) and `pnpm test:e2e` runs Playwright
- `mise run dev` starts the dev server with CSS and shared builds, and `mise run build` builds everything
- `hk check --all` runs the git-hook checks against the whole tree

Run `pnpm check` and `pnpm test` before reporting work as done.

## Layout

- `src/app.ts` wires the Hono app and routes register in `src/routes.ts`
- Templates are Vento under `src/templates/{layouts,pages,partials}`. A new page is a `.vto` under `pages/` plus a registration in `src/routes.ts`
- Styles live in `styles/`, static assets in `public/`, e2e specs in `tests/e2e/`

## Conventions

- Server-rendered semantic HTML with htmx for interactivity. Prefer server-side rendering when all else is equal
- Vento autoescaping stays on. Pass pre-rendered HTML through `|> safe` explicitly and never disable autoescape
- Accessibility is tested, not asserted: axe-core runs against `wcag2aa` plus `color-contrast` in the e2e suite
- Node permissions (`--permission`, `--allow-*`) are explicit in `dev` and `prod`. Do not broaden them without need
- Node runs `.ts` directly, so use erasable syntax only (no enums, namespaces, or parameter properties) and write the `.ts` extension on relative imports. Import project modules through `#src/*` and `#shared/*`

This file is template-owned and `copier update` keeps it current. Put project-specific guidance in `AGENTS.local.md` (loaded below when present) or in a nested `AGENTS.md` scoped to its directory.

@AGENTS.local.md
