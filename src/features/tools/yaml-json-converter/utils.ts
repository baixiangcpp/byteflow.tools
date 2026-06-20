import YAML from "yaml"
import { parse as parseToml, stringify as stringifyToml } from "smol-toml"

export type YamlJsonMode = "yaml-to-json" | "json-to-yaml"
export type StructuredDataFormat = "json" | "yaml" | "toml"

export type StructuredDataConversion = {
    from: StructuredDataFormat
    to: StructuredDataFormat
}

function parseYaml(input: string): unknown {
    const documents = YAML.parseAllDocuments(input)
        .filter((document) => document.contents !== null)

    if (documents.length === 0) return null
    const yamlError = documents.flatMap((document) => document.errors)[0]
    if (yamlError) throw yamlError
    if (documents.length === 1) return documents[0].toJSON()
    return documents.map((document) => document.toJSON())
}

function parseStructuredData(input: string, format: StructuredDataFormat): unknown {
    if (format === "json") return JSON.parse(input)
    if (format === "yaml") return parseYaml(input)
    return parseToml(input)
}

function stringifyStructuredData(value: unknown, format: StructuredDataFormat): string {
    if (format === "json") return JSON.stringify(value, null, 2)
    if (format === "yaml") return YAML.stringify(value)
    return stringifyToml(value as Parameters<typeof stringifyToml>[0])
}

export function convertStructuredData(input: string, conversion: StructuredDataConversion): string {
    if (conversion.from === conversion.to) {
        throw new Error("Choose two different formats.")
    }

    return stringifyStructuredData(parseStructuredData(input, conversion.from), conversion.to)
}

export function convertYamlJson(input: string, mode: YamlJsonMode): string {
    if (mode === "yaml-to-json") {
        return convertStructuredData(input, { from: "yaml", to: "json" })
    }

    return convertStructuredData(input, { from: "json", to: "yaml" })
}
