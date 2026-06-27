# Integration R&D Decision

This document covers the R&D phase for editor, terminal, local API, and self-host automation integrations. The decision is intentionally narrow: prove demand with a local CLI prototype first, keep the website and PWA as the primary product, and do not add hosted payload processing.

## Decision

Choose a minimal CLI prototype as the next integration path.

Rationale:

- It proves browser-independent local transformations with the smallest permission surface.
- It supports CI, shell, and self-host automation workflows without adding accounts, cloud history, or server-side payload processing.
- It can reuse small pure transformation functions before any editor extension or local API is justified.
- It creates evidence for demand before maintaining marketplace packages, extension permissions, native packaging, or a daemon.

Non-goals for this phase:

- no hosted API that processes tool payloads
- no synced history, account login, or cloud workspace
- no background clipboard, file, browser history, page content, request body, response body, or log collection
- no production-supported package distribution until demand is proven

## Option Comparison

| Option | Best fit | Privacy/security model | Maintenance risk | R&D verdict |
| --- | --- | --- | --- | --- |
| VS Code extension | Editor commands for formatters, encoders, log scrubbers, and validators | Operate only on explicit selection or active document after a command; no background document scanning; no telemetry payloads | Marketplace packaging, extension API churn, workspace trust, and permission review | Defer until CLI demand identifies top commands |
| CLI | Terminal, CI, local scripts, and self-host automation | Read stdin or explicit files, write stdout or explicit output files, no network, no payload persistence by default | Lowest packaging surface; still needs cross-platform tests and versioning | Chosen MVP path |
| Local API | Internal tools calling local transformations over HTTP | Bind to loopback only, disabled by default, no request logs, explicit CORS policy, no external listener | Security review, daemon lifecycle, port conflicts, CSRF/CORS risks | Defer until CLI workflows need a long-lived process |
| Self-host automation | Static hosting, Docker/static file serving, internal deployment checks | Serve static app files only; do not add server-side tool payload processing; keep PWA cache rules | Deployment docs and support matrix cost | Continue supporting static export, not a payload API |

## Top Integration Workflows

1. Format or minify JSON in a shell pipeline before committing API fixtures.
2. Decode Base64 or Base64URL payloads from logs without pasting them into a website.
3. Scrub logs before attaching them to tickets or CI artifacts.
4. Validate schema/OpenAPI fixtures in CI before deployment.
5. Run local hash, UUID, URL encode/decode, and JWT inspection utilities from editor tasks or scripts.

## MVP Scope

The first MVP should be a local CLI package that supports:

- `json-format` and `json-minify` from stdin to stdout
- `base64-encode` and `base64-decode` from stdin to stdout, including URL-safe mode
- exit code `0` for successful transformations and non-zero for invalid input or unsupported commands
- no network calls
- no implicit file writes
- no payload logging

Future CLI candidates, after usage evidence:

- `log-scrub`
- `json-schema-validate`
- `url-encode` and `url-decode`
- `hash`
- `jwt-decode`

## Prototype Evidence

The repository includes `scripts/prototypes/byteflow-local-cli.mjs` as an R&D prototype. It is not a published product package. It proves local transformation outside the website by running Node-only commands over stdin/stdout:

```bash
printf '{"b":2,"a":1}' | node scripts/prototypes/byteflow-local-cli.mjs json-format
printf 'hello' | node scripts/prototypes/byteflow-local-cli.mjs base64-encode
printf 'aGVsbG8=' | node scripts/prototypes/byteflow-local-cli.mjs base64-decode
```

Acceptance tests run the prototype as a child process and verify JSON formatting, JSON minifying, Base64 encode/decode, URL-safe mode, invalid input failure, and absence of executable network APIs in the prototype source.

## Self-Hosting Impact

No deployment change is required for the static app. If a team wraps this prototype for internal automation, keep it local to the runner or workstation. Do not expose it as a hosted payload-processing API unless a separate security review defines authentication, loopback binding, CORS, request logging, retention, rate limits, and incident response.
