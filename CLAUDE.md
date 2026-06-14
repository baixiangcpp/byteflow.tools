# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Byteflow is a local-first, browser-based toolbox with 120+ production-focused utilities. The codebase is built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4, targeting static export deployment.

The architecture prioritizes:
- **Consistency over novelty**: repeatable UX patterns across all tools
- **Guardrail-first delivery**: machine-checked quality gates for i18n, route metadata, static export, and generated assets
- **Multi-locale parity**: 7 locales (`en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `de`, `fr`) with CI-enforced translation coverage

## Product Principles

### Core Value Proposition
Byteflow's differentiation is **privacy by design** — all tool computation happens client-side in the browser. This is critical for developers handling sensitive payloads (JWT tokens, API keys, production JSON, customer data) who should not paste them into random online tools.

Key messaging:
- **Local-first**: Tool payloads processed locally, no backend required for tool execution
- **Privacy-first**: No uploads, no logging, no tracking of tool inputs/outputs
- **Developer-focused**: Task-oriented tools for daily workflows
- **Always free**: No premium tiers, no feature gates
- **Open source**: Transparent and auditable

### Target Users
Primary: Developers and DevOps engineers who handle sensitive data daily
Secondary: Technical writers, QA engineers, data analysts, designers

### Competitive Position
- vs. Online Hex Tools / Online Tools: Modern UI, stronger privacy guarantees, multi-locale, no ads
- vs. Cryptii: Broader tool coverage, simpler UX for common tasks, better documentation
- vs. Random online tools: Consistent UX, trustworthy privacy model, comprehensive documentation

## Essential Commands

### Development
```bash
npm run dev              # Start dev server on localhost:3000
npm run lint             # Run ESLint checks
npm run test             # Run Vitest unit/component tests
npm run check:types      # TypeScript type checking
```

### Build and Quality Gates
```bash
npm run build            # Full production build with all quality checks
npm run build:app        # Next.js build only (no post-build checks)
npm run analyze          # Webpack bundle analysis (.next/analyze/*.html)
```

Before merge, all changes must pass:
```bash
npm run lint
npm run test
npm run check:i18n
npm run build
```

### i18n Validation
```bash
npm run check:i18n                    # Key parity, referenced-key, and same-as-English checks
npm run check:i18n:ratchet            # Optional manual/rollout same-as-English ratchet check
npm run check:metadata-localization   # Metadata localization coverage
npm run check:rendered-i18n-copy      # Rendered copy quality checks
```

### Testing
```bash
npm run test                          # Unit tests (Vitest)
npm run test:e2e:smoke                # Playwright smoke tests
```

### Tool Creation
```bash
npm run create:tool                   # Interactive tool scaffolding wizard
```

## Architecture

### Directory Structure

```
src/
  app/[lang]/               # Locale-aware App Router routes
    {tool-slug}/page.tsx    # Thin wrappers around feature pages
  core/
    analytics/              # Analytics helpers and deferred analytics components
    clipboard/              # Clipboard helpers
    files/                  # Shared file import/download helpers
    i18n/                   # Locale definitions, provider, translations
    registry/               # Tool registry, aliases, menu groups
    routing/                # Route context, handoff, legacy redirects
    seo/                    # Route metadata and structured route data
    storage/                # Local persistence helpers
  components/
    layout/                 # Header, footer, nav, sidebar
    ui/                     # Base UI components (shadcn-style)
  features/
    pipeline/               # Pipeline domain logic
    tool-shell/             # Shared tool page shell components
    tool-templates/         # Reusable tool page templates
    tools/{tool}/           # Tool-specific feature modules
  generated/                # Generated source consumed by runtime
  lib/                      # Legacy re-export shims and route/export manifest JSON

scripts/                   # CI gates, generators, post-processing, smoke automation, scaffolding
  gates/                  # Quality gate scripts
  generators/             # Generated source and asset generation
  e2e/                    # Browser automation
  postprocess/            # Static export post-processing
  scaffolding/            # Tool scaffolding scripts
  lib/                    # Shared script helpers

docs/architecture/         # Repository boundary docs
  directory-structure.md
  module-boundaries.md
docs/specs/                # Durable design and product/technical specs

tests/                    # Vitest tests
  unit/                   # Logic tests
  component/              # React component/page tests
  guards/                 # Source and structure guard tests
  e2e/                    # Browser/e2e tests

```

### Key Concepts

#### Tool Registry System
Every canonical tool owns metadata in `src/features/tools/{tool}/manifest.ts`. `src/core/registry/manifests.ts` statically imports those manifests, and `src/core/registry` exposes the public registry APIs. This manifest layer is the single source of truth for:
- Sidebar navigation
- Sitemap generation
- Route metadata
- Breadcrumbs
- Related tools linking
- Command palette

Tool metadata structure:
```typescript
interface ToolMeta {
  key: string;              // Translation key (tools.{key})
  slug: string;             // URL slug (must match src/features/tools/{slug}/)
  category: ToolCategory;   // Category for breadcrumbs/hubs
  relatedTools: string[];   // Tool keys for related navigation (4-6 recommended)
  keywords: string[];       // Search and route metadata terms (English)
  updatedAt?: string;       // Optional lastmod for sitemap
}
```

Manifest files must stay as simple literal metadata objects exported as `toolManifest` and ending with `satisfies ToolMeta`. Use literal strings and literal string arrays for parser-read fields. Do not add spreads, computed keys, functions, template literals, dynamic expressions, React imports, or client-only imports to manifests.

#### Locale-Aware Routing
Route wrappers live under `src/app/[lang]/{tool-slug}/page.tsx`. The `[lang]` segment handles locale routing for all 7 supported languages. Locale context is provided via `useLang()` from `src/core/i18n/lang-provider.tsx`.

Canonical tool page implementations live in `src/features/tools/{tool}/page.tsx`, while their route files under `src/app/[lang]/{tool}/page.tsx` stay as thin wrappers. Large tools should keep helper, component, sample, state, and pure logic in feature-local modules such as `logic.ts`, `utils.ts`, `types.ts`, `samples.ts`, `constants.ts`, `browser-actions.ts`, `hooks.ts`, or `components.tsx`. Keep `logic.ts` pure and put downloads, FileReader, DOM helpers, and object URL helpers in `browser-actions.ts`.
Each canonical tool also has `src/features/tools/{tool}/manifest.ts`; legacy imports under `src/lib/tool-meta*` and `src/core/registry/tool-meta*` are compatibility shims.

#### Translation System
- Translations live in `src/core/i18n/translations/{locale}.json`
- Tool metadata keys follow `tools.{tool_key}.{field}` convention
- The i18n gate (`npm run check:i18n`) enforces key parity and same-as-English checks across all locales
- The untranslated ratchet script is available as an optional manual/rollout check, but CI/validate enforcement is owned by `check:i18n`

#### Static Export Mode
The project uses `output: "export"` for fully static generation, with all computation happening client-side in the browser.

#### Tool Patterns
Common tool UI patterns are extracted to reusable components:
- `tool-action-bar.tsx`: Standard action toolbar
- `tool-empty-state.tsx`: Empty/initial state
- `tool-preview-area.tsx`: Output preview
- `monaco-editors.tsx`: Code editor integration
- `src/features/tool-shell/`: Shared tool shell components and tool-level banners
- `src/features/tool-templates/single-hash-tool-page.tsx`: Single-input hash tool template
- `src/features/tool-templates/focused-hash-tool-page.tsx`: Focused hash workflow template
- `src/features/tool-templates/html-css-beautifier-tool.tsx`: HTML/CSS beautifier wrapper
- `src/features/tool-templates/markdown-preview-renderer.tsx`: Markdown preview renderer

#### Quality Gates and CI
The build pipeline (`npm run build`) runs:
1. Pre-build validation: SW version, sitemap, security headers, i18n, types
2. Next.js build
3. Post-build checks: canonical, hreflang, route metadata, localized route content, export HTML lang, robots meta

All gates are non-negotiable before merge.

## Development Workflows

### Adding a New Tool

Use the scaffolding script:
```bash
npm run create:tool
```

Manual steps if needed:
1. Create feature page: `src/features/tools/{tool-slug}/page.tsx`
2. Create route wrapper: `src/app/[lang]/{tool-slug}/page.tsx`
3. Create manifest: `src/features/tools/{tool-slug}/manifest.ts`
4. Add feature-local `logic.ts`, `types.ts`, `samples.ts`, and optional `browser-actions.ts` when the page needs helper code
5. Add translations for all locales in `src/core/i18n/translations/*.json` under `tools.{tool_key}`
6. Implement tool logic inside the feature page or a feature-local module; use `src/core/utils` only for retained cross-tool utilities.
7. Add related tools links (4-6 tools)
8. Run `npm run generate:tool-index` and `npm run generate:client-tool-lookup`
9. Verify quality gates pass

### Extending Locales

To add a new locale (checklist in `src/core/i18n/i18n.ts`):
1. Add to `LOCALES` and `LOCALE_NAMES` in `src/core/i18n/i18n.ts`
2. Create `src/core/i18n/translations/{locale}.json`
3. Add route metadata copy where required
4. Add locale-specific generated route content where required
5. Add locale-specific build checks to `package.json` scripts

### Running Single Tests
```bash
npx vitest run tests/{test-name}.test.ts
```

### Debugging Build Failures
1. Check script output for specific failure
2. For i18n failures: `npm run check:i18n` shows detailed mismatches
3. For route metadata or export failures: scripts under `scripts/gates/` provide specific line-by-line reports
4. For type errors: `npm run check:types`

## Code Conventions

### Tool Component Structure
- Use `"use client"` for interactive tool pages
- Extract tool-specific pure logic to feature-local `logic.ts` files; keep it testable and framework-agnostic. `logic.ts`, `samples.ts`, `types.ts`, and `constants.ts` should not import React.
- Use `useLang()` for translations
- Persist tool state with `src/core/storage/tool-persistence` utilities
- Import/export via `src/core/files/text-file-import` utilities
- Use `safeClipboardWrite()` from `src/core/clipboard/clipboard` for copy actions

### Naming Conventions
- Tool slugs: kebab-case (e.g., `base64-encode-decode`)
- Tool keys: snake_case (e.g., `base64_encode_decode`)
- Translation keys: nested (e.g., `tools.base64_encode_decode.title`)
- Component files: kebab-case
- Utility files: prefer feature-local `logic.ts`; retained shared utilities live under `src/core/utils`

### Import Aliases
The project uses `@/` alias for `src/` (configured in `tsconfig.json` and `vitest.config.mts`).

### Testing Philosophy
- Unit test pure logic in feature-local `logic.ts` modules or retained shared utilities under `src/core/utils`
- Component tests for complex UI interactions
- Guard tests (`*-guard.test.ts`) for CI quality gates
- E2E smoke tests for critical user paths

### High-Traffic Tool Quality Bar
Core tools that receive the most usage must meet a higher quality bar:
- JSON Formatter
- Base64 Encode/Decode
- JWT Decoder
- Hash Generator
- URL Encode/Decode
- UUID Generator
- Regex Tester
- Cron Generator
- JSON to TypeScript

For these tools, ensure:
1. **Auto-run or instant feedback** where appropriate
2. **Rich error messages** with line/column details
3. **Mobile-optimized** layout and interactions
4. **Example/sample data** readily available
5. **Keyboard shortcuts** for common actions
6. **Comprehensive edge-case handling**
7. **Performance tested** with large inputs (>1MB)

## Route Metadata and Content Quality

### Related Tools
Every tool must have 4-6 related tools for navigation consistency. Enforced by `npm run check:related-tools`.

**Best Practice**: Organize related tools by workflow/task rather than just similarity:
- After JSON Formatter → JSON to TypeScript, JSONPath, JSON Diff (task: "work with JSON data")
- After Base64 Decode → JWT Decoder, URL Decode, Hash Verify (task: "decode and inspect")
- After Hash Generator → HMAC Generator, Password Generator, UUID Generator (task: "generate IDs and secrets")

### Generated Route Content
Tools use generated, server-rendered route content modules that are checked per locale during build.

**Warning**: Avoid over-templating. Every tool should provide genuinely useful, tool-specific guidance instead of generic filler.

### Canonical and Hreflang
- Canonical URLs and hreflang tags are auto-generated and validated in post-build
- Failures block deployment

### Content Quality Guidelines
Tool documentation should include:
1. **Clear title and description** — What the tool does in one sentence
2. **Usage guide** — How to use, with specific examples
3. **Common use cases** — When developers would need this
4. **Input/output examples** — Show before/after
5. **Error handling** — What can go wrong and how to fix
6. **Security notes** — Any privacy or security considerations
7. **Tool-specific questions** — Real questions users have, not generic templates

Avoid:
- Step-by-step workflows that are obvious ("Click the button, see the result")
- Repetitive safety disclaimers across all tools
- Keyword stuffing
- Generic "Tips for Development" sections with no tool-specific value

## Performance

### Bundle Analysis
```bash
npm run analyze
```
Opens `.next/analyze/*.html` with Webpack Bundle Analyzer.

### Performance Considerations for Large Inputs

**Problem**: Client-side processing can block the main thread with large inputs (>1MB JSON, large files, complex transformations).

**Solutions**:
1. **Web Workers**: Offload heavy computation to background threads
2. **Streaming/Chunking**: Process files in chunks rather than loading entirely into memory
3. **Lazy Loading**: Code-split tool-specific dependencies
4. **Input Size Warnings**: Alert users before processing very large inputs
5. **Debouncing**: For auto-run tools, debounce input changes (300-500ms)

**Example thresholds**:
- JSON formatting: Warn at >5MB, use worker at >10MB
- Base64 encode/decode: Stream files >10MB
- File hash: Always use chunked reading
- Image processing: Warn at >20MB

**Files to modify**:
- Create `src/workers/{tool}.worker.ts` for computation
- Update tool logic to delegate to worker for large inputs
- Add size detection and user warnings

## UX Design Guidelines

### Tool Page Interaction Patterns

#### Input/Output Workflow
The ideal tool interaction flow should be:
1. **Immediate focus**: Click anywhere in input area to start typing
2. **Auto-run or explicit action**: Small inputs auto-run; large inputs require explicit action
3. **Clear feedback**: Show loading, success, or error states
4. **One-click copy**: Output should have prominent copy button
5. **Preserve context**: Don't clear input on error

#### Mode Switching
Tools with multiple modes (e.g., Encode/Decode, Format/Minify) must have **crystal-clear state**:
- Current mode should be visually highlighted
- Mode toggle should show "switch to X" action, not ambiguous labels
- Prefer explicit selector over toggle buttons when >2 modes exist

Example of good mode design:
```
Operation: [Encode ▼]  // Clear dropdown showing current state
Input type: [Text] [File] [URL-safe]  // Radio-style selection
```

Avoid ambiguous patterns like:
```
[Encode Base64] [Decode Base64]  // Which button shows current mode?
```

#### Error Handling
Error messages should be:
- **Specific**: Show line/column for syntax errors
- **Actionable**: Tell users how to fix, not just "invalid input"
- **Non-blocking**: Show error but don't clear input
- **Contextual**: For JSON, show parse error details; for Base64, explain padding/character issues

Good error examples:
- `Unexpected trailing comma at line 3, column 28`
- `Invalid Base64 length. Input must be divisible by 4, got 23 characters. Use URL-safe mode for unpadded Base64.`
- `Invalid cron minute field. Expected 0-59, got 90`

Bad error examples:
- `Invalid input`
- `Parse error`
- `Try again`

#### Accessibility Requirements
- All icon-only buttons must have `aria-label`
- Keyboard navigation (Tab order) must be logical
- Error messages need `aria-live` regions
- Color must not be the only state indicator
- Support Escape to close modals/dropdowns
- Command palette (⌘K / Ctrl+K) must be keyboard-accessible

### Mobile-First Considerations
Tool pages differ from content pages — they require special mobile optimization:
- **Vertical layout**: Input/output should stack vertically on mobile
- **Adequate touch targets**: Buttons minimum 44×44px
- **Copy button always visible**: Don't hide behind overflow
- **Keyboard-aware**: Input area should resize when keyboard appears
- **No floating overlays**: Feedback widget should not block output area
- **Paste-first workflow**: Make paste button prominent on mobile

### Chinese Localization Rules
- **Add spaces between Chinese and English/numbers**: `JWT 解码器` not `JWT解码器`
- **Translate UI actions**: Use `复制` not `Copy` for buttons
- **Keep technical terms in English when appropriate**: `Base64`、`JSON`、`API` are universally understood
- **Natural phrasing**: Avoid word-for-word translation; prioritize readability
- **Consistent terminology**: Use glossary to maintain consistency (e.g., always `工具` for tools, not mixed with `实用程序`)

## Known Issues and Improvement Priorities

### High Priority (P1) — Core Experience

#### 1. Homepage Value Proposition Clarity ✅ COMPLETED (2026-06-06)
**Problem**: "Local-First Developer Workspace" is abstract. First-time visitors need to read subtitle to understand this is a browser toolbox.

**Solution**: Updated hero message to be more direct:
```
Primary: "100+ 个本地浏览器工具" (localized across all 7 locales)
Secondary: "格式化、转换、生成、调试 — 敏感数据不出浏览器"
```

**Completed changes**: 
- Updated hero messaging in all locale files (`src/core/i18n/translations/*.json`)
- Replaced full 111-tool catalog with category preview (4 tools per category)
- Added popular tools section with 9 high-traffic tools
- Created `src/features/home/components/home-category-preview.tsx`
- Added i18n support: `explore_by_category_title`, `explore_by_category_subtitle`

**Related commits**: 
- `feat(i18n): add multilingual support for category preview section`
- `refactor: replace full tool catalog with category preview on homepage`

#### 2. Tool Mode Switching Confusion
**Problem**: Tools like Base64 Encode/Decode have ambiguous mode indicators. Users can't tell if buttons show "current mode" or "click action".

**Solution**: Redesign mode switcher pattern:
- Use explicit dropdown or segmented control showing current state
- Separate input type selection from operation selection
- Add visual highlight to active mode

**Files to modify**:
- `src/features/tools/{tool}/` for future tool-specific mode switching components
- Create reusable `mode-switcher.tsx` component

**Example tools affected**: Base64, Hash (HMAC mode), URL Encode/Decode

#### 3. Search and Tool Discovery (Partially Completed)
**Problem**: 111 tools with only category navigation isn't enough. Users need:
- Fuzzy search with typo tolerance
- Chinese/English search terms
- Search by use case (e.g., "decode token" → JWT Decoder)
- Popular/Recent tools section

**Status**: 
- ✅ Popular tools section added to homepage (9 high-traffic tools)
- ✅ Category preview shows 4 tools per category for better discovery
- Command palette search exists but needs fuzzy matching and multilingual search terms
- 🔄 Recently used tools tracking not yet implemented

**Remaining work**:
- Add search terms or aliases to the tool manifest/alias registry
- Implement fuzzy matching (consider Fuse.js)
- Track recently used tools in localStorage

**Files to modify**:
- `src/core/registry/types.ts` — add aliases or search terms if the registry model supports them
- `src/components/layout/command-palette.tsx` — enhance search algorithm
- `src/core/utils/search-index.ts` — new file for search logic

#### 4. Feedback Widget Positioning ✅ COMPLETED (2026-06-06)
**Problem**: Right-bottom floating "Was this tool helpful?" can block output area, especially on mobile or small screens.

**Solution**: Refactored feedback dialog for mobile responsiveness:
- Privacy guarantee text now properly contained within dialog viewport
- Left sidebar hidden on mobile with dedicated mobile header
- Mobile-specific privacy note positioned at bottom
- Debug console hidden by default and desktop-only
- Dialog height responsive with `max-h-[85vh]`

**Completed changes**:
- Refactored the legacy feedback CTA implementation (formerly `feedback-dialog.tsx`)
- Added mobile-responsive layout with hidden/visible sections
- Fixed text overflow issues on mobile viewports

**Related commit**: `refactor(feedback): fix mobile layout and privacy guarantee positioning`

#### 5. Mobile Experience
**Problem**: Tool pages not optimized for mobile. Input/output areas, copy buttons, and navigation need mobile-specific treatment.

**Solution**:
- Add responsive breakpoints for tool layouts
- Ensure copy buttons are always tapped
- Test with mobile keyboard open
- Optimize touch target sizes

**Files to modify**:
- `src/features/tool-shell/tool-action-bar.tsx`
- Tool page layouts in `src/app/[lang]/*/page.tsx`
- Add mobile-specific CSS utilities

### Medium Priority (P2) — Polish and Features

#### 6. Auto-Run Toggle
**Problem**: Some tools (Hash, JSON Formatter) would benefit from auto-run on input change. Currently require manual button clicks.

**Solution**: Add per-tool or global "Auto-run" setting stored in localStorage.

**Files to modify**:
- `src/core/storage/tool-persistence.ts` — add auto-run preference
- Tool components — add auto-run logic with debouncing

#### 7. Enhanced Error Messages
**Problem**: Error messages are often generic ("Invalid JSON"). Users need line numbers, column positions, and specific error reasons.

**Solution**: Parse error details from underlying libraries and format them clearly.

**Example implementations**:
- JSON: Extract SyntaxError message, show line/column
- Base64: Explain padding vs character issues
- Cron: Validate each field and explain which failed
- URL: Show specific malformed component

**Files to modify**:
- `src/core/utils/*-utils.ts` — enhance error handling to return structured errors
- Tool components — format errors for display

#### 8. Task-Based Related Tools
**Problem**: Related tools are currently generic. They should be workflow-oriented.

**Solution**: Group related tools by task/workflow:
- After JSON Formatter → suggest JSON to TypeScript, JSONPath Query, JSON Diff
- After Base64 Decode → suggest JWT Decoder, URL Decode, Hash verification
- Add "What's next?" context to related tools section

**Files to modify**:
- `src/features/tools/{tool}/manifest.ts` — refine `relatedTools` with task context
- Related tool surface — add workflow hints where the current component supports them

#### 9. Input Area Focus Behavior
**Problem**: Clicking input panel edges doesn't focus the editor. Users need to click specific editable area.

**Solution**: Expand click target to entire input container.

**Files to modify**:
- `src/features/tool-shell/monaco-editors.tsx`
- Tool-specific input components

#### 10. Example/Sample Data Buttons
**Problem**: Users need to see tool in action before inputting their data. Add "Try Example" button for every tool.

**Solution**: 
- Define sample inputs per tool
- Add "Load Example" button
- Show expected output for sample

**Files to modify**:
- `src/core/registry/types.ts` — add `sampleInput?: string`
- Tool components — add example button
- Translations — add example button labels

### Low Priority (P3) — Advanced Features

#### 11. Workflow/Pipeline Mode
**Problem**: Users often need multi-step transformations (e.g., URL Decode → Base64 Decode → JSON Format).

**Solution**: Create workflow mode where users can chain tools.

**New files**:
- `src/app/[lang]/workflow/page.tsx`
- `src/core/utils/workflow-engine.ts`

#### 12. Local History
**Problem**: Users may want to access recent inputs/outputs without server storage.

**Solution**: Store recent operations in IndexedDB (with opt-in, clear privacy disclosure).

**Considerations**:
- Default OFF for security
- Clear "stored locally only" messaging
- Add "Clear History" button
- Never store sensitive data without explicit consent

#### 13. Performance for Large Inputs
**Problem**: Large JSON/Base64/file processing can block main thread.

**Solution**: Use Web Workers for heavy computation.

**Files to create**:
- `src/workers/json-formatter.worker.ts`
- `src/workers/base64.worker.ts`
- Update tool logic to offload to workers for >1MB inputs

## Common Pitfalls

1. **Forgetting tool manifests**: New tool routes won't appear in nav/sitemap without `src/features/tools/{tool}/manifest.ts`
2. **Missing translations**: English-only tools will fail `check:i18n`
3. **Skipping related-tools**: Build will fail if <4 related tools
4. **Not running full build**: `npm run build` catches issues that `npm run build:app` misses
5. **Breaking i18n same-as-English checks**: Adding untranslated keys fails `check:i18n`
6. **Inconsistent Chinese spacing**: Must add spaces between Chinese and English/numbers
7. **Ambiguous mode switches**: Always make current state visually obvious
8. **Generic error messages**: Provide specific, actionable error details
9. **Blocking overlays on mobile**: Feedback widgets and modals must not block tool interaction
10. **Missing ARIA labels**: Icon-only buttons need accessibility labels

## Documentation Boundaries

Keep repository documentation durable and current:
- Architecture boundaries live in `docs/architecture/`.
- Product, UI, and technical design specs live in `docs/specs/`.
- Runtime reports, audit output, agent handoffs, temporary plans, and editor/assistant assets are not committed documentation. Write generated reports to ignored local output such as `output/reports/` or attach them to CI runs when needed.

## Product Roadmap Context

Based on user feedback and competitive analysis, the strategic priorities are:

### Phase 1: First Impression (Current Focus)
Goal: Make value proposition immediately clear to first-time visitors
- Clarify homepage hero messaging
- Add "Popular Tools" section to homepage
- Enhance search with fuzzy matching and aliases
- Optimize CTA from "Install app" to "Explore tools"

### Phase 2: Core Tool Polish
Goal: Make high-traffic tools exceptionally smooth
- Fix mode switching UX (Base64, encoding tools)
- Add auto-run toggle where appropriate
- Enhance error messages with specifics
- Improve input area focus behavior
- Add "Try Example" to all tools

### Phase 3: Discovery and Retention
Goal: Help users find tools and return frequently
- Build favorites/bookmark system (localStorage)
- Track recently used tools
- Add tool tags and advanced filtering
- Optimize PWA install flow
- Build task-based tool recommendations

### Phase 4: Advanced Differentiation
Goal: Features that competitors don't have
- Workflow/pipeline mode for chained transformations
- Batch processing mode
- Web Worker support for large files
- Local-only history (opt-in)
- Plugin or contribution system

### Anti-Goals (What NOT to Build)
- Server-side processing (violates privacy promise)
- User accounts or login (adds friction)
- Premium features or paywalls (goes against "always free")
- Tool quantity over quality (111 tools is already substantial)
- Generic AI features (focus on deterministic tools)

## Additional Resources

- Directory boundaries: `docs/architecture/directory-structure.md`
- Module boundaries: `docs/architecture/module-boundaries.md`
- Design and technical specs: `docs/specs/`

## Quick Reference: Key Files for Common Tasks

### Adding a new tool
- `src/features/tools/{tool-slug}/page.tsx` — create feature page implementation
- `src/features/tools/{tool-slug}/manifest.ts` — create tool metadata
- `src/app/[lang]/{tool-slug}/page.tsx` — create thin route wrapper
- `src/core/i18n/translations/*.json` — add translations
- `src/features/tools/{tool-slug}/logic.ts` — implement tool-specific logic (optional)

### Fixing homepage messaging
- `src/features/home/components/hero.tsx` or equivalent
- `src/core/i18n/translations/*.json` — update `home.title`, `home.subtitle`

### Improving search
- `src/components/layout/search.tsx` or command palette
- `src/core/registry/types.ts` — add search-related fields
- `src/core/utils/search-index.ts` — implement fuzzy search

### Enhancing error messages
- `src/core/utils/*-utils.ts` — return structured errors
- Tool components — format errors for display
- `src/core/i18n/translations/*.json` — add error message keys

### Mobile optimization
- `src/features/tool-shell/tool-action-bar.tsx`
- Tool page layouts with responsive breakpoints
- `tailwind.config.ts` — ensure mobile utilities

### i18n improvements
- `src/core/i18n/translations/*.json` — update all locales
- `scripts/gates/check-i18n.js` — understand validation logic
- `scripts/gates/check-i18n-untranslated-ratchet.js` — optional manual/rollout ratchet

### Performance optimization
- `src/workers/*.worker.ts` — offload heavy computation
- `next.config.ts` — adjust bundle splitting
- `npm run analyze` — identify large dependencies
