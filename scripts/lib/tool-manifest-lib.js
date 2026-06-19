import fs from "node:fs"
import path from "node:path"

export const ROOT_DIR = process.cwd()
export const FEATURE_TOOLS_DIR = path.join(ROOT_DIR, "src/features/tools")
export const TOOL_MANIFESTS_PATH = path.join(ROOT_DIR, "src/core/registry/manifests.ts")
export const TOOL_ORDER_PATH = path.join(ROOT_DIR, "src/core/registry/tool-order.json")

const REQUIRED_FIELDS = ["key", "slug", "category", "relatedTools", "keywords"]
const NETWORK_ACCESS_VALUES = new Set(["none", "user_requested", "third_party_api"])
const EXTERNAL_DATA_SENT_VALUES = new Set(["none", "user_provided_url", "derived_url"])
const PERSIST_INPUT_VALUES = new Set(["true", "false", "\"opt-in\"", "'opt-in'"])

function relative(filePath) {
    return path.relative(ROOT_DIR, filePath).replace(/\\/g, "/")
}

function manifestError(manifestPath, fieldName, message) {
    const fieldSuffix = fieldName ? ` field "${fieldName}"` : ""
    return new Error(`[tool-manifest] ${relative(manifestPath)}${fieldSuffix}: ${message}`)
}

function unescapeStringLiteral(value) {
    return value.replace(/\\(["'\\nrt])/g, (_, char) => {
        if (char === "n") return "\n"
        if (char === "r") return "\r"
        if (char === "t") return "\t"
        return char
    })
}

function parseStringArray(fragment, manifestPath, fieldName) {
    const values = []
    let rest = fragment.trim()

    while (rest.length > 0) {
        if (rest.startsWith(",")) {
            rest = rest.slice(1).trim()
            continue
        }

        const match = /^"((?:\\.|[^"\\])*)"|^'((?:\\.|[^'\\])*)'/.exec(rest)
        if (!match) {
            throw manifestError(manifestPath, fieldName, "must be a simple array of string literals")
        }

        values.push(unescapeStringLiteral(match[1] ?? match[2] ?? ""))
        rest = rest.slice(match[0].length).trim()

        if (rest.length > 0 && !rest.startsWith(",")) {
            throw manifestError(manifestPath, fieldName, "array entries must be separated by commas")
        }
    }

    return values
}

function readText(filePath) {
    return fs.readFileSync(filePath, "utf8")
}

function findMatchingBrace(source, openIndex) {
    let depth = 0
    let quote = null
    let escaped = false
    let lineComment = false
    let blockComment = false

    for (let index = openIndex; index < source.length; index += 1) {
        const char = source[index]
        const next = source[index + 1]

        if (lineComment) {
            if (char === "\n") lineComment = false
            continue
        }

        if (blockComment) {
            if (char === "*" && next === "/") {
                blockComment = false
                index += 1
            }
            continue
        }

        if (quote) {
            if (escaped) {
                escaped = false
                continue
            }
            if (char === "\\") {
                escaped = true
                continue
            }
            if (char === quote) quote = null
            continue
        }

        if (char === "/" && next === "/") {
            lineComment = true
            index += 1
            continue
        }

        if (char === "/" && next === "*") {
            blockComment = true
            index += 1
            continue
        }

        if (char === "\"" || char === "'") {
            quote = char
            continue
        }

        if (char === "{") depth += 1
        if (char === "}") {
            depth -= 1
            if (depth === 0) return index
        }
    }

    return -1
}

export function extractToolManifestObjectSource(source, manifestPath = TOOL_MANIFESTS_PATH) {
    const exportMatch = /export\s+const\s+toolManifest\s*=\s*/.exec(source)
    if (!exportMatch) {
        throw manifestError(manifestPath, "toolManifest", "must export `const toolManifest = { ... } satisfies ToolMeta`")
    }

    const objectStart = source.indexOf("{", exportMatch.index + exportMatch[0].length)
    if (objectStart === -1) {
        throw manifestError(manifestPath, "toolManifest", "must be assigned a simple object literal")
    }

    const prefix = source.slice(exportMatch.index + exportMatch[0].length, objectStart).trim()
    if (prefix.length > 0) {
        throw manifestError(manifestPath, "toolManifest", "must be assigned directly to a simple object literal")
    }

    const objectEnd = findMatchingBrace(source, objectStart)
    if (objectEnd === -1) {
        throw manifestError(manifestPath, "toolManifest", "object literal is not closed")
    }

    const suffix = source.slice(objectEnd + 1).trim()
    if (!/^satisfies\s+ToolMeta\s*;?\s*$/.test(suffix)) {
        throw manifestError(manifestPath, "toolManifest", "must end with `satisfies ToolMeta`")
    }

    return source.slice(objectStart + 1, objectEnd)
}

