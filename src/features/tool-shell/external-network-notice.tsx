import { ExternalLink } from "lucide-react"
import type { ToolNetworkAccess } from "@/core/registry/types"

type ExternalNetworkNoticeProps = {
    networkAccess: ToolNetworkAccess
}

export function ExternalNetworkNotice({ networkAccess }: ExternalNetworkNoticeProps) {
    if (networkAccess === "none") return null

    const message = networkAccess === "third_party_api"
        ? "This tool may contact a third-party service from your browser as part of its workflow."
        : "This tool may request or open a URL you provide from your browser when you explicitly run that action."

    return (
        <section className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
            <div className="flex gap-3">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                    <p className="font-medium">External network notice</p>
                    <p className="mt-1 text-muted-foreground">{message}</p>
                </div>
            </div>
        </section>
    )
}
