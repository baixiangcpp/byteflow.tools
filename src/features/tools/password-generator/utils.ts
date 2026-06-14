export type PasswordMode = "random" | "passphrase"

export interface RandomPasswordOptions {
    length: number
    includeUppercase: boolean
    includeLowercase: boolean
    includeNumbers: boolean
    includeSymbols: boolean
    excludeSimilar: boolean
    customCharset: string
}

export interface PassphraseOptions {
    wordCount: number
    separator: string
    capitalizeWords: boolean
    appendNumber: boolean
    appendSymbol: boolean
}

export interface PasswordPolicyPreset {
    id: string
    labelKey: string
    mode: PasswordMode
    random: RandomPasswordOptions
    passphrase: PassphraseOptions
    batchCount: number
}

export interface SavedPasswordPreset {
    id: string
    name: string
    mode: PasswordMode
    random: RandomPasswordOptions
    passphrase: PassphraseOptions
    batchCount: number
}

export interface PasswordStrength {
    entropy: number
    label: "weak" | "fair" | "good" | "strong"
    fraction: 1 | 2 | 3 | 4
}

export type RandomIntFn = (maxExclusive: number) => number

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz"
const NUMBERS = "0123456789"
const SYMBOLS = "!@#$%^&*()_+~`|}{[]:;?><,./-="
const PASSPHRASE_SYMBOLS = "!@#$%^&*"
const SIMILAR_CHARS = /[ilLI|`oO01]/g

export const DEFAULT_RANDOM_OPTIONS: RandomPasswordOptions = {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    customCharset: "",
}

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
    wordCount: 4,
    separator: "-",
    capitalizeWords: false,
    appendNumber: true,
    appendSymbol: false,
}

const BASE_PRESET_PASSPHRASE: PassphraseOptions = {
    ...DEFAULT_PASSPHRASE_OPTIONS,
}

export const PASSWORD_POLICY_PRESETS: PasswordPolicyPreset[] = [
    {
        id: "balanced",
        labelKey: "policy_balanced",
        mode: "random",
        random: { ...DEFAULT_RANDOM_OPTIONS, length: 16, excludeSimilar: false },
        passphrase: { ...BASE_PRESET_PASSPHRASE },
        batchCount: 1,
    },
    {
        id: "high-security",
        labelKey: "policy_hardcore",
        mode: "random",
        random: { ...DEFAULT_RANDOM_OPTIONS, length: 24, excludeSimilar: true },
        passphrase: { ...BASE_PRESET_PASSPHRASE },
        batchCount: 1,
    },
    {
        id: "pin",
        labelKey: "policy_pin",
        mode: "random",
        random: {
            length: 8,
            includeUppercase: false,
            includeLowercase: false,
            includeNumbers: true,
            includeSymbols: false,
            excludeSimilar: false,
            customCharset: "",
        },
        passphrase: { ...BASE_PRESET_PASSPHRASE },
        batchCount: 1,
    },
    {
        id: "memorable",
        labelKey: "policy_memorable",
        mode: "passphrase",
        random: { ...DEFAULT_RANDOM_OPTIONS },
        passphrase: {
            wordCount: 4,
            separator: "-",
            capitalizeWords: true,
            appendNumber: true,
            appendSymbol: false,
        },
        batchCount: 6,
    },
]

const WORDS = [
    "amber", "anchor", "apex", "apple", "arch", "aurora", "bamboo", "beacon", "berry", "breeze",
    "bridge", "cactus", "canyon", "cedar", "charm", "cinder", "cloud", "cobalt", "comet", "coral",
    "cosmos", "crimson", "delta", "dune", "echo", "ember", "falcon", "fern", "fjord", "flame",
    "forest", "frost", "galaxy", "garden", "glimmer", "granite", "harbor", "harmony", "hazel", "horizon",
    "island", "jade", "jungle", "lagoon", "lantern", "laurel", "legend", "lotus", "lumen", "marble",
    "meadow", "meteor", "mist", "mosaic", "mountain", "nebula", "nectar", "oak", "oasis", "onyx",
    "opal", "orbit", "orchid", "palm", "pearl", "phoenix", "pine", "pixel", "prairie", "quartz",
    "raven", "reef", "river", "saffron", "sage", "sierra", "silver", "sky", "solstice", "spruce",
    "star", "stone", "sunset", "temple", "thunder", "tiger", "topaz", "torrent", "trail", "velvet",
    "violet", "vivid", "willow", "winter", "zenith", "zephyr",
]

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

function sanitizeRandom(options: RandomPasswordOptions): RandomPasswordOptions {
    return {
        ...options,
        length: clamp(Math.floor(options.length || 0), 4, 128),
    }
}

function sanitizePassphrase(options: PassphraseOptions): PassphraseOptions {
    return {
        ...options,
        wordCount: clamp(Math.floor(options.wordCount || 0), 2, 12),
    }
}

function normalizeCharset(chars: string, excludeSimilar: boolean): string {
    const normalized = excludeSimilar ? chars.replace(SIMILAR_CHARS, "") : chars
    return Array.from(new Set(normalized.split(""))).join("")
}

function getRequiredSets(options: RandomPasswordOptions): string[] {
    const sets: string[] = []
    if (options.includeUppercase) sets.push(normalizeCharset(UPPERCASE, options.excludeSimilar))
    if (options.includeLowercase) sets.push(normalizeCharset(LOWERCASE, options.excludeSimilar))
    if (options.includeNumbers) sets.push(normalizeCharset(NUMBERS, options.excludeSimilar))
    if (options.includeSymbols) sets.push(normalizeCharset(SYMBOLS, options.excludeSimilar))
    return sets.filter((set) => set.length > 0)
}

function secureRandomInt(maxExclusive: number): number {
    if (maxExclusive <= 1) return 0
    if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
        const values = new Uint32Array(1)
        globalThis.crypto.getRandomValues(values)
        return values[0] % maxExclusive
    }
    return Math.floor(Math.random() * maxExclusive)
}

function pickChar(chars: string, randomInt: RandomIntFn): string {
    return chars[randomInt(chars.length)]
}

function shuffleChars(chars: string[], randomInt: RandomIntFn): string[] {
    const clone = [...chars]
    for (let i = clone.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        const temp = clone[i]
        clone[i] = clone[j]
        clone[j] = temp
    }
    return clone
}

function titleCase(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1)
}

export function generateRandomPassword(options: RandomPasswordOptions, randomInt: RandomIntFn = secureRandomInt): string {
    const safe = sanitizeRandom(options)
    const requiredSets = getRequiredSets(safe)
    const customSet = normalizeCharset(safe.customCharset || "", safe.excludeSimilar)
    let pool = [...requiredSets, customSet].join("")

    if (!pool) {
        pool = normalizeCharset(LOWERCASE, safe.excludeSimilar)
    }

    const outputChars: string[] = []
    if (requiredSets.length > 0 && safe.length >= requiredSets.length) {
        for (const set of requiredSets) {
            outputChars.push(pickChar(set, randomInt))
        }
    }

    while (outputChars.length < safe.length) {
        outputChars.push(pickChar(pool, randomInt))
    }

    return shuffleChars(outputChars, randomInt).join("")
}

export function generatePassphrase(options: PassphraseOptions, randomInt: RandomIntFn = secureRandomInt): string {
    const safe = sanitizePassphrase(options)
    const words: string[] = []
    for (let i = 0; i < safe.wordCount; i++) {
        const word = WORDS[randomInt(WORDS.length)]
        words.push(safe.capitalizeWords ? titleCase(word) : word)
    }

    let phrase = words.join(safe.separator)
    if (safe.appendNumber) {
        const number = (randomInt(100)).toString().padStart(2, "0")
        phrase += number
    }
    if (safe.appendSymbol) {
        phrase += PASSPHRASE_SYMBOLS[randomInt(PASSPHRASE_SYMBOLS.length)]
    }

    return phrase
}

export function generatePasswordBatch(input: {
    mode: PasswordMode
    random: RandomPasswordOptions
    passphrase: PassphraseOptions
    count: number
    randomInt?: RandomIntFn
}): string[] {
    const count = clamp(Math.floor(input.count || 0), 1, 100)
    const randomInt = input.randomInt || secureRandomInt
    const rows: string[] = []

    for (let i = 0; i < count; i++) {
        rows.push(
            input.mode === "random"
                ? generateRandomPassword(input.random, randomInt)
                : generatePassphrase(input.passphrase, randomInt)
        )
    }

    return rows
}

export function estimateStrength(input: {
    mode: PasswordMode
    random: RandomPasswordOptions
    passphrase: PassphraseOptions
}): PasswordStrength {
    let entropy = 0

    if (input.mode === "random") {
        const safe = sanitizeRandom(input.random)
        const requiredSets = getRequiredSets(safe)
        const customSet = normalizeCharset(safe.customCharset || "", safe.excludeSimilar)
        const pool = normalizeCharset([...requiredSets, customSet].join(""), false) || LOWERCASE
        entropy = safe.length * Math.log2(pool.length)
    } else {
        const safe = sanitizePassphrase(input.passphrase)
        entropy = safe.wordCount * Math.log2(WORDS.length)
        if (safe.appendNumber) entropy += Math.log2(100)
        if (safe.appendSymbol) entropy += Math.log2(PASSPHRASE_SYMBOLS.length)
    }

    if (entropy < 40) return { entropy, label: "weak", fraction: 1 }
    if (entropy < 60) return { entropy, label: "fair", fraction: 2 }
    if (entropy < 80) return { entropy, label: "good", fraction: 3 }
    return { entropy, label: "strong", fraction: 4 }
}
