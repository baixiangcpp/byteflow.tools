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

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useThemePreference()
  const sonnerRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    const liveRegion = sonnerRef.current
    const queuedFeedback = drainQueuedToastFeedback()
    const previousLiveMode = liveRegion?.getAttribute("aria-live") || "polite"

    if (queuedFeedback.length > 0) {
      liveRegion?.setAttribute("aria-live", "off")
      for (const feedback of queuedFeedback) {
        const options = { id: feedback.id, description: feedback.description }
        if (feedback.type === "error") {
          toast.error(feedback.message, options)
        } else {
          toast.success(feedback.message, options)
        }
      }
    }

    setToastLiveRegionReady(true)
    if (queuedFeedback.length > 0) {
      globalThis.setTimeout(() => liveRegion?.setAttribute("aria-live", previousLiveMode), 0)
    }

    return () => {
      setToastLiveRegionReady(false)
    }
  }, [])

  return (
    <Sonner
      ref={sonnerRef}
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
