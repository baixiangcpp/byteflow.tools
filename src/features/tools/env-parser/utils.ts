export type EnvVar = {
    key: string
    value: string
    comment?: string
    isComment: boolean
    isEmpty: boolean
    line: number
}

export type EnvExportFormat = "json" | "yaml" | "docker-args"

export function parseEnvFile(content: string): EnvVar[] {
    return content.split("\n").map((raw, i) => {
        const trimmed = raw.trim()
        if (!trimmed) return { key: "", value: "", isComment: false, isEmpty: true, line: i + 1 }
        if (trimmed.startsWith("#")) return { key: "", value: "", comment: trimmed.slice(1).trim(), isComment: true, isEmpty: false, line: i + 1 }

        const eqIdx = trimmed.indexOf("=")
        if (eqIdx === -1) return { key: trimmed, value: "", isComment: false, isEmpty: false, line: i + 1 }

        const key = trimmed.slice(0, eqIdx).trim()
        let value = trimmed.slice(eqIdx + 1).trim()
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
        }
        return { key, value, isComment: false, isEmpty: false, line: i + 1 }
    })
}

export function envToJson(vars: EnvVar[]): string {
    const obj: Record<string, string> = {}
    vars.filter((variable) => !variable.isComment && !variable.isEmpty && variable.key).forEach((variable) => {
        obj[variable.key] = variable.value
    })
    return JSON.stringify(obj, null, 2)
}

export function envToYaml(vars: EnvVar[]): string {
    return vars.filter((variable) => !variable.isComment && !variable.isEmpty && variable.key)
        .map((variable) => `${variable.key}: "${variable.value.replace(/"/g, "\\\"")}"`)
        .join("\n")
}

export function envToDockerArgs(vars: EnvVar[]): string {
    return vars.filter((variable) => !variable.isComment && !variable.isEmpty && variable.key)
        .map((variable) => `-e ${variable.key}="${variable.value}"`)
        .join(" \\\n  ")
}

export function exportEnvVars(vars: EnvVar[], format: EnvExportFormat): string {
    switch (format) {
        case "json":
            return envToJson(vars)
        case "yaml":
            return envToYaml(vars)
        case "docker-args":
            return envToDockerArgs(vars)
    }
}
