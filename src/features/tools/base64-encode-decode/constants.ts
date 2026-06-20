import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"

export const MAX_FILE_SIZE = FILE_INPUT_POLICIES["base64-file"].maxBytes
export const OUTPUT_PREVIEW_LIMIT = 10_000
export const MODE_STORAGE_KEY = "byteflow:base64:mode"
export const OPERATION_STORAGE_KEY = "byteflow:base64:operation"
