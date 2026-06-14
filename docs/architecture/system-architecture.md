# System Architecture

Byteflow is a static Next.js application for browser-local developer tools. The runtime has no application database and no server API for processing tool payloads. Tool inputs are handled in client-side React modules, while build-time scripts generate registry, route metadata, PWA, sitemap, and export artifacts that are checked by CI gates.

## Runtime Model

```mermaid
flowchart TD
    User[User browser] --> StaticAssets[Static HTML, CSS, JS, PWA assets]
    StaticAssets --> AppShell[Next.js App Router shell]
    AppShell --> LocaleRoutes[src/app/[lang] routes]
    LocaleRoutes --> ToolPages[src/features/tools/{tool}]
    ToolPages --> ToolShell[src/features/tool-shell]
    ToolPages --> Templates[src/features/tool-templates]
    ToolPages --> BrowserAPIs[Clipboard, FileReader, Blob, Canvas, localStorage]
    ToolPages --> LocalDeps[Monaco, formatters, parsers, crypto, QR/barcode, PDF utilities]

    Registry[src/core/registry] --> AppShell
    Generated[src/generated] --> Registry
    Metadata[src/core/seo] --> AppShell

    Build[Build and generator scripts] --> Generated
    Build --> RouteData[src/lib route/export JSON manifests]
    Build --> PublicAssets[public generated static assets]
```

## Key Boundaries

- `src/app/[lang]/` owns locale-aware routing and static page entrypoints.
- `src/features/tools/{tool}/` owns canonical tool implementations and feature-local logic.
- `src/features/tool-shell/` owns shared tool interaction surfaces such as action bars, preview areas, editor wrappers, and empty states.
- `src/features/tool-templates/` owns reusable tool templates.
- `src/core/` owns cross-cutting runtime infrastructure such as i18n, registry, routing, route metadata, storage, clipboard, and analytics helpers.
- `src/generated/` contains checked-in generated source consumed by runtime and CI.
- `src/lib/` is a compatibility shim layer plus checked-in route/export JSON manifests.
- `scripts/` contains grouped generators, gates, post-processing, smoke automation, and scaffolding.

See [Module boundaries](module-boundaries.md) for detailed ownership rules.

## Build And Validation Flow

1. Tool manifests under `src/features/tools/{tool}/manifest.ts` are parsed by script-side generators.
2. `npm run generate:tool-index` writes `src/generated/tool-index.json`.
3. `npm run generate:client-tool-lookup` writes `src/generated/client-tool-lookup.ts`.
4. `npm run validate` checks service worker versioning, sitemap lastmod data, security headers, PWA manifests, generated asset coverage, IA stability, generated lookup consistency, i18n, and types.
5. `npm run build` runs validation, `next build` static export, and post-build export checks.
6. `npm run test:e2e:smoke` runs a browser smoke pass against the built app.

## Privacy Model

The core privacy guarantee is architectural: tool payloads should be transformed in browser-local code, not sent to a Byteflow backend. Features that require external network access must make that behavior explicit in the UI and documentation, avoid sending secrets by default, and preserve offline-safe behavior where practical.

## Deployment Model

`next.config.ts` uses `output: "export"`, so production builds produce static assets under `out/`. The result can be served by any static host or CDN that supports the generated files, security headers, PWA assets, and localized routes.
