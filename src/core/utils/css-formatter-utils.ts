export type CssFormatOptions = {
    indentSize: number
    selectorSeparatorNewline: boolean
    newlineBetweenRules: boolean
    spaceAroundCombinator: boolean
    endWithNewline: boolean
}

export const DEFAULT_CSS_FORMAT_OPTIONS: CssFormatOptions = {
    indentSize: 2,
    selectorSeparatorNewline: true,
    newlineBetweenRules: true,
    spaceAroundCombinator: false,
    endWithNewline: false,
}

export function formatCssWithOptions(input: string, options: CssFormatOptions): string {
    const indentUnit = " ".repeat(Math.max(1, Math.min(8, options.indentSize)))
    let output = ""
    let indentLevel = 0
    let inString: '"' | "'" | null = null
    let inComment = false
    let parenDepth = 0

    const append = (text: string) => {
        output += text
    }

    const currentIndent = () => indentUnit.repeat(Math.max(0, indentLevel))

    const trimTrailingWhitespace = () => {
        output = output.replace(/[ \t]+$/g, "")
    }

    for (let index = 0; index < input.length; index += 1) {
        const char = input[index]
        const next = input[index + 1]

        if (inComment) {
            append(char)
            if (char === "*" && next === "/") {
                append("/")
                index += 1
                inComment = false
            }
            continue
        }

        if (inString) {
            append(char)
            if (char === "\\" && next) {
                append(next)
                index += 1
                continue
            }
            if (char === inString) {
                inString = null
            }
            continue
        }

        if (char === "/" && next === "*") {
            append("/*")
            index += 1
            inComment = true
            continue
        }

        if (char === '"' || char === "'") {
            inString = char
            append(char)
            continue
        }

        if (char === "(") {
            parenDepth += 1
            append(char)
            continue
        }

        if (char === ")") {
            parenDepth = Math.max(0, parenDepth - 1)
            append(char)
            continue
        }

        if (/\s/.test(char)) {
            if (output.endsWith("\n") || output.endsWith(" ") || output.endsWith("{") || output.endsWith("}")) {
                continue
            }
            append(" ")
            continue
        }

        if (char === "{") {
            trimTrailingWhitespace()
            append(" {\n")
            indentLevel += 1
            append(currentIndent())
            continue
        }

        if (char === "}") {
            trimTrailingWhitespace()
            indentLevel = Math.max(0, indentLevel - 1)
            if (!output.endsWith("\n")) {
                append("\n")
            }
            append(`${currentIndent()}}`)
            const trailing = input.slice(index + 1)
            if (/\S/.test(trailing)) {
                append(options.newlineBetweenRules ? "\n\n" : "\n")
            }
            continue
        }

        if (char === ";") {
            trimTrailingWhitespace()
            append(";")
            const trailing = input.slice(index + 1)
            if (/[^\s}]/.test(trailing)) {
                append(`\n${currentIndent()}`)
            } else {
                append("\n")
            }
            continue
        }

        if (char === ",") {
            trimTrailingWhitespace()
            if (indentLevel === 0 && parenDepth === 0) {
                append(options.selectorSeparatorNewline ? `,\n${currentIndent()}` : ", ")
            } else {
                append(", ")
            }
            continue
        }

        if ((char === ">" || char === "+" || char === "~") && indentLevel === 0 && parenDepth === 0) {
            trimTrailingWhitespace()
            append(options.spaceAroundCombinator ? ` ${char} ` : char)
            continue
        }

        if (char === ":" && indentLevel > 0 && parenDepth === 0) {
            trimTrailingWhitespace()
            append(": ")
            continue
        }

        append(char)
    }

    let formatted = output
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

    if (options.endWithNewline) {
        formatted = `${formatted}\n`
    }

    return formatted
}
