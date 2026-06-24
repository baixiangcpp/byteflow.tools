# Topic Clusters and Localized SEO Strategy

Date: 2026-06-24

Scope: BF-042 and BF-043 content planning for privacy-first local browser developer tools.

## Pillar Clusters

The eight active pillar clusters are defined in `src/core/growth/topic-clusters.ts` and map to the primary category hubs:

- JSON and structured data ecosystem
- API debugging, HTTP, and OpenAPI
- JWT, auth, crypto, and certificates
- Logs, DevOps, and incident handoff
- Text, regex, and Unicode
- Images, SVG, and CSS generators
- Generators, IDs, and QA test data
- Social metadata and content operations

Each cluster must link to a crawlable pillar hub, related browser-local tools, at least one workflow, supporting articles, and adjacent clusters.

## Localized SEO

Localized SEO must be planned per locale, not translated as an afterthought. The strategy data includes keyword maps for `zh-CN`, `zh-TW`, `ja`, `ko`, `de`, and `fr`.

For every localized content change:

- Use localized titles, descriptions, H1 text, body examples, FAQ copy, and schema-visible values.
- Link to localized tool, workflow, and guide URLs.
- Preserve technical acronyms where natural, such as JSON, JWT, API, Base64, SVG, and OpenAPI.
- Preserve the browser-local privacy promise without implying server-side payload processing.

## Roadmap

- 30 days: refresh pillar pages and top tool guides with concrete examples, error cases, and localized metadata checks.
- 60 days: expand supporting articles for long-tail fix, how-to, comparison, and workflow queries.
- 90 days: use aggregate Search Console clusters to prioritize localized rewrites and internal links.

## Validation

The strategy is guarded by `tests/guards/topic-cluster-strategy.test.ts` and rendered category surfaces are covered by `tests/guards/workflow-hubs.test.tsx`.
