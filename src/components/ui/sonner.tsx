"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import * as React from "react"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { drainQueuedToastFeedback, setToastLiveRegionReady } from "@/core/feedback/toast-live-region-state"
import { useThemePreference } from "@/hooks/use-theme-preference"
import { useVisualViewportRect } from "@/hooks/use-visual-viewport-rect"

const Toaster = ({ className, style, ...props }: ToasterProps) => {
  const { resolvedTheme } = useThemePreference()
  const visualViewportRect = useVisualViewportRect()
  const sonnerRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    const liveRegion = sonnerRef.current
    const queuedFeedback = drainQueuedToastFeedback()
    const previousLiveMode = liveRegion?.getAttribute("aria-live") || "polite"
    const replay = (feedback: (typeof queuedFeedback)[number]) => {
      const options = { id: feedback.id, description: feedback.description }
      if (feedback.type === "error") {
        toast.error(feedback.message, options)
      } else {
        toast.success(feedback.message, options)
      }
    }

    if (queuedFeedback.length > 0) {
      liveRegion?.setAttribute("aria-live", "off")
      queuedFeedback.forEach(replay)
    }

    setToastLiveRegionReady(true)
    if (queuedFeedback.length > 0) {
      globalThis.setTimeout(() => {
        if (liveRegion?.isConnected) liveRegion.setAttribute("aria-live", previousLiveMode)
      }, 0)
    }

    return () => {
      setToastLiveRegionReady(false)
    }
  }, [])

  return (
    <div
      data-toast-visual-viewport
      className={visualViewportRect
        ? "pointer-events-none fixed z-[999999999]"
        : "pointer-events-none fixed inset-0 z-[999999999]"}
      style={visualViewportRect || undefined}
    >
      <Sonner
        ref={sonnerRef}
        theme={resolvedTheme as ToasterProps["theme"]}
        className={["toaster group pointer-events-auto", className].filter(Boolean).join(" ")}
        icons={{
          success: <CircleCheckIcon className="size-4" />,
          info: <InfoIcon className="size-4" />,
          warning: <TriangleAlertIcon className="size-4" />,
          error: <OctagonXIcon className="size-4" />,
          loading: <Loader2Icon className="size-4 animate-spin" />,
        }}
        style={
          {
            position: "absolute",
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
            ...style,
          } as React.CSSProperties
        }
        {...props}
      />
    </div>
  )
}

export { Toaster }
