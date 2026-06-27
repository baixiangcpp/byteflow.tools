import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("integration R&D acceptance", () => {
    it("documents the compared options, workflows, privacy model, MVP, and prototype", () => {
        const doc = read("docs/growth/integration-rd.md")

        for (const phrase of [
            "VS Code extension",
            "CLI",
            "Local API",
            "Self-host automation",
            "Top Integration Workflows",
            "Privacy/security model",
            "MVP Scope",
            "Prototype Evidence",
            "json-format",
        ]) {
            expect(doc).toContain(phrase)
        }

        expect((doc.match(/^\d\./gm) ?? []).length).toBeGreaterThanOrEqual(5)
    })

    it("keeps the prototype local-only and self-hosting docs aligned", () => {
        const cli = read("scripts/prototypes/byteflow-local-cli.mjs")
        const selfHosting = read("docs/deployment/self-hosting.md")

        expect(cli).toContain("readStdin")
        expect(cli).toContain("process.stdout.write")
        expect(cli).not.toMatch(/\bfetch\s*\(/)
        expect(cli).not.toContain("XMLHttpRequest")
        expect(cli).not.toContain("sendBeacon")
        expect(cli).not.toContain("createServer")
        expect(selfHosting).toContain("byteflow-local-cli.mjs")
        expect(selfHosting).toContain("do not expose it as a hosted payload-processing endpoint")
    })
})
