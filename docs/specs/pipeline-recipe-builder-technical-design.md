# Pipeline / Recipe Builder Technical Design

**Status:** Phase 3 public MVP implemented
**Date:** 2026-06-10
**Scope:** Phase 3 Workbench Capabilities
**Repository:** `baixiangcpp/byteflow.tools`
**Branch:** `preview`

## 1. Purpose

Byteflow already has a broad set of local-first developer tools. Phase 3 should make those tools composable without changing the product boundary:

- All recipe execution stays in the browser.
- No backend, accounts, external APIs, or AI model calls.
- Sensitive payloads are not uploaded.
- Recipe sharing should share workflow structure by default, not private input data.

The Pipeline / Recipe Builder is the strategic core for turning standalone tools into repeatable local workflows.

## 2. Product Boundary

### In Scope

- Chain existing local tools through explicit input and output contracts.
- Save recipes locally.
- Import and export recipe JSON.
- Share recipe structure through a URL-safe encoded recipe.
- Execute deterministic text/data transforms in sequence.
- Surface step errors without dropping intermediate results.
- Reuse existing tool pages and utilities where practical.

### Out of Scope for MVP

- No backend persistence.
- No collaborative editing.
- No user-submitted public recipe gallery.
- No scheduled/background runs.
- No AI-generated recipes.
- No arbitrary JavaScript execution.
- No full visual node editor in the first implementation.
- No automatic adapter for every existing tool on day one.

## 3. Existing Building Blocks

| Area | Existing Surface | How Phase 3 Should Use It |
|------|------------------|---------------------------|
| Tool metadata | `src/features/tools/{tool}/manifest.ts`, `src/core/registry`, `src/generated/tool-index.json` | Discover canonical tools and display names. |
| Cross-tool handoff | `src/lib/tool-handoff.ts` | Continue using one-shot payload transfer for direct tool-to-tool links. |
| Header actions | `src/features/tool-shell/tool-action-bar.tsx` | Add future recipe actions without duplicating header UI. |
| Local storage helper | `src/lib/tool-persistence.ts` | Use for small preferences; do not store large recipe collections here. |
| i18n | `src/core/i18n/translations/*.json` | All recipe UI copy must be localized across supported locales. |
| Analytics | `src/lib/analytics` | Track recipe open/run/export/import without logging payload contents. |

## 4. Core Concepts

### Recipe

A recipe is a portable workflow definition. It describes steps, options, and wiring. It should not contain private runtime input by default.

```ts
export interface RecipeDocument {
  schemaVersion: 1
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  steps: RecipeStep[]
  edges: RecipeEdge[]
  settings: RecipeSettings
}
```

### Step

A step references one supported tool adapter and stores that adapter's public options.

```ts
export interface RecipeStep {
  id: string
  toolKey: string
  label?: string
  adapterVersion: number
  inputMode: "previous_output" | "constant"
  constantInput?: string
  options: Record<string, unknown>
}
```

`manual` input mode is intentionally not part of Phase 3A. It needs a UI-level `manualInputsByStepId` contract before it can be implemented without silently behaving like `previous_output`.

### Edge

MVP should be linear, but the data model should allow explicit edges so the UI can grow into branching later.

```ts
export interface RecipeEdge {
  fromStepId: string
  toStepId: string
}
```

### Settings

```ts
export interface RecipeSettings {
  stopOnError: boolean
  keepIntermediateOutputs: boolean
  maxInputBytes: number
  maxOutputBytes: number
  maxSteps: number
}
```

Recommended MVP defaults:

```ts
export const DEFAULT_RECIPE_SETTINGS = {
  stopOnError: true,
  keepIntermediateOutputs: true,
  maxInputBytes: 2 * 1024 * 1024,
  maxOutputBytes: 2 * 1024 * 1024,
  maxSteps: 12,
} as const
```

## 5. Adapter Contract

Only tools with explicit adapters should be available in the first Pipeline Builder. This prevents accidental support claims for UI-only or non-deterministic workflows.

