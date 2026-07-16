import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"
import { INPUT_INTENTS, type InputIntent } from "@/components/ui/input-intent"

const ROOT = process.cwd()
const SOURCE_ROOT = path.join(ROOT, "src")
const CONTROL_TAGS = new Set(["Input", "Textarea", "MonacoEditor", "MonacoDiffEditor", "TextOutputPanel", "input", "textarea", "select"])
const INTENT_SET = new Set<string>(INPUT_INTENTS)
const REPRESENTATIVE_TOOL_DIRS = [
    "base64-encode-decode",
    "csv-json-converter",
    "json-formatter",
    "jwt-decoder",
    "pipeline-builder",
    "qr-code-generator",
    "regex-tester",
]
const HARDCODED_SIZE_PATTERN = /(?:(?:sm|md|lg|xl|2xl|hover|focus|focus-visible|data-\[[^\]]+\]):)*(?:h|min-h|max-h|size)-(?:\[[^\]]+\]|\d+(?:\.\d+)?)|field-sizing-content/g
const LEGACY_SIGNATURE_COUNT = 197
const LEGACY_SIGNATURE_SHA256 = "49e263f72c6d225c86c0c7c258089d5c0690c318ad5b2fa997ab43f5f0303f64"

type InventoryRecord = {
    explicitIntent: boolean
    file: string
    inferredIntent: InputIntent
    invalidIntent?: string
    line: number
    sizeTokens: string[]
    tag: string
}

function sourceFiles(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(directory, entry.name)
        if (entry.isDirectory()) return sourceFiles(fullPath)
        return entry.isFile() && entry.name.endsWith(".tsx") ? [fullPath] : []
    })
}

function jsxTagName(node: ts.JsxOpeningLikeElement) {
    return ts.isIdentifier(node.tagName) ? node.tagName.text : node.tagName.getText()
}

function findAttribute(node: ts.JsxOpeningLikeElement, attributeName: string) {
    return node.attributes.properties.find(
        (property): property is ts.JsxAttribute => ts.isJsxAttribute(property) && property.name.getText() === attributeName,
    )
}

function literalAttributeValue(attribute: ts.JsxAttribute | undefined) {
    if (!attribute?.initializer) return attribute ? "" : undefined
    if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text
    if (!ts.isJsxExpression(attribute.initializer) || !attribute.initializer.expression) return undefined
    const expression = attribute.initializer.expression
    return ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression) ? expression.text : undefined
}

function inferRawInputIntent(node: ts.JsxOpeningLikeElement): InputIntent {
    const type = literalAttributeValue(findAttribute(node, "type")) || "text"
    if (["checkbox", "color", "number", "radio", "range"].includes(type)) return "scalar"
    if (type === "file") return "payload"
    return "shortText"
}

function inferredIntent(tag: string, node: ts.JsxOpeningLikeElement, explicitValue: string | undefined): InputIntent {
    if (explicitValue && INTENT_SET.has(explicitValue)) return explicitValue as InputIntent
    if (tag === "Input") return "shortText"
    if (tag === "Textarea" || tag === "textarea") return "payload"
    if (tag === "MonacoDiffEditor") return "workbench"
    if (tag === "MonacoEditor") return "workbench"
    if (tag === "TextOutputPanel") return "generatedOutput"
    if (tag === "select") return "scalar"
    return inferRawInputIntent(node)
}

function collectInventory(): InventoryRecord[] {
    return sourceFiles(SOURCE_ROOT).flatMap((filePath) => {
        const sourceText = fs.readFileSync(filePath, "utf8")
        const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
        const records: InventoryRecord[] = []

        function visit(node: ts.Node) {
            if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
                const tag = jsxTagName(node)
                if (CONTROL_TAGS.has(tag)) {
                    const intentAttribute = findAttribute(node, "intent") || findAttribute(node, "data-input-intent")
                    const explicitValue = literalAttributeValue(intentAttribute)
                    const classSource = findAttribute(node, "className")?.getText(sourceFile) || ""
                    const sizeTokens = Array.from(new Set(classSource.match(HARDCODED_SIZE_PATTERN) || [])).sort()
                    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1
                    records.push({
                        explicitIntent: Boolean(intentAttribute),
                        file: path.relative(ROOT, filePath).replaceAll("\\", "/"),
                        inferredIntent: inferredIntent(tag, node, explicitValue),
                        invalidIntent: explicitValue !== undefined && explicitValue !== "" && !INTENT_SET.has(explicitValue) ? explicitValue : undefined,
                        line,
                        sizeTokens,
                        tag,
                    })
                }
            }
            ts.forEachChild(node, visit)
        }

        visit(sourceFile)
        return records
    })
}

function displayRecord(record: InventoryRecord) {
    return `${record.file}:${record.line} <${record.tag}> -> ${record.inferredIntent}${record.sizeTokens.length ? ` [${record.sizeTokens.join(", ")}]` : ""}`
}

const inventory = collectInventory()

describe("input intent static inventory", () => {
    it("classifies every shared and raw input surface with the five-value taxonomy", () => {
        expect(inventory.length).toBeGreaterThan(300)
        expect(inventory.filter((record) => record.invalidIntent).map(displayRecord)).toEqual([])
        expect(new Set(inventory.map((record) => record.inferredIntent))).toEqual(new Set(INPUT_INTENTS))
    })

    it("requires explicit intent on every representative tool input surface", () => {
        const representativePrefix = REPRESENTATIVE_TOOL_DIRS.map((slug) => `src/features/tools/${slug}/`)
        const offenders = inventory.filter(
            (record) => representativePrefix.some((prefix) => record.file.startsWith(prefix)) && !record.explicitIntent,
        )

        expect(offenders.map(displayRecord)).toEqual([])
    })

    it("freezes all remaining unclassified hardcoded field sizes as a legacy ratchet", () => {
        const legacySignatures = inventory
            .filter((record) => !record.explicitIntent && record.sizeTokens.length > 0)
            .map((record) => `${record.file}|${record.tag}|${record.sizeTokens.join(",")}`)
            .sort()
        const digest = crypto.createHash("sha256").update(JSON.stringify(legacySignatures)).digest("hex")

        expect(
            { count: legacySignatures.length, digest },
            `Legacy input sizing changed. Migrate the field to an explicit intent, or review the full inventory before updating the ratchet.\n${legacySignatures.join("\n")}`,
        ).toEqual({ count: LEGACY_SIGNATURE_COUNT, digest: LEGACY_SIGNATURE_SHA256 })
    })

    it("keeps generated tools on explicit payload, workbench, and generated-output intents", () => {
        const scaffold = fs.readFileSync(path.join(ROOT, "scripts/scaffolding/create-tool.js"), "utf8")
        expect(scaffold).toContain('intent="payload"')
        expect(scaffold).toContain('intent="generatedOutput"')
        expect(scaffold).toContain('data-input-intent="workbench"')
        expect(scaffold).not.toContain("field-sizing-content")
    })
})
