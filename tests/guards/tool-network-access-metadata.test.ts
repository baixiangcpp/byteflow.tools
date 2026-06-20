import fs from "node:fs"
import path from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { TOOL_MANIFESTS } from "@/core/registry"
import { getToolPrivacyNetworkMetadata } from "@/core/registry/privacy"
import type { ToolMeta } from "@/core/registry/types"

const ROOT = process.cwd()
const FEATURE_TOOLS_DIR = path.join(ROOT, "src/features/tools")
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])
const EXECUTABLE_NETWORK_CALLS = new Set(["fetch", "openExternalUrl"])
const EXECUTABLE_NETWORK_CONSTRUCTORS = new Set(["EventSource", "WebSocket", "XMLHttpRequest"])
const EXECUTABLE_NETWORK_PROPERTY_CALLS = new Set(["window.open", "navigator.sendBeacon"])
const EXTERNAL_TARGET_PATTERNS = [
    /\btarget\s*=\s*["']_blank["']/,
    /\.\s*target\s*=\s*["']_blank["']/,
]
const STATIC_EXTERNAL_URL_PATTERN = /\bhttps:\/\/([a-z0-9.-]+)(?=[:/?#"']|\b)/gi

function walkFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return []

    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) return walkFiles(fullPath)
        if (!entry.isFile() || !SOURCE_EXTENSIONS.has(path.extname(entry.name))) return []
        if (entry.name === "manifest.ts") return []
        return [fullPath]
    })
}