```ts
export interface PipelineToolAdapter<Input = string, Output = string> {
  toolKey: string
  slug: string
  version: number
  inputKind: "text" | "json" | "yaml" | "csv" | "bytes"
  outputKind: "text" | "json" | "yaml" | "csv" | "bytes"
  safeForSensitiveInput: boolean
  deterministic: boolean
  mayIncreaseSize: boolean
  warnings: readonly string[]
  defaultOptions: Record<string, unknown>
  publicOptionKeys: readonly string[]
  persistentOptionKeys?: readonly string[]
  persistentOptionReview?: Record<string, string>
  validateOptions(options: Record<string, unknown>): AdapterValidationResult
  run(input: Input, options: Record<string, unknown>): Promise<AdapterRunResult<Output>> | AdapterRunResult<Output>
}

export interface AdapterRunResult<Output> {
  ok: boolean
  output?: Output
  warnings?: string[]
  error?: {
    code: string
    message: string
  }
  metrics?: {
    inputBytes: number
    outputBytes: number
    durationMs: number
  }
}
```

Adapter rules:

- Adapters must be pure browser-side functions.
- Adapters must not import page components.
- Adapters must not call `fetch` except for same-page static assets already used by an existing local tool.
- Adapters must not persist payloads.
- Adapters must be deterministic for the same input and options. Non-deterministic generators, canvas/image editing flows, and external-network tools need a separate design before inclusion.
- `safeForSensitiveInput` means the adapter is appropriate for local sensitive payloads; it does not imply output is safe to share unless the adapter redacts or removes sensitive content.
- `mayIncreaseSize` must be true for reversible encoders and pretty-printers that can expand payloads.
- `warnings` must describe persistent adapter-level caveats shown or available to UI surfaces.
- Adapters must return structured warnings instead of throwing for expected user errors.
- Adapters must have unit tests covering success and failure paths.
- `publicOptionKeys` controls which options are editable or visible in the Pipeline Builder UI.
- `persistentOptionKeys` controls which reviewed options are allowed into saved recipes, exported recipe JSON, and shared recipe URLs. If omitted, it defaults to `publicOptionKeys` for backwards compatibility.
- `persistentOptionReview` must document any persisted option whose key looks sensitive even when the persisted value is a safe scalar, such as `urlSafe` or a boolean scrub-rule toggle.

Option persistence taxonomy:

| Persistence | Meaning | Examples |
|-------------|---------|----------|
| Safe | Reviewed scalar configuration that does not carry user-authored payload content. | `mode`, `indent`, `format`, `operation`, bounded numeric limits, boolean toggles. |
| Sensitive | User-authored text, structured data, or values likely to contain private contract details. These are excluded by default. | `schema`, regex `pattern`, headers, bodies, URLs, payloads, examples, defaults, constants. |
| Reviewed exception | A safe scalar whose key contains a suspicious substring and therefore needs an explicit reason. | `urlSafe`, boolean log scrubber toggles such as `apiKeys` or `bearerTokens`. |

Guard tests must prevent new suspicious persistent option keys containing `token`, `secret`, `key`, `url`, `header`, `body`, `payload`, `input`, `output`, `example`, `default`, `const`, `query`, `endpoint`, `host`, `schema`, or `pattern` unless `persistentOptionReview` explains why the value is safe to persist.

## 6. Adapter Sets

### Phase 3A Initial Private Adapter Set

The current non-public foundation includes only deterministic, low-risk text/data adapters:

| Tool Key | Reason |
|----------|--------|
| `json_formatter` | Common first step for pasted JSON. |
| `base64_encode_decode` | Common encode/decode step. |
| `url_encode_decode` | Common query/string cleanup step. |
| `multiple_whitespace_remover` | Simple text normalization. |
| `invisible_chars_detector` | Clean copied config/log text before parsing. |
| `log_scrubber` | Redact sensitive log content before export. |
| `yaml_json_converter` | Convert YAML snippets to JSON and JSON snippets back to YAML in local data workflows. |
| `csv_json_converter` | Bridge tabular CSV data into JSON and convert JSON arrays back to CSV. |
| `ndjson_formatter` | Convert JSON arrays and newline-delimited JSON records for log/data pipelines. |
| `slugify_case_converter` | Normalize strings into deterministic slug and case formats. |
| `hash_generator` | Produce deterministic text digests for checksum and fixture workflows. |
| `jwt_decoder` | Decode JWT header and payload JSON without signature verification. |
| `unix_timestamp` | Convert Unix seconds or milliseconds into ISO or structured JSON output. |
| `html_to_markdown` | Convert HTML snippets into Markdown text for content cleanup pipelines. |
| `regex_tester` | Produce JSON match summaries for deterministic pattern checks. |
| `env_parser` | Parse `.env` content into JSON, YAML, or docker argument text. |

