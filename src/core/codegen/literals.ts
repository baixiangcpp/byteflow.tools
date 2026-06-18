export function shellSingleQuote(value: string): string {
    if (value.length === 0) return "''"
    return `'${value.replace(/'/g, "'\\''")}'`
}

export function jsStringLiteral(value: string): string {
    return JSON.stringify(value)
}

export function pythonStringLiteral(value: string): string {
    return JSON.stringify(value)
}

export function goStringLiteral(value: string): string {
    return JSON.stringify(value)
}

export function phpStringLiteral(value: string): string {
    return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
}

function rustEscapedStringLiteral(value: string): string {
    let output = '"'
    for (const char of value) {
        switch (char) {
            case "\\":
                output += "\\\\"
                break
            case '"':
                output += '\\"'
                break
            case "\n":
                output += "\\n"
                break
            case "\r":
                output += "\\r"
                break
            case "\t":
                output += "\\t"
                break
            case "\0":
                output += "\\0"
                break
            default: {
                const codePoint = char.codePointAt(0) ?? 0
                output += codePoint < 0x20
                    ? `\\u{${codePoint.toString(16)}}`
                    : char
            }
        }
    }
    return `${output}"`
}

export function rustStringLiteral(value: string): string {
    for (let hashCount = 0; hashCount <= 8; hashCount += 1) {
        const hashes = "#".repeat(hashCount)
        const endDelimiter = `"${hashes}`
        if (!value.includes(endDelimiter)) {
            return `r${hashes}"${value}"${hashes}`
        }
    }

    return rustEscapedStringLiteral(value)
}

export function jsJsonBodyExpression(value: string): string | null {
    try {
        return `JSON.stringify(${JSON.stringify(JSON.parse(value), null, 2)})`
    } catch {
        return null
    }
}

export function pythonJsonBodyExpression(value: string): string | null {
    try {
        JSON.parse(value)
        return `json.loads(${pythonStringLiteral(value)})`
    } catch {
        return null
    }
}
