#!/usr/bin/env node

import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"

const require = createRequire(import.meta.url)
const ts = require("typescript")

const ROOT_DIR = process.cwd()
const INVENTORY_PATH = path.join(ROOT_DIR, "src/generated/route-width-inventory.json")
const CONTRACT_PATH = path.join(ROOT_DIR, "src/components/layout/route-container-contract.ts")
const TOOL_ROOT = path.join(ROOT_DIR, "src/features/tools")
const SCAFFOLD_PATH = path.join(ROOT_DIR, "scripts/scaffolding/create-tool.js")
const PAGE_CONTAINER_NAMES = new Set([
    "CatalogPageContainer",
    "StaticPageContainer",
    "ToolPageContainer",
    "WideToolPageContainer",
])
const SCAN_ROOTS = [
    ["app", "src/app"],
    ["layout", "src/components/layout"],
    ["tools", "src/features/tools"],
    ["route-surfaces", "src/core/seo/components"],
    ["install", "src/features/install-app"],
    ["scaffold", "scripts/scaffolding/create-tool.js"],
]
const WIDTH_TOKEN_PATTERN = /(?<![\w-])((?:[a-z0-9-]+:)*(?:max-w-(?:\[[^\]\s"'`]+\]|[a-z0-9-]+)|w-full|container|(?:grid-cols|col-span)-(?:\[[^\]\s"'`]+\]|[a-z0-9-]+)))/g
const CENTERED_MAX_WIDTH_ALLOWLIST = new Set([
    "src/app/[lang]/error.tsx::focused-status::max-w-2xl",
    "src/app/[lang]/page.tsx::home-copy::max-w-2xl",
    "src/app/[lang]/page.tsx::home-hero::max-w-4xl",
    "src/app/[lang]/page.tsx::home-shell::max-w-screen-2xl",
    "src/components/layout/app-runtime.tsx::runtime-banner::max-w-6xl",
    "src/components/layout/footer-content.tsx::global-shell::max-w-screen-2xl",
    "src/components/layout/lang-not-found-content.tsx::focused-status::max-w-3xl",
    "src/components/layout/navbar.tsx::global-shell::max-w-screen-2xl",
    "src/components/layout/seo-faq-section.tsx::readable-content::max-w-3xl",
    "src/core/seo/components/legacy-tool-redirect-page.tsx::legacy-redirect::max-w-xl",
    "src/core/seo/components/tool-content-template-modules/core.tsx::readable-content::max-w-4xl",
    "src/features/tools/cidr-subnet-calculator/page.tsx::focused-work-surface::max-w-3xl",
])

function toPosix(filePath) {
    return path.relative(ROOT_DIR, filePath).replaceAll(path.sep, "/")
}

function listSourceFiles(targetPath) {
    const absolutePath = path.join(ROOT_DIR, targetPath)
    if (!fs.existsSync(absolutePath)) return []
    const stat = fs.statSync(absolutePath)
    if (stat.isFile()) return [absolutePath]

    return fs.readdirSync(absolutePath, { withFileTypes: true })
        .flatMap((entry) => listSourceFiles(path.join(targetPath, entry.name)))
        .filter((filePath) => /\.(?:js|ts|tsx)$/.test(filePath))
}

function unwrapExpression(node) {
    let current = node
    while (
        ts.isParenthesizedExpression(current)
        || ts.isAsExpression(current)
        || ts.isSatisfiesExpression(current)
        || ts.isNonNullExpression(current)
        || ts.isAwaitExpression(current)
    ) {
        current = current.expression
    }
    return current
}

function propertyNameText(name, sourceFile) {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
    return name.getText(sourceFile)
}

function findVariable(sourceFile, variableName) {
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) continue
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName) {
                return declaration.initializer ? unwrapExpression(declaration.initializer) : null
            }
        }
    }
    return null
}

