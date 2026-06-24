import type { ImageMetadataScan } from "./types"

function decodeAscii(bytes: Uint8Array): string {
    let output = ""
    const limit = Math.min(bytes.length, 512 * 1024)
    for (let index = 0; index < limit; index += 1) {
        const byte = bytes[index]
        output += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "."
    }
    return output
}

export function scanImageMetadata(bytes: Uint8Array, mime: string): ImageMetadataScan {
    const text = decodeAscii(bytes)
    const hasExif = text.includes("Exif") || text.includes("http://ns.adobe.com/xap/") || text.includes("XMP")
    const hasGpsHint = /GPS|Latitude|Longitude|MapDatum|GPSInfo/i.test(text)
    const hints: string[] = []
    if (hasExif) hints.push("Metadata marker detected. Re-encode before sharing.")
    if (hasGpsHint) hints.push("Possible GPS/location marker detected.")
    if (/Photoshop|GIMP|Lightroom|iPhone|Android|Camera/i.test(text)) hints.push("Editor or device marker detected.")
    return {
        bytes: bytes.byteLength,
        mime,
        hasExif,
        hasGpsHint,
        hints,
    }
}

export function formatMetadataScan(scan: ImageMetadataScan): string {
    return [
        `MIME: ${scan.mime}`,
        `Bytes: ${scan.bytes}`,
        `Metadata marker: ${scan.hasExif ? "detected" : "not detected"}`,
        `GPS hint: ${scan.hasGpsHint ? "detected" : "not detected"}`,
        ...scan.hints.map((hint) => `- ${hint}`),
    ].join("\n")
}

export function runTool(input: string): string {
    return input
}
