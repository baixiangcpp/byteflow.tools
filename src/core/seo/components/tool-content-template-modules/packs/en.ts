import type { FallbackLocalePack } from "../types"

export const EN_FALLBACK_PACK: FallbackLocalePack = {
    description: (title) => `${title} helps developers complete focused tasks quickly in the browser.`,
    introSuffix: "This guide provides practical usage notes, troubleshooting checks, and safe handling recommendations.",
    whatThisToolDoes: (title) => [
        `${title} converts raw input into structured output so teams can validate results before rollout.`,
        "You can change one variable at a time, rerun instantly, and compare output differences.",
        "Input, output, and troubleshooting notes stay in one place to reduce handoff mistakes.",
    ],
    useCases: (title) => [
        `Validate ${title} output during API integration and incident triage.`,
        "Prepare reproducible examples for docs, runbooks, and pull requests.",
        "Run manual quality checks before payload or config updates.",
        "Exercise edge cases early to reduce QA loops.",
    ],
    inputExamples: [
        { label: "Sample input", value: "Paste representative source content used by your workflow." },
        { label: "Edge-case input", value: "Include empty values, boundary lengths, and malformed snippets." },
    ],
    outputExamples: [
        { label: "Expected output", value: "Keep one normalized output as a baseline for environment comparison." },
        { label: "Review output", value: "Attach this output block in PRs or issues to speed up technical review." },
    ],
    commonErrors: [
        { error: "Input format mismatch", fix: "Verify assumptions and normalize to the expected format before rerun." },
        { error: "Hidden characters from copy/paste", fix: "Paste as plain text and trim surrounding whitespace." },
        { error: "Mismatch with backend output", fix: "Align encoding, delimiter strategy, timezone, and newline rules." },
    ],
    privacyNotes: [
        "Processing is local to your browser session and does not require server-side submission.",
        "Redact tokens, secrets, and personal data before sharing output externally.",
        "Clear clipboard history on shared devices after copying sensitive output.",
    ],
    faqs: (title) => [
        { q: `When should I use ${title}?`, a: "Use it before merge, release, or handoff when you need a quick reproducible check." },
        { q: "How do I investigate inconsistent output?", a: "Start with minimal input, then verify encoding and delimiters step by step." },
        { q: "Can this replace automated tests?", a: "No. Treat this as an interactive validation layer; CI tests remain required." },
    ],
    workflow: (title) => [
        `Start with a minimal input for ${title} and verify baseline behavior first.`,
        "Confirm the source sample matches the format or workflow you actually need to inspect.",
        "Change one variable at a time and compare output differences before moving on.",
        "Keep one verified output snapshot as a team reference.",
    ],
    checklist: (title) => [
        `Confirm ${title} output is deterministic across repeated runs with identical input.`,
        "Check boundary inputs (empty values, long fields, invalid characters).",
        "Remove sensitive data before sharing output externally.",
        "Record the exact input and output pair that passed review so teammates can reproduce it quickly.",
    ],
    operational: (title) => `Use ${title} as a quick browser-side verification step before merge, release, or handoff, then carry the confirmed sample into docs or tickets.`,
    intentContent: {
        formatter: {
            whatThisToolDoes: (title) => [
                `${title} restructures source text into readable, review-friendly output before release.`,
                "It exposes syntax and spacing issues faster than manual inspection in large payloads.",
                "It keeps formatting, validation, and troubleshooting cues in one repeatable browser workflow.",
            ],
            useCases: (title) => [
                `Format and verify ${title} results before merge or incident handoff.`,
                "Normalize copied snippets from logs into readable blocks for reviews.",
                "Prepare clean examples for runbooks, docs, and pull requests.",
                "Quickly catch malformed structures before backend parsing fails.",
            ],
            inputExamples: [
                { label: "Raw source input", value: "Paste unformatted code or payload content for normalization." },
                { label: "Malformed sample", value: "Include uneven spacing, line breaks, or syntax-adjacent edge cases." },
            ],
            outputExamples: [
                { label: "Formatted output", value: "Keep one canonical, readable output block for team review." },
                { label: "Validation output", value: "Use normalized output to compare parser behavior across environments." },
            ],
            commonErrors: [
                { error: "Input is not valid for this formatter", fix: "Validate source syntax first, then rerun formatting." },
                { error: "Unexpected indentation style", fix: "Confirm configured spacing and line-break options." },
                { error: "Assuming formatting changed semantics", fix: "Formatting affects presentation; verify logic separately." },
            ],
            faqs: (title) => [
                { q: `When should I use ${title}?`, a: "Use it when readability and quick syntax sanity checks are needed before sharing output." },
                { q: "Can formatting replace validation tests?", a: "No. Treat this as a fast interactive check, not a substitute for CI validation." },
                { q: "How do I debug unexpected output?", a: "Start with a minimal sample and add complexity one variable at a time." },
            ],
            workflow: (title) => [
                `Paste representative source text into ${title} and run it once to establish a clean baseline.`,
                "Check indentation, spacing, and structural grouping before reviewing edge cases.",
                "Rerun with malformed or uneven samples to confirm how formatting behaves near parser boundaries.",
                "Keep one normalized output block as the reference copy for reviews and handoff.",
            ],
            checklist: (title) => [
                `Confirm ${title} produces the same normalized output for identical input.`,
                "Spot-check that formatting improved readability without hiding syntax mistakes.",
                "Verify indentation, line breaks, and wrapping rules match team expectations.",
                "Redact secrets or customer data before sharing formatted samples externally.",
            ],
            operational: (title) => `${title} works best as a fast normalization step before code review, incident triage, and parser debugging.`,
        },
        generator: {
            whatThisToolDoes: (title) => [
                `${title} produces structured outputs from configurable inputs so teams can generate assets quickly.`,
                "It supports repeatable generation runs with clear output snapshots for handoff and review.",
                "It reduces manual authoring time when placeholder, id, visual, or schedule artifacts are needed.",
            ],
            useCases: (title) => [
                `Generate production-like ${title} output for UI, docs, and test workflows.`,
                "Create batched artifacts for onboarding, demos, or scripted QA tasks.",
                "Standardize generated output shape across teams with predictable settings.",
                "Prepare reproducible samples for integration and support debugging.",
            ],
            inputExamples: [
                { label: "Generation settings", value: "Set count, mode, and constraints before running output generation." },
                { label: "Preset scenario", value: "Use known-good presets for repeatable team workflows." },
            ],
            outputExamples: [
                { label: "Generated output", value: "Store one verified output snapshot as a reference sample." },
                { label: "Batch output", value: "Export multiple generated items for controlled downstream use." },
            ],
            commonErrors: [
                { error: "Output does not match policy constraints", fix: "Recheck generation options and preset configuration." },
                { error: "Reused generated values cause collisions", fix: "Generate unique output per account, row, or workflow context." },
                { error: "Randomness assumptions are unclear", fix: "Document seed/entropy expectations for reproducible runs." },
            ],
            faqs: (title) => [
                { q: `Is ${title} suitable for production workflows?`, a: "Yes for generation tasks, as long as output is validated before deployment." },
                { q: "Can I generate multiple results at once?", a: "Yes. Batch generation is recommended for repeatable operational tasks." },
                { q: "Should generated values be reviewed manually?", a: "Yes. Spot-check samples and policy alignment before broad rollout." },
            ],
            workflow: (title) => [
                `Set the minimum options required by ${title} and generate one sample output first.`,
                "Review the first result for structure, readability, and policy fit before generating variants.",
                "Adjust one setting at a time so you can see which control changes the output.",
                "Save one approved sample or preset to anchor future runs and reviews.",
            ],
            checklist: (title) => [
                `Confirm ${title} output matches the constraints or style rules you intended to apply.`,
                "Check that generated values are plausible for the real workflow, not just the demo case.",
                "Verify repeated runs behave as expected when randomness or presets are involved.",
                "Remove any real account names, IDs, or internal references before sharing generated output.",
            ],
            operational: (title) => `${title} is most useful when you lock in a reviewed preset, then generate repeatable samples for product, QA, or content workflows.`,
        },
        converter: {
            whatThisToolDoes: (title) => [
                `${title} transforms input from one format to another while preserving conversion intent.`,
                "It helps teams verify round-trip behavior and detect encoding or delimiter mismatches early.",
                "It provides practical examples for moving data between APIs, docs, and automation scripts safely.",
            ],
            useCases: (title) => [
                `Convert ${title} payloads between source and target formats during integration work.`,
                "Generate interoperable examples for API docs and troubleshooting tickets.",
                "Validate conversion results before applying transformed content in production paths.",
                "Compare round-trip outputs to catch hidden encoding drift.",
            ],
            inputExamples: [
                { label: "Source format input", value: "Paste representative content in the original format." },
                { label: "Boundary conversion input", value: "Include empty values and escaped characters to test edge behavior." },
            ],
            outputExamples: [
                { label: "Converted output", value: "Review transformed output against expected target format rules." },
                { label: "Round-trip check", value: "Convert back when possible to confirm no unintended data drift." },
            ],
            commonErrors: [
                { error: "Source and target formats are mixed", fix: "Verify direction and mode before running conversion." },
                { error: "Escaping rules differ between systems", fix: "Align encoding and escape strategy across producer and consumer." },
                { error: "Type coercion changes meaning", fix: "Validate numeric, boolean, and null semantics after conversion." },
            ],
            faqs: (title) => [
                { q: `What is the best way to validate ${title} output?`, a: "Use representative fixtures and compare against expected target schema rules." },
                { q: "Should I run round-trip checks?", a: "Yes, whenever bidirectional conversion is available and fidelity matters." },
                { q: "Can conversion replace schema validation?", a: "No. Convert first, then run explicit schema or contract checks." },
            ],
            workflow: (title) => [
                `Start ${title} with a representative source sample and confirm the conversion direction before running it.`,
                "Review the first converted result against the target format rules you expect downstream systems to enforce.",
                "If the tool supports reverse conversion, run a round-trip check to catch silent drift early.",
                "Keep one verified source/output pair as a regression sample for docs, tickets, and future checks.",
            ],
            checklist: (title) => [
                `Confirm ${title} preserves the fields and values that matter for your target workflow.`,
                "Check escaping, delimiters, quoting, and null/boolean handling where formats differ.",
                "Use at least one boundary sample with empty values, special characters, or nested content.",
                "Redact tokens, secrets, and customer data before sharing converted payloads.",
            ],
            operational: (title) => `${title} should be treated as a quick translation and verification step before transformed payloads are reused in production paths.`,
        },
        analyzer: {
            whatThisToolDoes: (title) => [
                `${title} inspects, compares, or explains technical inputs so teams can diagnose issues faster.`,
                "It surfaces actionable findings for debugging, triage, and cross-team communication.",
                "It keeps analysis evidence in one place to reduce context switching during incident response.",
            ],
            useCases: (title) => [
                `Analyze ${title} input and review findings before escalating incidents.`,
                "Compare outputs across environments to isolate regressions quickly.",
                "Prepare concise diagnostic artifacts for runbooks and support handoff.",
                "Use structured analysis notes in postmortems and remediation planning.",
            ],
            inputExamples: [
                { label: "Diagnostic input", value: "Paste logs, payloads, or config snippets relevant to the issue." },
                { label: "Comparison input", value: "Provide baseline and current samples to inspect differences." },
            ],
            outputExamples: [
                { label: "Analysis output", value: "Capture key findings and risk signals from the inspected input." },
                { label: "Investigation note", value: "Document assumptions, anomalies, and next validation steps." },
            ],
            commonErrors: [
                { error: "Input sample is incomplete", fix: "Start with minimal reproducible evidence, then expand scope." },
                { error: "False conclusions from noisy data", fix: "Compare against clean baseline samples before deciding." },
                { error: "Findings are not actionable", fix: "Translate output into concrete next checks and ownership notes." },
            ],
            faqs: (title) => [
                { q: `How should I use ${title} during incidents?`, a: "Use it to gather consistent evidence before diving into deeper system-level debugging." },
                { q: "Can analysis output be shared directly?", a: "Yes, but redact sensitive fields before posting outside trusted channels." },
                { q: "Does this replace observability tooling?", a: "No. It complements logs and APM by accelerating focused local analysis." },
            ],
            workflow: (title) => [
                `Feed ${title} the smallest reproducible sample you can collect from the real issue.`,
                "Review the first findings and separate confirmed signals from assumptions or environment-specific noise.",
                "Compare a clean baseline sample against the problematic input when you need to isolate regressions.",
                "Keep one redacted output snapshot with the key findings for tickets, runbooks, or incident handoff.",
            ],
            checklist: (title) => [
                `Confirm ${title} findings still reproduce with the same input and assumptions.`,
                "Check that the sample includes enough surrounding context to support the conclusion you are drawing.",
                "Translate notable findings into concrete next checks, ownership, or remediation notes.",
                "Redact private hosts, tokens, certificates, or customer identifiers before sharing analysis output.",
            ],
            operational: (title) => `${title} is most effective when it produces a focused, reproducible evidence bundle that can be handed to the next engineer without extra cleanup.`,
        },
    },
}
