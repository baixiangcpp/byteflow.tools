# Self-hosting byteflow.tools

byteflow.tools is a static Next.js export for privacy-first browser-local developer tools. A team deployment should preserve the hosted product promise:

- no account required
- no cloud history
- no server-side tool payload processing
- no default storage of tool input, output, uploaded files, logs, secrets, URLs, request bodies, response bodies, prompts, or generated content

## Deployment Options

- Static host or CDN: serve the exported app and static assets.
- Internal object storage: publish the `out/` build behind internal access controls.
- Container wrapper: use a minimal static server only for files; do not add an API that processes tool payloads.

## Privacy-Safe Analytics

Analytics should be disabled unless the deployment owner has reviewed the allowlisted taxonomy. If enabled, only aggregate event names and safe identifiers such as tool ID, category, language, size bucket, or result count are allowed. Raw search text, tool input, output, file names, file contents, tokens, logs, full URLs, request bodies, and response bodies are forbidden.

## Headers And CSP

Keep the public `_headers` policy aligned with the repository. Review CSP, Permissions-Policy, Referrer-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, and X-Content-Type-Options before publishing internally.

## PWA Cache

The PWA may cache versioned app shell files, icons, static assets, and tool chunks. Tool payloads and external-request responses must not be cached by default. Users can clear cached app files from the install page.

## Team Boundary

Commercial support can focus on packaging, security review, internal deployment help, or sponsorship. It should not depend on forced accounts, hosted payload history, or processing user tool payloads on a backend.
