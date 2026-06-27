# Next Bundled PostCSS Advisory Runbook

This runbook tracks issue #7: GHSA-qx2v-qp2m-jg93 through Next.js bundled `postcss`.

The issue must stay open until a stable Next.js release bundles `postcss >= 8.5.10`, or an upstream non-applicable determination is documented.

## Current Stable Evidence

Checked on 2026-06-27:

- `npm view next version`: `16.2.9`
- `npm view @next/bundle-analyzer version`: `16.2.9`
- `npm view next@latest dependencies --json`: bundled `postcss` is `8.4.31`
- Project dependency: `next@16.2.9`
- Project dev dependency: `@next/bundle-analyzer@16.2.9`

This does not meet the closing requirement because `8.4.31 < 8.5.10`.

## Stable Remediation Check

Run on a dedicated branch:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b chore/next-postcss-stable-check
npm view next version
npm view @next/bundle-analyzer version
npm view next@latest dependencies --json
```

If stable Next bundles `postcss >= 8.5.10`, update Next and bundle analyzer together:

```bash
npm install next@<stable-version> @next/bundle-analyzer@<stable-version> --package-lock-only
npm ci
node -p "require('./node_modules/next/package.json').version"
node -p "require('./node_modules/next/node_modules/postcss/package.json').version"
npm audit --omit=dev --json
```

Required validation before closing #7:

```bash
npm run check:audit:prod-high
npm run lint
npm test
npm run test:coverage
npm run validate
npm run build:app
npm run build:post
npm run test:e2e:smoke
npm run test:e2e:pwa
```

## Non-Goals

- Do not run `npm audit fix --force` if it downgrades Next.
- Do not merge Next canary into `main` without an explicit project decision.
- Do not suppress the advisory without upstream evidence.
- Do not loosen production audit gates.

## Closure Comment Template

```text
Next bundled PostCSS advisory closure evidence

Build commit:
Date:
Tester:

Stable Next version:
Bundled postcss version:
npm audit --omit=dev result:
check:audit:prod-high:
lint:
test:
test:coverage:
validate:
build:app:
build:post:
test:e2e:smoke:
test:e2e:pwa:

Residual notes:
```
