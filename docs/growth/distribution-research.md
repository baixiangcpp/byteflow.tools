# Distribution Research

This note compares PWA-only, browser extension, and desktop wrapper distribution for frequent byteflow.tools users. The R&D decision is intentionally conservative: keep the PWA as the primary product, prototype only a permissionless browser extension launcher, and defer desktop packaging until demand is proven.

## Decision

Remain PWA-first. Build no production browser extension or desktop wrapper yet.

Rationale:

- PWA-only already preserves the existing browser-local runtime, offline app shell, static hosting model, Trust Center copy, and no-account access.
- A browser extension can improve repeat access, but the useful MVP is a launcher popup that opens existing tools. It does not need clipboard, host, storage, browsing-history, or page-content permissions.
- A desktop wrapper adds the highest maintenance and security review cost through native packaging, update signing, sandboxing, auto-update infrastructure, and platform-specific distribution.
- Clipboard-aware suggestions are promising only after explicit user action proves demand. They should not ship as background clipboard monitoring.

## Option Comparison

| Option | Best fit | Privacy/security model | Maintenance risk | R&D verdict |
| --- | --- | --- | --- | --- |
| PWA-only | Default cross-platform access, installable app shell, offline entry point | Browser-local tool execution, no payload sync, no forced accounts, no cloud history | Lowest; uses the existing site, service worker, cache rules, and static export | Preferred primary path |
| Browser extension | Fast launcher from browser chrome, optional future context menu handoff | Prototype uses popup links only; no clipboard, host, tabs, storage, browsing-history, or page-content permissions | Medium; marketplace review, extension API churn, permission review, and support surface | Prototype launcher only |
| Desktop wrapper | Offline-heavy users who want a native dock/taskbar app | Must preserve local-only processing and avoid payload telemetry; native shell needs sandbox and update review | Highest; Tauri/Electron packaging, signing, updates, platform QA, and vulnerability response | Defer |

## Clipboard Privacy Model

No clipboard content leaves the device.

For this R&D phase:

- The prototype does not request `clipboardRead` or `clipboardWrite`.
- The prototype does not call the Clipboard API.
- The prototype does not read the active page, selected text, browsing history, request bodies, response bodies, logs, secrets, generated output, or clipboard content in the background.
- The prototype does not send tool payloads to byteflow.tools or any third party.
- The prototype has no payload telemetry, no payload logs, no cloud history, no payload sync, and no account requirement.

If clipboard-aware suggestions are revisited later:

- Suggestions must run only after explicit user paste, explicit context-menu action, or a clear permission prompt.
- Clipboard samples must be processed locally and held only in memory for the active suggestion.
- Suggestions must send only coarse interaction events, if analytics are enabled, and never the clipboard value, derived secrets, URLs, tokens, logs, or generated output.
- A separate security review must approve any new permission, retention policy, telemetry field, or marketplace submission copy.

## Permissions

The prototype uses this minimized permission set:

- `permissions`: empty
- `host_permissions`: empty
- no content scripts
- no background service worker
- no `tabs` permission
- no clipboard permissions
- no storage permission

Opening tools is demonstrated with ordinary popup anchor links to the existing public URLs. The browser handles the new tab, so the extension does not need `chrome.tabs.create`, page access, or host access.

## MVP Scope

The only MVP worth validating next is a browser extension popup launcher that opens common tools from browser context without reading user content.

In scope:

- static popup with search-friendly names and direct links
- at least five common tools
- no clipboard access
- no background process
- no extension-side storage of payloads, history, favorites, or recent items
- no network calls from extension JavaScript
- no desktop wrapper

MVP candidate tools:

- JSON Formatter
- Base64 Encode/Decode
- JWT Decoder
- Regex Tester
- URL Encode/Decode
- UUID Generator
- Hash Generator
- Log Scrubber

## Prototype Evidence

The repository includes `prototypes/browser-extension-launcher/` as an R&D prototype. It is not a production extension package. It proves that a Manifest V3 popup can open common byteflow.tools utilities without requesting permissions or touching clipboard content.

Prototype launch targets:

1. JSON Formatter
2. Base64 Encode/Decode
3. JWT Decoder
4. Regex Tester
5. URL Encode/Decode
6. UUID Generator
7. Hash Generator
8. Log Scrubber

Manual smoke check:

```bash
# In Chrome or Edge extension developer mode:
# 1. Load unpacked: prototypes/browser-extension-launcher
# 2. Open the Byteflow Tools Launcher popup
# 3. Click at least five tool links and verify they open byteflow.tools URLs
```

Automated guard coverage verifies that the manifest has no requested permissions, the popup exposes at least five common tool links, and prototype files do not contain clipboard, network, runtime messaging, storage, or background collection APIs.

## Non-Goals

- no payload sync
- no cloud history
- no forced accounts
- no server-side tool payload processing
- no background clipboard monitoring
- no active-page scraping
- no desktop wrapper until launcher demand is proven
