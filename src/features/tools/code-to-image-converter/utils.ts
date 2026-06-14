export type CodeImageTheme = "dark" | "light"

const FONT_WIDTH_RATIO = 0.62
const LINE_HEIGHT_RATIO = 1.6

export function splitCodeLines(input: string): string[] {
    if (!input) return [""]
    return input.replace(/\r\n/g, "\n").split("\n")
}

export function estimateCanvasSize(lines: string[], fontSize: number, padding: number): { width: number; height: number } {
    const maxLineLength = lines.reduce((max, line) => Math.max(max, line.length), 0)
    const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO)
    const width = Math.max(320, Math.ceil(maxLineLength * fontSize * FONT_WIDTH_RATIO + padding * 2))
    const height = Math.max(180, lines.length * lineHeight + padding * 2)
    return { width, height }
}

export function renderCodeToPngDataUrl({
    code,
    theme,
    fontSize,
    padding = 24,
}: {
    code: string
    theme: CodeImageTheme
    fontSize: number
    padding?: number
}): string {
    if (typeof document === "undefined") {
        throw new Error("Code-to-image rendering requires a browser environment.")
    }

    const lines = splitCodeLines(code)
    const lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO)
    const { width, height } = estimateCanvasSize(lines, fontSize, padding)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) {
        throw new Error("Unable to create canvas context.")
    }

    const darkTheme = {
        background: "#0b1220",
        text: "#e2e8f0",
    }

    const lightTheme = {
        background: "#f8fafc",
        text: "#0f172a",
    }

    const palette = theme === "dark" ? darkTheme : lightTheme

    context.fillStyle = palette.background
    context.fillRect(0, 0, width, height)

    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
    context.textBaseline = "top"
    context.fillStyle = palette.text

    lines.forEach((line, index) => {
        const y = padding + index * lineHeight
        context.fillText(line, padding, y)
    })

    return canvas.toDataURL("image/png")
}
