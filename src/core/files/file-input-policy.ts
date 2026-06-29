import { formatByteLimit } from "@/core/performance/tool-runtime-budgets"

export type FileInputPolicyId =
    | "text"
    | "csv-json"
    | "hash-file"
    | "base64-file"
    | "image-standard"
    | "image-compact"
    | "image-logo"
    | "svg"
    | "scan-image"
    | "recipe-json"

export type FileInputPolicy = {
    id: FileInputPolicyId
    accept: string
    description: string
    maxBytes: number
    maxPixels?: number
    maxFiles?: number
    allowedExtensions?: readonly string[]
    allowedMimePrefixes?: readonly string[]
    allowedMimeTypes?: readonly string[]
}

export type FileValidationResult =
    | { ok: true; file: File }
    | { ok: false; reason: "empty" | "too_large" | "unsupported_type"; message: string }

const TEXT_EXTENSIONS = [
    ".txt",
    ".json",
    ".md",
    ".csv",
    ".tsv",
    ".yaml",
    ".yml",
    ".xml",
    ".log",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".html",
    ".css",
] as const

export const FILE_INPUT_POLICIES = {
    text: {
        id: "text",
        accept: TEXT_EXTENSIONS.join(","),
        description: "Text-compatible files up to 2 MB",
        maxBytes: 2 * 1024 * 1024,
        allowedExtensions: TEXT_EXTENSIONS,
        allowedMimePrefixes: ["text/"],
        allowedMimeTypes: [
            "application/json",
            "application/ld+json",
            "application/xml",
            "application/javascript",
            "application/typescript",
            "application/x-yaml",
            "application/yaml",
            "text/yaml",
        ],
    },
    "csv-json": {
        id: "csv-json",
        accept: ".csv,.tsv,.txt,.json",
        description: "CSV, TSV, TXT, or JSON files up to 1 MB",
        maxBytes: 1024 * 1024,
        allowedExtensions: [".csv", ".tsv", ".txt", ".json"],
        allowedMimePrefixes: ["text/"],
        allowedMimeTypes: ["application/json"],
    },
    "hash-file": {
        id: "hash-file",
        accept: "*/*",
        description: "Any local file up to 50 MB",
        maxBytes: 50 * 1024 * 1024,
    },
    "base64-file": {
        id: "base64-file",
        accept: "*/*",
        description: "Any local file up to 10 MB",
        maxBytes: 10 * 1024 * 1024,
    },
    "image-standard": {
        id: "image-standard",
        accept: ".png,.jpg,.jpeg,.webp,.gif,.avif,image/png,image/jpeg,image/webp,image/gif,image/avif",
        description: "Raster image files up to 12 MB and 24 MP. Use SVG tools for SVG files.",
        maxBytes: 12 * 1024 * 1024,
        maxPixels: 24_000_000,
        allowedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"],
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],
    },
    "image-compact": {
        id: "image-compact",
        accept: ".png,.jpg,.jpeg,.webp,.gif,.avif,image/png,image/jpeg,image/webp,image/gif,image/avif",
        description: "Raster image files up to 10 MB and 16 MP. Use SVG tools for SVG files.",
        maxBytes: 10 * 1024 * 1024,
        maxPixels: 16_000_000,
        allowedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"],
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],
    },
    "image-logo": {
        id: "image-logo",
        accept: ".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif",
        description: "Raster logo/avatar images up to 2 MB and 4 MP. Use SVG tools for SVG files.",
        maxBytes: 2 * 1024 * 1024,
        maxPixels: 4_000_000,
        allowedExtensions: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    },
    svg: {
        id: "svg",
        accept: ".svg,image/svg+xml",
        description: "SVG files up to 2 MB",
        maxBytes: 2 * 1024 * 1024,
        allowedExtensions: [".svg"],
        allowedMimeTypes: ["image/svg+xml", "text/xml", "application/xml"],
    },
    "scan-image": {
        id: "scan-image",
        accept: "image/*",
        description: "Up to 20 image pages, 12 MB and 24 MP each",
        maxBytes: 12 * 1024 * 1024,
        maxPixels: 24_000_000,
        maxFiles: 20,
        allowedMimePrefixes: ["image/"],
        allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
    },
    "recipe-json": {
        id: "recipe-json",
        accept: "application/json,.json",
        description: "Pipeline recipe JSON up to 256 KB",
        maxBytes: 256 * 1024,
        allowedExtensions: [".json"],
        allowedMimeTypes: ["application/json"],
    },
} as const satisfies Record<FileInputPolicyId, FileInputPolicy>

