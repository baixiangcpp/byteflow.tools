import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

const PROJECT_ROOT = process.cwd()
const LANG_APP_DIR = path.join(PROJECT_ROOT, "src/app/[lang]")

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8")
}

function walkRouteFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            return walkRouteFiles(fullPath)
        }
        if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            return [fullPath]
        }
        return []
    })
}

describe("locale routing guard", () => {
    it("locks the [lang] segment to known static params and rejects invalid locale fallback", () => {
        const source = readSource("src/app/[lang]/layout.tsx")

        expect(source).toContain("export const dynamicParams = false;")
        expect(source).toContain("notFound()")
        expect(source).not.toContain("DEFAULT_LOCALE")
    })

    it("removes invalid locale fallback patterns across [lang] routes", () => {
        const routeFiles = walkRouteFiles(LANG_APP_DIR)
        const offenders = routeFiles.filter((filePath) => {
            const source = fs.readFileSync(filePath, "utf8")
            return source.includes("LOCALES.includes(lang as Locale) ? lang : DEFAULT_LOCALE")
                || source.includes("DEFAULT_LOCALE")
        })

        expect(offenders).toEqual([])
    })

    it("removes visible English fallback literals from home discovery surfaces", () => {
        const source = readSource("src/app/[lang]/page.tsx")

        expect(source).not.toContain("INSTALL_APP_LINK_BY_LOCALE")
        expect(source).not.toContain('|| "Favorites"')
        expect(source).not.toContain('|| "Recent tools"')
        expect(source).not.toContain('|| "Add to favorites"')
        expect(source).not.toContain('|| "Remove from favorites"')
    })

    it("keeps translation catalogs strict and free of English merge fallback", () => {
        const source = readSource("src/core/i18n/translations/catalog.ts")

        expect(source).not.toContain("mergeWithFallback")
        expect(source).not.toContain("mergedCache")
    })

    it("keeps shared shell copy on locale-owned translation keys instead of source maps", () => {
        const appLayoutSource = readSource("src/components/layout/app-layout.tsx")
        const footerSource = readSource("src/components/layout/footer.tsx")
        const notFoundSource = readSource("src/app/[lang]/not-found.tsx")

        expect(appLayoutSource).not.toContain("PWA_INSTALL_COPY_BY_LOCALE")
        expect(appLayoutSource).not.toContain("INSTALL_INLINE_COPY_BY_LOCALE")
        expect(appLayoutSource).not.toContain("SKIP_TO_CONTENT_BY_LOCALE")
        expect(appLayoutSource).not.toContain("BACK_TO_TOP_BY_LOCALE")
        expect(footerSource).not.toContain("INSTALL_APP_LABEL_BY_LOCALE")
        expect(notFoundSource).not.toContain("NOT_FOUND_COPY")
        expect(notFoundSource).not.toContain('JSON Formatter')
        expect(notFoundSource).not.toContain('Base64 Encode/Decode')
    })

    it("keeps SEO and scaffolding copy strict instead of silently falling back", () => {
        const seoSource = readSource("src/core/seo/seo.ts")
        const createToolSource = readSource("scripts/scaffolding/create-tool.js")

        expect(seoSource).not.toContain("tool?.title || toolKey")
        expect(seoSource).not.toContain("tool?.description ||")
        expect(seoSource).not.toContain("nav[navKey] || fallback")
        expect(createToolSource).not.toContain("DEFAULT_LOCALE")
        expect(createToolSource).not.toContain("LOCALES.includes(lang as Locale)")
        expect(createToolSource).toContain('t.common.run')
        expect(createToolSource).not.toContain('t.common.format')
        expect(createToolSource).not.toContain('|| "Run"')
        expect(createToolSource).not.toContain('|| "Copy"')
        expect(createToolSource).not.toContain('|| "Input"')
        expect(createToolSource).not.toContain('|| "Output"')
    })

    it("keeps exported html lang corrected in the static build pipeline", () => {
        const packageJson = JSON.parse(readSource("package.json")) as {
            scripts?: Record<string, string>
        }

        expect(packageJson.scripts?.["build:post"]).toContain("postprocess:export-html-lang")
        expect(packageJson.scripts?.["build:post"]).toContain("check:export-html-lang")
        expect(readSource("scripts/postprocess/fix-export-html-lang.js")).toContain("[fix:export-html-lang]")
        expect(readSource("scripts/gates/check-export-html-lang.js")).toContain("[check:export-html-lang]")
    })

    it("fails fast when language context is missing instead of defaulting to English", () => {
        const source = readSource("src/core/i18n/lang-provider.tsx")
        const commandPaletteSource = readSource("src/components/layout/command-palette.tsx")

        expect(source).toContain("React.createContext<LangContextValue | null>(null)")
        expect(source).toContain('throw new Error("[i18n] useLang must be used within LangProvider")')
        expect(source).not.toContain("getTranslation(")
        expect(source).not.toContain("TRANSLATIONS.en")
        expect(commandPaletteSource).not.toContain("@/core/i18n/translations/catalog")
        expect(commandPaletteSource).not.toContain("TRANSLATIONS.en")
    })

    it("keeps tool handoff routing and localized date output strict", () => {
        const jsonFormatterSource = readSource("src/features/tools/json-formatter/page.tsx")
        const csvJsonConverterSource = readSource("src/features/tools/csv-json-converter/page.tsx")
        const crontabGeneratorSource = readSource("src/features/tools/crontab-generator/page.tsx")
        const htmlMinifierSource = readSource("src/features/tools/html-minifier/page.tsx")
        const javascriptFormatterSource = readSource("src/features/tools/javascript-formatter/page.tsx")
        const slugifyCaseConverterSource = readSource("src/features/tools/slugify-case-converter/page.tsx")
        const yamlJsonConverterSource = readSource("src/features/tools/yaml-json-converter/page.tsx")
        const htmlCssBeautifierSource = readSource("src/features/tool-templates/html-css-beautifier-tool.tsx")
        const toolHandoffSource = readSource("src/core/routing/tool-handoff.ts")
        const unixTimestampSource = readSource("src/features/tools/unix-timestamp/page.tsx")

        expect(jsonFormatterSource).not.toContain("useParams")
        expect(csvJsonConverterSource).not.toContain("useParams")
        expect(htmlMinifierSource).not.toContain("useParams")
        expect(javascriptFormatterSource).not.toContain("useParams")
        expect(yamlJsonConverterSource).not.toContain("useParams")
        expect(htmlCssBeautifierSource).not.toContain("useParams")
        expect(toolHandoffSource).toContain('throw new Error("[i18n] tool handoff requires an explicit locale")')
        expect(toolHandoffSource).not.toContain('|| "en"')
        expect(crontabGeneratorSource).not.toContain('?? "en"')
        expect(csvJsonConverterSource).not.toContain('|| "en"')
        expect(htmlMinifierSource).not.toContain('|| "en"')
        expect(javascriptFormatterSource).not.toContain('|| "en"')
        expect(slugifyCaseConverterSource).not.toContain('React.useState("en-US")')
        expect(yamlJsonConverterSource).not.toContain('|| "en"')
        expect(unixTimestampSource).not.toContain("toUTCString()")
        expect(unixTimestampSource).toContain('timeZone: "UTC"')
    })
})
