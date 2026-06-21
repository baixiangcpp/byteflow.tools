# Contributing to Byteflow

Thanks for helping improve Byteflow. This guide explains how to make changes without breaking the local-first privacy model, generated registry flow, locale coverage, or static export checks.

## Code of Conduct

All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Keep issues, pull requests, reviews, and discussions respectful, specific, and focused on the work.

## Ways to Contribute

Good contributions include:

- Bug fixes with a reproducible case or regression test.
- New browser-local developer tools.
- Improvements to existing tool logic, accessibility, performance, or copy.
- Translation fixes across supported locales.
- Tests or guards that prevent clear regressions.
- Documentation that describes current behavior and durable architecture.

Please do not add process reports, local assistant files, private editor settings, generated root data directories, or historical planning documents to the repository. Durable docs belong under `docs/architecture/` or `docs/specs/`.

## Before Opening an Issue

For bugs:

- Search existing [issues](https://github.com/baixiangcpp/byteflow.tools/issues).
- Test the latest hosted version or current branch.
- Include browser, OS, affected URL, steps to reproduce, expected behavior, and actual behavior.
- Remove secrets, customer data, production tokens, or private payloads from screenshots and examples.

For feature requests:

- Explain the developer workflow and why a browser-local tool is the right fit.
- Note expected inputs, outputs, edge cases, and privacy considerations.
- Mention related tools if the feature should appear in recommendations or navigation.

For security issues, use [SECURITY.md](SECURITY.md) instead of a public issue.

## Development Setup

Prerequisites:

- Node.js 20.19.0 or newer within Node 20.x
- npm 10.x
- Git

Setup:

```bash
git clone https://github.com/YOUR_USERNAME/byteflow.tools.git
cd byteflow.tools
git remote add upstream https://github.com/baixiangcpp/byteflow.tools.git
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional local environment keys are documented in `.env.example`. Do not put real tokens, customer data, production payloads, or private analytics exports in environment examples, fixtures, issues, screenshots, or logs.

Run a quick local check before making larger changes:

```bash
npm run lint
npm run test
```

## Repository Map

```text
src/app/[lang]/              Locale routes and thin tool wrappers
src/components/layout/       Site layout components
src/components/ui/           Base UI primitives
src/core/                    Cross-cutting runtime infrastructure
src/features/tool-shell/     Shared tool page shell components
src/features/tool-templates/ Reusable tool page templates
src/features/tools/{tool}/   Tool pages, manifests, and feature-local modules
src/generated/               Checked-in generated registry artifacts
src/lib/                     Legacy shims and checked-in route/export JSON manifests

scripts/e2e/                 Browser smoke automation
scripts/gates/               CI and quality gates
scripts/generators/          Generated source and asset scripts
scripts/lib/                 Shared script modules
scripts/postprocess/         Static export post-processing
scripts/scaffolding/         Developer scaffolding commands

tests/unit/                  Pure logic tests
tests/component/             React component tests
tests/guards/                Structural, i18n, routing, accessibility, and performance guards
tests/e2e/                   Smoke test assets

docs/architecture/           Durable repository and runtime architecture
docs/specs/                  Current product and technical specifications
```

Read these before larger structural changes:

- [Directory structure](docs/architecture/directory-structure.md)
- [Module boundaries](docs/architecture/module-boundaries.md)
- [System architecture](docs/architecture/system-architecture.md)

## Coding Standards

TypeScript:

- Keep strict typing intact.
- Prefer explicit return types for exported functions.
- Avoid `any`; use `unknown`, discriminated unions, and type guards when input shape is uncertain.
- Keep pure parsers, formatters, validators, and transformers framework-agnostic.

React:

- Use functional components and hooks.
- Mark client components with `"use client"` only when needed.
- Keep `src/app/[lang]/{tool}/page.tsx` as a thin route wrapper.
- Keep tool orchestration in `src/features/tools/{tool}/page.tsx`.
- Move browser side effects such as downloads, FileReader, DOM helpers, and object URLs into feature-local `browser-actions.ts`.
- Keep `logic.ts`, `utils.ts`, `samples.ts`, `types.ts`, and `constants.ts` free of React imports.

Styling and accessibility:

- Use the existing Tailwind tokens and component primitives.
- Preserve visible keyboard focus states.
- Keep touch targets usable on mobile.
- Avoid broad visual redesigns inside bug-fix PRs.
- Check affected flows at desktop and mobile widths when UI changes.

Manifests:

- Tool manifests must export `toolManifest = { ... } satisfies ToolMeta`.
- Keep manifest fields literal and statically parseable.
- Do not use spreads, computed keys, functions, template literals, dynamic imports, React imports, or client-only imports in manifests.
- Set `networkAccess` when a tool opens external pages, fetches user-provided URLs, or relies on third-party APIs.
- Set `persistInput` deliberately. Sensitive payload tools should use `false`; tools that save payloads should explain that behavior in UI copy.
- Discovery `family`, `tags`, and `capabilities` are generated from manifest metadata and taxonomy rules. Do not hand-edit generated taxonomy fields.

## Adding a Tool

Use the scaffolder when possible:

```bash
npm run create:tool -- --slug my-new-tool --category formatters
```

Useful scaffolder flags:

- `--network-access none|user_requested|third_party_api`
- `--persist-input true|false|opt-in`
- `--pipeline-adapter` to mark that the tool needs a matching adapter design before it should appear as pipeline-ready
- `--search-keywords term1,term2` for additional command palette and discovery matching

The expected shape is:

- `src/features/tools/{slug}/manifest.ts`
- `src/features/tools/{slug}/page.tsx`
- `src/features/tools/{slug}/logic.ts` and `logic.test.ts`
- `src/app/[lang]/{slug}/page.tsx`
- Optional feature-local `logic.ts`, `types.ts`, `samples.ts`, `constants.ts`, `browser-actions.ts`, `hooks.ts`, or `components.tsx`
- Translation entries in every supported locale
- Tests for pure logic and any important UI or routing behavior
- Runtime budgets, external URL validation, and accessibility coverage when the tool parses large payloads, fetches URLs, renders previews, or uses icon-only controls

After changing tool manifests, run:

```bash
npm run generate:tool-index
npm run check:tool-index
npm run generate:client-tool-lookup
npm run check:client-tool-lookup
```

Never hand-edit generated files under `src/generated/`.

## Internationalization

Supported locales:

- `en`
- `zh-CN`
- `zh-TW`
- `ja`
- `ko`
- `de`
- `fr`

Guidelines:

- Add English keys first, then update every locale file in `src/core/i18n/translations/`.
- Hard merge rule: user-facing copy is not complete until every supported locale in the same PR has complete, accurate localized text. This includes headings, body copy, CTAs, FAQ, table text, examples, schema-visible text, and SEO metadata.
- Hard merge rule: every supported locale has complete, accurate localized text before a PR can merge.
- No English-only originality: new or rewritten content cannot be authored only for `en` while other locales receive fallback, literal filler, or metadata-only localization.
- No partial originality: the complete affected user-facing surface must be localized. Do not make only one locale, one section, or only above-the-fold copy original while leaving the rest as generic fallback copy.
- partial originality is not acceptable for any user-facing copy, SEO copy, FAQ, table, example, or schema-visible text.
- Partial localization is a merge blocker. Split scope before opening the PR if the full multilingual copy cannot be reviewed accurately.
- Preserve technical terms such as `JSON`, `JWT`, `API`, `Base64`, and `UUID` when that is the natural localized form.
- For Chinese copy, use spaces between Chinese text and English terms or numbers where readability requires it.
- Keep labels short enough for compact tool controls.
- Use the [i18n glossary](docs/i18n/glossary.md) for privacy, runtime, workflow, and tool-family terminology.
- For larger localized copy or SEO template changes, follow the [localization quality review checklist](docs/specs/localization-quality-review.md).

Checks:

```bash
npm run check:i18n
npm run check:i18n-qa
npm run check:metadata-localization
```

`npm run check:i18n` is the enforced same-as-English gate. `npm run check:i18n:ratchet` remains available as an optional manual/rollout tool.

## Testing and Validation

Use the smallest check that proves your change, then run the broader gates before PRs that affect runtime behavior, generated data, routing, route metadata, static export, or build output.

| Command | When to run |
| --- | --- |
| `npm run lint` | Every code change. |
| `npm run test` | Logic, component, guard, manifest, or routing changes. |
| `npm run check:types` | Type-level or shared API changes. |
| `npm run validate` | Registry, i18n, sitemap, PWA, security header, route metadata, or generated artifact changes. |
| `npm run build` | User-facing, routing, static export, or release-sensitive changes. |
| `npm run test:e2e:smoke` | Navigation, layout, generated app shell, or smoke-flow changes. |

Generated checks:

```bash
npm run generate:tool-index
npm run check:tool-index
npm run generate:client-tool-lookup
npm run check:client-tool-lookup
```

## Pull Requests

Use a focused branch:

```bash
git checkout -b feat/my-change
```

Before opening a PR:

- Keep the scope narrow and explain the user-visible impact.
- Update tests or guards when behavior changes.
- Update current docs when architecture, commands, or contribution workflow changes.
- Run the relevant checks and paste the commands in the PR.
- Include screenshots or recordings for visible UI changes.
- Confirm no secrets or private payloads appear in fixtures, screenshots, logs, or issues.

Review expectations:

- Automated checks must pass.
- Maintainers may ask for smaller diffs, clearer tests, or more precise docs.
- Prefer follow-up commits on the same PR branch until review is complete.

## Commit Messages

Use Conventional Commits:

```text
feat(json-formatter): add strict-mode error details
fix(i18n): restore missing German tool copy
docs(readme): clarify local-first execution
test(registry): cover generated lookup stability
chore(repo): update contributor templates
```

Keep commits atomic, use present tense, and reference related issues when helpful.

## Documentation

Documentation should describe the current project, not temporary execution history.

- `README.md` is the public entrypoint.
- `CONTRIBUTING.md` explains contributor workflow.
- `CLAUDE.md` is the in-repo project guide for AI-assisted development.
- `docs/architecture/` holds durable architecture and boundary docs.
- `docs/specs/` holds current product and technical specifications.

Avoid adding long-lived cleanup reports, handoff notes, local audit exports, or one-off plans.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
