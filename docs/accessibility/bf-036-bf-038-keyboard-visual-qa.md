# BF-036/BF-038 Keyboard and Visual QA

Date: 2026-06-24

Scope: representative navigation, discovery, tool action, upload, and output surfaces for BF-036 and BF-038.

## Representative Pages

- `/en`
- `/en/all-tools`
- `/en/json-formatter`
- `/en/base64-encode-decode`
- `/en/jwt-decoder`
- `/en/regex-tester`
- `/en/image-resizer`
- `/en/json-diff-viewer`
- `/en/text-diff-checker`
- `/en/pipeline-builder`

## Manual Checks

- Header and skip link: Tab exposes a visible skip link, Enter moves focus to main content, and focus order follows the visible navigation.
- Command palette: Control/Command+K opens search, Escape closes it, arrow or Tab navigation reaches results, and Enter opens the selected tool without a mouse.
- All Tools filters: mobile filters open as a named dialog, trap focus, close with Escape, restore focus to the trigger, and announce result-count changes.
- Tool actions: shared action bars keep Sample, Import/Upload, Clear/Reset, primary run actions, Copy, Download/Export, Share, and Send to in the documented order with visible focus.
- Disabled actions: disabled Copy, Download, Preview, Save, and Send to controls expose a visible label plus an accessible disabled reason.
- Long text and mobile: long tool titles, URLs, code blocks, diff output, and card descriptions wrap or scroll within their container at 390px without page-level horizontal scrolling.
- Touch targets: interactive controls are at least 44px on mobile or coarse-pointer devices.
- Theme contrast: foreground and muted text tokens meet WCAG AA against the page background in light and dark themes.

## Automated Coverage

- `tests/guards/focus-visible-guard.test.ts` prevents removing visible focus rings from app/component surfaces.
- `tests/guards/shared-a11y-surfaces.test.ts` guards All Tools dialog focus trap/restore behavior, shared action-group names, and Pipeline Builder run status.
- `tests/guards/a11y-mobile-baseline.test.ts` guards skip-link behavior, live toast feedback, mobile touch target baseline, and core mobile routes.
- `tests/guards/all-tools-performance-a11y-guard.test.ts` guards disabled explanations plus long-text/mobile containment on All Tools.
- `tests/guards/theme-contrast-token-guard.test.ts` checks light/dark foreground and muted text contrast tokens against WCAG AA.
- `tests/guards/playwright-smoke-matrix-guard.test.ts` keeps browser smoke coverage for command palette, mobile tool pages, copy feedback, touch targets, and horizontal overflow checks.
- `tests/component/representative-a11y-axe.test.tsx` runs axe on representative dynamic pages.

## Privacy Notes

- These checks use local sample data only.
- No tool input, output, uploaded content, URLs, tokens, or generated output is persisted by the QA flow.
