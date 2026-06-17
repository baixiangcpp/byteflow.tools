import { encodeTextToBase64, decodeBase64ToText } from "@/core/utils/base64-utils"
import { hashTextByAlgorithm, type StandardHashAlgorithm } from "@/core/utils/hash-utils"
import { cleanText, analyzeText, type CleanOptions } from "@/core/utils/invisible-chars-utils"
import { scrubLogs, DEFAULT_SCRUB_OPTIONS, type ScrubOptions } from "@/core/utils/log-scrubber-utils"
import { encodeUrlByMode, decodeUrlByMode, type UrlEncodingMode } from "@/core/utils/url-codec-utils"
import { removeExtraWhitespace } from "@/core/utils/whitespace-utils"
import { csvToJson, jsonToCsv } from "@/features/tools/csv-json-converter/logic"
import { JSON_ARRAY_REQUIRED_ERROR } from "@/features/tools/csv-json-converter/constants"
import { convertHtmlToMarkdown } from "@/features/tools/html-to-markdown/utils"
import { decodeJwtParts } from "@/features/tools/jwt-decoder/utils"
import { runNdjsonTransform, type NdjsonMessages, type NdjsonMode } from "@/features/tools/ndjson-formatter/utils"
import { convertCase, type CaseStyle } from "@/features/tools/slugify-case-converter/utils"
import { parseTimestampHeuristic } from "@/features/tools/unix-timestamp/utils"
import { convertYamlJson, type YamlJsonMode } from "@/features/tools/yaml-json-converter/utils"
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

const yamlJsonAdapter: PipelineToolAdapter = {
    toolKey: "yaml_json_converter",
    slug: "yaml-json-converter",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "YAML to JSON and JSON to YAML conversions can normalize comments, anchors, and formatting.",
    ],
    defaultOptions: {
        mode: "yaml-to-json",
    },
    publicOptionKeys: ["mode"],
    validateOptions(options) {
        const mode = stringOption(options, "mode", "yaml-to-json")
        if (!["yaml-to-json", "json-to-yaml"].includes(mode)) return fail("mode must be yaml-to-json or json-to-yaml.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        try {
            const mode = stringOption(options, "mode", "yaml-to-json") as YamlJsonMode
            return success(convertYamlJson(input, mode), startedAt, input)
        } catch (error) {
            return failure("yaml_json_conversion_error", error instanceof Error ? error.message : "Unable to convert YAML/JSON.", startedAt, input)
        }
    },
}

const csvJsonAdapter: PipelineToolAdapter = {
    toolKey: "csv_json_converter",
    slug: "csv-json-converter",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "CSV conversion can infer primitive types and flatten nested JSON objects depending on options.",
    ],
    defaultOptions: {
        direction: "csv-to-json",
        delimiter: "auto",
        hasHeader: true,
        typeInference: true,
    },
    publicOptionKeys: ["direction", "delimiter", "hasHeader", "typeInference"],
    validateOptions(options) {
        const direction = stringOption(options, "direction", "csv-to-json")
        if (!["csv-to-json", "json-to-csv"].includes(direction)) return fail("direction must be csv-to-json or json-to-csv.")
        const delimiter = stringOption(options, "delimiter", "auto")
        if (!["auto", ",", ";", "\t", "|"].includes(delimiter)) return fail("delimiter must be auto, comma, semicolon, tab, or pipe.")
        if (typeof (options.hasHeader ?? true) !== "boolean") return fail("hasHeader must be boolean.")
        if (typeof (options.typeInference ?? true) !== "boolean") return fail("typeInference must be boolean.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        try {
            const direction = stringOption(options, "direction", "csv-to-json")
            const delimiter = stringOption(options, "delimiter", "auto")
            const hasHeader = booleanOption(options, "hasHeader", true)
            const typeInference = booleanOption(options, "typeInference", true)
            const output = direction === "csv-to-json"
                ? csvToJson(input, delimiter, hasHeader, typeInference)
                : jsonToCsv(input, delimiter, hasHeader)
            return success(output, startedAt, input)
        } catch (error) {
            const message = error instanceof Error && error.message === JSON_ARRAY_REQUIRED_ERROR
                ? "JSON input must be an array to convert to CSV."
                : error instanceof Error
                    ? error.message
                    : "Unable to convert CSV/JSON."
            return failure("csv_json_conversion_error", message, startedAt, input)
        }
    },
}

const NDJSON_ADAPTER_MESSAGES: NdjsonMessages = {
    error_label: "Error",
    invalid_json_line_label: "Invalid JSON line",
    input_must_be_array_label: "Input must be a JSON array",
    invalid_json_label: "Invalid JSON",
    error_parsing_line_label: "Error parsing line",
}

const ndjsonAdapter: PipelineToolAdapter = {
    toolKey: "ndjson_formatter",
    slug: "ndjson-formatter",
    version: 1,
    inputKind: "json",
    outputKind: "json",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "Invalid NDJSON lines are preserved with error comments instead of throwing.",
    ],
    defaultOptions: {
        mode: "format",
    },
    publicOptionKeys: ["mode"],
    validateOptions(options) {
        const mode = stringOption(options, "mode", "format")
        if (!["format", "to-ndjson", "to-array"].includes(mode)) return fail("mode must be format, to-ndjson, or to-array.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        const mode = stringOption(options, "mode", "format") as NdjsonMode
        return success(runNdjsonTransform(input, mode, NDJSON_ADAPTER_MESSAGES), startedAt, input)
    },
}

