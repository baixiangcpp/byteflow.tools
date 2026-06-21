# Localization Quality Review

This document records the lessons from the June 2026 localization cleanup and defines the review bar for future localized copy changes.

## Why The Previous Translation Had Errors

The previous localization pass allowed weak copy to land for four concrete reasons:

1. A synthetic localization generator existed in the repository and was easy to invoke by mistake. Even when generated output was not intentionally accepted, the presence of that workflow made it too easy to treat generated localized SEO copy as a starting point.
2. Review focused on affected tools first, then spot-checked surrounding localized files. That missed existing low-quality fragments in the broader localized JSON surface.
3. The existing i18n gates verified key coverage, same-as-English regressions, rendered English leftovers, and placeholder-like SEO templates. They did not catch language-quality issues such as direct English term carryover, wrong particles, duplicate words, or awkward spacing.
4. Some SEO template files live under `generated/`, but they still contain checked-in localized copy. The directory name made it tempting to treat them as machine-owned artifacts instead of user-facing copy that needs human review.

## Rules Going Forward

- Do not use synthetic translation generation for production localized copy.
- Treat checked-in localized JSON as user-facing copy, even when the path contains `generated`.
- For every localized copy change, review all supported locales: `zh-CN`, `zh-TW`, `ja`, `ko`, `de`, and `fr`.
- New user-facing pages, guides, comparisons, alternatives, tutorials, FAQ, schema-visible text, examples, tables, and SEO copy must be fully localized for every supported locale in the same change. Localized titles or descriptions are not enough when the body remains English, and partial originality is not acceptable.
- Use `docs/i18n/glossary.md` as the source of truth for privacy, runtime, workflow, and tool-family terms.
- Preserve accepted technical terms such as `JSON`, `YAML`, `TOML`, `JWT`, `API`, `Base32`, `Base58`, `Base64`, and `UUID` when that is the natural localized form.
- Translate workflow terms deliberately. Do not leave `fixture`, `payload`, or similar English terms in non-English copy unless the locale commonly uses that term in technical UI.
- Check grammar and typography, not just key presence. Watch for Korean particles, Japanese spacing around particles, German compound terms, French agreement, and Chinese spacing around Latin technical terms.
- When a scan finds a suspicious term, classify it explicitly as either a true issue or an accepted technical/domain term. Do not silently ignore the result.

## Required Review Scope

For localized copy changes, review both surfaces:

- UI translations: `src/core/i18n/translations/*.json`
- Localized SEO content templates: `src/core/seo/components/tool-content-template-modules/generated/*.json`

If a tool page is changed, also inspect the English source copy in:

- `src/core/seo/components/tool-content-template-modules/top-templates.ts`
- the affected tool's `manifest.ts`
- the affected tool page component

## Required Checks

Run the narrow guard first:

```bash
npm test -- tests/guards/localized-copy-guard.test.ts
```

Run the enforced i18n and content checks:

```bash
npm run check:i18n
npm run check:content-template
npm run check:content-template:zh-cn
npm run check:content-template:zh-tw
npm run check:content-template:ja
npm run check:content-template:ko
npm run check:content-template:de
npm run check:content-template:fr
npm run check:content-template:quality
npm run check:content-template:quality:zh-cn
npm run check:content-template:quality:zh-tw
npm run check:content-template:quality:ja
npm run check:content-template:quality:ko
npm run check:content-template:quality:de
npm run check:content-template:quality:fr
```

Before merging a user-facing localization change, run the broader CI-equivalent checks:

```bash
npm run validate
npm test
npm run lint
npm run build:app
npm run build:post
```

## Manual Scan Checklist

Use `rg` or a small script to scan the full localized JSON surface for suspicious fragments. At minimum, include:

- mojibake or replacement characters: `Ã`, `Â`, `�`
- direct fixture carryover: `fixture`, `fixtures`, `Test-Fixtures`
- known awkward fragments already guarded by `tests/guards/localized-copy-guard.test.ts`
- locale-specific spacing issues introduced by the change

The scan output is not automatically authoritative. For example, Chinese `锚点` is a valid regex term, not mojibake. The reviewer must classify each hit and either fix it or document why it is accepted.

## Regression Guard Policy

When a real localization defect is found, add it to `tests/guards/localized-copy-guard.test.ts` if it is likely to recur. The guard should scan the full relevant JSON surface rather than only the file touched in the current PR.

Do not add broad bans that would reject legitimate technical terms. Prefer precise fragments such as `测试 fixture`, `Kompakte Kompakte`, or `内容를`.
