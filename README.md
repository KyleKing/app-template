# app-template

A [copier](https://copier.readthedocs.io) template for Deno web applications built with Hono (routing), Vento (server-rendered templates), and htmx (interactivity). It shares TypeScript between the server and the browser and manages CSS without a framework or React.

```sh
copier copy --trust gh:kyleking/app-template your-project-name
```

## What you get

| Path | Purpose |
| --- | --- |
| `src/app.ts` | Hono app with canonical JSON request logging, error handling, and static file serving |
| `src/routes.ts` | Where your page routes go. Seeded once, never overwritten |
| `src/api.ts` | JSON endpoints under `/iapi`, starting with `/healthz` |
| `src/templates/` | Vento engine, `renderPage` helper, and a base layout |
| `src/utils/` | Zod-validated env config, error handler, and HTML whitespace trimming |
| `shared/` | Isomorphic modules transpiled to `public/shared/` for the browser |
| `styles/` | Design tokens and base styles, concatenated by `scripts/build-css.ts` |
| `tests/e2e/` | Playwright fixtures that fail a test on any console error or on CSS coverage below 90% |
| `hk.pkl`, `biome.json`, `dprint.json` | Pre-commit hooks, linting, and formatting |
| `.github/workflows/ci.yml` | Tests, type check, format check, lint, and headless Chrome e2e |

## Questions

| Variable | Default | Description |
| --- | --- | --- |
| `development_branch` | `main` | Branch CI runs against |
| `project_name` | — | Lowercase, hyphens allowed. Names the binary, the deno module, and the nav brand |
| `project_description` | — | Shown on the generated home page and README |
| `author_name` | `Kyle King` | |
| `author_email` | `dev.act.kyle@gmail.com` | |
| `repository_provider` | `https://github.com` | |
| `author_username` | `kyleking` | |
| `repository_namespace` | `{{ author_username }}` | |
| `repository_url` | derived | Accept the default |
| `copyright_date` | current year | |

`hk_version` is internal (`when: false`) and pins the same hk release in `hk.pkl` and `mise.toml`.

## Files the template will not overwrite

`copier update` re-renders everything except these, which a project takes over immediately:

- `README.md`
- `src/routes.ts`
- `src/templates/pages/home.vto`
- `src/templates/partials/nav.vto`

Add a new page by writing a `.vto` file under `src/templates/pages/` and registering it in `src/routes.ts`. Add a stylesheet by dropping it in `styles/components/`; `scripts/build-css.ts` globs the directory, so no list needs editing. Same for `shared/*.ts` and `scripts/build-shared.ts`.

## Development

Rendered output for every case in [ctt.toml](./ctt.toml) is committed under `.ctt/`, so a template change shows up as a reviewable diff of generated projects:

```sh
mise run ctt          # regenerate .ctt/default and .ctt/demo
mise run ctt-demo     # regenerate only .ctt/demo
git diff .ctt         # review what changed for a generated project
```

`.ctt/default` is the bare scaffolding a new project starts from. [`.ctt/demo`](./.ctt/demo/README.md) is the same scaffolding with a runnable htmx comments demo committed on top; ctt renders over it without deleting files the template does not emit, so the demo survives regeneration. Run it with:

```sh
cd .ctt/demo && mise run build && deno task dev
```

Both directories are checked by the same [CI workflow](./.github/workflows/ci.yml) that a generated project gets.

## Upstreaming improvements from a project

Generated files split in two. Universal scaffolding (`src/app.ts`, `src/utils/`, the build scripts, the hk and CI config) is shared by every project, so an improvement made downstream belongs back in `app_template/`, with any `{{ jinja }}` variables the rendered file had filled in restored. Project-specific content (`README.md`, `src/routes.ts`, pages, nav) stays in the project; those are protected by `_skip_if_exists` and must not be pushed into the template.
