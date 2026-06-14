import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function readSource(relativePath: string) {
    return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

function collectSourceFiles(dirPath: string): string[] {
    return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
        const absolutePath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
            return collectSourceFiles(absolutePath)
        }

        return absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx") ? [absolutePath] : []
    })
}

describe("theme runtime guard", () => {
    it("keeps next-themes out of the source tree", () => {
        const sourceFiles = collectSourceFiles(path.join(process.cwd(), "src"))

        for (const sourceFile of sourceFiles) {
            const source = fs.readFileSync(sourceFile, "utf8")
            expect(source, sourceFile).not.toContain("next-themes")
        }
    })

    it("wires the theme toggle and toaster to the local preference hook", () => {
        const themeToggleSource = readSource("src/components/layout/theme-toggle.tsx")
        const toasterSource = readSource("src/components/ui/sonner.tsx")

        expect(themeToggleSource).toContain('import { type ThemePreference, useThemePreference } from "@/hooks/use-theme-preference"')
        expect(themeToggleSource).toContain("const { theme, setTheme } = useThemePreference()")
        expect(themeToggleSource).toContain("DropdownMenuCheckboxItem")
        expect(themeToggleSource).toContain("checked={isSelected}")
        expect(themeToggleSource).toContain('className={cn(isSelected && "bg-accent text-accent-foreground")}')
        expect(themeToggleSource).toContain("t.common.theme_toggle")
        expect(themeToggleSource).toContain("t.common[option.labelKey]")
        expect(toasterSource).toContain('import { useThemePreference } from "@/hooks/use-theme-preference"')
        expect(toasterSource).toContain("const { resolvedTheme } = useThemePreference()")
    })
})
