/**
 * Deprecated tool banner component
 * Shows warning for deprecated tools with suggested alternatives
 */

import * as React from "react"
import { AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ToolMeta } from "@/core/registry"
import type { Locale } from "@/core/i18n/i18n"

interface DeprecatedToolBannerProps {
    tool: ToolMeta
    locale: Locale
    translations: {
        deprecated_tool: string
        deprecated_message: string
        suggested_alternatives: string
    }
    toolTranslations: Record<string, { title?: string }>
}

export function DeprecatedToolBanner({
    tool,
    locale,
    translations,
    toolTranslations,
}: DeprecatedToolBannerProps) {
    if (!tool.deprecated) {
        return null
    }

    const { alternatives, messageKey, reason } = tool.deprecated

    const reasonLabels: Record<string, string> = {
        "strategic-refocus": "Strategic Refocus",
        "low-usage": "Low Usage",
        "superseded": "Superseded",
        "external-dependency": "External Dependency",
    }

    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-semibold">
                {translations.deprecated_tool}
                {reason && (
                    <span className="ml-2 text-xs font-normal opacity-75">
                        ({reasonLabels[reason] || reason})
                    </span>
                )}
            </AlertTitle>
            <AlertDescription className="space-y-3">
                <p className="text-sm">
                    {messageKey ? translations[messageKey as keyof typeof translations] : translations.deprecated_message}
                </p>

                {alternatives && alternatives.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {translations.suggested_alternatives}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {alternatives.map((altKey) => {
                                const altTitle = toolTranslations[altKey]?.title || altKey
                                return (
                                    <Link
                                        key={altKey}
                                        href={`/${locale}/${altKey.replace(/_/g, "-")}`}
                                        className="inline-flex items-center gap-1 rounded-md bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background transition-colors"
                                    >
                                        {altTitle}
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </AlertDescription>
        </Alert>
    )
}
