import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("navbar performance guard", () => {
    it("keeps language and theme controls behind a deferred wrapper", () => {
        const navbarSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/navbar.tsx"), "utf8")
        const serverSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/server-navbar.tsx"), "utf8")
        const deferredSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/deferred-navbar-controls.tsx"), "utf8")

        expect(navbarSource).toContain('import { DeferredNavbarControls } from "./deferred-navbar-controls"')
        expect(navbarSource).toContain("<DeferredNavbarControls />")
        expect(navbarSource).not.toContain('"use client"')
        expect(navbarSource).not.toContain('import { LanguageSwitcher } from "./language-switcher"')
        expect(navbarSource).not.toContain('import { ThemeToggle } from "./theme-toggle"')
        expect(navbarSource).not.toContain('usePathname')
        expect(navbarSource).not.toContain('useLang')

        expect(serverSource).toContain('import { Navbar } from "./navbar"')
        expect(serverSource).toContain('lang={lang}')
        expect(serverSource).toContain('translations.nav.search')

        expect(deferredSource).toContain('const LanguageSwitcher = dynamic(')
        expect(deferredSource).toContain('const ThemeToggle = dynamic(')
        expect(deferredSource).toContain('import("./language-switcher")')
        expect(deferredSource).toContain('import("./theme-toggle")')
        expect(deferredSource).toContain('useDeferredMount({ delayMs: 1200, activateOnInteraction: true })')
    })

    it("keeps the mobile navigation drawer behind a deferred wrapper", () => {
        const navbarSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/navbar.tsx"), "utf8")
        const deferredSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/deferred-mobile-nav-menu.tsx"), "utf8")
        const mobileMenuSource = fs.readFileSync(path.join(process.cwd(), "src/components/layout/navbar-mobile-menu.tsx"), "utf8")

        expect(navbarSource).toContain('import { DeferredMobileNavMenu } from "./deferred-mobile-nav-menu"')
        expect(navbarSource).toContain('<DeferredMobileNavMenu menuLabel={labels.openNavigation} />')
        expect(navbarSource).not.toContain('from "@/components/ui/sheet"')
        expect(navbarSource).toContain("data-command-palette-trigger")

        expect(deferredSource).toContain('const NavbarMobileMenu = dynamic(')
        expect(deferredSource).toContain('import("./navbar-mobile-menu")')
        expect(deferredSource).toContain("React.startTransition(() => {")
        expect(deferredSource).toContain("setIsOpen(true)")
        expect(deferredSource).not.toContain("onSearch")

        expect(mobileMenuSource).toContain("prefetch={false}")
        expect(mobileMenuSource).toContain("<SheetContent")
        expect(mobileMenuSource).toContain("data-command-palette-trigger")
    })
})
