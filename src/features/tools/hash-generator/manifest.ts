import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "hash_generator",
    slug: "hash-generator",
    category: "text-string",
    relatedTools: ["md5_generator", "base64_encode_decode", "jwt_decoder", "password_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "Byteflow sample checksum",
    sampleMode: "text:sha256",
    inputSizePolicy: {
        warnAtBytes: 5242880,
        workerAtBytes: 1048576,
        hardLimitBytes: 52428800,
        streamingSupported: false,
    },
    keywords: ["hash generator", "md5 hash", "sha256 hash online", "sha512 generator"],
    searchKeywords: ["generate hash", "checksum", "hash text", "crypto hash", "哈希生成", "ハッシュ生成", "해시 생성", "校验和"],
} satisfies ToolMeta
