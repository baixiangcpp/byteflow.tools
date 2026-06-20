import { FILE_INPUT_POLICIES, readTextFileWithPolicy, validateFileAgainstPolicy, type FileInputPolicy } from "@/core/files/file-input-policy"

export const TEXT_FILE_IMPORT_ACCEPT = FILE_INPUT_POLICIES.text.accept
export const DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES = FILE_INPUT_POLICIES.text.maxBytes

export function validateTextImportFile(file: File, maxBytes = DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES): string | null {
    const policy: FileInputPolicy = { ...FILE_INPUT_POLICIES.text, maxBytes }
    const validation = validateFileAgainstPolicy(file, policy)
    return validation.ok ? null : validation.message
}

export async function importTextFile(file: File, maxBytes = DEFAULT_TEXT_FILE_IMPORT_MAX_BYTES): Promise<string> {
    return readTextFileWithPolicy(file, { ...FILE_INPUT_POLICIES.text, maxBytes })
}
