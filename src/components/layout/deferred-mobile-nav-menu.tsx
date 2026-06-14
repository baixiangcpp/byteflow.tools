"use client"

import * as React from "react"
import dynamic from "next/dynamic"

const NavbarMobileMenu = dynamic(
    () => import("./navbar-mobile-menu").then((mod) => mod.NavbarMobileMenu),
)

export function DeferredMobileNavMenu({
    menuLabel,
}: {
    menuLabel: string
}) {
    const [isMounted, setIsMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)

    const mountMenu = React.useCallback(() => {
        React.startTransition(() => {
            setIsMounted(true)
        })
        setIsOpen(true)
    }, [])

    if (isMounted) {
        return <NavbarMobileMenu open={isOpen} onOpenChange={setIsOpen} />
    }

    return (
        <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-sm font-medium transition-[color,background-color,border-color,box-shadow,opacity,transform] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 lg:hidden dark:hover:bg-accent/50"
            onClick={mountMenu}
        >
            <span aria-hidden="true" className="flex flex-col items-center justify-center gap-1">
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
                <span className="block h-0.5 w-4 rounded-full bg-current" />
            </span>
            <span className="sr-only">{menuLabel}</span>
        </button>
    )
}