export function formatFilePolicyLimit(policy: FileInputPolicy): string {
    return formatByteLimit(policy.maxBytes)
}

export function formatPixelLimit(maxPixels: number): string {
    if (maxPixels >= 1_000_000) return `${Number((maxPixels / 1_000_000).toFixed(1))} MP`
    if (maxPixels >= 1_000) return `${Number((maxPixels / 1_000).toFixed(1))} KP`
    return `${maxPixels} px`
}

export function describeFilePolicy(policy: FileInputPolicy): string {
    return policy.description
}

function fileExtension(file: File): string {
    const dotIndex = file.name.lastIndexOf(".")
    return dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : ""
}

function hasAllowedFileType(file: File, policy: FileInputPolicy): boolean {
    const mime = file.type.toLowerCase()
    const extension = fileExtension(file)
    const hasTypeRules = Boolean(policy.allowedMimePrefixes?.length || policy.allowedMimeTypes?.length || policy.allowedExtensions?.length)
    if (!hasTypeRules) return true
    if (extension && policy.allowedExtensions?.length && !policy.allowedExtensions.includes(extension)) return false
    if (mime && policy.allowedMimePrefixes?.some((prefix) => mime.startsWith(prefix))) return true
    if (mime && policy.allowedMimeTypes?.includes(mime)) return true
    if (extension && policy.allowedExtensions?.includes(extension)) return true
    return false
}

export function validateFileAgainstPolicy(file: File, policy: FileInputPolicy): FileValidationResult {
    if (file.size === 0) {
        return { ok: false, reason: "empty", message: "The selected file is empty." }
    }
    if (file.size > policy.maxBytes) {
        return {
            ok: false,
            reason: "too_large",
            message: `File is too large. Max supported size is ${formatFilePolicyLimit(policy)}.`,
        }
    }
    if (!hasAllowedFileType(file, policy)) {
        return {
            ok: false,
            reason: "unsupported_type",
            message: `Unsupported file type. Supported input: ${policy.description}.`,
        }
    }
    return { ok: true, file }
}

export async function readTextFileWithPolicy(file: File, policy: FileInputPolicy = FILE_INPUT_POLICIES.text): Promise<string> {
    const validation = validateFileAgainstPolicy(file, policy)
    if (!validation.ok) throw new Error(validation.message)
    return file.text()
}

export async function readArrayBufferWithPolicy(file: File, policy: FileInputPolicy): Promise<ArrayBuffer> {
    const validation = validateFileAgainstPolicy(file, policy)
    if (!validation.ok) throw new Error(validation.message)
    return file.arrayBuffer()
}

export function filterFilesByPolicy(files: Iterable<File>, policy: FileInputPolicy): { accepted: File[]; rejected: Array<{ file: File; message: string }> } {
    const accepted: File[] = []
    const rejected: Array<{ file: File; message: string }> = []
    const maxFiles = policy.maxFiles ?? Number.POSITIVE_INFINITY

    for (const file of files) {
        if (accepted.length >= maxFiles) break
        const validation = validateFileAgainstPolicy(file, policy)
        if (validation.ok) accepted.push(file)
        else rejected.push({ file, message: validation.message })
    }

    return { accepted, rejected }
}
