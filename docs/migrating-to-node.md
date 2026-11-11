# Migrating a project from Deno to Node 26

Template releases up to `v0.4.1` generated Deno projects. Starting with the next major release the template generates Node 26 projects that use pnpm, `node --test`, `tsc`, dprint, and Biome. Hono, Vento, htmx, the zod env config, the isomorphic `shared/` modules, the CSS build, the Playwright fixtures, hk, and mise stay.

This guide comes from a rehearsal on `.ctt/demo`, a project that keeps its own routes, nav, home page, README, tests, and a comments feature. The commands below are the ones the rehearsal ran, in order. The demo reached a green `hk check --all` (typecheck, 29 unit tests, Biome, dprint, benches, and the chrome e2e project with 100% CSS coverage).

## Steps

Start from a clean tree on a branch.

1. Delete Deno's `node_modules`. `nodeModulesDir: "auto"` leaves a `node_modules/.deno` directory (59 MB in the demo) that pnpm does not remove

    ```sh
    rm -rf node_modules
    ```

1. Update from the template. `--skip-tasks` skips the template's `git init`. If your `.copier-answers.yml` points `_src_path` at a local path, set it to `gh:KyleKing/app-template` first

    ```sh
    copier update --UNSAFE --conflict=rej --defaults --skip-tasks --vcs-ref=v1.0.0
    ```

    The demo produced no `.rej` files. Copier deleted `deno.json` and `deno.lock` because the project had not edited them, and wrote `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `scripts/bench.ts`, and `scripts/compile.ts`. The demo never edited `deno.json`. A project that did (checked on a second rehearsal) gets `deno.json.rej` and `deno.lock.rej`, and `deno.json` is deleted. Read your old dependencies and tasks with `git show HEAD:deno.json` and move them to `package.json` by hand (`pnpm add` for packages, `scripts` for tasks)

1. Install the pinned tools (`node` 26 and `pnpm` 12)

    ```sh
    mise install
    ```

1. Run the codemod. It rewrites `.ts` files in place and lists everything it could not rewrite. It exits 1 while that list is not empty. Node prints a `MODULE_TYPELESS_PACKAGE_JSON` warning for the downloaded file, which is harmless

    ```sh
    curl -fsSL https://raw.githubusercontent.com/KyleKing/app-template/v1.0.0/scripts/migrate-to-node.ts -o /tmp/migrate-to-node.ts
    node /tmp/migrate-to-node.ts .
    ```

    - `@/` becomes `#src/` and `~/` becomes `#shared/`
    - `@std/assert` becomes `node:assert/strict` (see the table below), `@std/path` becomes `node:path`, `vento/mod.ts` becomes `ventojs`, and `hono/deno` becomes `@hono/node-server/serve-static`
    - `Deno.test("name", fn)` becomes `test("name", fn)`, added to an existing `node:test` import or a new one
    - `describe`, `it`, `beforeEach`, and `afterEach` from `@std/testing/bdd` come from `node:test`
    - `deno task <name>` and `deno install` become `pnpm <name>` and `pnpm install` in `.ts`, `.vto`, and `.md` files
    - Relative imports gain their `.ts` extension
    - It prints every remaining `Deno.` use, remote specifier (`@std/`, `jsr:`, `npm:`, `http(s)://`), mention of `deno`, and non-erasable TypeScript (`enum`, `namespace`, and constructor parameter properties) in `.ts`, `.vto`, and `.md` files

1. Fix what the codemod printed (next section), then install, build, and check

    ```sh
    pnpm install --frozen-lockfile
    mise run build
    hk check --all
    ```

    Add your own dependencies with `pnpm add` before the install. The template's `pnpm-lock.yaml` only knows the template's packages

1. Delete any `.rej` files once resolved

## What the demo needed by hand

The codemod rewrote 5 files and listed 1 call site and 3 text mentions.

- `src/partials/comments_integration_test.ts` used `spy` from `@std/testing/mock`. Node's equivalent is `mock.method`, and the shapes differ

    | `@std/testing/mock` | `node:test` |
    | --- | --- |
    | `spy(console, "info")` | `mock.method(console, "info")` |
    | `spy.calls[i].args` | `spy.mock.calls[i].arguments` |
    | `spy.restore()` | `spy.mock.restore()` |

- `README.md` and a comment in `tests/e2e/comments.spec.ts` still named `deno install`, `deno task dev`, and `deno task test:e2e`. The template never overwrites a README, so these are yours to edit (`pnpm install`, `pnpm dev`, `pnpm test:e2e`)
- The codemod has no mapping for `assertExists`, `assertFalse`, `Deno.test({ ... })`, `spy` and `stub`, or `Deno.*` calls other than `Deno.test`. It leaves them and prints the line

The assertion rewrite follows this map. `assertEquals` becomes `deepEqual` because Deno's version compares deeply. In `node:assert/strict`, `deepEqual` is `deepStrictEqual`

