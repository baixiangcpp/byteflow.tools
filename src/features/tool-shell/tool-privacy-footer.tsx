import { ShieldCheck, Github, Info } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLang } from "@/core/i18n/lang-provider"
import { getToolSourceUrl, isRouteSourceToolSlug } from "@/core/registry/tool-source"
import { getClientToolBySlug } from "@/generated/client-tool-lookup"

function getToolSlugFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean)
  return segments.length >= 2 ? segments[1] : null
}

export function ToolPrivacyFooter() {
  const { t, lang } = useLang()
  const pathname = usePathname()
  const footerT = t.common.privacy_footer as Record<string, string> | undefined
  const slug = getToolSlugFromPathname(pathname)

  if (!slug || (!getClientToolBySlug(slug) && !isRouteSourceToolSlug(slug))) {
    return null
  }

  return (
    <div className="mt-12 pt-6 border-t space-y-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
          <span>
            <strong className="text-foreground">
              {footerT?.privacy_label || "Privacy"}:
            </strong>{" "}
            {footerT?.privacy_text || "Runs locally in your browser"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Github className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong className="text-foreground">
              {footerT?.opensource_label || "Open Source"}:
            </strong>{" "}
            <Link
              href={getToolSourceUrl(slug)}
              className="hover:text-primary underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              {footerT?.opensource_text || "Verify on GitHub"}
            </Link>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong className="text-foreground">
              {footerT?.verify_label || "How to verify"}:
            </strong>{" "}
            <Link
              href={`/${lang}/about#privacy`}
              className="hover:text-primary underline underline-offset-4"
            >
              {footerT?.verify_text || "Open DevTools Network panel"}
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}
