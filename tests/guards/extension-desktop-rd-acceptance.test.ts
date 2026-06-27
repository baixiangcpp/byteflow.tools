import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const PROTOTYPE_DIR = "prototypes/browser-extension-launcher"

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("extension and desktop R&D acceptance", () => {
    it("documents the decision, compared options, privacy model, permissions, MVP, and prototype", () => {
        const doc = read("docs/growth/distribution-research.md")

        for (const phrase of [
            "PWA-only",
            "Browser extension",
            "desktop wrapper",
            "Clipboard Privacy Model",
            "No clipboard content leaves the device.",
            "Permissions",
            "MVP Scope",
            "Prototype Evidence",
            "prototypes/browser-extension-launcher/",
        ]) {
            expect(doc).toContain(phrase)
        }

        expect(doc).toContain("Remain PWA-first")
        expect(doc).toContain("no payload sync")
        expect(doc).toContain("no server-side tool payload processing")
    })

    it("keeps the extension launcher permissionless", () => {
        const manifest = JSON.parse(read(`${PROTOTYPE_DIR}/manifest.json`)) as {
            manifest_version: number
            permissions?: string[]
            host_permissions?: string[]
            action?: { default_popup?: string }
            background?: unknown
            content_scripts?: unknown
        }

        expect(manifest.manifest_version).toBe(3)
        expect(manifest.action?.default_popup).toBe("popup.html")
        expect(manifest.permissions ?? []).toEqual([])
        expect(manifest.host_permissions ?? []).toEqual([])
        expect(manifest.background).toBeUndefined()
        expect(manifest.content_scripts).toBeUndefined()
    })

    it("demonstrates opening at least five common tools from the popup", () => {
        const popup = read(`${PROTOTYPE_DIR}/popup.html`)
        const toolLinks = [...popup.matchAll(/<a\b[^>]*class="tool-link"[^>]*href="([^"]+)"[^>]*data-tool-slug="([^"]+)"/g)]
            .map((match) => ({ href: match[1], slug: match[2] }))

        expect(toolLinks.length).toBeGreaterThanOrEqual(5)
        expect(toolLinks.map((link) => link.slug)).toEqual(expect.arrayContaining([
            "json-formatter",
            "base64-encode-decode",
            "jwt-decoder",
            "regex-tester",
            "url-encode-decode",
        ]))

        for (const link of toolLinks) {
            expect(link.href).toBe(`https://byteflow.tools/en/${link.slug}`)
        }
    })

    it("does not include clipboard exfiltration, network, storage, messaging, or background collection APIs", () => {
        const prototypeFiles = [
            `${PROTOTYPE_DIR}/manifest.json`,
            `${PROTOTYPE_DIR}/popup.html`,
            `${PROTOTYPE_DIR}/README.md`,
        ]
        const combined = prototypeFiles.map(read).join("\n")

        for (const forbidden of [
            /\bnavigator\.clipboard\b/i,
            /\bclipboardRead\b/i,
            /\bclipboardWrite\b/i,
            /\bfetch\s*\(/i,
            /\bXMLHttpRequest\b/i,
            /\bsendBeacon\b/i,
            /\bchrome\.runtime\.sendMessage\b/i,
            /\bchrome\.storage\b/i,
            /\bchrome\.tabs\b/i,
            /\bcontent_scripts\b/i,
            /\bservice_worker\b/i,
        ]) {
            expect(combined).not.toMatch(forbidden)
        }
    })
})
