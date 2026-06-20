import fs from "node:fs"
import path from "node:path"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"

const CONFIG_PATH = path.join(process.cwd(), "public", "_headers")
const INLINE_SCRIPT_POLICY_PATH = path.join(process.cwd(), "src", "core", "security", "inline-script-policy.ts")
const EXTERNAL_SOURCE_ALLOWLIST_PATH = path.join(process.cwd(), "scripts", "gates", "security-header-allowlist.json")
const REQUIRED_HEADERS = {
    "content-security-policy": {
        requiredTokens: [
            "default-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            "frame-src 'none'",
            "child-src 'none'",
            "https://cloudflareinsights.com",
        ],
    },
    "x-content-type-options": {
        exact: "nosniff",
    },
    "x-frame-options": {
        exact: "DENY",
    },
    "referrer-policy": {
        exact: "strict-origin-when-cross-origin",
    },
    "permissions-policy": {
        requiredTokens: [
            "camera=()",
            "microphone=()",
            "geolocation=()",
        ],
    },
}

function fail(message) {
    console.error(`[check:security-headers] FAILED: ${message}`)
    process.exit(1)
}

function normalizeHeaderEntries(entries) {
    const headerMap = new Map()

    for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue
        const key = typeof entry.key === "string" ? entry.key.trim().toLowerCase() : ""
        const value = typeof entry.value === "string" ? entry.value.trim() : ""
        if (!key) continue
        headerMap.set(key, value)
    }

    return headerMap
}

function inlineScriptPolicyRequiresUnsafeInline() {
    if (!fs.existsSync(INLINE_SCRIPT_POLICY_PATH)) {
        fail(`Missing inline script policy: ${path.relative(process.cwd(), INLINE_SCRIPT_POLICY_PATH)}`)
    }

    const source = fs.readFileSync(INLINE_SCRIPT_POLICY_PATH, "utf8")
    const trueCount = (source.match(/requiresUnsafeInline:\s*true/g) || []).length
    const falseCount = (source.match(/requiresUnsafeInline:\s*false/g) || []).length
    if (trueCount + falseCount === 0) {
        fail("Inline script policy does not declare any requiresUnsafeInline entries")
    }
    if (!source.includes("migrationPath:")) {
        fail("Inline script policy entries must include migrationPath rationale")
    }
    const jsonLdUnsafeInlineEntry = /id:\s*["']json-ld-structured-data["'][\s\S]*?requiresUnsafeInline:\s*true/.test(source)
    if (trueCount > 1 || !jsonLdUnsafeInlineEntry) {
        fail("Inline script policy may only keep the JSON-LD structured-data entry as an unsafe-inline exception")
    }
    return trueCount > 0
}

function externalRuntimeScriptsFromPolicy() {
    if (!fs.existsSync(INLINE_SCRIPT_POLICY_PATH)) {
        fail(`Missing inline script policy: ${path.relative(process.cwd(), INLINE_SCRIPT_POLICY_PATH)}`)
    }

    const source = fs.readFileSync(INLINE_SCRIPT_POLICY_PATH, "utf8")
    return [...source.matchAll(/externalScript:\s*["']([^"']+)["']/g)].map((match) => match[1])
}

function loadExternalSourceAllowlist() {
    if (!fs.existsSync(EXTERNAL_SOURCE_ALLOWLIST_PATH)) {
        fail(`Missing security header allowlist: ${path.relative(process.cwd(), EXTERNAL_SOURCE_ALLOWLIST_PATH)}`)
    }

    return JSON.parse(fs.readFileSync(EXTERNAL_SOURCE_ALLOWLIST_PATH, "utf8"))
}

function parseCspDirectives(cspValue) {
    const directives = new Map()

    for (const directive of cspValue.split(";")) {
        const parts = directive.trim().split(/\s+/).filter(Boolean)
        if (parts.length === 0) continue
        directives.set(parts[0].toLowerCase(), parts.slice(1))
    }

    return directives
}

function externalHttpsSourcesForDirective(cspDirectives, directiveName) {
    return (cspDirectives.get(directiveName) || [])
        .filter((token) => /^https:\/\//.test(token))
        .sort((a, b) => a.localeCompare(b))
}

function sourceHost(source) {
    try {
        return new URL(source).hostname.toLowerCase()
    } catch {
        return null
    }
}

function sourceMatchesHostname(source, hostname) {
    const normalizedHost = hostname.toLowerCase()
    const sourceHostname = sourceHost(source)
    if (!sourceHostname) return false
    if (sourceHostname.startsWith("*.")) {
        const suffix = sourceHostname.slice(2)
        return normalizedHost === suffix || normalizedHost.endsWith(`.${suffix}`)
    }
    return sourceHostname === normalizedHost || sourceHostname.endsWith(`.${normalizedHost}`)
}

function externalManifestHosts() {
    return [...new Set(loadOrderedToolManifests()
        .flatMap((tool) => tool.privacy.externalRequest.required ? tool.privacy.externalRequest.domains || [] : [])
        .map((host) => host.toLowerCase()))].sort((a, b) => a.localeCompare(b))
}

function assertNoForbiddenCspSources(cspDirectives, failures) {
    const forbiddenTokens = ["*", "http:", "https:", "'unsafe-eval'"]
    for (const [directiveName, tokens] of cspDirectives.entries()) {
        for (const token of tokens) {
            if (forbiddenTokens.includes(token)) {
                failures.push(`content-security-policy: ${directiveName} must not include ${token}`)
            }
        }
    }
    const scriptSrc = cspDirectives.get("script-src") || []
    if (scriptSrc.includes("*") || scriptSrc.includes("https:")) {
        failures.push("content-security-policy: script-src must not allow arbitrary script sources")
    }
}

function assertExternalSourcesAreDeclared(cspDirectives, failures) {
    const manifestHosts = externalManifestHosts()
    const externalConnectSources = externalHttpsSourcesForDirective(cspDirectives, "connect-src")

    for (const source of externalConnectSources) {
        if (source.includes("cloudflare")) continue
        if (!manifestHosts.some((host) => sourceMatchesHostname(source, host))) {
            failures.push(`content-security-policy: connect-src source "${source}" has no external-request manifest domain`)
        }
    }
}

function parseCloudflareHeadersConfig(fileContent) {
    const rules = []
    let currentRule = null
    const lines = fileContent.split(/\r?\n/)

    for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, "")
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue

        const isIndented = /^\s/.test(line)
        if (!isIndented) {
            currentRule = { source: trimmed, headers: [] }
            rules.push(currentRule)
            continue
        }

        if (!currentRule) {
            fail("Invalid public/_headers format: header declared before a route pattern")
        }

        const separatorIndex = trimmed.indexOf(":")
        if (separatorIndex <= 0) {
            fail(`Invalid header line in public/_headers: "${trimmed}"`)
        }

        const key = trimmed.slice(0, separatorIndex).trim()
        const value = trimmed.slice(separatorIndex + 1).trim()
        if (!key || !value) {
            fail(`Invalid header key/value in public/_headers: "${trimmed}"`)
        }

        currentRule.headers.push({ key, value })
    }

    if (rules.length === 0) {
        fail("public/_headers does not contain any header rules")
    }

    return rules
}

