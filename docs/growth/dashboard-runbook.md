# Growth Dashboard Runbook

This runbook defines the operating dashboard for byteflow.tools after SEO, privacy, PWA, and tool-discovery changes ship. It is an internal operations document, not user-facing product copy.

## Goals

- Track whether users can find the right local-first tool and complete useful actions.
- Monitor indexing, crawl health, metadata quality, and page performance after releases.
- Keep analytics privacy-safe: aggregate signals only, no tool payloads, no user identifiers, and no undisclosed external requests.

## Required Access

The dashboard owner needs explicit access to these sources before using the checklist:

- Google Search Console property for `https://byteflow.tools/`.
- Hosting/CDN dashboard for deployment, redirects, 404s, cache, and aggregate traffic.
- GitHub repository access for issues, PRs, release notes, and CI history.
- PageSpeed Insights or CrUX for aggregate Core Web Vitals.
- Privacy-safe analytics provider only if it is enabled by configuration and matches the allowlist in `docs/privacy/analytics-policy.md`.

Do not use data exports from sources that require cookies, user-level tracking IDs, session replay, advertising profiles, fingerprinting, or raw request bodies.

## North Star Metrics

| Metric | Definition | Source | Notes |
| --- | --- | --- | --- |
| Monthly tool reach | Monthly aggregate count of tool page loads, measured only if a privacy-safe aggregate provider exists. | Privacy-safe analytics | Must not rely on cookies, user IDs, fingerprints, or session IDs. |
| Successful tool operations | Count of allowlisted `tool_action`, `copy_output`, and `download_output` events. | Privacy-safe analytics | Event params must stay coarse: tool ID, action type, locale, source page, and size bucket only. |
| Indexed useful pages | Valid indexed locale home, category, tool, workflow, and article pages. | Google Search Console | Track by route family and locale, not by user. |
| Search discovery quality | Clicks, impressions, CTR, and average position for tool and workflow query clusters. | Google Search Console | GSC query data is aggregate search demand, not internal search text. |

## SEO Dashboard

Track these weekly by route family: root, locale home, all tools, category hubs, tools, workflows, articles, compare pages, alternatives, fix pages, and static trust pages.

| Metric | What To Watch | Action Threshold |
| --- | --- | --- |
| Indexed pages | Valid indexed URLs by route family and locale. | Any unexpected drop after a release. |
| Crawled currently not indexed | Pages Google crawled but did not index. | Rising count for tools, workflows, or localized pages. |
| Discovered currently not indexed | Pages found but not crawled. | Increasing count for sitemap-backed pages. |
| Duplicate without user-selected canonical | Canonical confusion. | Any core route hit. |
| Alternate page with proper canonical | Expected localized alternates. | Investigate if canonical points to the wrong locale. |
| 404 / soft 404 | Broken links, stale sitemap entries, or removed tools. | Any sitemap URL returning 404. |
| Redirect errors | Legacy route map or hosting redirect regressions. | Any redirect loop or wrong target. |
| Sitemap submitted / indexed | Sitemap acceptance and URL coverage. | Submitted count diverges from expected generated routes. |
| CTR by query cluster | Snippet/title intent match. | CTR drop greater than 20% week over week with stable position. |
| Average position | Ranking movement by cluster. | Position drop greater than 3 places for core tool clusters. |
| Core Web Vitals | LCP, INP, CLS by template. | Any route family leaving good status. |

## Product Dashboard

Use only allowlisted, aggregate events. Do not add raw input, output, query text, file information, or user identifiers.

| Event | Allowed Dimensions | Purpose |
| --- | --- | --- |
| `tool_loaded` | tool ID, locale, source page | Understand tool discovery and route health. |
| `tool_action` | tool ID, action type, locale, input size bucket, source page | Count successful local tool actions without payloads. |
| `copy_output` | tool ID, action type, locale, source page | Measure completion of copy workflows. |
| `download_output` | tool ID, action type, locale, size bucket, source page | Measure export workflows without file names or content. |
| `search_performed` | locale, query length bucket, result count, source page | Track search usefulness without query text. |
| `related_tool_click` | source tool ID, related tool ID, locale, source page | Measure workflow navigation. |
| `pwa_installed` | locale, platform bucket, source page | Track successful installs. |

