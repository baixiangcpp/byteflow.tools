import { formatByteLimit } from "@/core/performance/tool-runtime-budgets"

export type FileInputPolicyId =
    | "text"
    | "csv-json"
    | "hash-file"
    | "base64-file"
    | "image-standard"
    | "image-compact"
    | "image-logo"
    | "qr-decode-image"
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

type RasterImageMime = "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "image/avif"

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
    "qr-decode-image": {
        id: "qr-decode-image",
        accept: ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp",
        description: "PNG, JPEG, or WebP QR images up to 8 MB and 12 MP",
        maxBytes: 8 * 1024 * 1024,
        maxPixels: 12_000_000,
        allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
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
        accept: ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp",
        description: "Up to 20 PNG, JPEG, or WebP pages, 12 MB and 24 MP each",
        maxBytes: 12 * 1024 * 1024,
        maxPixels: 24_000_000,
        maxFiles: 20,
        allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
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
    const hasExtensionRules = Boolean(policy.allowedExtensions?.length)
    const hasMimeRules = Boolean(policy.allowedMimePrefixes?.length || policy.allowedMimeTypes?.length)
    const hasTypeRules = hasExtensionRules || hasMimeRules
    if (!hasTypeRules) return true

    const extensionAllowed = Boolean(extension && policy.allowedExtensions?.includes(extension))
    const mimeAllowed = Boolean(
        mime && (
            policy.allowedMimePrefixes?.some((prefix) => mime.startsWith(prefix))
            || policy.allowedMimeTypes?.includes(mime)
        ),
    )

    if (extension && hasExtensionRules) {
        if (!extensionAllowed) return false

        // Browsers often assign generic or vendor MIME types to extension-matched files.
        // Raster content is checked separately against its file signature before decoding.
        return !(mime.startsWith("image/") && hasMimeRules && !mimeAllowed)
    }

    return mimeAllowed
}

const RASTER_POLICY_IDS = new Set<FileInputPolicyId>([
    "image-standard",
    "image-compact",
    "image-logo",
    "qr-decode-image",
    "scan-image",
])

const RASTER_MIME_BY_EXTENSION: Record<string, RasterImageMime> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
}

function startsWithBytes(bytes: Uint8Array, signature: readonly number[]): boolean {
    return signature.every((value, index) => bytes[index] === value)
}

export function detectRasterImageMime(input: ArrayBuffer | Uint8Array): RasterImageMime | null {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
    if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png"
    if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg"
    if (startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
        || startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) return "image/gif"
    if (startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46])
        && startsWithBytes(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])) return "image/webp"

    const hasIsoFileTypeBox = startsWithBytes(bytes.subarray(4), [0x66, 0x74, 0x79, 0x70])
    if (hasIsoFileTypeBox) {
        const brands = new TextDecoder("ascii").decode(bytes.subarray(8, 64))
        if (brands.includes("avif") || brands.includes("avis")) return "image/avif"
    }
    return null
}

function validateRasterFileBytes(file: File, policy: FileInputPolicy, input: ArrayBuffer | Uint8Array): FileValidationResult {
    if (!RASTER_POLICY_IDS.has(policy.id)) return { ok: true, file }

    const detectedMime = detectRasterImageMime(input)
    const extensionMime = RASTER_MIME_BY_EXTENSION[fileExtension(file)]
    const declaredMime = file.type.toLowerCase()
    const detectedMimeAllowed = detectedMime && (
        policy.allowedMimeTypes?.includes(detectedMime)
        || policy.allowedMimePrefixes?.some((prefix) => detectedMime.startsWith(prefix))
    )

    const declaredMimeConflicts = declaredMime.startsWith("image/") && declaredMime !== detectedMime
    if (!detectedMime || !detectedMimeAllowed || (extensionMime && extensionMime !== detectedMime) || declaredMimeConflicts) {
        return {
            ok: false,
            reason: "unsupported_type",
            message: `File content does not match a supported raster image. Supported input: ${policy.description}.`,
        }
    }
    return { ok: true, file }
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
    const buffer = await file.arrayBuffer()
    const contentValidation = validateRasterFileBytes(file, policy, buffer)
    if (!contentValidation.ok) throw new Error(contentValidation.message)
    return buffer
}

export async function validateFileContentAgainstPolicy(file: File, policy: FileInputPolicy): Promise<FileValidationResult> {
    const validation = validateFileAgainstPolicy(file, policy)
    if (!validation.ok || !RASTER_POLICY_IDS.has(policy.id)) return validation

    try {
        const signatureBytes = await file.slice(0, 64).arrayBuffer()
        return validateRasterFileBytes(file, policy, signatureBytes)
    } catch {
        return {
            ok: false,
            reason: "unsupported_type",
            message: "Unable to verify the selected file content.",
        }
    }
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