| `@std/assert` | `node:assert/strict` |
| --- | --- |
| `assert(x)` | `assert.ok(x)` |
| `assertEquals(a, b)` | `assert.deepEqual(a, b)` |
| `assertNotEquals(a, b)` | `assert.notDeepEqual(a, b)` |
| `assertStrictEquals(a, b)` | `assert.equal(a, b)` |
| `assertMatch(s, re)` | `assert.match(s, re)` |
| `assertNotMatch(s, re)` | `assert.doesNotMatch(s, re)` |
| `assertStringIncludes(s, t, msg)` | `assert.ok((s).includes(t), msg)` |

## What a project with Deno-specific code needed

The second rehearsal generated a project from `v0.4.1`, then added what real projects have and the demo lacks: an edited `deno.json` (an extra `@std/yaml` dependency and a `seed` task), a script using `Deno.args` and `Deno.readTextFile`, a route using `Deno.env.get`, a test using `describe`, `it`, `assertThrows`, `assertRejects`, and `Deno.test({ name, fn })`, and a shared module with an `enum` and a constructor parameter property. After the update and the codemod it listed 9 call sites (14 before the codemod learned bdd, `assertThrows`, `assertRejects`, `deno task`, and non-erasable syntax). By hand it needed

- `enum Status { Open = "open" }` became `const Status = { Open: "open" } as const` plus `type Status = (typeof Status)[keyof typeof Status]`. `constructor(public id: number)` became a field declaration and an assignment. `tsc` reports both under `erasableSyntaxOnly`, and `node` fails on them at runtime
- `Deno.args`, `Deno.readTextFile`, and `Deno.env.get` became `process.argv.slice(2)`, `readFile(path, "utf8")`, and `process.env.NAME`
- `@std/yaml` became the `yaml` package (`pnpm add yaml`)
- `Deno.test({ name, fn })` became `test(name, fn)`
- A README sentence that says "A Deno web application"

It then passed `hk check --all`, with 21 unit tests and the chrome e2e project.

## Replacement map

| Deno | Node |
| --- | --- |
| `deno run x.ts` | `node x.ts` (needs `.ts` extensions, erasable syntax only: no enums, namespaces, or parameter properties) |
| `deno.json` tasks | `package.json` scripts, with mise tasks calling them |
| import map `@/`, `~/` | `package.json` `imports`: `#src/*`, `#shared/*` |
| `deno.lock` | `pnpm-lock.yaml` |
| `deno test`, `@std/assert` | `node --test`, `node:assert/strict` |
| `deno bench` | `tinybench`, run by `scripts/bench.ts` |
| `deno check` | `tsc --noEmit` |
| `deno fmt` | dprint |
| `deno lint` | Biome |
| `@deno/emit` | `node:module` `stripTypeScriptTypes`, with relative `.ts` imports rewritten to `.js` |
| `Deno.env.get`, `Deno.args`, `Deno.cwd` | `process.env`, `process.argv`, `process.cwd()` |
| `Deno.readDir`, `readTextFile`, `writeTextFile`, `mkdir`, `remove` | `readdir`, `readFile`, `writeFile`, `mkdir`, `rm` from `node:fs/promises` |
| `Deno.watchFs` | `watch` from `node:fs/promises` |
| `Deno.serve` and `hono/deno` | `@hono/node-server` (`serve`, `serve-static`) |
| Vento from `deno.land/x` | `ventojs` from npm |
| `jsr:@logtape/logtape` | `@logtape/logtape` from npm |
| `deno run npm:playwright test` | `playwright test` |
| `deno compile` | `scripts/compile.ts` (see below) |
| `deno = "latest"` in mise | `node = "26"` and `pnpm = "12"` |

### The compiled binary

`pnpm compile` bundles `scripts/app-server.ts` with esbuild, then runs `node --build-sea` on the bundle and writes `dist/<project>` (146 MB in the demo). The binary carries `--permission --allow-fs-read=. --allow-net` in its `execArgv`, serves from the project directory like `deno compile` did, and `pnpm prod` builds and starts it. esbuild is the template's only bundler and only `compile` uses it.

On macOS the binary that `--build-sea` writes is killed on launch (exit 137, no output) until it is signed. `compile.ts` runs `codesign --force --sign -` on darwin.

## Permission flags

Checked by running Node 26.13.1 with `--permission`. Without its flag, writes, reads outside the allow list, child processes, and `listen()` each fail with `ERR_ACCESS_DENIED`.

| Deno | Node |
| --- | --- |
| `--allow-read` | `--allow-fs-read=<path>` |
| `--allow-write` | `--allow-fs-write=<path>` |
| `--allow-net` | `--allow-net` (all hosts, no allow list, prints an `ExperimentalWarning` on every start) |
| `--allow-run` | `--allow-child-process` |
| `--allow-ffi` | `--allow-ffi` |
| `--allow-env`, `--allow-sys` | no equivalent. `process.env` stays readable under `--permission` |

