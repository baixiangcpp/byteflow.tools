export type RegexGeneratorPreset =
    | "email"
    | "url"
    | "ipv4"
    | "hex_color"
    | "username"
    | "letters"
    | "numbers"
    | "alphanumeric"
    | "custom"

export type RegexGeneratorOptions = {
    preset: RegexGeneratorPreset
    minLength?: number
    maxLength?: number
    anchored?: boolean
    caseInsensitive?: boolean
    global?: boolean
    multiline?: boolean
    customCharClass?: string
}

export type RegexGeneratorResult = {
    pattern: string
    flags: string
    literal: string
}

const PRESET_PATTERN: Record<Exclude<RegexGeneratorPreset, "letters" | "numbers" | "alphanumeric" | "custom">, string> = {
    email: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
    url: "https?:\\/\\/(?:[\\w-]+\\.)+[\\w-]+(?:\\/[^\\s]*)?",
    ipv4: "(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}",
    hex_color: "#?(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})",
    username: "[A-Za-z][A-Za-z0-9_]{2,31}",
}

const PRESET_SAMPLE: Record<RegexGeneratorPreset, string> = {
    email: "team@byteflow.tools\nsupport@example.org",
    url: "https://byteflow.tools/docs?q=regex",
    ipv4: "192.168.1.10",
    hex_color: "#0ea5e9",
    username: "byteflow_dev",
    letters: "Byteflow",
    numbers: "20260302",
    alphanumeric: "v2release9",
    custom: "abc_123-XYZ",
}

function clampLength(value: number | undefined, fallback: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) return fallback
    return Math.min(Math.max(Math.floor(value), 1), 999)
}

function buildLengthQuantifier(minLength: number, maxLength: number): string {
    if (minLength === maxLength) return `{${minLength}}`
    return `{${minLength},${maxLength}}`
}

function sanitizeCustomCharClass(value: string | undefined): string {
    const base = (value || "").trim()
    if (!base) return "A-Za-z0-9"
    return base.replace(/[\[\]]/g, "")
}

function buildVariablePresetPattern(options: RegexGeneratorOptions): string {
    const minLength = clampLength(options.minLength, 1)
    const maxLengthRaw = clampLength(options.maxLength, Math.max(minLength, 12))
    const maxLength = Math.max(minLength, maxLengthRaw)
    const quantifier = buildLengthQuantifier(minLength, maxLength)

    if (options.preset === "letters") return `[A-Za-z]${quantifier}`
    if (options.preset === "numbers") return `\\d${quantifier}`
    if (options.preset === "alphanumeric") return `[A-Za-z0-9]${quantifier}`
    return `[${sanitizeCustomCharClass(options.customCharClass)}]${quantifier}`
}

function buildPattern(options: RegexGeneratorOptions): string {
    const anchored = options.anchored ?? true

    const core = options.preset in PRESET_PATTERN
        ? PRESET_PATTERN[options.preset as keyof typeof PRESET_PATTERN]
        : buildVariablePresetPattern(options)

    if (!anchored) return core
    return `^${core}$`
}

function buildFlags(options: RegexGeneratorOptions): string {
    const flags: string[] = []
    if (options.global ?? true) flags.push("g")
    if (options.caseInsensitive) flags.push("i")
    if (options.multiline) flags.push("m")
    return flags.join("")
}

export function getRegexPresetSample(preset: RegexGeneratorPreset): string {
    return PRESET_SAMPLE[preset]
}

export function buildRegexGeneratorResult(options: RegexGeneratorOptions): RegexGeneratorResult {
    const pattern = buildPattern(options)
    const flags = buildFlags(options)
    return {
        pattern,
        flags,
        literal: `/${pattern}/${flags}`,
    }
}
