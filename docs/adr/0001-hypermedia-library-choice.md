# ADR 0001: Hypermedia library choice for the demo template

Status: Proposed
Date: 2026-07-25

## Problem

The demo (`.ctt/demo/src/templates/pages/comments.vto`) uses htmx 2.0.x for AJAX interactivity, pinned via `scripts/download-assets.sh`. The repo is moving toward a copier template with the demo split into its own directory, and dependencies are getting a general upgrade pass. That's a good point to record why htmx is the reference pattern here, and whether an alternative fits the "no framework" goal better, rather than carry the choice forward implicitly.

Two references prompted this: the [htmx tricks chapter](https://hypermedia.systems/tricks-of-the-htmx-masters) from _Hypermedia Systems_, and the [Datastar getting started guide](https://data-star.dev/guide/getting_started#data-on).

## Options considered

### htmx (current)

Attribute-driven (`hx-get`, `hx-post`, `hx-swap`, ...). Request/response cycle: the browser sends a normal HTTP request, the server returns an HTML fragment, htmx swaps it into the DOM. No change to the Hono routes' request/response shape, matches how `commentsRouter.ts` already works.

Relevant tricks from the chapter, not yet used in the demo:

| Trick                                                            | What it does                                                                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `hx-swap-oob`                                                    | Lets one response update more than one place in the page (e.g. a comment count alongside the new comment) |
| `hx-swap` modifiers (`settle:`, `show:`, `scroll:`)              | Tune the pause between DOM insertion and CSS transition, and scroll behavior after a swap                 |
| `hx-trigger` with `delay:`/`changed`                             | Debounce input-driven requests                                                                            |
| `hx-sync`                                                        | Prevent overlapping requests from the same element                                                        |
| `HX-Trigger` response header + `htmx:configRequest`/`htmx:abort` | Server-initiated client events, request interception, cancellation                                        |
| `htmx.logAll()`                                                  | Console log of htmx's internal event stream, for debugging trigger issues                                 |

### Datastar

Combines htmx-style backend-driven swaps with Alpine-style client reactivity in one small library, via `data-*` attributes (`data-on:click="@get('/endpoint')"`, `data-signals`). The backend side is different in kind, not degree: it streams Server-Sent Events (`datastar-patch-elements`) that Datastar morphs into the DOM by element ID, rather than one request producing one HTML response. Adopting it here would mean adding an SSE-emitting route in Hono, not just swapping markup.

### Alpine.js + fetch (not in either link, included for completeness)

Client-side reactivity without a backend contract change, but no built-in AJAX pattern of its own, you'd hand-roll `fetch` calls. Doesn't demonstrate the "hypermedia" idea the template seems to want to teach.

## Recommendation

Keep htmx as the reference pattern and pull three of the tricks above into `comments.vto` when the demo moves to its standalone directory:

- `hx-swap-oob` for a live comment count, since it's the clearest illustration of "one response, multiple DOM updates" and needs no new infrastructure
- `hx-swap` modifiers (`settle:`, `show:`) to demonstrate transition timing control
- `hx-sync` on the comment form to prevent duplicate submits

Datastar is worth revisiting if the template grows a feature that's naturally SSE-shaped (live updates pushed from the server without a client poll or request), since that is where it's built to fit. Introducing it now would add a second hypermedia library with an overlapping purpose, and a backend contract (SSE) the rest of the app doesn't otherwise use. Note it as an alternative and link the getting-started guide rather than build a parallel demo.

## Consequences

- `public/htmx.min.js` bumped from 2.0.6 to 2.0.10 via `scripts/download-assets.sh` (done as part of the general dependency upgrade).
- No code change yet for the htmx tricks or Datastar; both are deferred to the demo's move into its own directory so the work isn't done twice against a structure that's about to change.
