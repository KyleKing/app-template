# Roadmap

## TypeScript 7.1 JavaScript API

TypeScript 7.0 ships no JavaScript API, so `import ts from "typescript"` returns only version information and `transpileModule` is gone. The 7.1 beta restores a programmatic API under new entry points (`typescript/sync` and `typescript/async`, with `transpileModule` and `transpileModuleFromFile`). Until 7.1 is stable, `app_template/scripts/build-shared.ts` strips types with `node:module` `stripTypeScriptTypes`, and TypeScript only runs `tsc --noEmit`.

### Trigger

Start when `typescript@7.1.0` (stable) is published and the entry points are no longer prefixed `unstable` or marked beta. The 7.1 beta was checked by unpacking the tarball, and its `transpileModule` was not run.

### Decide first

`stripTypeScriptTypes` already covers what `shared/` needs, because the files are erasable-only TypeScript and browsers run modern JavaScript. Switching only pays off when the output needs one of these:

- downleveling to a target older than Node 26's own syntax
- `rewriteRelativeImportExtensions` handled by the compiler instead of a regex
- a single TypeScript version governing both type checking and emit

If none applies, close this item and keep the current script. It removes the TypeScript dependency from the build, which is a benefit of its own.

### Changes if switching

- `app_template/scripts/build-shared.ts`: replace `stripTypeScriptTypes` and `RELATIVE_TS_IMPORT` with `transpileModule` from `typescript/sync`, passing `rewriteRelativeImportExtensions`, `verbatimModuleSyntax`, `module: esnext`, and `target: es2022`
- `app_template/package.json.jinja`: drop `--disable-warning=ExperimentalWarning` from `build:shared` and raise `typescript` to `^7.1.0`
- `docs/migrating-to-node.md`: rewrite the TypeScript 7 note under tool surprises and the `@deno/emit` row of the replacement table
- `mise run ctt`, then `hk check --all` in `.ctt/default` and `.ctt/demo`, to confirm the emitted `public/shared/*.js` still passes the e2e suite and the console-error fixture

### Checks before merging

- the sync API starts a native process, so time `mise run build-shared` against the current script and watch mode with `--watch`
- `transpileModule` on the empty `shared/` directory a new project starts with must stay a no-op
- relative imports written as `./x.ts`, `export * from`, and `import()` must all come out as `.js`, the cases the regex covers today

### Consumer impact

`build-shared.ts` and `package.json` are template-owned, so `copier update` carries the change to generated projects. Nothing in a consumer's own code calls `transpileModule`, so no codemod is needed. A project that calls the TypeScript API from its own scripts moves to the new entry points by hand.

## Node type stripping stability

`stripTypeScriptTypes` prints an ExperimentalWarning, which `build:shared` silences with `--disable-warning=ExperimentalWarning`. Remove the flag once Node marks the API stable, and update the guide's note at the same time.
