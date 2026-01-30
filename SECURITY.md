# Security

## XSS Protection

This application uses **Vento templating engine** with `autoescape: true` (configured in `src/templates/engine.ts`). This automatically escapes all template variables to prevent Cross-Site Scripting (XSS) attacks.

**Important:** Vento's autoescape defaults to `false`, so it must be explicitly enabled. This project has it properly configured for security.

### Safe Usage

- Template variables are automatically escaped: `{{ comment.body }}` is safe
- Use the `|> safe` filter only for trusted, already-sanitized content
- Client-side: Use `textContent` instead of `innerHTML` for user input (see `shared/commentShape.ts`)

## Security Headers

The application includes security headers middleware (see `src/app.ts`):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` with restricted directives

## Asset Integrity

External assets (e.g., HTMX) are downloaded with SHA-256 integrity verification in `scripts/download-assets.sh`.

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainers or open a private security advisory on GitHub.
