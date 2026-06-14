export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function downloadTextFile(content: string, filename: string) {
    downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), filename)
}