### Phase 3D Target Expansion / Public MVP Candidates

These remain future candidates and are not part of the current foundation adapter registry:

| Tool Key | Reason |
|----------|--------|
| `jq_playground` | Existing local JSON transform runtime. |
| `yq_playground` | Local yq-like YAML/JSON subset. |
| `local_log_parser` | Parse logs before filtering/export. |
| Other deterministic adapters | Add only after each adapter has explicit validation and public option keys. |

Do not include image tools, social/marketing tools, random generators, or network/API-dependent tools in the first adapter batch.

## 7. Execution Model

MVP execution is linear:

1. Validate recipe schema.
2. Validate all step adapters and options.
3. Apply initial input to the first step.
4. Run each step in order.
5. Pass output to the next step.
6. Stop on error when `stopOnError` is enabled.
7. Keep per-step status, warnings, metrics, and output preview.

Explicit edges are allowed only when they form one connected linear chain covering every step. Branching, merging, cycles, self-loops, and disconnected graphs are validation errors until a later graph executor exists.

Execution should be cancelable before starting the next step. A later worker-based execution engine can be added after the linear MVP is stable.

## 8. URL Sharing

Recipe URL sharing should encode recipe structure only:

```text
/{lang}/pipeline-builder?recipe=<base64url-json>
```

Rules:

- Do not include runtime input by default.
- Do not include unknown adapter options; share URLs keep only keys declared in each adapter's `persistentOptionKeys` or the fallback persistent key set.
- Do not include user-authored schemas, regex patterns, examples, defaults, URLs, headers, bodies, or payload-like options by default.
- If a user explicitly chooses to include sample input, show a privacy warning.
- Enforce a URL length budget and fall back to export JSON when the recipe is too large.
- Reuse base64url behavior consistent with `tool-handoff`.
- Treat malformed recipe params as recoverable import errors.

## 9. Local Saved Recipes

Use IndexedDB for saved recipes because recipes can grow beyond safe localStorage usage. Suggested store:

```ts
interface SavedRecipeRecord {
  id: string
  recipe: RecipeDocument
  lastRunAt?: string
  pinned?: boolean
}
```

Fallback behavior:

- If IndexedDB is unavailable, allow the current unsaved recipe to run.
- Disable save/load with a localized warning.
- Keep import/export JSON available.

## 10. Import / Export JSON

Exported recipe JSON should be the same `RecipeDocument` shape. Import must:

- Validate `schemaVersion`.
- Reject unknown adapter versions unless a migration exists.
- Clamp resource settings to product limits.
- Drop unknown fields unless the schema explicitly permits them.
- Never auto-run imported recipes.

## 11. UI MVP

Route:

```text
src/app/[lang]/pipeline-builder/page.tsx
```

Suggested first implementation:

- Header with recipe name, run, save, import, export, share.
- Left column: ordered step list with add/remove/reorder.
- Main column: selected step options and input/output preview.
- Bottom or side panel: run log with per-step status.

The MVP can be list-based. A visual canvas should wait until the adapter and execution model are proven.

## 12. Failure Handling

Failure states must be explicit:

| Failure | Expected Behavior |
|---------|-------------------|
| Invalid recipe JSON | Show import error, keep current recipe unchanged. |
| Missing adapter | Mark step unsupported and block run. |
| Invalid options | Show step-level validation error. |
| Step runtime error | Stop or continue according to settings. |
| Output too large | Stop step and show size-limit error. |
| Storage unavailable | Allow unsaved runs; disable save/load. |
| Malformed URL recipe | Show recoverable error and start empty recipe. |

## 13. Privacy Requirements

- Runtime payloads stay in React state or browser storage only when the user explicitly saves a recipe with sample input.
- Share URLs must not include payloads by default.
- Analytics must never include recipe input, step output, secrets, or raw options that could contain data.
- Saved, exported, and shared recipes persist reviewed safe options only. User-authored schemas, regex patterns, examples, defaults, URLs, headers, bodies, and payload-like options stay out of the structure-only recipe boundary by default.
- Export should be user-triggered only.
- Imported recipes should never auto-run.

## 14. Test Plan

Required unit tests:

