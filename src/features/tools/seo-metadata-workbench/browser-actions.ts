export function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
}
