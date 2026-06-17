import { encodeTextToBase64, decodeBase64ToText } from "@/core/utils/base64-utils"
import { cleanText, analyzeText, type CleanOptions } from "@/core/utils/invisible-chars-utils"
import { scrubLogs, DEFAULT_SCRUB_OPTIONS, type ScrubOptions } from "@/core/utils/log-scrubber-utils"
import { encodeUrlByMode, decodeUrlByMode, type UrlEncodingMode } from "@/core/utils/url-codec-utils"
import { removeExtraWhitespace } from "@/core/utils/whitespace-utils"
import type { AdapterRunResult, AdapterValidationResult, PipelineToolAdapter } from "./recipe-types"

type Operation = "encode" | "decode"

function ok(): AdapterValidationResult {
    return { ok: true, errors: [] }
}

function fail(message: string): AdapterValidationResult {
    return { ok: false, errors: [message] }
}

function stringOption(options: Record<string, unknown>, key: string, fallback: string): string {
    const value = options[key]
    return typeof value === "string" ? value : fallback
}

function booleanOption(options: Record<string, unknown>, key: string, fallback: boolean): boolean {
    const value = options[key]
    return typeof value === "boolean" ? value : fallback
}

function success(output: string, startedAt: number, input: string, warnings: string[] = []): AdapterRunResult {
    return {
        ok: true,
        output,
        warnings,
        metrics: {
            inputBytes: new TextEncoder().encode(input).byteLength,
            outputBytes: new TextEncoder().encode(output).byteLength,
            durationMs: Math.max(0, performance.now() - startedAt),
        },
    }
}

function failure(code: string, message: string, startedAt: number, input: string): AdapterRunResult {
    return {
        ok: false,
        error: { code, message },
        metrics: {
            inputBytes: new TextEncoder().encode(input).byteLength,
            outputBytes: 0,
            durationMs: Math.max(0, performance.now() - startedAt),
        },
    }
}

const jsonFormatterAdapter: PipelineToolAdapter = {
    toolKey: "json_formatter",
    slug: "json-formatter",
    version: 1,
    inputKind: "json",
    outputKind: "json",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "Pretty-print mode can increase payload size.",
        "This adapter preserves input data; place a scrubber step first for secrets.",
    ],
    defaultOptions: {
        mode: "pretty",
        indent: 2,
    },
    publicOptionKeys: ["mode", "indent"],
    validateOptions(options) {
        const mode = stringOption(options, "mode", "pretty")
        if (!["pretty", "minify"].includes(mode)) return fail("mode must be pretty or minify.")
        const indent = Number(options.indent ?? 2)
        if (!Number.isFinite(indent) || indent < 0 || indent > 8) return fail("indent must be between 0 and 8.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        try {
            const parsed = JSON.parse(input)
            const mode = stringOption(options, "mode", "pretty")
            const indent = Math.max(0, Math.min(8, Math.floor(Number(options.indent ?? 2))))
            const output = mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent)
            return success(output, startedAt, input)
        } catch (error) {
            return failure("json_parse_error", error instanceof Error ? error.message : "Invalid JSON.", startedAt, input)
        }
    },
}

const base64Adapter: PipelineToolAdapter = {
    toolKey: "base64_encode_decode",
    slug: "base64-encode-decode",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: false,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "Encoding is reversible and does not protect sensitive input.",
        "Encoded output can be larger than the input.",
    ],
    defaultOptions: {
        operation: "encode",
        urlSafe: false,
    },
    publicOptionKeys: ["operation", "urlSafe"],
    validateOptions(options) {
        const operation = stringOption(options, "operation", "encode")
        if (!["encode", "decode"].includes(operation)) return fail("operation must be encode or decode.")
        if (typeof (options.urlSafe ?? false) !== "boolean") return fail("urlSafe must be boolean.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        try {
            const operation = stringOption(options, "operation", "encode") as Operation
            const urlSafe = booleanOption(options, "urlSafe", false)
            const output = operation === "decode"
                ? decodeBase64ToText(input.trim(), urlSafe)
                : encodeTextToBase64(input, urlSafe)
            return success(output, startedAt, input)
        } catch {
            return failure("base64_decode_error", "Input is not valid Base64 for the selected mode.", startedAt, input)
        }
    },
}

