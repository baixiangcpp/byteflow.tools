import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "image_resizer",
    slug: "image-resizer",
    category: "generators",
    relatedTools: ["image_privacy_workbench", "image_cropper", "image_filters", "image_base64"],
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
        { toolKey: "image_cropper", reasonKey: "crop_before_resize" },
        { toolKey: "image_filters", reasonKey: "adjust_after_resize" },
        { toolKey: "image_base64", reasonKey: "embed_resized_asset" },
    ],
    inputSizePolicy: {
        warnAtBytes: 6291456,
        workerAtBytes: 3145728,
        hardLimitBytes: 12582912,
        streamingSupported: false,
    },
    keywords: ["image resizer", "resize image online", "change photo dimensions", "image resize tool"],
} satisfies ToolMeta
