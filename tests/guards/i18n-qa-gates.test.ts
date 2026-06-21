import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"

const PROJECT_ROOT = process.cwd()

function runNodeScript(scriptPath: string, env: Record<string, string | undefined> = {}, cwd = PROJECT_ROOT) {
    return execFileSync(process.execPath, [path.join(PROJECT_ROOT, scriptPath)], {
        cwd,
        env: {
            ...process.env,
            ...env,
        },
        encoding: "utf8",
    })
}

function writeHtml(filePath: string, html: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, html)
}

function alternateLinks(slug: string) {
    return [
        ...LOCALES.map((locale) => `<link rel="alternate" hrefLang="${locale}" href="https://byteflow.tools/${locale}/${slug}" />`),
        `<link rel="alternate" hrefLang="x-default" href="https://byteflow.tools/en/${slug}" />`,
    ].join("\n")
}

describe("BF-029 i18n QA gates", () => {
    it("passes the repository i18n QA gate", () => {
        const output = runNodeScript("scripts/gates/check-i18n-qa.js")

        expect(output).toContain("[check:i18n-qa] OK")
    })

    it("checks nested localized routes in canonical and hreflang gates", () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "byteflow-i18n-gate-"))
        const slug = "how-to/decode-jwt-locally"

        try {
            for (const locale of LOCALES) {
                writeHtml(
                    path.join(tempDir, locale, "how-to", "decode-jwt-locally.html"),
                    [
                        "<!doctype html><html><head>",
                        `<link rel="canonical" href="https://byteflow.tools/${locale}/${slug}" />`,
                        alternateLinks(slug),
                        "</head><body>Nested page</body></html>",
                    ].join("\n"),
                )
            }

            const canonicalOutput = runNodeScript("scripts/gates/check-canonical.js", {
                CANONICAL_SCAN_DIR: tempDir,
            })
            const hreflangOutput = runNodeScript("scripts/gates/check-hreflang.js", {
                HREFLANG_SCAN_DIR: tempDir,
            })

            expect(canonicalOutput).toContain("OK: 7 page(s) verified")
            expect(hreflangOutput).toContain("OK: 7 page(s) verified")
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
    })

    it("fails metadata localization when a localized description is empty", () => {
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "byteflow-metadata-gate-"))
        const appDir = path.join(tempRoot, ".next", "server", "app")

        try {
            writeHtml(
                path.join(appDir, "en", "json-formatter.html"),
                "<!doctype html><title>JSON Formatter</title><meta name=\"description\" content=\"Format JSON locally.\">",
            )
            writeHtml(
                path.join(appDir, "zh-CN", "json-formatter.html"),
                "<!doctype html><title>JSON 格式化工具</title><meta name=\"description\" content=\"\">",
            )

            expect(() => runNodeScript("scripts/gates/check-metadata-localization.js", {
            }, tempRoot)).toThrow(/description/)
        } finally {
            fs.rmSync(tempRoot, { recursive: true, force: true })
        }
    })
})
