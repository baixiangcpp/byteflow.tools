import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "scanned_pdf_converter",
    slug: "scanned-pdf-converter",
    category: "generators",
    relatedTools: ["photo_censor", "image_filters", "image_resizer", "image_base64"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    inputSizePolicy: {
        warnAtBytes: 6291456,
        workerAtBytes: 3145728,
        hardLimitBytes: 12582912,
        streamingSupported: false,
    },
    keywords: ["scanned pdf converter", "scan to pdf", "enhance scanned document", "multi page pdf exporter"],
} satisfies ToolMeta
