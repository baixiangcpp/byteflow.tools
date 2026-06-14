"use client"

import dynamic from "next/dynamic"
import { useDeferredMount } from "@/hooks/use-deferred-mount"

const NewsletterCTA = dynamic(
    () => import("@/features/newsletter/components/newsletter-cta").then((mod) => mod.NewsletterCTA),
    { ssr: false },
)

export function DeferredNewsletterCTA() {
    const isMounted = useDeferredMount({ delayMs: 2000 })

    return isMounted ? <NewsletterCTA /> : null
}
