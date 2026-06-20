import {
    emptyHmacHashes,
    emptyStandardHashes,
    hashBytes,
    hashHmac,
    hashText,
    hashTextByAlgorithm,
    type HmacHashes,
    type StandardHashAlgorithm,
    type StandardHashes,
} from "@/core/utils/hash-utils"

export type HashBatchRow = {
    index: number
    line: string
    hash: string
}

export type HashTaskInput =
    | { mode: "text"; input: string }
    | { mode: "file"; bytes: Uint8Array }
    | { mode: "hmac"; input: string; secret: string }
    | { mode: "batch"; input: string; algorithm: StandardHashAlgorithm }

export type HashTaskResult = {
    standardHashes: StandardHashes
    hmacHashes: HmacHashes
    batchRows: HashBatchRow[]
}

function buildBatchRows(input: string, algorithm: StandardHashAlgorithm): HashBatchRow[] {
    if (!input.trim()) return []

    return input
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line, index) => ({
            index: index + 1,
            line,
            hash: hashTextByAlgorithm(line, algorithm),
        }))
}

export function runHashTaskSync(input: HashTaskInput): HashTaskResult {
    return {
        standardHashes: input.mode === "text"
            ? hashText(input.input)
            : input.mode === "file"
                ? hashBytes(input.bytes)
                : emptyStandardHashes(),
        hmacHashes: input.mode === "hmac" ? hashHmac(input.input, input.secret) : emptyHmacHashes(),
        batchRows: input.mode === "batch" ? buildBatchRows(input.input, input.algorithm) : [],
    }
}
