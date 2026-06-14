import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("color converter route entry wiring", () => {
    it("keeps the route entry as a thin wrapper", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/color-converter/page.tsx"), "utf8")

        expect(source).toContain('import { ColorConverterPage } from "@/features/tools/color-converter/page"')
        expect(source).toContain("export default function ColorConverterRoutePage()")
        expect(source).toContain('"use client"')
        expect(source).not.toContain("initialMode")
    })

    it("does not keep duplicate color-converter entry routes around", () => {
        expect(fs.existsSync(path.join(process.cwd(), "src/app/[lang]/hex-to-rgba-converter/page.tsx"))).toBe(false)
        expect(fs.existsSync(path.join(process.cwd(), "src/app/[lang]/rgba-to-hex-converter/page.tsx"))).toBe(false)
    })
})