function readContract() {
    const source = fs.readFileSync(CONTRACT_PATH, "utf8")
    const sourceFile = ts.createSourceFile(CONTRACT_PATH, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const classMapNode = findVariable(sourceFile, "ROUTE_CONTAINER_CLASS_NAMES")
    const viewportNode = findVariable(sourceFile, "ROUTE_VIEWPORT_CLASS_NAME")
    const representativeNode = findVariable(sourceFile, "REPRESENTATIVE_ROUTE_CONTAINER_INTENTS")
    const wideSetNode = findVariable(sourceFile, "WIDE_TOOL_SLUGS")

    if (!classMapNode || !ts.isObjectLiteralExpression(classMapNode)) {
        throw new Error("[route-width-inventory] ROUTE_CONTAINER_CLASS_NAMES must be an object literal")
    }
    if (!viewportNode || !ts.isStringLiteral(viewportNode)) {
        throw new Error("[route-width-inventory] ROUTE_VIEWPORT_CLASS_NAME must be a string literal")
    }
    if (!representativeNode || !ts.isObjectLiteralExpression(representativeNode)) {
        throw new Error("[route-width-inventory] REPRESENTATIVE_ROUTE_CONTAINER_INTENTS must be an object literal")
    }
    if (!wideSetNode || !ts.isNewExpression(wideSetNode)) {
        throw new Error("[route-width-inventory] WIDE_TOOL_SLUGS must be a Set literal")
    }

    const intents = Object.fromEntries(classMapNode.properties.map((property) => {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(unwrapExpression(property.initializer))) {
            throw new Error("[route-width-inventory] Container class entries must be string literals")
        }
        return [propertyNameText(property.name, sourceFile), unwrapExpression(property.initializer).text]
    }))
    const representativeRoutes = Object.fromEntries(representativeNode.properties.map((property) => {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(unwrapExpression(property.initializer))) {
            throw new Error("[route-width-inventory] Representative route intents must be string literals")
        }
        return [propertyNameText(property.name, sourceFile), unwrapExpression(property.initializer).text]
    }))
    const wideArray = wideSetNode.arguments?.[0]
    if (!wideArray || !ts.isArrayLiteralExpression(wideArray)) {
        throw new Error("[route-width-inventory] WIDE_TOOL_SLUGS must be created from an array literal")
    }
    const wideToolSlugs = wideArray.elements.map((element) => {
        const value = unwrapExpression(element)
        if (!ts.isStringLiteral(value)) {
            throw new Error("[route-width-inventory] Wide tool slugs must be string literals")
        }
        return value.text
    }).sort()

    return {
        viewport: viewportNode.text,
        intents,
        representativeRoutes,
        wideToolSlugs,
    }
}

function collectStaticClassFragments(node) {
    const expression = unwrapExpression(node)
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
        return [expression.text]
    }
    if (ts.isTemplateExpression(expression)) {
        return [
            expression.head.text,
            ...expression.templateSpans.flatMap((span) => [
                ...collectStaticClassFragments(span.expression),
                span.literal.text,
            ]),
        ]
    }

    const fragments = []
    ts.forEachChild(expression, (child) => fragments.push(...collectStaticClassFragments(child)))
    return fragments
}

function getClassName(openingElement) {
    for (const attribute of openingElement.attributes.properties) {
        if (!ts.isJsxAttribute(attribute) || attribute.name.text !== "className" || !attribute.initializer) continue
        if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text
        if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
            return collectStaticClassFragments(attribute.initializer.expression).join(" ")
        }
    }
    return ""
}

function getLiteralJsxAttribute(openingElement, attributeName) {
    for (const attribute of openingElement.attributes.properties) {
        if (!ts.isJsxAttribute(attribute) || attribute.name.text !== attributeName || !attribute.initializer) continue
        return ts.isStringLiteral(attribute.initializer) ? attribute.initializer.text : ""
    }
    return ""
}

function collectCenteredMaxWidthWrappers(filePath) {
    const source = fs.readFileSync(filePath, "utf8")
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const wrappers = []

    const visit = (node) => {
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
            const openingElement = ts.isJsxElement(node) ? node.openingElement : node
            const className = getClassName(openingElement)
            const maxWidthTokens = [...className.matchAll(/(?:^|\s)(max-w-(?:\[[^\]]+\]|[^\s]+))/g)]
                .map((match) => match[1])
            if (/(?:^|\s)mx-auto(?:\s|$)/.test(className) && maxWidthTokens.length > 0) {
                wrappers.push({
                    file: toPosix(filePath),
                    element: openingElement.tagName.getText(sourceFile),
                    line: sourceFile.getLineAndCharacterOfPosition(openingElement.getStart(sourceFile)).line + 1,
                    reason: getLiteralJsxAttribute(openingElement, "data-route-width-exception"),
                    maxWidthTokens,
                })
            }
        }
        ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    return wrappers
}

