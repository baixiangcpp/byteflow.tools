# BF-037 Screen Reader QA

Date: 2026-06-24

Scope: representative dynamic tool interfaces for BF-037.

## Representative Pages

- `/en/json-formatter`
- `/en/all-tools`
- `/en/pipeline-builder`
- `/en/youtube-thumbnail-grabber`

## Manual Checks

- JSON Formatter: input editor exposes the accessible name "Input"; invalid JSON marks the input invalid and associates the parse alert through `aria-describedby`; disabled download explains why it is unavailable.
- All Tools: search exposes the result-count status as its accessible description; filtered result counts announce through a polite live region; the mobile filter drawer has a dialog name, description, trapped focus, Escape close, and focus restoration.
- Pipeline Builder: final output is label-associated; run-log status announces through a polite live region; the run-log table has an accessible name; run failures expose an alert.
- External-request media flow: confirmation panel identifies the destination/purpose/data sent; preview/download actions remain disabled with accessible descriptions until explicit confirmation.
- Shared tool actions: action groups expose a toolbar label; disabled actions use visible button names plus programmatic descriptions, without exposing tool payloads.
- Copy, download, export, save, and share feedback: toast title/description text is mirrored into the shared polite status region so success and failure states are announced consistently.

## Automated Coverage

- `tests/component/representative-a11y-axe.test.tsx` runs `axe-core` on the representative rendered states above.
- `tests/component/toaster-live-region.test.tsx` verifies the shared toast status region announces current success and failure feedback.
- Existing Playwright smoke continues to exercise keyboard and basic accessible-name checks across core routes and mobile tool journeys.

## Privacy Notes

- The QA states use sample/local test data only.
- No tool input, output, uploaded content, logs, URLs, tokens, prompts, or generated output are persisted by these checks.
