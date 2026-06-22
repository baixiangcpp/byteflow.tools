import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import taxonomy from "@/core/analytics/taxonomy.json"

const PROJECT_ROOT = process.cwd()

describe("BF-031 analytics taxonomy guard", () => {
    it("passes the repository analytics taxonomy gate", () => {
        const output = execFileSync(process.execPath, [path.join(PROJECT_ROOT, "scripts/gates/check-analytics-taxonomy.js")], {
            cwd: PROJECT_ROOT,
            encoding: "utf8",
        })

        expect(output).toContain("[check:analytics-taxonomy] OK")
    })

    it("documents a strict event and parameter allowlist", () => {
        expect(Object.keys(taxonomy.events)).toEqual([
            "tool_loaded",
            "tool_action",
            "copy_output",
            "download_output",
            "search_performed",
            "related_tool_click",
            "pwa_installed",
        ])
        expect(taxonomy.events.search_performed.allowedParams).toEqual([
            "language",
            "query_length_bucket",
            "results_count",
            "source_page",
        ])
        expect(taxonomy.forbiddenParams).toContain("search_query")
        expect(taxonomy.forbiddenParams).toContain("file_content")
        expect(taxonomy.forbiddenParams).toContain("jwt")
    })

    it("keeps privacy docs aligned with the taxonomy", () => {
        const docs = fs.readFileSync(path.join(PROJECT_ROOT, "docs/privacy/analytics-taxonomy.md"), "utf8")
        expect(docs).toContain("search_performed")
        expect(docs).toContain("query_length_bucket")
        expect(docs).toContain("Never send tool input")
        expect(docs).toContain("search query text")
    })
})
