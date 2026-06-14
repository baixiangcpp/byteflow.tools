import fs from "node:fs"
import path from "node:path"

const SCAN_TARGETS = ["src", "tests", "scripts/scaffolding/create-tool.js"]
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"])

const LEGACY_PATTERNS = [
    {
        label: "legacy alias import",
        regex: /["']@\/components\/seo\/tool-content-template(?:\.tsx)?["']/g,
    },
    {
        label: "legacy relative import",
        regex: /["'](?:\.{1,2}\/)+tool-content-template(?:\.tsx)?["']/g,
    },
    {
        label: "legacy source file reference",
        regex: /src\/components\/seo\/tool-content-template\.tsx/g,
    },
]

function listFiles(target) {
    if (!fs.existsSync(target)) return []

    const stat = fs.statSync(target)
    if (stat.isFile()) {
        return SOURCE_EXTENSIONS.has(path.extname(target)) ? [target] : []
    }

    const files = []
    for (const entry of fs.readdirSync(target)) {
        const absolute = path.join(target, entry)
        const entryStat = fs.statSync(absolute)

        if (entryStat.isDirectory()) {
            files.push(...listFiles(absolute))
            continue
        }

        if (SOURCE_EXTENSIONS.has(path.extname(absolute))) {
            files.push(absolute)
        }
    }

    return files
}

function findLineNumber(source, index) {
    let line = 1
    for (let i = 0; i < index; i += 1) {
        if (source.charCodeAt(i) === 10) line += 1
    }
    return line
}

function normalizeSnippet(text) {
    return text.replace(/\s+/g, " ").trim().slice(0, 140)
}

function run() {
    const files = SCAN_TARGETS.flatMap((target) => listFiles(target))
    const findings = []

    for (const filePath of files) {
        const source = fs.readFileSync(filePath, "utf8")
        const relativePath = path.relative(process.cwd(), filePath)

        for (const pattern of LEGACY_PATTERNS) {
            pattern.regex.lastIndex = 0
            for (const match of source.matchAll(pattern.regex)) {
                const matchText = match[0] || ""
                const line = findLineNumber(source, match.index || 0)
                findings.push({
                    file: relativePath,
                    line,
                    label: pattern.label,
                    snippet: normalizeSnippet(matchText),
                })
            }
        }
    }

    if (findings.length > 0) {
        console.error(`[check:content-template:legacy-paths] Found ${findings.length} legacy reference(s):`)
        for (const finding of findings) {
            console.error(`  - ${finding.file}:${finding.line} [${finding.label}] ${finding.snippet}`)
        }
        process.exit(1)
    }

    console.log("[check:content-template:legacy-paths] OK: no legacy tool-content-template path references found")
}

run()
