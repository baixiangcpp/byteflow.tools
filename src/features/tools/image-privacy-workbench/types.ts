export type ImageMetadataScan = {
    bytes: number
    mime: string
    hasExif: boolean
    hasGpsHint: boolean
    hints: string[]
}

export type ImagePrivacyExport = {
    dataUrl: string
    before: ImageMetadataScan
    after: ImageMetadataScan
    width: number
    height: number
}

export type ScreenshotRedactionStep = {
    title: string
    detail: string
}

