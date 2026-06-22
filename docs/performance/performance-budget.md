# Performance Budget

BF-025 adds a route-level performance budget gate for the exported app. The budget is intentionally small and explicit: it covers the root page, English home, All Tools, JSON Formatter, Markdown Preview, and Image Resizer.

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
- `/en`
- `/en/all-tools`
- `/en/json-formatter`
- `/en/markdown-preview`
- `/en/image-resizer`

## Updating A Budget

Only update a threshold when the route growth is intentional. The PR should include:

- the route and metric that changed
- the before and after values from `npm run check:performance-budget:report`
- why the extra bytes are necessary
- confirmation that heavy dependencies still pass `npm run check:bundle-boundaries`

Do not raise budgets to hide accidental regressions. Prefer route-level code splitting, dynamic imports, or removing duplicated client code before changing the baseline.
