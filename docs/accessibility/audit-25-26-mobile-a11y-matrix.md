# Audit 25/26 Mobile and Accessibility Matrix

This matrix tracks the repeatable checks used for the mobile layout and accessibility audit batch.

## Automated Browser Matrix

Run with `npm run test:e2e:smoke` after `npm run build`.

Mobile layout routes:

- `/en`
- `/en/all-tools`
- `/en/data-code-formats`
- `/en/json-formatter`
- `/en/pipeline-builder`
- `/en/trust-center`
- `/en/install-app`

Mobile viewport widths:

- `360x740`
- `390x844`
- `430x932`
- `768x1024`

Automated checks:

- Main content renders.
- Interactive controls have accessible names.
- Visible enabled controls meet the 44px touch-target floor.
- Page-level horizontal overflow stays within the 2px tolerance.
- Runtime, console, and same-origin critical resource errors fail the smoke.

Accessibility routes:

- `/en`
- `/en/all-tools`
- `/en/json-formatter`
- `/en/pipeline-builder`
- `/en/trust-center`
- `/en/install-app`

Automated checks:

- Axe serious and critical violations must be zero.
- Color contrast is covered by token-level guards, because runtime CSS variables are not reliable in every axe environment.
- Skip link, header language menu, mobile navigation focus restoration, command palette, copy feedback, and Pipeline Builder workflows are covered by Playwright smoke journeys.

## Validation Run

The June 27, 2026 audit batch passed:

- `npm test -- --run tests/guards/mobile-a11y-audit-issues-262-263.test.ts tests/guards/playwright-smoke-matrix-guard.test.ts tests/guards/a11y-mobile-baseline.test.ts tests/guards/bf-037-a11y-qa-guard.test.ts tests/guards/bf-036-bf-038-accessibility-visual-qa-guard.test.ts`
- `npm test -- --run tests/component/representative-a11y-axe.test.tsx tests/component/phase3-pipeline-builder-page.test.tsx`
- `npm run test:e2e:smoke`
- `npm run test:e2e:pwa`
- `npm run validate`
- `npm run lint`
- `npm run build:app`
- `npm run build:post`

## Manual Follow-Up

The following checks still require real device or assistive-technology verification before closing device-specific acceptance criteria:

- Android Chrome PWA install and offline behavior.
- iOS Safari Add to Home Screen and offline behavior.
- Microsoft Edge install and offline behavior.
- Lighthouse accessibility score verification on representative pages in a stable Chrome/Lighthouse environment.
- Screen-reader output in NVDA, VoiceOver, or TalkBack for Pipeline Builder and external-request confirmation flows.
- Software keyboard overlap on physical mobile devices for multiline tool inputs.

Use `docs/accessibility/audit-23-25-26-manual-closure-runbook.md` for the required closure procedure and issue comment template.
