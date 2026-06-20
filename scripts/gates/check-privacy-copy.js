import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const TARGET_EXTENSIONS = new Set([".md", ".ts", ".tsx", ".js", ".json"])
const SCAN_DIRS = ["README.md", "src", "scripts", "tests"]
const SKIP_DIRS = new Set([".git", ".next", "node_modules", "out", "coverage"])
const SKIP_FILES = new Set([
    "scripts/gates/check-privacy-copy.js",
    "tests/guards/privacy-copy-alignment.test.ts",
])

const FORBIDDEN_PATTERNS = [
    {
        pattern: /No data leaves your device\s*(?:—|-|--)?\s*ever/i,
        reason: "unqualified absolute no-data-leaves-device promise",
    },
    {
        pattern: /Your (?:input|data) never leaves your (?:device|machine)/i,
        reason: "unqualified no-data-leaves-device promise",
    },
    {
        pattern: /all data (?:is )?(?:processed|processing) (?:entirely|completely)/i,
        reason: "unqualified all-data local processing promise",
    },
    {
        pattern: /all processing happens locally/i,
        reason: "unqualified all-processing local promise",
    },
    {
        pattern: /every tool works offline/i,
        reason: "unqualified offline promise across all tools",
    },
    {
        pattern: /100%\s+(?:local|private|privacy|本地|私密|プライベート|로컬|프라이빗|lokal|privé|Confidentialité)/i,
        reason: "unqualified 100% privacy/local wording",
    },
    {
        pattern: /100%\s+(?:Client-Side|客户端|客戶端|クライアント|클라이언트|Client-seitig|local)/i,
        reason: "unqualified 100% client/local wording",
    },
    {
        pattern: /No data is ever sent to any server/i,
        reason: "unqualified no-server-send promise",
    },
    {
        pattern: /never sent to any server/i,
        reason: "unqualified no-server-send promise",
    },
    {
        pattern: /entirely in your browser/i,
        reason: "unqualified entirely-in-browser promise",
    },
]

function walk(entryPath, out = []) {
    const fullPath = path.join(ROOT, entryPath)
    if (!fs.existsSync(fullPath)) return out

    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
        if (SKIP_DIRS.has(path.basename(fullPath))) return out
        for (const child of fs.readdirSync(fullPath)) {
            walk(path.join(entryPath, child), out)
        }
        return out
    }

    const relativePath = path.relative(ROOT, fullPath).replaceAll("\\", "/")
    if (stat.isFile() && TARGET_EXTENSIONS.has(path.extname(fullPath)) && !SKIP_FILES.has(relativePath)) {
        out.push(fullPath)
    }

    return out
}

function main() {
    const files = SCAN_DIRS.flatMap((entry) => walk(entry))
    const failures = []

    for (const file of files) {
        const rel = path.relative(ROOT, file).replaceAll("\\", "/")
        const lines = fs.readFileSync(file, "utf8").split(/\r?\n/)

        lines.forEach((line, index) => {
            for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
                if (pattern.test(line)) {
                    failures.push(`${rel}:${index + 1}: ${reason}`)
                }
            }
        })
    }

    if (failures.length > 0) {
        console.error(`[check:privacy-copy] Found ${failures.length} privacy copy issue(s):`)
        for (const failure of failures.slice(0, 120)) {
            console.error(`- ${failure}`)
        }
        process.exit(1)
    }

    console.log(`[check:privacy-copy] OK: ${files.length} file(s) checked for absolute privacy promises.`)
}

main()
