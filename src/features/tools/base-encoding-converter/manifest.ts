import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "base_encoding_converter",
    slug: "base-encoding-converter",
    category: "text-string",
    relatedTools: ["base64_encode_decode", "hex_bytes_workbench", "url_encode_decode", "hash_generator"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    relatedWorkflows: [
        { toolKey: "base64_encode_decode", reasonKey: "compare_base_encodings", handoffSupported: true },
        { toolKey: "hex_bytes_workbench", reasonKey: "inspect_encoded_bytes", handoffSupported: true },
        { toolKey: "hash_generator", reasonKey: "hash_decoded_payload", handoffSupported: true },
    ],
    sampleInput: "byteflow-tools",
    sampleMode: "base32:encode",
    inputSizePolicy: {
        warnAtBytes: 1048576,
        workerAtBytes: 5242880,
        hardLimitBytes: 10485760,
        streamingSupported: false,
    },
    keywords: ["base32 encoder", "base32 decoder", "base58 encoder", "base58 decoder", "base encoding converter"],
    searchKeywords: ["base32", "base58", "bitcoin base58", "encoding converter", "base encode", "base decode", "编码", "解码"],
} satisfies ToolMeta
