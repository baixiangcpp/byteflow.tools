export type BarcodeFormat = "CODE128" | "EAN13"
export type BarcodeErrorKey =
    | "input_required"
    | "ean13_invalid_checksum"
    | "ean13_length"
    | "code128_ascii_only"
    | "code128_too_long"

const EAN13_WEIGHT_ODD = 1
const EAN13_WEIGHT_EVEN = 3

function digitsOnly(value: string): string {
    return value.replace(/\D/g, "")
}

export function computeEan13CheckDigit(base12: string): string {
    if (!/^\d{12}$/.test(base12)) {
        throw new Error("EAN-13 check digit requires exactly 12 digits.")
    }

    let weightedSum = 0
    for (let i = 0; i < base12.length; i += 1) {
        const digit = Number(base12[i])
        const weight = i % 2 === 0 ? EAN13_WEIGHT_ODD : EAN13_WEIGHT_EVEN
        weightedSum += digit * weight
    }

    const remainder = weightedSum % 10
    const check = (10 - remainder) % 10
    return String(check)
}

export function isValidEan13(value: string): boolean {
    const normalized = digitsOnly(value)
    if (!/^\d{13}$/.test(normalized)) return false
    return computeEan13CheckDigit(normalized.slice(0, 12)) === normalized[12]
}

export function normalizeBarcodeValue(
    value: string,
    format: BarcodeFormat,
): { normalized: string; errorKey: BarcodeErrorKey | null } {
    const raw = value.trim()
    if (!raw) return { normalized: "", errorKey: "input_required" }

    if (format === "EAN13") {
        const numeric = digitsOnly(raw)
        if (numeric.length === 12) {
            return {
                normalized: `${numeric}${computeEan13CheckDigit(numeric)}`,
                errorKey: null,
            }
        }
        if (numeric.length === 13) {
            if (!isValidEan13(numeric)) {
                return { normalized: numeric, errorKey: "ean13_invalid_checksum" }
            }
            return { normalized: numeric, errorKey: null }
        }
        return { normalized: numeric, errorKey: "ean13_length" }
    }

    if (!/^[\x20-\x7E]+$/.test(raw)) {
        return { normalized: raw, errorKey: "code128_ascii_only" }
    }
    if (raw.length > 80) {
        return { normalized: raw, errorKey: "code128_too_long" }
    }

    return { normalized: raw, errorKey: null }
}
