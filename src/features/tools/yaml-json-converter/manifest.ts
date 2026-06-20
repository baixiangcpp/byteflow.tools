import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "yaml_json_converter",
    slug: "yaml-json-converter",
    category: "formatters",
    relatedTools: ["json_formatter", "json_to_typescript", "structured_data_visualizer", "xml_formatter"],
    relatedWorkflows: [
        { toolKey: "json_formatter", reasonKey: "format_converted_json", handoffSupported: true },
        { toolKey: "json_to_typescript", reasonKey: "typed_model_from_converted_json", handoffSupported: true },
        { toolKey: "structured_data_visualizer", reasonKey: "inspect_converted_structure", handoffSupported: true },
    ],
    sampleInput: "name = \"byteflow\"\nports = [80, 443]\n\n[owner]\nteam = \"tools\"",
    sampleMode: "toml-to-json",
    inputSizePolicy: {
        warnAtBytes: 1048576,
        workerAtBytes: 5242880,
        hardLimitBytes: 10485760,
        streamingSupported: false,
    },
    keywords: ["yaml to json", "json to yaml", "toml to json", "json to toml", "yaml json toml converter"],
    searchKeywords: ["convert yaml", "convert toml", "toml parser", "json converter", "YAML转换", "TOML转换", "YAML変換", "TOML変換", "YAML 변환", "TOML 변환", "配置转换"],
    persistInput: false,
} satisfies ToolMeta
