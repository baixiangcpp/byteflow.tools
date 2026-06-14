# Directory Structure

Byteflow keeps top-level directories as ownership boundaries. The repository root should only contain standard project entrypoints, configuration files, and first-level boundaries such as:

- `src/` for application source.
- `public/` for checked-in static assets.
- `scripts/` for repository automation.
- `docs/` for durable architecture and design documentation only.
- `tests/` for unit, component, guard, e2e, and fixture tests.

`docs/` is intentionally limited to `docs/architecture/` and `docs/specs/`. Execution plans, audit archives, runtime reports, agent handoffs, editor settings, and local assistant assets are not repository documentation. Runtime reports should be written to ignored local output such as `output/reports/` or uploaded as CI artifacts when needed.

## Generated Artifacts

`src/generated/` is reserved for machine-generated artifacts that are checked in because runtime or CI surfaces consume them. Files in this directory must be produced by scripts and must not be edited by hand.

Current generated artifacts:

- `src/generated/tool-index.json`, produced by `npm run generate:tool-index`.
- `src/generated/client-tool-lookup.ts`, produced by `npm run generate:client-tool-lookup`.

Scripts that write generated files must create their target directories automatically when needed.

## Source Features

`src/features/tool-shell/` owns shared tool page shell components such as action bars, empty states, preview areas, Monaco editor wrappers, privacy affordances, and tool-level banners.

`src/features/tool-templates/` owns reusable tool page templates and wrappers such as hash tool templates, HTML/CSS beautifier wrappers, and Markdown preview rendering.

Canonical tool page implementations live under `src/features/tools/{tool}/page.tsx`, and each canonical tool owns metadata in `src/features/tools/{tool}/manifest.ts`. Large or complex tools should keep helper code in feature-local modules such as `logic.ts`, `utils.ts`, `types.ts`, `samples.ts`, `constants.ts`, `browser-actions.ts`, `hooks.ts`, or `components.tsx` instead of growing the page file. `logic.ts` and `utils.ts` are for pure parser, formatter, validator, and transformer code owned by that tool. Browser side effects such as downloads, FileReader, DOM helpers, and object URLs belong in `browser-actions.ts`. Their `src/app/[lang]/{tool}/page.tsx` files are thin route wrappers that import and render the feature page. Hub pages, article pages, aliases, and static pages remain under `src/app/[lang]/`.

Tool manifests are the metadata source of truth. A manifest must stay a simple literal object exported as `toolManifest` and ending with `satisfies ToolMeta`; do not use spreads, computed properties, functions, template literals, dynamic imports, React imports, or client-only modules in manifest files. The script parser and guard tests depend on that static shape.

`src/features/pipeline/` owns pipeline domain logic. Legacy imports under `src/lib/pipeline/*` are compatibility re-exports only.

`src/components/ui/` remains the home for base UI primitives, and `src/components/layout/` remains the home for site layout components.

## Core Runtime

`src/core/` owns cross-cutting infrastructure:

- `src/core/analytics/`
- `src/core/clipboard/`
- `src/core/commands/`
- `src/core/files/`
- `src/core/i18n/`
- `src/core/registry/` aggregates feature tool manifests and exposes registry APIs.
- `src/core/routing/`
- `src/core/seo/`
- `src/core/storage/`
- `src/core/utils/` owns retained shared utility implementations that are used across multiple features or shared tests. Single-tool utilities belong under `src/features/tools/{tool}/`.

`src/lib/` remains only as a legacy compatibility shim layer plus checked-in route/export manifests such as `src/lib/sitemap-lastmod.json`. TypeScript files under `src/lib` should re-export from `src/core`, `src/features`, or `src/generated`; new implementation files belong in `src/core/*` or feature-local modules. `src/lib/tool-meta*` is a legacy re-export path; new registry work should use `src/core/registry` and feature manifests.

## Scripts

New scripts must be placed in one of the grouped directories below:

- `scripts/gates/` for CI and quality gate checks.
- `scripts/generators/` for generated assets, generated source, and report baselines.
- `scripts/e2e/` for browser and Playwright-style automation.
- `scripts/postprocess/` for build output rewriting after the app build.
- `scripts/scaffolding/` for code generation wizards.
- `scripts/lib/` for modules imported by other scripts.

Do not place import-only helpers in an entrypoint directory, and do not place runnable command entrypoints in `scripts/lib/`.