function collectPageContainerImports(filePath) {
    const source = fs.readFileSync(filePath, "utf8")
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const imports = new Map()

    for (const statement of sourceFile.statements) {
        if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== "@/components/layout/page-container") continue
        const bindings = statement.importClause?.namedBindings
        if (!bindings || !ts.isNamedImports(bindings)) continue
        for (const element of bindings.elements) {
            imports.set(element.name.text, element.propertyName?.text ?? element.name.text)
        }
    }
    return imports
}

function collectJsxRoots(expression, sourceFile) {
    const node = unwrapExpression(expression)
    if (ts.isConditionalExpression(node)) {
        return [
            ...collectJsxRoots(node.whenTrue, sourceFile),
            ...collectJsxRoots(node.whenFalse, sourceFile),
        ]
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const openingElement = ts.isJsxElement(node) ? node.openingElement : node
        return [{
            element: openingElement.tagName.getText(sourceFile),
            className: getClassName(openingElement),
            line: sourceFile.getLineAndCharacterOfPosition(openingElement.getStart(sourceFile)).line + 1,
        }]
    }
    if (ts.isJsxFragment(node)) {
        return [{ element: "Fragment", className: "", line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1 }]
    }
    return []
}

function isExportedPageFunction(node, filePath) {
    if (!ts.isFunctionDeclaration(node)) return false
    const modifiers = node.modifiers ?? []
    const isDefault = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
    const isExported = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    const isNamedPage = Boolean(node.name?.text.endsWith("Page"))
    const isRouteSurface = new Set(["error.tsx", "loading.tsx", "not-found.tsx", "page.tsx"])
        .has(path.basename(filePath))
    return (isDefault && (isNamedPage || isRouteSurface)) || (isExported && isNamedPage)
}

function collectPageRoots(filePath) {
    const source = fs.readFileSync(filePath, "utf8")
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const roots = []

    for (const statement of sourceFile.statements) {
        if (!isExportedPageFunction(statement, filePath)) continue
        const component = statement.name?.text ?? "default"
        const visit = (node) => {
            if (node !== statement && ts.isFunctionLike(node)) return
            if (ts.isReturnStatement(node) && node.expression) {
                for (const root of collectJsxRoots(node.expression, sourceFile)) {
                    roots.push({
                        file: toPosix(filePath),
                        component,
                        ...root,
                        hardcodedMaxWidth: [...root.className.matchAll(/(?:^|\s)(max-w-(?:\[[^\]]+\]|[^\s]+))/g)]
                            .map((match) => match[1]),
                    })
                }
            }
            ts.forEachChild(node, visit)
        }
        visit(statement)
    }

    return roots
}

function buildWidthTokenInventory() {
    const areas = {}
    const scannedFiles = new Set()

    for (const [area, targetPath] of SCAN_ROOTS) {
        const counts = new Map()
        for (const filePath of listSourceFiles(targetPath)) {
            scannedFiles.add(filePath)
            const source = fs.readFileSync(filePath, "utf8")
            for (const match of source.matchAll(WIDTH_TOKEN_PATTERN)) {
                const token = match[1]
                counts.set(token, (counts.get(token) ?? 0) + 1)
            }
        }
        areas[area] = Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)))
    }

    return { areas, scannedFiles: [...scannedFiles].sort() }
}

