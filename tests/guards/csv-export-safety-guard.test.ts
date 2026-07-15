import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const SOURCE_ROOT = path.join(ROOT, "src")

const CSV_DOWNLOAD_SURFACES = [
    "src/features/tool-templates/focused-hash-tool-page.tsx",
    "src/features/tools/csv-json-converter/page.tsx",
    "src/features/tools/hash-generator/page.tsx",
    "src/features/tools/local-log-parser/page.tsx",
    "src/features/tools/twitter-ad-revenue-generator/page.tsx",
    "src/features/tools/uuid-generator/page.tsx",
]

const CSV_BUILDERS = [
    "src/features/tool-templates/focused-hash-tool-page.tsx",
    "src/features/tools/csv-json-converter/logic.ts",
    "src/features/tools/hash-generator/page.tsx",
    "src/features/tools/local-log-parser/utils.ts",
    "src/features/tools/twitter-ad-revenue-generator/utils.ts",
    "src/features/tools/uuid-generator/page.tsx",
]

function listSourceFiles(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const absolutePath = path.join(directory, entry.name)
        if (entry.isDirectory()) return listSourceFiles(absolutePath)
        return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : []
    })
}

function read(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("CSV export safety guard", () => {
    it("tracks every source file that initiates a CSV download", () => {
        const discovered = listSourceFiles(SOURCE_ROOT)
            .filter((file) => {
                const source = fs.readFileSync(file, "utf8")
                return source.includes("text/csv")
                    || (source.includes(".csv") && (
                        source.includes("downloadTextFile(")
                        || /\.download\s*=/.test(source)
                    ))
            })
            .map((file) => path.relative(ROOT, file).replaceAll(path.sep, "/"))
            .sort()

        expect(discovered, "Audit new CSV download surfaces and add them to the shared serializer.")
            .toEqual(CSV_DOWNLOAD_SURFACES)
    })

    it("routes every CSV builder through the spreadsheet-safe serializer", () => {
        for (const file of CSV_BUILDERS) {
            expect(read(file), file).toContain("serializeSpreadsheetSafeCsv(")
        }

        expect(read("src/features/tools/csv-json-converter/page.tsx"))
            .toContain("{toolT.spreadsheet_safe_note}")
    })
})
