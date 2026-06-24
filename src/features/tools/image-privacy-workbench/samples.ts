export const SAMPLE_INPUT = "Load a PNG or JPEG screenshot. The workbench re-encodes it locally to strip metadata and guides the safe redaction order."

export const SCREENSHOT_REDACTION_STEPS = [
    {
        title: "Redact visible secrets first",
        detail: "Cover tokens, email addresses, account names, URLs, and customer data before resizing or compressing.",
    },
    {
        title: "Remove metadata by re-encoding",
        detail: "Export through canvas as PNG or JPEG to drop EXIF, camera, GPS, and editor metadata from supported browser decoders.",
    },
    {
        title: "Inspect the exported file",
        detail: "Check the after scan for EXIF markers and download only the sanitized output.",
    },
]

