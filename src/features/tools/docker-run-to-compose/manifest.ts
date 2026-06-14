import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "docker_run_to_compose",
    slug: "docker-run-to-compose",
    category: "network-web",
    relatedTools: ["env_parser", "yaml_json_converter", "chmod_calculator", "curl_to_code"],
    keywords: ["docker run to compose", "docker compose converter", "docker command to yaml", "containerize"],
    searchKeywords: ["docker", "compose", "container", "convert docker run", "docker-compose", "容器", "Docker変換", "도커 컴포즈"],
} satisfies ToolMeta
