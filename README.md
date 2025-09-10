# App Template

A simplified Deno web application built with Hono (API), Vento (templating), and HTMX (AJAX interactivity)

## Setup

```sh
mise install
deno install
hk install
```

## Development

```sh
deno task dev # Run locally and watch changes (but FYI not on .vto files)

hk run pre-commit --all

deno task test:watch
```

## Production

```bash
deno task prod # Serves production app from built executable
```

## Environment Variables

See [./src/utils/env.ts](./src/utils/env.ts)