If a desired event is not in the current analytics taxonomy, open a privacy review issue before adding it.

## Weekly Checklist

1. Open Google Search Console coverage and compare indexed, crawled-not-indexed, duplicate, and 404 counts with the previous week.
2. Confirm the submitted sitemap is accepted and the submitted URL count matches expected generated route families.
3. Review the top query clusters for each core category: JSON, JWT, Base64, hash, URL encoding, regex, Markdown, image tools, OpenAPI, and security headers.
4. Find pages with CTR drops greater than 20% while average position is stable; create content or metadata follow-up issues.
5. Review pages with impression growth but low CTR; check title, description, heading, and snippet intent.
6. Check legacy redirects and 404s; any sitemap URL returning 404 becomes a P1 routing issue.
7. Review Core Web Vitals by route family; create performance issues for route templates that leave good status.
8. Check privacy-safe product events for tool load to action completion by route family.
9. Confirm internal search metrics still avoid query text and only report length bucket, result count, locale, and source page.
10. Record findings in the weekly dashboard note with links to new issues.

## Monthly Checklist

1. Group GSC queries into clusters: direct tool names, local/privacy intent, alternatives, fix/how-to intent, and workflow intent.
2. Compare locale performance for `en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `de`, and `fr`; create i18n content issues where a locale underperforms with real impressions.
3. Review pages with high impressions and low action completion; check whether the tool surface matches the search intent.
4. Review content decay: pages losing impressions for three consecutive weeks should get a content refresh issue.
5. Review competitor and alternative-page queries only from aggregate GSC data; do not scrape or store user-level behavior.
6. Check release notes and CI failures for recurring SEO, PWA, sitemap, hreflang, or metadata regressions.
7. Reconfirm the analytics provider, if enabled, remains cookie-free and does not add user identifiers or new external requests.

## Post-Release Monitoring

Run this flow for every release that changes routes, sitemap, metadata, PWA, search, analytics, privacy copy, or tool templates:

1. Confirm CI passed: lint, tests, validate, build, and required smoke tests.
2. Compare generated sitemap URL counts with the previous release.
3. Spot-check `/`, `/en`, `/zh-CN`, `/en/all-tools`, `/en/json-formatter`, `/en/jwt-decoder`, `/en/base64-encode-decode`, and `/en/trust-center`.
4. In GSC, inspect a sample of changed URLs after deployment.
5. Check hosting/CDN aggregate 404s and redirect errors after 24 hours.
6. Review privacy-safe event volume for sudden drops in tool load, tool action, copy, download, search click, and PWA install signals.
7. Create issues for regressions instead of making undocumented dashboard-only fixes.

## Feedback Loop

Every dashboard finding must become one of these outcomes:

- No action: documented as expected behavior with evidence.
- New GitHub issue: include route family, locale, metric, date range, suspected cause, and acceptance criteria.
- Existing issue update: add dashboard evidence to the relevant BF or follow-up issue.
- Content refresh: identify the exact page, intent mismatch, and required localized copy scope.
- Privacy review: required before adding any event, provider, field, cookie, user identifier, or external request.

## Issue Template For Findings

```markdown
## Dashboard Finding
- Date range:
- Source:
- Route family:
- Locale(s):
- Metric:
- Current value:
- Previous value:
- Suspected cause:

## Privacy Check
- [ ] Does not include tool input/output
- [ ] Does not include JWTs, tokens, secrets, log bodies, file names, file contents, image contents, hashes, or full URLs
- [ ] Does not require cookies, user IDs, session IDs, or fingerprinting

## Proposed Action
- ...

## Acceptance Criteria
- ...
```