function hasExecutableNetworkCall(source: string): boolean {
    const sourceFile = ts.createSourceFile("tool-source.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    let found = false

    function visit(node: ts.Node) {
        if (found) return
        if (ts.isCallExpression(node)) {
            const expression = node.expression
            if (ts.isIdentifier(expression) && EXECUTABLE_NETWORK_CALLS.has(expression.text)) {
                found = true
                return
            }
            if (ts.isPropertyAccessExpression(expression)) {
                const receiver = expression.expression.getText(sourceFile)
                const callName = `${receiver}.${expression.name.text}`
                if (EXECUTABLE_NETWORK_PROPERTY_CALLS.has(callName)) {
                    found = true
                    return
                }
            }
        }
        if (ts.isNewExpression(node)) {
            const expression = node.expression
            if (ts.isIdentifier(expression) && EXECUTABLE_NETWORK_CONSTRUCTORS.has(expression.text)) {
                found = true
                return
            }
        }
        ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return found
}

function hasNetworkBehavior(source: string): boolean {
    return (
        hasExecutableNetworkCall(source) ||
        EXTERNAL_TARGET_PATTERNS.some((pattern) => pattern.test(source))
    )
}

function collectStaticExternalHosts(source: string): string[] {
    const hosts = new Set<string>()
    for (const match of source.matchAll(STATIC_EXTERNAL_URL_PATTERN)) {
        hosts.add(match[1].toLowerCase())
    }
    return [...hosts].sort()
}

function isHostCovered(host: string, declaredHosts: readonly string[] | undefined): boolean {
    return Boolean(declaredHosts?.some((declaredHost) => {
        const normalized = declaredHost.toLowerCase()
        return host === normalized || host.endsWith(`.${normalized}`)
    }))
}

describe("tool network access metadata", () => {
    it("requires privacy manifest fields for every tool", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const offenders = tools.flatMap((tool) => {
            const problems: string[] = []
            if (!tool.privacy) problems.push("missing privacy")
            if (!tool.privacy?.executionMode) problems.push("missing privacy.executionMode")
            if (typeof tool.privacy?.offlineCapable !== "boolean") problems.push("missing privacy.offlineCapable")
            if (typeof tool.privacy?.sensitiveInput !== "boolean") problems.push("missing privacy.sensitiveInput")
            if (typeof tool.privacy?.externalRequest?.required !== "boolean") problems.push("missing privacy.externalRequest.required")
            return problems.map((problem) => `${tool.slug}: ${problem}`)
        })

        expect(offenders).toEqual([])
    })

    it("requires explicit metadata for tools with browser network behavior", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const manifestBySlug = new Map(tools.map((tool) => [tool.slug, tool]))
        const offenders = [...manifestBySlug.values()].flatMap((tool) => {
            const files = walkFiles(path.join(FEATURE_TOOLS_DIR, tool.slug))
            const hasNetwork = files.some((file) => hasNetworkBehavior(fs.readFileSync(file, "utf8")))
            return hasNetwork && !tool.privacy.externalRequest.required ? [`${tool.slug}: missing privacy.externalRequest`] : []
        })

        expect(offenders).toEqual([])
    })

    it("does not mark network-free tools as requiring external access", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const manifestBySlug = new Map(tools.map((tool) => [tool.slug, tool]))
        const offenders = [...manifestBySlug.values()].flatMap((tool) => {
            if (!tool.privacy.externalRequest.required) return []
            const files = walkFiles(path.join(FEATURE_TOOLS_DIR, tool.slug))
            const hasNetwork = files.some((file) => hasNetworkBehavior(fs.readFileSync(file, "utf8")))
            return hasNetwork ? [] : [`${tool.slug}: declares external request but no guarded network behavior was found`]
        })

        expect(offenders).toEqual([])
    })

    it("requires host and purpose details for network-enabled tools", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const offenders = tools.flatMap((tool) => {
            if (!tool.privacy.externalRequest.required) return []

            const problems: string[] = []
            if (tool.privacy.executionMode !== "external-request") problems.push("privacy.executionMode must be external-request")
            if (tool.privacy.offlineCapable) problems.push("privacy.offlineCapable must be false")
            if (!tool.privacy.externalRequest.domains || tool.privacy.externalRequest.domains.length === 0) problems.push("missing externalRequest.domains")
            if (!tool.privacy.externalRequest.purposeKey) problems.push("missing externalRequest.purposeKey")
            if (!tool.privacy.externalRequest.endpointType || tool.privacy.externalRequest.endpointType === "none") problems.push("missing externalRequest.endpointType")
            if (!tool.privacy.externalRequest.userDataSent) problems.push("missing externalRequest.userDataSent")
            if (!tool.privacy.externalRequest.disclosure) problems.push("missing externalRequest.disclosure")
            if (tool.privacy.externalRequest.consentRequired !== true) problems.push("missing externalRequest.consentRequired")

            return problems.map((problem) => `${tool.slug}: ${problem}`)
        })

        expect(offenders).toEqual([])
    })

    it("keeps compatibility network fields derived from privacy manifest", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const offenders = tools.flatMap((tool) => {
            const expected = getToolPrivacyNetworkMetadata(tool.privacy)
            const actual = {
                networkAccess: tool.networkAccess ?? expected.networkAccess,
                networkHosts: tool.networkHosts ?? expected.networkHosts,
                networkPurposeKey: tool.networkPurposeKey ?? expected.networkPurposeKey,
                allowUserProvidedUrl: tool.allowUserProvidedUrl ?? expected.allowUserProvidedUrl,
                requiresExplicitUserAction: tool.requiresExplicitUserAction ?? expected.requiresExplicitUserAction,
                externalDataSent: tool.externalDataSent ?? expected.externalDataSent,
            }

            return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${tool.slug}: privacy/network metadata drift`]
        })

        expect(offenders).toEqual([])
    })

    it("requires static external hosts in tool source to be covered by network metadata", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const offenders = tools.flatMap((tool) => {
            if (!tool.privacy.externalRequest.required) return []

            const files = walkFiles(path.join(FEATURE_TOOLS_DIR, tool.slug))
            return files.flatMap((file) => {
                const source = fs.readFileSync(file, "utf8")
                const hosts = collectStaticExternalHosts(source)
                return hosts
                    .filter((host) => !isHostCovered(host, tool.privacy.externalRequest.domains))
                    .map((host) => `${tool.slug}: ${path.relative(ROOT, file)} references ${host} without externalRequest.domains coverage`)
            })
        })

        expect(offenders).toEqual([])
    })

    it("keeps browser-local tools free of external request domains", () => {
        const tools = TOOL_MANIFESTS as readonly ToolMeta[]
        const offenders = tools.flatMap((tool) => {
            if (tool.privacy.externalRequest.required) return []
            if (tool.privacy.executionMode !== "browser-local") return [`${tool.slug}: non-external tool must use browser-local executionMode`]
            if (!tool.privacy.offlineCapable) return [`${tool.slug}: browser-local tool must be offline capable`]
            if ((tool.privacy.externalRequest.domains ?? []).length > 0) return [`${tool.slug}: browser-local tool declares external domains`]
            return []
        })

        expect(offenders).toEqual([])
    })
})
