import type { StandardHashAlgorithm } from "@/core/utils/hash-utils"
import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"

export const MAX_HASH_FILE_SIZE = FILE_INPUT_POLICIES["hash-file"].maxBytes

export const BATCH_ALGORITHMS: Array<{ key: StandardHashAlgorithm; label: string }> = [
    { key: "md5", label: "MD5" },
    { key: "sha1", label: "SHA-1" },
    { key: "sha224", label: "SHA-224" },
    { key: "sha256", label: "SHA-256" },
    { key: "sha384", label: "SHA-384" },
    { key: "sha512", label: "SHA-512" },
]
