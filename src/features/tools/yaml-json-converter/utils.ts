import YAML from "yaml"

export type YamlJsonMode = "yaml-to-json" | "json-to-yaml"

export function convertYamlJson(input: string, mode: YamlJsonMode): string {
    if (mode === "yaml-to-json") {
        const parsed = YAML.parse(input)
        return JSON.stringify(parsed, null, 2)
    }

    const parsed = JSON.parse(input)
    return YAML.stringify(parsed)
}