const urlCodecAdapter: PipelineToolAdapter = {
    toolKey: "url_encode_decode",
    slug: "url-encode-decode",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: false,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "Encoding is reversible and does not protect sensitive input.",
        "URL encoding can increase payload size.",
    ],
    defaultOptions: {
        operation: "encode",
        mode: "component",
    },
    publicOptionKeys: ["operation", "mode"],
    validateOptions(options) {
        const operation = stringOption(options, "operation", "encode")
        if (!["encode", "decode"].includes(operation)) return fail("operation must be encode or decode.")
        const mode = stringOption(options, "mode", "component")
        if (!["component", "full", "reserved"].includes(mode)) return fail("mode must be component, full, or reserved.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        try {
            const operation = stringOption(options, "operation", "encode") as Operation
            const mode = stringOption(options, "mode", "component") as UrlEncodingMode
            const output = operation === "decode" ? decodeUrlByMode(input, mode) : encodeUrlByMode(input, mode)
            return success(output, startedAt, input)
        } catch {
            return failure("url_decode_error", "Input is not valid URL-encoded text for the selected mode.", startedAt, input)
        }
    },
}

const whitespaceAdapter: PipelineToolAdapter = {
    toolKey: "multiple_whitespace_remover",
    slug: "multiple-whitespace-remover",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: false,
    warnings: [],
    defaultOptions: {},
    publicOptionKeys: [],
    validateOptions() {
        return ok()
    },
    run(input) {
        const startedAt = performance.now()
        return success(removeExtraWhitespace(input), startedAt, input)
    },
}

const invisibleCharactersAdapter: PipelineToolAdapter = {
    toolKey: "invisible_chars_detector",
    slug: "invisible-characters-detector",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: false,
    warnings: [
        "This adapter normalizes or removes invisible characters and can change text semantics.",
    ],
    defaultOptions: {
        removeZeroWidth: true,
        normalizeSpaces: true,
        removeControlExceptNewlineTab: true,
    },
    publicOptionKeys: ["removeZeroWidth", "normalizeSpaces", "removeControlExceptNewlineTab"],
    validateOptions(options) {
        for (const key of ["removeZeroWidth", "normalizeSpaces", "removeControlExceptNewlineTab"]) {
            if (typeof (options[key] ?? true) !== "boolean") return fail(`${key} must be boolean.`)
        }
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        const cleanOptions: CleanOptions = {
            removeZeroWidth: booleanOption(options, "removeZeroWidth", true),
            normalizeSpaces: booleanOption(options, "normalizeSpaces", true),
            removeControlExceptNewlineTab: booleanOption(options, "removeControlExceptNewlineTab", true),
        }
        const analysis = analyzeText(input)
        return success(
            cleanText(input, cleanOptions),
            startedAt,
            input,
            analysis.suspiciousChars.length > 0 ? [`Detected ${analysis.suspiciousChars.length} suspicious characters before cleaning.`] : [],
        )
    },
}

const logScrubberAdapter: PipelineToolAdapter = {
    toolKey: "log_scrubber",
    slug: "log-scrubber",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: false,
    warnings: [
        "Redaction patterns are best-effort; review output before sharing.",
    ],
    defaultOptions: { ...DEFAULT_SCRUB_OPTIONS },
    publicOptionKeys: Object.keys(DEFAULT_SCRUB_OPTIONS),
    validateOptions(options) {
        for (const key of Object.keys(DEFAULT_SCRUB_OPTIONS)) {
            if (typeof (options[key] ?? true) !== "boolean") return fail(`${key} must be boolean.`)
        }
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        const scrubOptions = Object.fromEntries(
            Object.entries(DEFAULT_SCRUB_OPTIONS).map(([key, defaultValue]) => [key, booleanOption(options, key, defaultValue)]),
        ) as unknown as ScrubOptions
        const result = scrubLogs(input, scrubOptions)
        return success(
            result.output,
            startedAt,
            input,
            result.redactionCount > 0 ? [`Redacted ${result.redactionCount} sensitive matches.`] : [],
        )
    },
}

export const PIPELINE_TOOL_ADAPTERS = [
    jsonFormatterAdapter,
    base64Adapter,
    urlCodecAdapter,
    whitespaceAdapter,
    invisibleCharactersAdapter,
    logScrubberAdapter,
] as const satisfies readonly PipelineToolAdapter[]

export function getPipelineAdapter(toolKey: string): PipelineToolAdapter | undefined {
    return PIPELINE_TOOL_ADAPTERS.find((adapter) => adapter.toolKey === toolKey)
}

export function getPipelineAdapterKeys(): string[] {
    return PIPELINE_TOOL_ADAPTERS.map((adapter) => adapter.toolKey)
}
