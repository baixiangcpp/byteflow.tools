# Community And Sustainability Model

This decision note closes the open questions around feedback loops, sponsorship, self-hosting support, and enterprise boundaries.

## Decision

byteflow.tools remains free, open source, static-exportable, and browser-local first. The project can accept sponsorship or paid self-hosting assistance, but the free core must not be weakened by accounts, payload sync, hosted history, or server-side tool payload processing.

There is no hosted paid plan, cloud workspace, synced history, hosted API, or SLA-backed enterprise product today. Any future paid work must be scoped as support around the open-source app, not as a separate cloud service that stores user payloads.

## Support And Sponsorship Boundary

Allowed support:

- sponsorship or donation for ongoing maintenance
- self-hosting packaging guidance
- deployment review for static hosts, CDNs, or internal object storage
- security and privacy review of an internal deployment
- custom local-first tool development contributed back when possible
- documentation, localization, and onboarding improvements

Out of scope:

- guaranteed uptime for the public hosted site
- hosted accounts, team workspaces, or cloud history
- server-side processing of tool inputs, outputs, files, logs, secrets, URLs, request bodies, response bodies, prompts, or generated content
- paid priority that bypasses privacy, security, accessibility, i18n, or test gates

## Feedback Loop

Public feedback stays GitHub-first:

- request a tool with `.github/ISSUE_TEMPLATE/feature_request.yml`
- request a Pipeline Builder recipe with `.github/ISSUE_TEMPLATE/recipe_request.yml`
- report reproducible bugs with `.github/ISSUE_TEMPLATE/bug_report.yml`
- request docs or onboarding improvements with `.github/ISSUE_TEMPLATE/docs_request.yml`
- report localization issues with `.github/ISSUE_TEMPLATE/localization_request.yml`
- use GitHub reactions and comments on existing issues as demand signals
- report vulnerabilities privately through GitHub Security Advisories

Public issues must use sanitized examples only. Security-sensitive reports, private payloads, customer data, tokens, logs, HAR files, private URLs, request bodies, response bodies, prompts, generated output, and sensitive screenshots do not belong in public issues.

## Prioritization Method

Roadmap decisions use a lightweight public signal model:

1. Severity and privacy risk come first for bugs, security, data handling, and accessibility issues.
2. User demand is counted from thumbs-up reactions, unique commenters, linked duplicate issues, and recurring support requests.
3. Product fit is evaluated against the local-first model, browser feasibility, offline behavior, i18n cost, and maintenance burden.
4. SEO or growth work must still preserve useful content, crawlable routes, privacy copy, and technical quality gates.
5. Commercial or sponsorship requests can inform priority, but they cannot override the privacy model or merge requirements.

## Public Site Links

The public site should keep these loops connected:

- Roadmap links to request and voting flows.
- Changelog links back to Roadmap and public requests.
- Contact links to GitHub Issues, request templates, voting, and private security advisories.
- About and footer link to Roadmap, Changelog, Contact, Self-hosting, and repository resources.
- Pricing and Self-hosting explain what support can and cannot include.

## Review Triggers

Revisit this decision only if there is clear demand for a different model, such as repeated enterprise deployment requests, sustained sponsorship interest, or a concrete integration proposal. Any change must keep no-cloud-history and no-server-side-payload-processing promises explicit on Pricing, Self-hosting, and Trust surfaces.
