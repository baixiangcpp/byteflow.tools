export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H"

export type QrPreset = {
    id: string
    labelKey: string
    size: number
    margin: number
    errorCorrectionLevel: ErrorCorrectionLevel
    fgColor: string
    bgColor: string
    logoScale: number
}
