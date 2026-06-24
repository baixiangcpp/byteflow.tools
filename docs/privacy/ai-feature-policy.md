# AI Feature Policy

Byteflow may use deterministic or local-first helpers with AI-style naming, but AI-assisted tools must not weaken the core privacy promise: browser-local by default, no account, no cloud history, and no server-side tool payload processing.

## Current Boundary

- Existing AI-adjacent tools must declare their processing boundary in the tool manifest.
- `ai-color-palette-generator` is deterministic browser-local generation. It does not call a model service, does not send prompts, and works offline.
- New remote AI tools are not approved until product, privacy, and implementation review are complete.

## Default Rules

- Prefer local deterministic generation, browser APIs, or user-provided local files over remote model calls.
- Never send tool input, tool output, uploaded file content, image content, logs, HAR files, JWTs, API keys, private keys, certificates, prompts, generated output, full URLs, authorization headers, request bodies, or response bodies to an AI provider by default.
- Never proxy user secrets or tool payloads through a Byteflow backend.
- Do not store prompts, completions, payloads, or generated output in localStorage, sessionStorage, IndexedDB, Cache Storage, analytics, exported recipes, or share URLs unless the user explicitly opts in and the UI clearly says what is stored.
- Analytics for AI-assisted flows may include only safe aggregate identifiers already allowed by the analytics taxonomy, such as tool ID, action type, language, source page, and coarse result status.

## External AI Requirements

Any external AI behavior, if introduced later, must be treated as an external request:

- It must require an explicit user action before any request leaves the browser.
- The UI must disclose the destination domain, purpose, data sent, retention uncertainty, and offline behavior before the request.
- The tool manifest must declare `executionMode: "external-request"`, external domains, purpose key, data-sent classification, disclosure copy, and explicit consent.
- Responses must not be cached by default.
- The Trust Center and tool page must link to the external-processing disclosure.
- Tests must prove that no request runs on page load and no sensitive payload is persisted by default.

## Review Checklist

- [ ] The tool can run locally or has a justified external-request boundary.
- [ ] The manifest, UI, and docs agree on the processing boundary.
- [ ] No sensitive input is sent externally by default.
- [ ] No prompt, input, output, file content, log, token, or generated result is persisted by default.
- [ ] The user sees destination, purpose, data sent, and offline behavior before any external AI request.
- [ ] Analytics uses only allowlisted safe fields.
- [ ] Tests cover network silence, persistence shape, and disclosure copy.
