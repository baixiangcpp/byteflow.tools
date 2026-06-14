import type { SeparatorKey } from "./types"

export const STORAGE_KEY = "byteflow.password_generator.presets.v1"
export const MAX_CUSTOM_PRESETS = 8

export const SEPARATOR_MAP: Record<SeparatorKey, string> = {
    space: " ",
    hyphen: "-",
    underscore: "_",
    dot: ".",
}
