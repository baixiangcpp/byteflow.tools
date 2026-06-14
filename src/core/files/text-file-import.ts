const SUPPORTED_TEXT_FILE_EXTENSIONS = [
    ".txt",
    ".json",
    ".md",
    ".csv",
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
]

export const TEXT_FILE_IMPORT_ACCEPT = SUPPORTED_TEXT_FILE_EXTENSIONS.join(",")
export const DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES = 2 * 1024 * 1024

function hasSupportedTextMime(file: File): boolean {
    const mime = file.type.toLowerCase()
    if (!mime) return false
    return (
        mime.startsWith("text/") ||
        mime.includes("json") ||
        mime.includes("xml") ||
        mime.includes("javascript") ||
        mime.includes("typescript")
    )
}

function hasSupportedTextExtension(file: File): boolean {
    const lowerName = file.name.toLowerCase()
    return SUPPORTED_TEXT_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
}

export function validateTextImportFile(file: File, maxBytes = DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES): string | null {
    if (!file) return "No file selected."
    if (file.size === 0) return "The selected file is empty."
    if (file.size > maxBytes) {
        const limitMb = (maxBytes / (1024 * 1024)).toFixed(1)
        return `File is too large. Max supported size is ${limitMb} MB.`
    }
    if (!hasSupportedTextMime(file) && !hasSupportedTextExtension(file)) {
        return "Unsupported file type. Please import a text-compatible file."
    }
    return null
}

export async function importTextFile(file: File, maxBytes = DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES): Promise<string> {
    const validationError = validateTextImportFile(file, maxBytes)
    if (validationError) {
        throw new Error(validationError)
    }

    return file.text()
}
