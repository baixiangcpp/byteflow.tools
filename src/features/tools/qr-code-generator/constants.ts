import type { QrPreset } from "./types"

export const BUTTON_BASE_CLASS =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"

export const BUTTON_VARIANT_CLASS = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
} as const

export const BUTTON_SIZE_CLASS = {
    sm: "h-9 px-3",
} as const

export const DEFAULT_QR_TEXT = ""
export const SAMPLE_QR_TEXT = "https://example.com/qr?id=42"

export const PRESETS: QrPreset[] = [
    {
        id: "default",
        labelKey: "preset_default",
        size: 256,
        margin: 2,
        errorCorrectionLevel: "H",
        fgColor: "#ffffff",
        bgColor: "#0a0a1a",
        logoScale: 22,
    },
    {
        id: "print",
        labelKey: "preset_print",
        size: 320,
        margin: 3,
        errorCorrectionLevel: "Q",
        fgColor: "#111111",
        bgColor: "#ffffff",
        logoScale: 20,
    },
    {
        id: "social",
        labelKey: "preset_social",
        size: 384,
        margin: 1,
        errorCorrectionLevel: "H",
        fgColor: "#0d1b2a",
        bgColor: "#e0fbfc",
        logoScale: 24,
    },
    {
        id: "minimal",
        labelKey: "preset_minimal",
        size: 224,
        margin: 0,
        errorCorrectionLevel: "M",
        fgColor: "#171717",
        bgColor: "#f5f5f5",
        logoScale: 18,
    },
]
