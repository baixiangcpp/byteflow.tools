export const VIEW_MODE_STORAGE_KEY = "byteflow:json-formatter:view-mode"
export const INPUT_STORAGE_KEY = "byteflow:json-formatter:input"
export const INPUT_STORAGE_DEBOUNCE_MS = 700
export const INPUT_STORAGE_MAX_CHARS = 2_000_000
export const JSON_FORMATTER_PERSISTENCE_POLICY = {
    persistInput: false,
    inputStorageKey: INPUT_STORAGE_KEY,
    maxInputChars: INPUT_STORAGE_MAX_CHARS,
} as const
