import * as beautify from "js-beautify"

const DEFAULT_JS_FORMAT_OPTIONS = {
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 2,
    wrap_line_length: 80,
    break_chained_methods: true,
    space_in_empty_paren: true,
    end_with_newline: true,
} as const

export function formatJavascript(input: string): string {
    if (!input.trim()) return ""

    const beautifyModule = beautify as unknown as {
        default?: {
            js?: (code: string, options: typeof DEFAULT_JS_FORMAT_OPTIONS) => string
            js_beautify?: (code: string, options: typeof DEFAULT_JS_FORMAT_OPTIONS) => string
        }
        ["module.exports"]?: {
            js?: (code: string, options: typeof DEFAULT_JS_FORMAT_OPTIONS) => string
            js_beautify?: (code: string, options: typeof DEFAULT_JS_FORMAT_OPTIONS) => string
        }
        js?: (code: string, options: typeof DEFAULT_JS_FORMAT_OPTIONS) => string
        js_beautify?: (code: string, options: typeof DEFAULT_JS_FORMAT_OPTIONS) => string
    }

    const formatFn =
        beautifyModule.js ||
        beautifyModule.js_beautify ||
        beautifyModule.default?.js ||
        beautifyModule.default?.js_beautify ||
        beautifyModule["module.exports"]?.js ||
        beautifyModule["module.exports"]?.js_beautify

    if (typeof formatFn !== "function") {
        throw new Error("JAVASCRIPT_FORMATTER_UNAVAILABLE")
    }

    const formatted = formatFn(input, DEFAULT_JS_FORMAT_OPTIONS)
    return formatted.endsWith("\n") ? formatted : `${formatted}\n`
}
