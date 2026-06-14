export async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ""))
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
    })
}

export async function loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error("Failed to load image"))
        image.src = src
    })
}

export async function getImageDataForAnalysis(src: string, maxSize = 240): Promise<ImageData> {
    const image = await loadImageElement(src)
    const ratio = Math.min(1, maxSize / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * ratio))
    const height = Math.max(1, Math.round(image.height * ratio))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext("2d")
    if (!context) throw new Error("2D canvas context unavailable")
    context.drawImage(image, 0, 0, width, height)
    return context.getImageData(0, 0, width, height)
}

export function createDemoImageDataUrl(width = 960, height = 540): string {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) return ""

    const gradient = context.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#22d3ee")
    gradient.addColorStop(0.45, "#6366f1")
    gradient.addColorStop(1, "#0f172a")
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    context.globalAlpha = 0.35
    context.fillStyle = "#facc15"
    context.beginPath()
    context.arc(width * 0.2, height * 0.2, height * 0.12, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = "#34d399"
    context.fillRect(width * 0.56, height * 0.18, width * 0.32, height * 0.22)

    context.fillStyle = "#0ea5e9"
    context.fillRect(width * 0.12, height * 0.58, width * 0.28, height * 0.2)
    context.globalAlpha = 1

    return canvas.toDataURL("image/png")
}
