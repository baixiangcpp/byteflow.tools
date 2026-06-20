"use client"

import { ShieldCheck } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"

export function PrivacyBadge() {
  const { t } = useLang()
  const privacyT = t.common.privacy_badge as Record<string, string> | undefined

  const tooltipText = [
    privacyT?.title || "Privacy-first",
    "",
    privacyT?.description || "This tool processes input in your browser. External-request tools disclose when a network call is needed.",
    "",
    privacyT?.check1 || "No tool input upload for local tools",
    privacyT?.check2 || "✓ Open source & auditable",
    privacyT?.check3 || "Verify behavior in DevTools Network"
  ].join("\n")

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground
                 hover:text-primary cursor-help transition-colors"
      title={tooltipText}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span>{privacyT?.label || "Browser-local"}</span>
    </span>
  )
}