export function assertSimpleToolManifestSource(source, manifestPath) {
    const body = extractToolManifestObjectSource(source, manifestPath)
    const bodyWithoutStrings = body
        .replace(/"((?:\\.|[^"\\])*)"/g, "\"\"")
        .replace(/'((?:\\.|[^'\\])*)'/g, "''")

    const disallowed = [
        [/\.\.\./, "spread properties are not supported"],
        [/(^|[,{]\s*)\[/m, "computed property names are not supported"],
        [/=>|\bfunction\b/, "functions are not supported"],
        [/`/, "template literals are not supported"],
        [/\b(?:require|import)\s*\(/, "dynamic imports are not supported"],
    ]

    for (const [pattern, message] of disallowed) {
        if (pattern.test(bodyWithoutStrings)) {
            throw manifestError(manifestPath, "toolManifest", message)
        }
    }

    return body
}

function stringField(source, fieldName, manifestPath, required = false) {
    const match = new RegExp(`(?:^|[,\\n])\\s*${fieldName}:\\s*(["'])((?:\\\\.|(?!\\1).)*)\\1`, "s").exec(source)
    if (!match) {
        if (required) throw manifestError(manifestPath, fieldName, "must be a string literal")
        return null
    }
    return unescapeStringLiteral(match[2])
}

function arrayField(source, fieldName, manifestPath, required = false) {
    const match = new RegExp(`(?:^|[,\\n])\\s*${fieldName}:\\s*\\[([\\s\\S]*?)\\]`, "s").exec(source)
    if (!match) {
        if (required) throw manifestError(manifestPath, fieldName, "must be an array of string literals")
        return []
    }
    return parseStringArray(match[1], manifestPath, fieldName)
}

function objectField(source, fieldName) {
    const match = new RegExp(`${fieldName}:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`).exec(source)
    return match ? match[1] : null
}

function booleanOrOptInField(source, fieldName, manifestPath) {
    const match = new RegExp(`(?:^|[,\\n])\\s*${fieldName}:\\s*(true|false|["']opt-in["'])`, "s").exec(source)
    if (!match) return undefined
    if (!PERSIST_INPUT_VALUES.has(match[1])) {
        throw manifestError(manifestPath, fieldName, "must be true, false, or \"opt-in\"")
    }
    if (match[1] === "true") return true
    if (match[1] === "false") return false
    return "opt-in"
}

function booleanField(source, fieldName, manifestPath) {
    const match = new RegExp(`(?:^|[,\\n])\\s*${fieldName}:\\s*(true|false)`, "s").exec(source)
    if (!match) return undefined
    if (match[1] === "true") return true
    if (match[1] === "false") return false
    throw manifestError(manifestPath, fieldName, "must be true or false")
}

function parseDeprecated(source, manifestPath) {
    const block = objectField(source, "deprecated")
    if (!block) return undefined

    const deprecated = {}
    const messageKey = stringField(block, "messageKey", manifestPath)
    const reason = stringField(block, "reason", manifestPath)
    const alternatives = arrayField(block, "alternatives", manifestPath)

    if (messageKey) deprecated.messageKey = messageKey
    if (alternatives.length > 0) deprecated.alternatives = alternatives
    if (reason) deprecated.reason = reason

    return Object.keys(deprecated).length > 0 ? deprecated : {}
}

export function listManifestFiles() {
    return fs
        .readdirSync(FEATURE_TOOLS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(FEATURE_TOOLS_DIR, entry.name, "manifest.ts"))
        .filter((manifestPath) => fs.existsSync(manifestPath))
        .sort((a, b) => a.localeCompare(b))
}

export function parseToolManifestFile(manifestPath) {
    const source = readText(manifestPath)
    const body = assertSimpleToolManifestSource(source, manifestPath)

    for (const field of REQUIRED_FIELDS) {
        if (!new RegExp(`(?:^|[,\\n])\\s*${field}:`, "s").test(body)) {
            throw manifestError(manifestPath, field, "required field is missing")
        }
    }

    const key = stringField(body, "key", manifestPath, true)
    const slug = stringField(body, "slug", manifestPath, true)
    const category = stringField(body, "category", manifestPath, true)
    const keywords = arrayField(body, "keywords", manifestPath, true)
    const relatedTools = arrayField(body, "relatedTools", manifestPath, true)
    const sampleInput = stringField(body, "sampleInput", manifestPath)
    const sampleMode = stringField(body, "sampleMode", manifestPath)
    const searchKeywords = arrayField(body, "searchKeywords", manifestPath)
    const updatedAt = stringField(body, "updatedAt", manifestPath)
    const networkAccess = stringField(body, "networkAccess", manifestPath)
    const networkHosts = arrayField(body, "networkHosts", manifestPath)
    const networkPurposeKey = stringField(body, "networkPurposeKey", manifestPath)
    const allowUserProvidedUrl = booleanField(body, "allowUserProvidedUrl", manifestPath)
    const requiresExplicitUserAction = booleanField(body, "requiresExplicitUserAction", manifestPath)
    const externalDataSent = stringField(body, "externalDataSent", manifestPath)
    const persistInput = booleanOrOptInField(body, "persistInput", manifestPath)
    const deprecated = parseDeprecated(body, manifestPath)

    if (networkAccess && !NETWORK_ACCESS_VALUES.has(networkAccess)) {
        throw manifestError(manifestPath, "networkAccess", "must be one of none, user_requested, or third_party_api")
    }
    if (externalDataSent && !EXTERNAL_DATA_SENT_VALUES.has(externalDataSent)) {
        throw manifestError(manifestPath, "externalDataSent", "must be one of none, user_provided_url, or derived_url")
    }
    if (networkHosts.some((host) => !/^[a-z0-9.-]+$/i.test(host))) {
        throw manifestError(manifestPath, "networkHosts", "must contain hostname literals only")
    }

    const manifest = {
        key,
        slug,
        category,
        relatedTools,
        keywords,
        sourceFile: relative(manifestPath),
    }

    if (sampleInput) manifest.sampleInput = sampleInput
    if (sampleMode) manifest.sampleMode = sampleMode
    if (updatedAt) manifest.updatedAt = updatedAt
    if (searchKeywords.length > 0) manifest.searchKeywords = searchKeywords
    if (networkAccess) manifest.networkAccess = networkAccess
    if (networkHosts.length > 0) manifest.networkHosts = networkHosts
    if (networkPurposeKey) manifest.networkPurposeKey = networkPurposeKey
    if (allowUserProvidedUrl !== undefined) manifest.allowUserProvidedUrl = allowUserProvidedUrl
    if (requiresExplicitUserAction !== undefined) manifest.requiresExplicitUserAction = requiresExplicitUserAction
    if (externalDataSent) manifest.externalDataSent = externalDataSent
    if (persistInput !== undefined) manifest.persistInput = persistInput
    if (deprecated) manifest.deprecated = deprecated

    return manifest
}

export function loadToolManifestMap() {
    const manifests = listManifestFiles().map(parseToolManifestFile)
    return new Map(manifests.map((manifest) => [manifest.key, manifest]))
}

export function loadToolManifestOrder() {
    const parsed = JSON.parse(readText(TOOL_ORDER_PATH))
    if (!Array.isArray(parsed) || parsed.some((slug) => typeof slug !== "string" || !slug.trim())) {
        throw new Error("[tool-manifest] src/core/registry/tool-order.json must be an array of non-empty slug strings")
    }
    return parsed
}

export function loadOrderedToolManifests() {
    const manifestsBySlug = new Map(listManifestFiles().map((manifestPath) => {
        const manifest = parseToolManifestFile(manifestPath)
        return [manifest.slug, manifest]
    }))

    return loadToolManifestOrder().map((slug) => {
        const manifest = manifestsBySlug.get(slug)
        if (!manifest) {
            throw new Error(`[tool-manifest] Ordered manifest slug not found: ${slug}`)
        }
        return manifest
    })
}

export function loadToolSlugs() {
    return loadOrderedToolManifests().map((manifest) => manifest.slug)
}
