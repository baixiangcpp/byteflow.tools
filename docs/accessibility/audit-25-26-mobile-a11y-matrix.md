# Audit 25/26 Mobile and Accessibility Matrix

This matrix tracks the repeatable checks used for the mobile layout and accessibility audit batch.

## Automated Browser Matrix

Run with `npm run test:e2e:smoke` after `npm run build`.

Mobile layout routes:

- `/en`
- `/en/all-tools`
- `/en/data-code-formats`
- `/en/json-formatter`
- `/en/qr-code-generator`
- `/en/base64-encode-decode`
- `/en/csv-json-converter`
- `/en/jwt-decoder`
- `/en/regex-tester`
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

Core mobile workflows run at both `390x844` and `430x932`:

- QR content update, copy feedback, and PNG download.
- CSV-to-JSON conversion, copy feedback, and JSON download.
- Pipeline sample loading, section jumps, Inspector editing, execution, output, and copy feedback.
- JSON, Base64, JWT, Markdown, Regex, Cron, Image Resizer, JSON Diff, and Text Diff core interactions.

Viewport-pressure checks run for QR, CSV, and Pipeline Builder:

- A focused input remains visible in a reduced-height `390x420` keyboard proxy.
- The primary action remains reachable at `390x420`.
- Portrait-to-landscape transition to `844x390` does not introduce page-level horizontal overflow.
- The primary action remains reachable after the landscape transition.

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

## Validation Commands

Run the full candidate commit through:

- `npm test -- --run tests/guards/mobile-a11y-audit-issues-262-263.test.ts tests/guards/playwright-smoke-matrix-guard.test.ts tests/guards/a11y-mobile-baseline.test.ts tests/guards/bf-037-a11y-qa-guard.test.ts tests/guards/bf-036-bf-038-accessibility-visual-qa-guard.test.ts`
- `npm test -- --run tests/component/representative-a11y-axe.test.tsx tests/component/phase3-pipeline-builder-page.test.tsx`
- `npm run test:e2e:smoke`
- `npm run test:e2e:mobile`
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
- Real orientation-change behavior and browser chrome/visual viewport interaction on physical devices.

Use `docs/accessibility/audit-23-25-26-manual-closure-runbook.md` for the required closure procedure and issue comment template.
