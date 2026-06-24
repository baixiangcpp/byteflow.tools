# Distribution Research

This note compares PWA, browser extension, and desktop wrapper distribution for frequent byteflow.tools users.

## Privacy Requirements

- local-only processing by default
- no payload sync
- no cloud history
- no account requirement
- no background collection of browsing history, clipboard content, request bodies, response bodies, logs, secrets, or generated output

## MVP Candidate Tools

- JSON Formatter
- Base64 Encode/Decode
- JWT Decoder
- Regex Tester
- UUID Generator
- Password Generator
- URL Encode/Decode
- Hash Generator
- Log Scrubber

## Options

PWA is the preferred first path because it reuses the existing runtime, cache controls, and Trust Center model.

Browser extension remains research-only. It could support a popup and context-menu handoff, but permissions must be narrow and optional. It must not read page content automatically.

Desktop wrapper remains research-only. It could improve offline access, but update signing, sandboxing, and packaging increase maintenance cost.

## Decision

Continue investing in the PWA while documenting extension and desktop wrapper constraints on the public roadmap. Do not implement payload sync or cloud history.
