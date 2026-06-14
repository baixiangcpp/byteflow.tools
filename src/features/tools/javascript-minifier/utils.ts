import { minify } from "terser"

const DEFAULT_JS_MINIFY_OPTIONS = {
    compress: {
        passes: 2,
    },
    mangle: true,
    format: {
        comments: false,
    },
} as const

export async function minifyJavascript(input: string): Promise<string> {
    if (!input.trim()) return ""

    const result = await minify(input, DEFAULT_JS_MINIFY_OPTIONS)
    return result.code ?? ""
}
