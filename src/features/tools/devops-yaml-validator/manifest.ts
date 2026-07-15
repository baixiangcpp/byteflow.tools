import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "devops_yaml_validator",
    slug: "devops-yaml-validator",
    inputBehavior: "explicit-sample",
    category: "network-web",
    relatedTools: ["docker_run_to_compose", "yaml_json_converter", "yq_playground", "env_parser"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: true,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    sampleInput: "services:\n  api:\n    image: node:20\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api",
    sampleMode: "validate-devops-yaml",
    keywords: ["docker compose validator", "kubernetes yaml validator", "k8s yaml checker", "devops yaml validator"],
    searchKeywords: ["kubernetes", "k8s", "docker compose", "yaml", "devops"],
    persistInput: false,
    networkAccess: "none",
} satisfies ToolMeta