- Recipe schema validation accepts a valid MVP recipe.
- Recipe schema validation rejects malformed steps and unsupported versions.
- Recipe schema validation returns structured errors for malformed URL/import payloads instead of throwing.
- Recipe schema validation rejects non-linear explicit edge graphs.
- Linear executor passes output between adapters.
- Executor converts unexpected adapter throws into structured step errors.
- `stopOnError` stops execution.
- Continue-on-error records the failed step and continues where possible.
- URL encode/decode round trip for recipe structure.
- Shared URL rejects payload inclusion unless explicitly enabled and strips unknown/non-public option keys.
- IndexedDB-unavailable path keeps import/export/run available.

Required page smoke tests:

- Page renders recipe name, step list, input, output, run button, import/export buttons.
- Add/remove/reorder step controls are present.
- Invalid imported JSON shows an error.

Required gates:

- `npm run lint`
- `npm run test`
- `npm run check:types`
- `npm run check:i18n`
- `npm run check:tool-index`
- `npm run check:client-tool-lookup`
- `npm run check:related-tools`
- `npm run build`

## 15. Implementation Phases

### Phase 3A: Foundation

- Added initial recipe schema/types in `src/features/pipeline/recipe-types.ts`.
- Added URL encode/decode helpers in `src/features/pipeline/recipe-codec.ts`.
- Added adapter registry with 6 low-risk adapters in `src/features/pipeline/adapter-registry.ts`.
- Added linear executor and validation in `src/features/pipeline/executor.ts`.
- Added focused foundation tests in `tests/pipeline-foundation.test.ts`.
- No public route is exposed yet.

### Phase 3B: MVP Route

- Added `pipeline_builder` as a canonical tool after the UI could run real recipes.
- Added localized metadata and page copy.
- Added route, registry entry, related tools, and tool-index updates.
- Shipped list-based workflow UI.

### Phase 3C: Persistence and Sharing

- Added IndexedDB saved recipe store.
- Added import/export JSON.
- Added recipe URL sharing for structure-only recipes.
- Shared URLs still exclude runtime input by default.

### Phase 3D: Tool Chaining Expansion

- Add adapters for more deterministic tools.
- Add direct "Send to Pipeline" actions from selected tool pages.
- Add compatibility hints between input/output kinds.

### Phase 5A: Recipe Template Layer

- Added built-in recipe templates in `src/features/pipeline/recipe-templates.ts`.
- Expanded the curated gallery to 12 built-in templates covering API, security, logs, text cleanup, image metadata, and schema workflows.
- Templates reuse the existing deterministic adapter set instead of introducing new public tools.
- Template sample input loads into the current browser session only; shared recipe URLs still encode structure and public options without runtime input.
- Added foundation and page tests so templates stay valid, executable, and visible in the public Pipeline Builder UI.
- Community recipe submissions are deferred from in-app publishing. The first version is curated-only, with requests collected through `.github/ISSUE_TEMPLATE/recipe_request.yml`, so maintainers can review privacy boundaries, adapter safety, localization copy, and static indexability before adding a workflow.

## 16. Merge-Ready Criteria for First Public MVP

- At least 5 deterministic adapters are implemented and tested.
- Recipe execution works locally without backend/API calls.
- Share/export/import do not leak input by default.
- i18n parity passes for all supported locales.
- Tool index has no unknown route directories.
- Build and full quality gates pass.
- The UI clearly labels unsupported tools as unavailable instead of implying full-suite support.

## 17. Open Decisions

| Decision | Default Recommendation |
|----------|------------------------|
| IndexedDB wrapper | Start with a tiny local wrapper around browser IndexedDB; avoid adding a dependency until needed. |
| Worker execution | Defer until large recipes or heavy adapters justify the complexity. |
| Visual node canvas | Defer until linear list usage proves valuable. |
| Including sample input in shared URLs | Off by default with explicit privacy warning. |
| Adapter migration strategy | Require `adapterVersion` and add migrations only when an adapter behavior changes. |

## 18. Next Action

Continue workbench hardening after the public MVP stays green:

1. Run browser QA across the built-in templates in all supported locales.
2. Add more deterministic adapters only after each has explicit validation, `publicOptionKeys`, and reviewed `persistentOptionKeys` for save/export/share behavior.
3. Add direct "Send to Pipeline" actions from selected mature tool pages.
4. Evaluate worker-based execution only if large recipes make main-thread execution a real problem.
5. Keep branching/merge graph execution out of scope until a separate graph executor design exists.
