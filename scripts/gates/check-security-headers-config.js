import fs from "node:fs"
import path from "node:path"

const CONFIG_PATH = path.join(process.cwd(), "public", "_headers")
const INLINE_SCRIPT_POLICY_PATH = path.join(process.cwd(), "src", "core", "security", "inline-script-policy.ts")
const REQUIRED_HEADERS = {
    "content-security-policy": {
        requiredTokens: [
            "default-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
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
    return trueCount > 0
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
    if (hasUnsafeInlineScript && !inlineScriptPolicyRequiresUnsafeInline()) {
        failures.push("content-security-policy: script-src contains 'unsafe-inline' but inline policy has no active rationale")
    }
    if (!hasUnsafeInlineScript && inlineScriptPolicyRequiresUnsafeInline()) {
        failures.push("content-security-policy: inline script policy still requires 'unsafe-inline' but script-src does not include it")
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
