type Monaco = typeof import("monaco-editor")

export const BYTEFLOW_MONACO_DARK_THEME = "byteflow-dark"
export const BYTEFLOW_MONACO_LIGHT_THEME = "byteflow-light"

let themesRegistered = false

export function ensureByteflowMonacoThemes(monaco: Monaco) {
    if (themesRegistered) return

    monaco.editor.defineTheme(BYTEFLOW_MONACO_DARK_THEME, {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#020817",
            "editor.lineHighlightBackground": "#0f172a",
        },
    })

    monaco.editor.defineTheme(BYTEFLOW_MONACO_LIGHT_THEME, {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#ffffff",
            "editor.lineHighlightBackground": "#f8fafc",
        },
    })

    themesRegistered = true
}

export function getByteflowMonacoThemeName(theme: string | undefined) {
    return theme === "light" ? BYTEFLOW_MONACO_LIGHT_THEME : BYTEFLOW_MONACO_DARK_THEME
}