function main() {
    if (!fs.existsSync(CONFIG_PATH)) {
        fail(`Missing deployment config: ${path.relative(process.cwd(), CONFIG_PATH)}`)
    }

    const fileContent = fs.readFileSync(CONFIG_PATH, "utf8")
    const rules = parseCloudflareHeadersConfig(fileContent)

    const globalRule = rules.find((rule) => (
        rule.source === "/*"
        || rule.source === "/(.*)"
        || rule.source === "/:path*"
    ))

    if (!globalRule) {
        fail("Missing global headers rule with source '/*'")
    }

    if (!Array.isArray(globalRule.headers)) {
        fail("Global headers rule missing \"headers\" array")
    }

    const headerMap = normalizeHeaderEntries(globalRule.headers)
    const failures = []
    const cspValue = headerMap.get("content-security-policy") || ""
    const cspDirectives = parseCspDirectives(cspValue)
    const externalSourceAllowlist = loadExternalSourceAllowlist()

    for (const [headerName, requirement] of Object.entries(REQUIRED_HEADERS)) {
        const value = headerMap.get(headerName)
        if (!value) {
            failures.push(`${headerName}: missing`)
            continue
        }

        if (requirement.exact && value !== requirement.exact) {
            failures.push(`${headerName}: expected exact value "${requirement.exact}"`)
        }

        if (requirement.requiredTokens) {
            for (const token of requirement.requiredTokens) {
                if (!value.includes(token)) {
                    failures.push(`${headerName}: missing token "${token}"`)
                }
            }
        }
    }

    const hasUnsafeInlineScript = /(?:^|;)\s*script-src\b[^;]*'unsafe-inline'/.test(cspValue)
    const scriptSrc = cspDirectives.get("script-src") || []
    assertNoForbiddenCspSources(cspDirectives, failures)
    assertExternalSourcesAreDeclared(cspDirectives, failures)
    if (hasUnsafeInlineScript && !inlineScriptPolicyRequiresUnsafeInline()) {
        failures.push("content-security-policy: script-src contains 'unsafe-inline' but inline policy has no active rationale")
    }
    if (!hasUnsafeInlineScript && inlineScriptPolicyRequiresUnsafeInline()) {
        failures.push("content-security-policy: inline script policy still requires 'unsafe-inline' but script-src does not include it")
    }

    for (const runtimeScript of externalRuntimeScriptsFromPolicy()) {
        const publicScriptPath = path.join(process.cwd(), "public", runtimeScript.replace(/^\/+/, ""))
        if (!fs.existsSync(publicScriptPath)) {
            failures.push(`inline-script-policy: externalScript "${runtimeScript}" does not exist in public/`)
        }
        if (!scriptSrc.includes("'self'")) {
            failures.push(`content-security-policy: script-src must include 'self' for externalScript "${runtimeScript}"`)
        }
    }

    for (const [directiveName, allowlistKey] of [["script-src", "scriptSrc"], ["connect-src", "connectSrc"], ["img-src", "imgSrc"]]) {
        const allowedSources = externalSourceAllowlist[allowlistKey] || {}
        for (const source of externalHttpsSourcesForDirective(cspDirectives, directiveName)) {
            if (!allowedSources[source]) {
                failures.push(`content-security-policy: ${directiveName} external source "${source}" is missing from scripts/gates/security-header-allowlist.json`)
            }
        }
    }

    if (failures.length > 0) {
        console.error("[check:security-headers] FAILED:")
        for (const issue of failures) {
            console.error(`- ${issue}`)
        }
        process.exit(1)
    }

    console.log(`[check:security-headers] OK: ${Object.keys(REQUIRED_HEADERS).length} required headers verified in public/_headers`)
}

main()
