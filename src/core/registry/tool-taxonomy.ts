import type { ToolMeta, ToolNetworkAccess } from "./types"
import taxonomyConfig from "./tool-taxonomy-config.json"

export type ToolFamily =
    | "formatters-validators"
    | "encoders-decoders"
    | "text-strings"
    | "data-formats"
    | "security-tokens"
    | "network-http"
    | "devops-logs"
    | "generators"
    | "images-media"
    | "svg-css-visual"
    | "social-metadata"
    | "workbench-pipeline"

export type ToolCapability =
    | "browser-local"
    | "offline-capable"
    | "external-request"
    | "sensitive-input"
    | "pipeline-ready"
    | "file-input"
    | "visual-output"

export type ToolTaxonomy = {
    family: ToolFamily
    tags: string[]
    capabilities: ToolCapability[]
}

export const TOOL_FAMILY_LABELS: Record<ToolFamily, string> = {
    "formatters-validators": "Formatters and validators",
    "encoders-decoders": "Encoders and decoders",
    "text-strings": "Text and strings",
    "data-formats": "JSON, YAML, CSV, and data formats",
    "security-tokens": "Security, tokens, and certificates",
    "network-http": "Network, HTTP, and web",
    "devops-logs": "DevOps and logs",
    generators: "Generators",
    "images-media": "Images and media",
    "svg-css-visual": "SVG and CSS visual tools",
    "social-metadata": "Social and metadata tools",
    "workbench-pipeline": "Workbench and pipeline tools",
}

export const TOOL_CAPABILITY_LABELS: Record<ToolCapability, string> = {
    "browser-local": "Browser-local",
    "offline-capable": "Offline capable",
    "external-request": "External request",
    "sensitive-input": "Sensitive input",
    "pipeline-ready": "Pipeline ready",
    "file-input": "File input",
    "visual-output": "Visual output",
}

const FAMILY_BY_TOOL_KEY = taxonomyConfig.familyByToolKey as Partial<Record<string, ToolFamily>>
const PIPELINE_READY_TOOL_KEYS = new Set(taxonomyConfig.pipelineReadyToolKeys)

function fallbackFamily(tool: ToolMeta): ToolFamily {
    if (tool.category === "formatters") return "formatters-validators"
    if (tool.category === "generators") return "generators"
    if (tool.category === "network-web") return "network-http"
    return "text-strings"
}

function inferKeywordTags(tool: ToolMeta): string[] {
    const source = [tool.key, tool.slug, ...tool.keywords, ...(tool.searchKeywords ?? [])]
        .join(" ")
        .toLowerCase()

    const tags = new Set<string>()
    const addWhen = (tag: string, patterns: string[]) => {
        if (patterns.some((pattern) => source.includes(pattern))) tags.add(tag)
    }

    addWhen("json", ["json", "jq"])
    addWhen("yaml", ["yaml", "yq"])
    addWhen("csv", ["csv"])
    addWhen("xml", ["xml", "saml"])
    addWhen("html", ["html"])
    addWhen("css", ["css"])
    addWhen("svg", ["svg"])
    addWhen("markdown", ["markdown"])
    addWhen("base64", ["base64"])
    addWhen("url", ["url", "uri"])
    addWhen("jwt", ["jwt"])
    addWhen("hash", ["hash", "checksum", "digest", "md5", "sha"])
    addWhen("http", ["http", "header", "curl", "openapi", "request"])
    addWhen("regex", ["regex", "regexp"])
    addWhen("image", ["image", "photo", "png", "jpeg", "webp"])
    addWhen("color", ["color", "palette", "gradient"])
    addWhen("logs", ["log", "har"])
    addWhen("security", ["security", "token", "certificate", "totp", "secret", "saml", "asn.1", "asn1"])

    return [...tags].sort()
}

function uniqueSorted<T extends string>(values: T[]): T[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export function getToolTaxonomy(tool: ToolMeta): ToolTaxonomy {
    const networkAccess: ToolNetworkAccess = tool.networkAccess ?? (tool.privacy.externalRequest.required ? "user_requested" : "none")
    const family = FAMILY_BY_TOOL_KEY[tool.key] ?? fallbackFamily(tool)
    const tags = uniqueSorted([family, ...inferKeywordTags(tool)])
    const capabilities: ToolCapability[] = []

    if (tool.privacy.executionMode === "external-request" || networkAccess !== "none") {
        capabilities.push("external-request")
    } else {
        capabilities.push("browser-local")
    }
    if (tool.privacy.offlineCapable) capabilities.push("offline-capable")
    if (tool.privacy.sensitiveInput || tool.persistInput === false || family === "security-tokens" || family === "devops-logs") {
        capabilities.push("sensitive-input")
    }
    if (PIPELINE_READY_TOOL_KEYS.has(tool.key)) capabilities.push("pipeline-ready")
    if (["data-formats", "images-media", "devops-logs", "workbench-pipeline"].includes(family)) {
        capabilities.push("file-input")
    }
    if (["images-media", "svg-css-visual", "social-metadata"].includes(family)) {
        capabilities.push("visual-output")
    }

    return {
        family,
        tags,
        capabilities: uniqueSorted(capabilities),
    }
}
