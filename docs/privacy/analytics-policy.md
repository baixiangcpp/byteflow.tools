# Privacy-Safe Analytics Policy

This policy defines what operational dashboards may collect and what they must never collect. It applies to product analytics, dashboard exports, GSC review notes, screenshots, and issue evidence.

## Allowed Aggregate Signals

Analytics may use only allowlisted aggregate events and coarse dimensions:

- Event name.
- Tool ID or route family.
- Locale.
- Source page or template family.
- Action type from a fixed list.
- Result count.
- Size bucket, not exact content.
- Query length bucket, not query text.
- PWA install state or platform bucket.

Any new field requires a privacy review issue before implementation.

## Prohibited Data

Never collect, store, export, paste into issues, or send to a provider:

- Tool input.
- Tool output.
- JWTs, tokens, passwords, API keys, private keys, certificates with private material, or secrets.
- Payloads, request bodies, response bodies, logs, stack traces, HAR bodies, environment dumps, or configuration files.
- File names, file paths, file contents, image contents, document contents, or generated output containing original content.
- Raw internal search query text.
- Full URLs, URL query strings, fragments, or user-provided URLs.
- Hash values derived from user content.
- Email addresses, IP addresses, user IDs, account IDs, session IDs, cookies, device IDs, or fingerprints.
- Session replay, screen recordings, keystrokes, clipboard contents, or form field values.

## Provider Requirements

An analytics provider may be enabled only when it satisfies all requirements:

- Cookie-free by default.
- No user-level identifier.
- No fingerprinting.
- No session replay.
- No advertising or retargeting use.
- No tool input/output capture.
- Configurable by environment variable or build-time setting.
- Disclosed in Privacy Policy and Trust Center before launch.
- Covered by tests or gates that prevent forbidden fields.

If any requirement is uncertain, do not enable the provider. Mark the PR `needs-human-review`.

## Search Data Rules

There are two different search sources:

- Google Search Console queries are aggregate external search demand and may be reviewed in dashboard summaries.
- Byteflow internal search and command palette queries must not collect query text. Only query length bucket, result count, locale, and source page are allowed.

Never join GSC query data with user-level analytics or internal search behavior.

## File And Tool Data Rules

File and tool workflows may report only safe buckets:

- Size bucket instead of exact size when needed.
- Tool ID instead of file name.
- Action type instead of raw command or payload.
- Success/failure count without error payloads.

Do not log file names, MIME-derived personal names, file hashes, previews, extracted text, image pixels, or generated output.

## Dashboard Export Rules

Dashboard exports may contain aggregate rows only. Before sharing an export in an issue or PR:

1. Remove any raw URL query string.
2. Remove any free-text query from internal search sources.
3. Remove user, session, cookie, IP, device, and account columns.
4. Remove file names and full referrers.
5. Keep only date range, route family, locale, metric name, aggregate value, and dashboard source.

## Review Checklist

- [ ] The metric is aggregate.
- [ ] The field is allowlisted.
- [ ] No raw input or output appears in the event, screenshot, log, or issue.
- [ ] No identifier can track a person or browser across time.
- [ ] The provider is disclosed.
- [ ] Privacy Policy and Trust Center remain consistent.
- [ ] Tests or gates cover the field before merge.