function buildInventory() {
    const contract = readContract()
    const { areas, scannedFiles } = buildWidthTokenInventory()
    const pageRoots = scannedFiles.flatMap(collectPageRoots)
        .sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line)
    const centeredMaxWidthWrappers = scannedFiles.flatMap(collectCenteredMaxWidthWrappers)
        .sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line)
    const violations = []

    for (const root of pageRoots) {
        if (root.hardcodedMaxWidth.length > 0) {
            violations.push(`${root.file}:${root.line} ${root.component} hardcodes ${root.hardcodedMaxWidth.join(", ")} at its page root`)
        }
    }

    const usedCenteredMaxWidthAllowlistEntries = new Set()
    for (const wrapper of centeredMaxWidthWrappers) {
        for (const token of wrapper.maxWidthTokens) {
            const allowlistEntry = `${wrapper.file}::${wrapper.reason}::${token}`
            if (!wrapper.reason || !CENTERED_MAX_WIDTH_ALLOWLIST.has(allowlistEntry)) {
                violations.push(`${wrapper.file}:${wrapper.line} centered ${token} wrapper is not explicitly allowlisted`)
                continue
            }
            usedCenteredMaxWidthAllowlistEntries.add(allowlistEntry)
        }
    }
    for (const allowlistEntry of CENTERED_MAX_WIDTH_ALLOWLIST) {
        if (!usedCenteredMaxWidthAllowlistEntries.has(allowlistEntry)) {
            violations.push(`unused centered max-width allowlist entry: ${allowlistEntry}`)
        }
    }

    const toolSurfaces = []
    const wideToolSlugs = new Set(contract.wideToolSlugs)
    const toolDirs = fs.readdirSync(TOOL_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    for (const entry of toolDirs) {
        const filePath = path.join(TOOL_ROOT, entry.name, "page.tsx")
        if (!fs.existsSync(filePath)) continue
        const roots = pageRoots.filter((root) => root.file === toPosix(filePath))
        if (roots.length === 0) {
            violations.push(`${toPosix(filePath)} does not export a detectable *Page component`)
            continue
        }

        const expectedElement = wideToolSlugs.has(entry.name) ? "WideToolPageContainer" : "ToolPageContainer"
        const containerImports = collectPageContainerImports(filePath)
        if (containerImports.get(expectedElement) !== expectedElement) {
            violations.push(`${toPosix(filePath)} must import ${expectedElement} from @/components/layout/page-container without aliasing`)
        }
        for (const root of roots) {
            if (!PAGE_CONTAINER_NAMES.has(root.element)) {
                violations.push(`${root.file}:${root.line} ${root.component} must use a page container primitive, found ${root.element}`)
            } else if (root.element !== expectedElement) {
                violations.push(`${root.file}:${root.line} ${entry.name} expects ${expectedElement}, found ${root.element}`)
            }
        }
        toolSurfaces.push({
            slug: entry.name,
            intent: wideToolSlugs.has(entry.name) ? "wide-tool" : "tool",
            roots: [...new Set(roots.map((root) => root.element))].sort(),
        })
    }

    const scaffoldSource = fs.readFileSync(SCAFFOLD_PATH, "utf8")
    const featureTemplateStart = scaffoldSource.indexOf("function createFeaturePageTemplate")
    const featureTemplateEnd = scaffoldSource.indexOf("function createTypesTemplate", featureTemplateStart)
    const featureTemplate = scaffoldSource.slice(featureTemplateStart, featureTemplateEnd)
    if (!featureTemplate.includes('import { ToolPageContainer } from "@/components/layout/page-container"')) {
        violations.push("scripts/scaffolding/create-tool.js must import ToolPageContainer in generated feature pages")
    }
    if (!featureTemplate.includes("<ToolPageContainer")) {
        violations.push("scripts/scaffolding/create-tool.js must generate ToolPageContainer as the feature page root")
    }
    if (/max-w-/.test(featureTemplate)) {
        violations.push("scripts/scaffolding/create-tool.js must not hardcode max-w-* in generated feature page roots")
    }

    if (violations.length > 0) {
        throw new Error(`[route-width-inventory] Contract violations:\n- ${violations.join("\n- ")}`)
    }

    return {
        schemaVersion: 1,
        contracts: contract,
        summary: {
            scannedFiles: scannedFiles.length,
            pageRoots: pageRoots.length,
            toolSurfaces: toolSurfaces.length,
            standardTools: toolSurfaces.filter((tool) => tool.intent === "tool").length,
            wideTools: toolSurfaces.filter((tool) => tool.intent === "wide-tool").length,
        },
        toolSurfaces: toolSurfaces.sort((left, right) => left.slug.localeCompare(right.slug)),
        centeredMaxWidthExceptions: centeredMaxWidthWrappers,
        pageRoots: pageRoots.map(({ file, component, element, line }) => ({ file, component, element, line })),
        widthTokensByArea: areas,
    }
}

function main() {
    const expected = `${JSON.stringify(buildInventory(), null, 2)}\n`
    if (process.argv.includes("--check")) {
        const current = fs.existsSync(INVENTORY_PATH) ? fs.readFileSync(INVENTORY_PATH, "utf8") : ""
        if (current !== expected) {
            throw new Error("[route-width-inventory] Generated inventory is stale. Run npm run generate:route-width-inventory.")
        }
        console.log("[route-width-inventory] PASS: generated inventory and page-root contracts are current")
        return
    }

    fs.writeFileSync(INVENTORY_PATH, expected, "utf8")
    console.log(`[route-width-inventory] Wrote ${path.relative(ROOT_DIR, INVENTORY_PATH)}`)
}

try {
    main()
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
}
