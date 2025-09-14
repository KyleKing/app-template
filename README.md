# App Template

A simplified Deno web application built with Hono (API), Vento (templating), and HTMX (AJAX interactivity)

## Setup

```sh
mise install
deno install
hk install
mise run build
```

## Development

```sh
mise watch build # Keeps built files up to date
mise watch dev |& tail-jsonl # Hot reloads on TS changes, while mise watches .vto. Optionally run with `pipx:tail-jsonl`

deno task test:watch

hk run pre-commit --all
```

## Production

```bash
deno task prod # Serves production app from built executable
```

## Environment Variables

See [./src/utils/env.ts](./src/utils/env.ts)