`dev` and `prod` run with `--permission --allow-fs-read=. --allow-net`, and the dev server and the e2e suite pass with exactly that. Build scripts (`build-css.ts`, `build-shared.ts`) run without `--permission` because they write `public/`.

## Checks on the plan's four open claims

Each was run against the Node 26.13.1 spike and the demo.

1. Subpath imports resolve `.ts` files under type stripping. Yes. `tsc` (with `module: nodenext`) type-checks `#src/*` and `#shared/*`, and the dev server, `node --test`, and Playwright's web server all load them
1. `tinybench` covers what the `*_bench.ts` files measured. Yes for the four existing benches, which ran unchanged apart from the API. The table prints latency average and median, throughput, and sample count. Deno's output also had min, max, p75, and p99, which `tinybench` keeps on `task.result` but omits from `table()`. Node has no bench command, so `scripts/bench.ts` globs `*_bench.ts` and imports each, and each bench file runs when imported
1. The `--allow-*` mapping. See the table above. Two flags (`--allow-env`, `--allow-sys`) have no Node equivalent
1. Biome and dprint agree on every file type once `deno fmt` is gone. Yes after two config changes, and the demo passes both. Biome's formatter is disabled, so the two cannot disagree on formatting and only share `.ts` files for linting and formatting. The changes
    - dprint's TypeScript plugin needs `quoteStyle: "preferDouble"` and `semicolons: "asi"` (the key was `semiColons` before plugin 0.99, and an unknown key stops the whole plugin from loading) to match `deno fmt` (`alwaysDouble` escaped quotes inside the demo's inline scripts)
    - dprint's markup plugin formats `.vto` files, which `deno fmt` never touched, and rewrapped two Vento templates in the demo. `dprint.json` excludes `**/*.vto`

    The rest of dprint's output differed from `deno fmt` in two spots in the default project (a CSS gradient and a long template literal), and the template now carries the dprint form

## Tools that behave differently

- `hk check --all` failed on the Deno template too (`Hook 'check' not found`) because `hk.pkl` only defined `pre-commit`. The template now targets hk 2, where one top-level `steps` block defines the `check`, `fix`, and `pre-commit` hooks together. hk 2 also stops invoking the `pkl` CLI and stages fixes only in `pre-commit`
- hk runs from the git root. Inside `.ctt/*`, which has no repository of its own, pnpm ran in `app-template/` and then climbed to `~/package.json`. The root README shows a throwaway `git init` for running a case
- `typescript@7` is the native port and has no `transpileModule`, so `scripts/build-shared.ts` strips types with `node:module` `stripTypeScriptTypes` and TypeScript only runs `tsc --noEmit`. Having `tsc` emit `shared/` instead fails with TS18003 on the empty directory a new project starts with. The JavaScript API returns in TypeScript 7.1 (beta), tracked in [ROADMAP.md](../ROADMAP.md)
- pnpm 11 and 12 refuse releases less than a day old (`minimumReleaseAge`) and blocks dependency build scripts. `pnpm-workspace.yaml` lists `dprint: true` and `esbuild: false` under `allowBuilds`, and the template uses caret ranges so the lockfile resolves a release old enough. pnpm 12 also prints `Agent skills awaiting approval` for `@logtape/logtape` after install, which does not fail the install
- `biome migrate --write` from 2.2.4 wrote invalid globs (`!!**/**/node_modules/**`) and switched the file to tabs. The template's `biome.json` is written by hand for 2.6
- `deno lint` was configured in `deno.json` but no hk step, task, or CI step ran it, so no lint check disappears. On the old demo it reported 9 problems (6 `no-explicit-any`, 2 `no-window`, 1 `require-await`). Recommended Deno rules with no recommended Biome rule are `no-deprecated-deno-api`, `no-sloppy-imports`, `no-unversioned-import`, `no-window`, `no-window-prefix`, `no-await-in-sync-fn`, `require-await`, and the `ban-*-ignore` rules. Most only apply to Deno or are covered by `tsc`. Biome's `suspicious/useAwait` is the `require-await` counterpart and is off by default (verified: it flags `async (c) => c.json(...)`)
- `mise run build --minify` still reaches `build-css`. mise skips a task whose `sources` are unchanged, so rebuilding after a non-minified build needs `--force`

## Not checked

- Real projects. No `.copier-answers.yml` names this template under `~/Developer` or in public GitHub code search, so the manual-fix lists above come from the demo and one generated stand-in

The generated stand-in was also updated from the published `v1.0.0` tag with the `curl`ed codemod and reached the same result. A fresh `copier copy` of the update branch into an empty directory passed the same ladder using only the commands in `_message_after_copy`.
