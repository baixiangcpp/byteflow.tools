# Browser Extension Launcher Prototype

This is an R&D prototype for issue #266. It demonstrates a Manifest V3 popup that opens common byteflow.tools utilities without requesting extension permissions.

## Decision Scope

- Keep byteflow.tools PWA-first.
- Use this extension only as a launcher proof of concept.
- Defer desktop wrappers until launcher demand is proven.
- Do not add clipboard-aware suggestions until a separate security review approves the permission model.

## Privacy Model

No clipboard content leaves the device.

The prototype:

- has empty `permissions` and `host_permissions`
- has no content scripts
- has no background service worker
- does not use clipboard APIs
- does not use extension storage
- does not fetch or beacon data
- opens tools through ordinary popup links

## Smoke Test

1. Open Chrome or Edge extension developer mode.
2. Load unpacked from `prototypes/browser-extension-launcher`.
3. Open the popup.
4. Click at least five links and confirm they open `https://byteflow.tools/en/...` tool URLs.
