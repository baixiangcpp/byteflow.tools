# Performance Budget

BF-025 adds a route-level performance budget gate for the exported app. Issue #261 expands that gate to include Pipeline Builder and ties route budgets, heavy-worker safeguards, and release Core Web Vitals checks into one performance audit boundary. The budget is intentionally small and explicit: it covers the root page, All Tools, Pipeline Builder, JSON Formatter, Markdown Preview, and Image Resizer.

## CI Behavior

CI runs `npm run validate`, which checks that the performance budget configuration is present and well formed. After `npm run build:app`, CI runs `npm run build:post`; that command includes `npm run check:performance-budget:report` and prints a route bundle summary.

The report fails when any route exceeds its configured budget. The current budget tracks:

- initial JavaScript gzip bytes
- initial JavaScript raw bytes
- initial script file count
- CSS gzip bytes
- CSS raw bytes
- rendered HTML bytes

## Routes

Budgets live in `scripts/gates/performance-budgets.json` for these baseline routes:

- `/`
- `/en/all-tools`
- `/en/pipeline-builder`
- `/en/json-formatter`
- `/en/markdown-preview`
- `/en/image-resizer`

## Performance Audit Targets

Issue #261 uses these release targets:

- LCP p75: 2.5 seconds or faster for major route families.
- CLS p75: 0.10 or lower for major route families.
- INP p75: 200 ms or faster for major route families.
- Large local inputs: representative 256 KB+ text/SVG payloads and 4 MB image buffers must route through workers or explicit runtime budgets instead of blocking the main thread.
- Representative browser smoke: home, All Tools, Pipeline Builder, JSON Formatter, Base64, CSV/JSON, and locale navigation must complete without uncaught runtime errors, console errors, or failed same-origin app requests.

CI enforces route bundle budgets in `npm run build:post`, worker and runtime-budget coverage in unit/guard tests, and representative no-console/no-failed-request smoke coverage in `npm run test:e2e:smoke`. Field Core Web Vitals are reviewed after release in the dashboard runbook. Any route family leaving the LCP, CLS, or INP targets above should get a follow-up performance issue before traffic changes are interpreted as content demand.

## Worker And Runtime Coverage

The current heavy-work boundary is:

- `tests/guards/monaco-editors-defer-source-guard.test.ts` keeps Monaco deferred behind desktop interaction.
- `tests/guards/bf-heavy-worker-safeguards.test.ts` keeps image edit, image resize, scanned PDF, SVG, compression, and regex-heavy work on worker tasks with abort/timeout handling.
- `tests/unit/heavy-worker-representative-inputs.test.ts` runs representative large inputs through workers and verifies timeout paths do not fall back to main-thread work.
- `tests/guards/tool-runtime-budget-guard.test.ts` keeps high-risk parser and diff tools on centralized byte, row, endpoint, and node budgets.
- `tests/guards/csv-json-converter-performance-guard.test.ts` keeps CSV/JSON conversion behind a worker and abortable request flow.

## All Tools Discovery Budget

The All Tools page uses a hybrid incremental-rendering strategy instead of list virtualization. Each category group renders up to 6 rich cards by default, then keeps overflow tools as compact, crawlable links behind the same group. This preserves SEO coverage for every tool link while avoiding a full rich-card render for large inventories.

Risk baseline: the catalog already has more than 100 tools and can grow past 200. Rendering every tool as a full card would scale card DOM, badges, descriptions, controls, and hover states linearly with catalog size. At the 300-tool acceptance target, an uncapped group would render 300 rich cards before any user interaction. Issue #244 tracks that risk even when the current page is not yet failing performance budgets.

Current after state:

- `src/features/tool-discovery/all-tools-discovery.tsx` sets `INITIAL_GROUP_TOOL_LIMIT = 6`.
- `tests/component/all-tools-discovery.test.tsx` renders 300 synthetic tools and asserts the collapsed state stays at 6 rich cards plus 294 compact crawlable links.
- The same test verifies filtering preserves the 6-card budget and exact search results collapse to 1 rich card with 0 compact overflow links.
- Rich cards are marked with `data-all-tools-card="true"` and compact SEO links are marked with `data-all-tools-compact-link="true"`.
- Expanded groups use `aria-expanded` and keep the full card list user-triggered.

Latest local after-change route report from `npm run build:app && npm run build:post`:

| Route | JS gzip | JS raw | Scripts | CSS gzip | HTML |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/en/all-tools` | 260.4 KiB / 278.3 KiB | 953.9 KiB / 1001.0 KiB | 19 / 20 | 26.8 KiB / 34.2 KiB | 454.4 KiB / 605.5 KiB |

Route budget for `/en/all-tools` is enforced by `npm run check:performance-budget:report` after `npm run build:app`:

- initial JS gzip: 285000 bytes
- initial JS raw: 1025000 bytes
- initial scripts: 20
- CSS gzip: 35000 bytes
- CSS raw: 220000 bytes
- rendered HTML: 620000 bytes

PRs that materially change All Tools card markup, filters, search, or category rendering should include the before and after `/en/all-tools` row from `npm run check:performance-budget:report` and confirm the 300-tool component budget still passes.

## Updating A Budget

Only update a threshold when the route growth is intentional. The PR should include:

- the route and metric that changed
- the before and after values from `npm run check:performance-budget:report`
- why the extra bytes are necessary
- confirmation that heavy dependencies still pass `npm run check:bundle-boundaries`

Do not raise budgets to hide accidental regressions. Prefer route-level code splitting, dynamic imports, or removing duplicated client code before changing the baseline.
