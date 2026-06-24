import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"

const PROJECT_ROOT = process.cwd()

function readJpegDimensions(filePath: string) {
    const buffer = fs.readFileSync(filePath)
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        throw new Error(`${filePath} is not a JPEG`)
    }

    let offset = 2
    while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
            offset += 1
            continue
        }

        const marker = buffer[offset + 1]
        const length = buffer.readUInt16BE(offset + 2)
        if (marker >= 0xc0 && marker <= 0xc3) {
            return {
                width: buffer.readUInt16BE(offset + 7),
                height: buffer.readUInt16BE(offset + 5),
            }
        }
        offset += 2 + length
    }

    throw new Error(`Could not read JPEG dimensions for ${filePath}`)
}

describe("BF-030 OG image coverage", () => {
    it("keeps localized default share images at social-card dimensions", () => {
        for (const locale of LOCALES) {
            const imagePath = path.join(PROJECT_ROOT, "public", "og", "default", `${locale}.jpg`)
            expect(fs.existsSync(imagePath), imagePath).toBe(true)
            expect(readJpegDimensions(imagePath)).toEqual({ width: 1200, height: 630 })
            expect(fs.statSync(imagePath).size, imagePath).toBeLessThanOrEqual(250_000)
        }
    })

    it("keeps representative localized tool share images at social-card dimensions", () => {
        for (const locale of LOCALES) {
            const imagePath = path.join(PROJECT_ROOT, "public", "og", "tools", locale, "json-formatter.jpg")
            expect(fs.existsSync(imagePath), imagePath).toBe(true)
            expect(readJpegDimensions(imagePath)).toEqual({ width: 1200, height: 630 })
        }
    })

    it("passes the OG image gate", () => {
        const output = execFileSync(process.execPath, [path.join(PROJECT_ROOT, "scripts/gates/check-og-tool-images.js")], {
            cwd: PROJECT_ROOT,
            encoding: "utf8",
        })

        expect(output).toContain("[check:og-tool-images] OK")
        expect(output).not.toContain("stale")
    }, 45_000)
})
