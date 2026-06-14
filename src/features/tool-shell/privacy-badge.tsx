"use client"

import { ShieldCheck } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"

export function PrivacyBadge() {
  const { t } = useLang()
  const privacyT = t.common.privacy_badge as Record<string, string> | undefined

  const tooltipText = [
    privacyT?.title || "🛡️ Privacy First",
    "",
    privacyT?.description || "This tool runs entirely in your browser. Your input is never uploaded.",
    "",
    privacyT?.check1 || "✓ No input upload",
    privacyT?.check2 || "✓ Open source & auditable",
    privacyT?.check3 || "✓ Processed locally in your browser"
  ].join("\n")

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground
                 hover:text-primary cursor-help transition-colors"
      title={tooltipText}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>{privacyT?.label || "Runs Locally"}</span>
    </span>
  )
}
