import type { ScanEnhanceConfig } from "./utils"

export type ScanEnhanceTaskInput = {
    source: string
    enhance: ScanEnhanceConfig
}

export type ScanEnhanceTaskResult = {
    mime: "image/jpeg"
    bytes: ArrayBuffer
    width: number
    height: number
}
