import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "csv_json_converter",
    slug: "csv-json-converter",
    category: "formatters",
    relatedTools: ["json_formatter", "yaml_json_converter", "json_to_typescript", "text_diff_checker"],
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
        warnAtBytes: 524288,
        workerAtBytes: 262144,
        hardLimitBytes: 1048576,
        streamingSupported: false,
    },
    keywords: ["csv to json", "json to csv", "csv converter online", "csv json transform"],
} satisfies ToolMeta
