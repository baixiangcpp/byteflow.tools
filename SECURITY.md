# Security Policy

Byteflow is designed so core tool processing happens locally in the browser. Even so, security issues can still appear in dependencies, static export behavior, PWA assets, headers, routing, sanitization, clipboard handling, or documentation examples.

## Supported Scope

Security fixes target the latest maintained branch and the hosted production site at [byteflow.tools](https://byteflow.tools).

## Reporting a Vulnerability

Please do not open a public issue for vulnerabilities.

Use GitHub private vulnerability reporting when available:

<https://github.com/baixiangcpp/byteflow.tools/security/advisories/new>

If private reporting is unavailable, open a public issue with only a minimal request for a private security contact. Do not include exploit details, private payloads, tokens, customer data, or working proof-of-concept code in a public thread.

Helpful reports include:

- Affected URL, package, script, or file.
- Reproduction steps with sanitized sample data.
- Browser and OS details when relevant.
- Expected impact and any known mitigations.
- Whether the issue affects the hosted site, local development, static export artifacts, or repository automation.

## Handling Expectations

Maintainers will triage security reports as quickly as practical, validate impact, prepare a fix, and coordinate disclosure when needed. Please keep vulnerability details private until a fix or mitigation is available.

## Security Hygiene for Contributions

- Do not commit secrets, real tokens, private customer data, or sensitive payloads.
- Use sanitized fixtures and screenshots.
- Keep tool processing local unless a feature explicitly documents a network requirement.
- Run relevant validation before PRs that touch routing, sanitization, generated output, PWA assets, security headers, or export post-processing.
