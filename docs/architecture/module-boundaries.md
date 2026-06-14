# Module Boundaries

Byteflow modules should have clear ownership boundaries so repository layout can evolve without changing product behavior.

## Application Routes

Canonical tool page implementations live at `src/features/tools/{tool}/page.tsx`. Each canonical tool also owns metadata in `src/features/tools/{tool}/manifest.ts`. Their `src/app/[lang]/{tool}/page.tsx` files are thin wrappers that import and render the feature page. Hub pages, article pages, aliases, and static pages remain under `src/app/[lang]/`.

## Tool Shell

`src/features/tool-shell/` owns shared tool page shell components reused across many tools. This includes action bars, empty states, preview surfaces, Monaco editor wrappers, privacy UI, and tool-level banners.

`src/features/tool-templates/` owns reusable tool page templates and wrappers, including hash tool templates, HTML/CSS beautifier wrappers, and Markdown preview rendering.

Add new shared tool shell components and reusable tool templates only under the feature directories above. `src/components/ui/` remains for base UI primitives, and `src/components/layout/` remains for site layout.

Specific tool implementation details belong inside `src/features/tools/{tool}/`. Use feature-local modules such as `logic.ts`, `utils.ts`, `types.ts`, `samples.ts`, `constants.ts`, `browser-actions.ts`, `hooks.ts`, and `components.tsx` when a page grows complex. Keep `page.tsx` focused on client orchestration, state wiring, and layout. Keep `logic.ts` and `utils.ts` pure and framework-agnostic: no React, `lucide-react`, tool shell imports, lang provider imports, `document`, `window`, storage globals, Blob downloads, or `URL.createObjectURL`. Browser-only side effects such as downloads, FileReader, canvas helpers, and DOM helpers belong in `browser-actions.ts`. Keep `samples.ts`, `types.ts`, and `constants.ts` free of React imports.

## Core Runtime

`src/core` owns cross-cutting runtime infrastructure:

- `src/core/analytics/`
- `src/core/clipboard/`
- `src/core/commands/`
- `src/core/files/`
- `src/core/i18n/`
- `src/core/registry/`
- `src/core/routing/`
- `src/core/seo/`
- `src/core/storage/`
- `src/core/utils/`

`src/core/registry/` statically aggregates `src/features/tools/{tool}/manifest.ts` files and exposes the registry API used by navigation, sitemap generation, route metadata, related tools, and command palette data. Retired category metadata files under `src/core/registry/tool-meta/` are compatibility shims only.

Feature tool manifests are simple literal metadata objects. They must export `toolManifest = { ... } satisfies ToolMeta` with literal string fields and literal string arrays for parser-read fields. Do not add spreads, computed keys, functions, template literals, dynamic expressions, React imports, or client-only imports. `scripts/lib/tool-manifest-lib.js` intentionally parses this static shape so generators can fail fast with file and field names.

`src/features/pipeline/` owns pipeline domain logic. Legacy `src/lib/pipeline/*` files are re-export compatibility shims.

`src/core/utils/` owns retained cross-tool utility implementations that are still shared by several features or tests. It is guarded by an allowlist and should not become a second miscellaneous utility directory. Single-tool utilities belong under `src/features/tools/{tool}/`. `src/core/commands/` owns command palette data helpers.

`src/lib` is a legacy compatibility shim layer plus checked-in route/export JSON files. TypeScript files under `src/lib` should re-export from `src/core`, `src/features`, or `src/generated`; do not add implementation code there. `src/lib/tool-meta*` remains a re-export shim for compatibility. New tool-specific logic should start feature-local, not in `src/lib`.

## Generated Data

Generated source and generated indexes belong in `src/generated/`:

- Do not hand-edit generated files.
- Update the generator when generated content needs to change.
- Keep npm script names stable while moving script implementations.

`src/generated/tool-index.json` is the generated canonical tool index. It is written by `scripts/generators/generate-tool-index.js` and consumed by script-side generators/checks.

`src/generated/client-tool-lookup.ts` is generated source written by `scripts/generators/generate-client-tool-lookup.js`. The legacy `src/lib/tool-meta/client.ts` path is a re-export shim only.

## Script Boundaries

Script entrypoints are grouped by responsibility:

- `scripts/gates/`
- `scripts/generators/`
- `scripts/e2e/`
- `scripts/postprocess/`
- `scripts/scaffolding/`
- `scripts/lib/`

When adding a script, choose the narrowest matching group. Script entrypoints should not be added directly under `scripts/`.

## Deferred Cleanup

Deferred structure work:

- Continue splitting remaining large feature page files into feature-local components, hooks, samples, and logic when there is a focused reason to do so.
- Continue reducing broad shared utilities under `src/core/utils` into feature-local modules when ownership becomes clear.
- Remove legacy registry compatibility shims only after internal and external imports no longer rely on them.
