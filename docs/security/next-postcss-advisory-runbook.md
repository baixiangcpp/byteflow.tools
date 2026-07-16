# Next Bundled PostCSS Advisory Runbook

This runbook records the remediation for issue #7: GHSA-qx2v-qp2m-jg93 through
Next.js bundled `postcss`.

## Stable Remediation

Checked on 2026-07-16:

- `npm view next version`: `16.2.10`
- `npm view @next/bundle-analyzer version`: `16.2.10`
- Stable Next still declares vulnerable `postcss@8.4.31`.
- The project keeps Next, `@next/bundle-analyzer`, and `eslint-config-next` aligned at
  stable `16.2.10`.
- A controlled npm override replaces only Next's internal PostCSS copy with
  `postcss@8.5.10`, the first patched version already used by Next 16.3 canaries.

This avoids the unsafe framework downgrade proposed by `npm audit fix --force`, does
not suppress the advisory, and keeps the application on a stable Next release.

After `npm ci`, verify the effective dependency and production audit:

```bash
node -p "require('./node_modules/next/package.json').version"
node -p "require('./node_modules/next/node_modules/postcss/package.json').version"
npm audit --omit=dev --json
```

Expected results:

- Next reports `16.2.10`.
- Next's effective PostCSS reports `8.5.10`, satisfying `postcss >= 8.5.10`.
- The production audit reports 0 moderate/high/critical vulnerabilities and no
  `next -> postcss` advisory path.

## Upstream Evidence

- Advisory: https://github.com/advisories/GHSA-qx2v-qp2m-jg93
- Next PostCSS 8.5.10 bump: https://github.com/vercel/next.js/pull/93288
- Next applicability discussion: https://github.com/vercel/next.js/issues/93234

## Regression Validation

Run the complete release-sensitive validation set whenever the Next version or
override changes:

```bash
npm run check:audit:prod
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
- Do not remove the override until stable Next resolves PostCSS to `8.5.10` or newer
  without it.

## Closure Comment Template

```text
Next bundled PostCSS advisory closure evidence

Build commit:
Date:
Tester:

Stable Next version:
Bundled postcss version:
npm audit --omit=dev result:
check:audit:prod:
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
