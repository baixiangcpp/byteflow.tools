"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import * as React from "react"
import { Toaster as Sonner, useSonner, type ToasterProps } from "sonner"
import { useThemePreference } from "@/hooks/use-theme-preference"

function toastNodeToText(value: React.ReactNode | (() => React.ReactNode)): string {
  if (value === null || value === undefined || typeof value === "boolean") return ""
  if (typeof value === "function") return toastNodeToText(value())
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return String(value)
  if (Array.isArray(value)) return value.map(toastNodeToText).filter(Boolean).join(" ")
  if (React.isValidElement(value)) {
    return toastNodeToText((value.props as { children?: React.ReactNode }).children)
  }
  return ""
}

function ToastLiveRegion() {
  const { toasts } = useSonner()
  const latestToast = toasts.find((toast) => !toast.delete)
  const message = latestToast
    ? [toastNodeToText(latestToast.title), toastNodeToText(latestToast.description)].filter(Boolean).join(". ")
    : ""

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-toast-live-region>
      {message}
    </div>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useThemePreference()

  return (
    <>
      <ToastLiveRegion />
      <Sonner
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
    </>
  )
}

export { Toaster }