const slugCaseAdapter: PipelineToolAdapter = {
    toolKey: "slugify_case_converter",
    slug: "slugify-case-converter",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: false,
    warnings: [
        "Case conversion normalizes separators and punctuation.",
    ],
    defaultOptions: {
        style: "slug",
        locale: "en-US",
        preserveAcronyms: true,
    },
    publicOptionKeys: ["style", "locale", "preserveAcronyms"],
    validateOptions(options) {
        const style = stringOption(options, "style", "slug")
        if (!["slug", "camel", "pascal", "snake", "kebab", "constant", "dot", "title", "sentence"].includes(style)) {
            return fail("style must be a supported case style.")
        }
        if (typeof (options.locale ?? "en-US") !== "string") return fail("locale must be a string.")
        if (typeof (options.preserveAcronyms ?? true) !== "boolean") return fail("preserveAcronyms must be boolean.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        const style = stringOption(options, "style", "slug") as CaseStyle
        const locale = stringOption(options, "locale", "en-US")
        const preserveAcronyms = booleanOption(options, "preserveAcronyms", true)
        return success(convertCase(input, style, { locale, preserveAcronyms }), startedAt, input)
    },
}

const hashAdapter: PipelineToolAdapter = {
    toolKey: "hash_generator",
    slug: "hash-generator",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: false,
    deterministic: true,
    mayIncreaseSize: false,
    warnings: [
        "Hashes are one-way digests but can still expose low-entropy or guessable input.",
    ],
    defaultOptions: {
        algorithm: "sha256",
    },
    publicOptionKeys: ["algorithm"],
    validateOptions(options) {
        const algorithm = stringOption(options, "algorithm", "sha256")
        if (!["md5", "sha1", "sha224", "sha256", "sha384", "sha512"].includes(algorithm)) {
            return fail("algorithm must be md5, sha1, sha224, sha256, sha384, or sha512.")
        }
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        const algorithm = stringOption(options, "algorithm", "sha256") as StandardHashAlgorithm
        return success(hashTextByAlgorithm(input, algorithm), startedAt, input)
    },
}

const jwtDecoderAdapter: PipelineToolAdapter = {
    toolKey: "jwt_decoder",
    slug: "jwt-decoder",
    version: 1,
    inputKind: "text",
    outputKind: "json",
    safeForSensitiveInput: false,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "JWT decoding does not verify signatures and can expose sensitive claims.",
    ],
    defaultOptions: {
        part: "payload",
    },
    publicOptionKeys: ["part"],
    validateOptions(options) {
        const part = stringOption(options, "part", "payload")
        if (!["header", "payload", "both"].includes(part)) return fail("part must be header, payload, or both.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        try {
            const decoded = decodeJwtParts(input)
            const part = stringOption(options, "part", "payload")
            const output = part === "header"
                ? decoded.header
                : part === "both"
                    ? decoded
                    : decoded.payload
            return success(JSON.stringify(output, null, 2), startedAt, input)
        } catch (error) {
            return failure("jwt_decode_error", error instanceof Error ? error.message : "Input is not a valid JWT.", startedAt, input)
        }
    },
}

const unixTimestampAdapter: PipelineToolAdapter = {
    toolKey: "unix_timestamp",
    slug: "unix-timestamp",
    version: 1,
    inputKind: "text",
    outputKind: "json",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: true,
    warnings: [
        "Timestamp parsing uses the same seconds-versus-milliseconds heuristic as the tool UI.",
    ],
    defaultOptions: {
        output: "iso",
    },
    publicOptionKeys: ["output"],
    validateOptions(options) {
        const output = stringOption(options, "output", "iso")
        if (!["iso", "json"].includes(output)) return fail("output must be iso or json.")
        return ok()
    },
    run(input, options) {
        const startedAt = performance.now()
        const result = parseTimestampHeuristic(input.trim())
        if (Number.isNaN(result.date.getTime())) {
            return failure("timestamp_parse_error", "Input is not a valid Unix timestamp.", startedAt, input)
        }
        const output = stringOption(options, "output", "iso") === "json"
            ? JSON.stringify({
                iso: result.date.toISOString(),
                isMilliseconds: result.isMilliseconds,
                unixSeconds: Math.floor(result.date.getTime() / 1000),
                unixMilliseconds: result.date.getTime(),
            }, null, 2)
            : result.date.toISOString()
        return success(output, startedAt, input)
    },
}

const htmlToMarkdownAdapter: PipelineToolAdapter = {
    toolKey: "html_to_markdown",
    slug: "html-to-markdown",
    version: 1,
    inputKind: "text",
    outputKind: "text",
    safeForSensitiveInput: true,
    deterministic: true,
    mayIncreaseSize: false,
    warnings: [
        "HTML to Markdown conversion can drop unsupported HTML attributes and layout-only markup.",
    ],
    defaultOptions: {},
    publicOptionKeys: [],
    validateOptions() {
        return ok()
    },
    run(input) {
        const startedAt = performance.now()
        return success(convertHtmlToMarkdown(input), startedAt, input)
    },
}

export const PIPELINE_TOOL_ADAPTERS = [
    jsonFormatterAdapter,
    base64Adapter,
    urlCodecAdapter,
    whitespaceAdapter,
    invisibleCharactersAdapter,
    logScrubberAdapter,
    yamlJsonAdapter,
    csvJsonAdapter,
    ndjsonAdapter,
    slugCaseAdapter,
    hashAdapter,
    jwtDecoderAdapter,
    unixTimestampAdapter,
    htmlToMarkdownAdapter,
] as const satisfies readonly PipelineToolAdapter[]

export function getPipelineAdapter(toolKey: string): PipelineToolAdapter | undefined {
    return PIPELINE_TOOL_ADAPTERS.find((adapter) => adapter.toolKey === toolKey)
}

export function getPipelineAdapterKeys(): string[] {
    return PIPELINE_TOOL_ADAPTERS.map((adapter) => adapter.toolKey)
}
