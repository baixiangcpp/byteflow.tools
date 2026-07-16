# Audit 23/25/26 Manual Closure Runbook

This runbook covers the remaining manual checks for:

- Issue #260: PWA install, offline state, cache clearing, and update UX.
- Issue #262: mobile layout and real-device usability.
- Issue #263: accessibility, screen-reader output, keyboard paths, and Lighthouse accessibility.

Automated browser coverage already runs through `npm run test:e2e:smoke`, `npm run test:e2e:pwa`, representative axe checks, mobile overflow checks, and touch-target checks. Do not close #260, #262, or #263 from automation alone. Close them only after this runbook has real-device or assistive-technology evidence attached to the issue.

## Required Environment

Use the latest production build from `main` or a preview deploy for the PR being validated.

Required browsers and devices:

- Chrome Desktop on Windows, macOS, or Linux.
- Microsoft Edge Desktop on Windows or macOS.
- Android Chrome on a physical Android phone.
- iOS Safari on a physical iPhone.
- At least one desktop screen reader: NVDA on Windows or VoiceOver on macOS.
- At least one mobile screen reader: TalkBack on Android or VoiceOver on iOS.
- Chrome Lighthouse in a clean profile, with extensions disabled.

Record the exact date, build commit, browser version, OS/device model, and tester initials in each issue comment.

## PWA Checks For #260

Chrome Desktop:

- Open `/en/install-app`.
- Confirm Chrome-specific install instructions are visible.
- Trigger install from the browser UI or the in-app install CTA when available.
- If the install CTA is unavailable, confirm the UI explains the browser limitation and gives manual next steps.
- Open the installed app window and verify `/en/json-formatter` loads.
- Warm cache online, then turn network offline in DevTools.
- Confirm `/en/json-formatter` still runs a local JSON format flow.
- Confirm `/en/har-viewer-sanitizer` still runs a local scrub flow.
- Confirm Pipeline Builder can run a local sample pipeline while offline.
- Confirm an external-request tool shows a clear offline-required message.
- Clear cached app files from Install App and from Local Data Controls.

Microsoft Edge:

- Repeat the Chrome Desktop install, installed-window, offline local-tool, external-request offline, and cache-clear checks.
- Confirm Edge-specific install guidance is visible.

Android Chrome:

- Open `/en/install-app` on a physical Android phone.
- Confirm Android guidance is visible.
- Install to home screen where supported.
- Launch from the home-screen icon.
- Warm cache online, enable airplane mode, and run `/en/json-formatter`.
- Confirm external-request tools show offline-required messaging.
- Clear cached app files after returning online.

iOS Safari:

- Open `/en/install-app` on a physical iPhone.
- Confirm iOS Safari Add to Home Screen guidance is visible.
- Add to Home Screen.
- Launch from the home-screen icon.
- Warm cache online, enable airplane mode, and run `/en/json-formatter`.
- Confirm external-request tools show offline-required messaging.
- Confirm cache-clear instructions are still discoverable from Install App and Local Data Controls.

Update behavior:

- With a waiting service worker available, confirm update availability is communicated as a user-triggered action.
- Confirm active tool input is not silently discarded before the user chooses to refresh.

## Mobile Checks For #262

Run on Android Chrome and iOS Safari.

Routes:

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

For each route:

- Confirm there is no page-level horizontal scrolling.
- Confirm header navigation opens, closes, and restores focus.
- Confirm primary buttons and icon buttons are easy to tap.
- Confirm copy/export actions show visible feedback.
- Rotate between portrait and landscape where practical.

Software keyboard:

- On `/en/json-formatter`, focus the input, type invalid JSON, fix it, and run format.
- Confirm the keyboard does not hide the active input or primary action in a way that prevents completion.
- On `/en/base64-encode-decode`, enter a long URL-like value and copy output.
- On `/en/qr-code-generator`, edit QR content, download PNG, and confirm copy feedback with the keyboard open.
- On `/en/csv-json-converter`, convert a short CSV payload, copy the result, and confirm the Convert action remains reachable.
- On `/en/regex-tester`, edit pattern and sample text with the keyboard open.

Pipeline Builder:

- Open `/en/pipeline-builder`.
- Use the compact Steps, Input/output, and Inspector section jumps in portrait and landscape.
- Select a step, edit its label in Inspector, and return to the input without searching through the full page.
- Confirm the mobile diagnostics are readable without forcing page-level horizontal scrolling.
- Run the default sample or a local sample.
- Confirm run status and output are visible.
- If the workflow is too dense on a specific device, record the device/browser and exact blocker instead of marking pass.

## Accessibility Checks For #263

Desktop keyboard:

- Tab to the skip link, activate it, and confirm focus moves to main content.
- Open the command palette with Control/Command+K, search for `json`, select a result, and close with Escape.
- Navigate header language controls with keyboard only.
- Complete JSON Formatter input, run, copy, and clear with keyboard only.
- Complete Pipeline Builder sample run with keyboard only.
- Open and close modal/dialog surfaces with Escape and confirm focus restoration.

Screen reader:

Use NVDA or VoiceOver for desktop checks and TalkBack or iOS VoiceOver for mobile checks.

JSON Formatter:

- Confirm the input has a clear accessible name.
- Confirm invalid JSON exposes an error announcement or associated alert.
- Confirm copy success is announced.

All Tools:

- Confirm search field has a clear accessible name.
- Confirm result-count changes are announced through a polite status.
- Confirm mobile filter drawer has a dialog name and description, traps focus, closes with Escape, and restores focus.

Pipeline Builder:

- Confirm initial input and final output have clear accessible names.
- Confirm run status updates are announced.
- Confirm run-log table or mobile cards are understandable by the screen reader.
- Confirm failures expose an alert.

External-request flow:

- Confirm destination, purpose, data sent, and offline behavior are read before confirmation.
- Confirm preview/download actions remain disabled until explicit confirmation.

Lighthouse:

- Run Lighthouse accessibility in Chrome with a clean profile and extensions disabled.
- Representative URLs:
  - `/en`
  - `/en/all-tools`
  - `/en/json-formatter`
  - `/en/pipeline-builder`
  - `/en/trust-center`
  - `/en/install-app`
- Required result: each representative page has accessibility score >= 90.
- Attach the score table or report links to #263 before closing.

## Closure Comment Template

Use this template when all required checks pass:

```text
Manual closure verification for #260/#262/#263

Build commit:
Date:
Tester:

PWA:
- Chrome Desktop:
- Edge Desktop:
- Android Chrome:
- iOS Safari:

Mobile:
- Android Chrome device/browser:
- iOS Safari device/browser:
- Routes checked:
- Software keyboard result:
- Pipeline Builder result:

Accessibility:
- Desktop keyboard result:
- Desktop screen reader:
- Mobile screen reader:
- Lighthouse score table:

Residual notes:
```

If any item fails, keep the issue open and create a follow-up bug with the exact device/browser, route, steps, expected behavior, and observed behavior.
