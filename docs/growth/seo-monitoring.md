# SEO Monitoring Checklist

This checklist turns Google Search Console and build-gate output into repeatable SEO operations. It must be used with the privacy limits in `docs/privacy/analytics-policy.md`.

## Query Clusters

Track aggregate GSC queries in these clusters:

- Direct tool names: JSON formatter, JWT decoder, Base64 decode, URL encode, hash generator, regex tester.
- Local/privacy intent: local JSON formatter, browser JWT decoder, offline developer tools, privacy-first tools.
- Fix intent: JSON trailing comma, invalid Base64 length, URL malformed percent sequence.
- Workflow intent: API payload cleanup, security token review, log scrub before sharing, image social export.
- Comparison and alternative intent: jwt.io alternative, jsonlint alternative, Byteflow vs CyberChef.
- International intent: localized variants for the supported locales when GSC has enough aggregate data.

Do not combine GSC query data with user-level analytics, cookies, session IDs, or internal search text.

## URL Families

Review SEO health by family, not by individual ad hoc URLs:

| Family | Examples | Checks |
| --- | --- | --- |
| Root and locale home | `/`, `/en`, `/zh-CN` | x-default, localized title, category links, no thin root page. |
| Tool pages | `/en/json-formatter` | self canonical, all hreflang alternates, JSON-LD, unique metadata. |
| Category hubs | `/en/data-code-formats` | unique intro, linked tools, sitemap inclusion. |
| Workflow hubs | `/en/workflows/...` or equivalent route | How-to intent, related tools, localized metadata. |
| Content pages | how-to, fix, compare, alternatives | fair claims, unique title/description, Trust Center link. |
| Trust pages | privacy, about, install app, trust center | consistent privacy language and disclosed external requests. |

## Weekly GSC Review

1. Coverage: note valid, indexed, excluded, 404, soft 404, redirect error, duplicate, crawled-not-indexed, and discovered-not-indexed counts.
2. Sitemap: confirm submitted URL count and last read status.
3. Pages: sort by clicks lost week over week and flag drops not explained by seasonality or release changes.
4. Queries: group top queries into the clusters above and record changes in impressions, CTR, and average position.
5. Locales: compare the same route family across all supported locales where data is available.
6. Enhancements: check breadcrumbs, FAQ schema, software/app schema, and Core Web Vitals reports.
7. Actions: create issues for unexpected deltas with acceptance criteria and privacy-safe evidence only.

## Monthly Content Review

1. Prioritize pages with high impressions, low CTR, and stable or improving average position.
2. Refresh pages with declining impressions for three consecutive weeks.
3. Merge, redirect, or improve pages that remain crawled-not-indexed after two monthly reviews.
4. Review localized pages together; do not improve only English body copy while leaving other locales generic.
5. Check whether route metadata, headings, FAQ, examples, and related tools still match the page intent.

## Technical SEO Regression Checks

Run or verify these before using dashboard results to plan content changes:

```bash
npm run check:canonical
npm run check:hreflang
npm run check:sitemap-lastmod
npm run check:metadata-localization
npm run check:jsonld-structured-data
npm run check:rendered-i18n-copy
```

If a technical gate fails, fix the technical issue before interpreting traffic changes as content performance.

## Escalation

- P1: sitemap URL returns 404, canonical points to the wrong locale, core route has `noindex`, or privacy/trust copy contradicts current behavior.
- P2: CTR drop greater than 20% for a stable-position core tool page, crawled-not-indexed increase for generated pages, or Core Web Vitals regression.
- P3: new query cluster opportunity, low-impression content refresh, or title/description experimentation.
