export function jsonToTs(json: unknown, name: string, options: { readonly: boolean; optional: boolean }): string {
    const lines: string[] = []
    const seen = new Map<string, string>()

    function capitalize(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1)
    }

    function sanitize(key: string): string {
        return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`
    }

    function inferType(value: unknown, typeName: string): string {
        if (value === null) return "null"
        if (Array.isArray(value)) {
            if (value.length === 0) return "unknown[]"
            const itemType = inferType(value[0], typeName + "Item")
            return `${itemType}[]`
        }
        switch (typeof value) {
            case "string": return "string"
            case "number": return "number"
            case "boolean": return "boolean"
            default:
                if (typeof value === "object" && value !== null) {
                    const existing = seen.get(JSON.stringify(Object.keys(value).sort()))
                    if (existing) return existing
                    generateInterface(value as Record<string, unknown>, typeName)
                    return typeName
                }
                return "unknown"
        }
    }

    function generateInterface(obj: Record<string, unknown>, interfaceName: string) {
        const key = JSON.stringify(Object.keys(obj).sort())
        if (seen.has(key)) return
        seen.set(key, interfaceName)

        const prefix = options.readonly ? "readonly " : ""
        const suffix = options.optional ? "?" : ""

        const members = Object.entries(obj).map(([k, v]) => {
            const childTypeName = capitalize(interfaceName) + capitalize(k)
            const type = inferType(v, childTypeName)
            return `  ${prefix}${sanitize(k)}${suffix}: ${type};`
        })

        lines.push(`export interface ${interfaceName} {\n${members.join("\n")}\n}\n`)
    }

    if (Array.isArray(json)) {
        if (json.length > 0 && typeof json[0] === "object" && json[0] !== null) {
            generateInterface(json[0] as Record<string, unknown>, name)
            lines.push(`export type ${name}List = ${name}[];\n`)
        } else {
            const itemType = json.length > 0 ? inferType(json[0], name + "Item") : "unknown"
            lines.push(`export type ${name} = ${itemType}[];\n`)
        }
    } else if (typeof json === "object" && json !== null) {
        generateInterface(json as Record<string, unknown>, name)
    } else {
        lines.push(`export type ${name} = ${typeof json};\n`)
    }

    return lines.join("\n")
}
