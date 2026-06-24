import type { ImageFilterConfig } from "@/core/utils/image-edit-utils"
import type { CensorMode, CensorRectPercent } from "@/features/tools/photo-censor/utils"

export type ImageEditTaskInput =
    | {
          operation: "filter"
          source: string
          filters: ImageFilterConfig
          maxWidth?: number
      }
    | {
          operation: "crop"
          source: string
          crop: { x: number; y: number; width: number; height: number }
      }
    | {
          operation: "censor"
          source: string
          rect: CensorRectPercent
          mode: CensorMode
          intensity: number
      }

export type ImageEditTaskResult = {
    dataUrl: string
    width: number
    height: number
    metadata: string
}
