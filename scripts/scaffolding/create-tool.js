#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");

const CATEGORY_CONFIG = {
    formatters: {
        defaults: ["json_formatter", "javascript_formatter", "html_formatter", "yaml_json_converter"],
    },
    "text-string": {
        defaults: ["base64_encode_decode", "url_encode_decode", "hash_generator", "text_diff_checker"],
    },
    generators: {
        defaults: ["uuid_generator", "password_generator", "lorem_ipsum", "unix_timestamp"],
    },
    "network-web": {
        defaults: ["regex_tester", "http_request_builder", "url_parser", "hash_generator"],
    },
};

const MANIFESTS_PATH = "src/core/registry/manifests.ts";
const ROUTE_ROOT = "src/app/[lang]";
const FEATURE_TOOL_ROOT = "src/features/tools";
const TRANSLATION_FILES = {
    en: "src/core/i18n/translations/en.json",
    "zh-CN": "src/core/i18n/translations/zh-CN.json",
    "zh-TW": "src/core/i18n/translations/zh-TW.json",
    ja: "src/core/i18n/translations/ja.json",
    ko: "src/core/i18n/translations/ko.json",
    de: "src/core/i18n/translations/de.json",
    fr: "src/core/i18n/translations/fr.json",
};

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith("--")) continue;
        const key = token.slice(2);
        const value = argv[i + 1];
        if (!value || value.startsWith("--")) {
            args[key] = "true";
            continue;
        }
        args[key] = value;
        i += 1;
    }
    return args;
}

function kebabToSnake(value) {
    return value.replace(/-/g, "_");
}

function kebabToTitle(value) {
    return value
        .split("-")
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
}

function readText(relPath) {
    return fs.readFileSync(path.join(ROOT_DIR, relPath), "utf8");
}

function writeText(relPath, content) {
    fs.writeFileSync(path.join(ROOT_DIR, relPath), content, "utf8");
}

function assertSlug(slug) {
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error("--slug is required and must be kebab-case (e.g. my-new-tool)");
    }
}

function assertCategory(category) {
    if (!category || !Object.prototype.hasOwnProperty.call(CATEGORY_CONFIG, category)) {
        throw new Error(`--category is required and must be one of: ${Object.keys(CATEGORY_CONFIG).join(", ")}`);
    }
}

function parseList(raw, fallback) {
    if (!raw) return [...fallback];
    return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function asTsStringArray(items) {
    return `[${items.map((item) => `\"${item}\"`).join(", ")}]`;
}

function slugToManifestIdentifier(slug) {
    return `${slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase()).replace(/^[0-9]/, (char) => `_${char}`)}Manifest`;
}

function ensureNotExistsInMeta(key, slug) {
    const manifestsSource = readText(MANIFESTS_PATH);
    if (manifestsSource.includes(`/${slug}/manifest"`)) {
        throw new Error(`Tool slug already exists in manifest aggregator: ${slug}`);
    }

    const manifestFiles = fs
        .readdirSync(path.join(ROOT_DIR, FEATURE_TOOL_ROOT), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(ROOT_DIR, FEATURE_TOOL_ROOT, entry.name, "manifest.ts"))
        .filter((manifestPath) => fs.existsSync(manifestPath));

    for (const manifestPath of manifestFiles) {
        const source = fs.readFileSync(manifestPath, "utf8");
        if (source.includes(`key: \"${key}\"`)) {
            throw new Error(`Tool key already exists: ${key}`);
        }
        if (source.includes(`slug: \"${slug}\"`)) {
            throw new Error(`Tool slug already exists in manifests: ${slug}`);
        }
    }

    const routeDir = path.join(ROOT_DIR, ROUTE_ROOT, slug);
    if (fs.existsSync(routeDir)) {
        throw new Error(`Route directory already exists: ${path.relative(ROOT_DIR, routeDir)}`);
    }

    const featureDir = path.join(ROOT_DIR, FEATURE_TOOL_ROOT, slug);
    if (fs.existsSync(featureDir)) {
        throw new Error(`Feature tool directory already exists: ${path.relative(ROOT_DIR, featureDir)}`);
    }
}

function getLocaleCopy(locale, title) {
    if (locale === "en") {
        return {
            title,
            description: `${title} tool for local browser workflows.`,
        };
    }

    if (locale === "zh-CN") {
        return {
            title: `${title} 工具`,
            description: `在浏览器中本地处理 ${title}，无需上传数据。`,
        };
    }

    if (locale === "zh-TW") {
        return {
            title: `${title} 工具`,
            description: `在瀏覽器中本機處理 ${title}，無需上傳資料。`,
        };
    }

    if (locale === "ja") {
        return {
            title: `${title} ツール`,
            description: `ブラウザ内で ${title} をローカル処理します。`,
        };
    }

    if (locale === "ko") {
        return {
            title: `${title} 도구`,
            description: `브라우저 내에서 ${title}를 로컬에서 처리합니다.`,
        };
    }

    if (locale === "de") {
        return {
            title,
            description: `${title}-Tool für lokale Browser-Workflows.`,
        };
    }

    return {
        title,
        description: `Outil ${title} pour les workflows locaux dans le navigateur.`,
    };
}
function updateTranslations(toolKey, title) {
    for (const [locale, relPath] of Object.entries(TRANSLATION_FILES)) {
        const fullPath = path.join(ROOT_DIR, relPath);
        const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        data.tools = data.tools || {};

        if (data.tools[toolKey]) {
            throw new Error(`Translation key already exists in ${relPath}: tools.${toolKey}`);
        }

        data.tools[toolKey] = getLocaleCopy(locale, title);
        fs.writeFileSync(fullPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    }
}

function createLayoutTemplate(slug) {
    return `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/core/i18n/i18n";
import { buildToolMetadata } from "@/core/seo/seo";
import { ToolBreadcrumbJsonLd } from "@/core/seo/components/json-ld";
import { ToolContentTemplateServer } from "@/core/seo/components/tool-content-template-server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    if (!isValidLocale(lang)) {
        notFound();
    }

    return buildToolMetadata({ lang, slug: "${slug}" });
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    if (!isValidLocale(lang)) {
        notFound();
    }

    return (
        <>
            <ToolBreadcrumbJsonLd lang={lang} slug="${slug}" />
            {children}
            <ToolContentTemplateServer toolSlug="${slug}" lang={lang} />
        </>
    );
}
`;
}
function createFeaturePageTemplate(toolKey) {
    const componentName = kebabToTitle(toolKey.replace(/_/g, "-")).replace(/\s+/g, "");
    return `"use client"

import * as React from "react"
import { Copy, Play } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useLang } from "@/core/i18n/lang-provider"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { runTool } from "./logic"
import { SAMPLE_INPUT } from "./samples"

export function ${componentName}Page() {
    const { t } = useLang()
    const toolT = t.tools?.["${toolKey}"] as { title?: string; description?: string } | undefined
    const title = requireTranslationValue(toolT?.title, "tools.${toolKey}.title")
    const description = requireTranslationValue(toolT?.description, "tools.${toolKey}.description")
    const runLabel = requireTranslationValue(t.common.run, "common.run")
    const copyLabel = requireTranslationValue(t.common.copy, "common.copy")
    const inputLabel = requireTranslationValue(t.common.input, "common.input")
    const outputLabel = requireTranslationValue(t.common.output, "common.output")
    const copyFailedLabel = requireTranslationValue(t.common.copy_failed, "common.copy_failed")
    const copiedLabel = requireTranslationValue(t.common.copied, "common.copied")
    const copiedDescLabel = requireTranslationValue(t.common.copied_desc, "common.copied_desc")
    const [input, setInput] = React.useState(SAMPLE_INPUT)
    const [output, setOutput] = React.useState("")

    const run = () => {
        setOutput(runTool(input))
    }

    const handleCopy = async () => {
        if (!output) return
        const result = await safeClipboardWrite(output)
        if (!result.ok) {
            toast.error(copyFailedLabel)
            return
        }
        toast.success(copiedLabel, {
            description: copiedDescLabel,
        })
    }

    return (
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                <p className="mt-1 text-muted-foreground">{description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button onClick={run}>
                    <Play className="mr-2 h-4 w-4" />
                    {runLabel}
                </Button>
                <Button variant="outline" onClick={() => void handleCopy()} disabled={!output}>
                    <Copy className="mr-2 h-4 w-4" />
                    {copyLabel}
                </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{inputLabel}</label>
                    <Textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder={inputLabel}
                        className="min-h-[360px] font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">{outputLabel}</label>
                    <Textarea value={output} readOnly className="min-h-[360px] font-mono" />
                </div>
            </div>
        </div>
    )
}
`;
}

function createTypesTemplate() {
    return `export type ToolRunResult = string
`;
}

function createConstantsTemplate() {
    return `export const DEFAULT_INPUT = ""
`;
}

function createLogicTemplate() {
    return `import type { ToolRunResult } from "./types"

export function runTool(input: string): ToolRunResult {
    return input
}
`;
}

function createSamplesTemplate() {
    return `export const SAMPLE_INPUT = "Sample input"
`;
}

function createBrowserActionsTemplate() {
    return `// Put browser-only side effects here when this tool needs downloads, FileReader, or DOM helpers.
`;
}

function createManifestTemplate({ key, slug, category, relatedTools, keywords }) {
    return `import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "${key}",
    slug: "${slug}",
    category: "${category}",
    relatedTools: ${asTsStringArray(relatedTools)},
    keywords: ${asTsStringArray(keywords)},
} satisfies ToolMeta
`;
}

function createRoutePageTemplate(slug, toolKey) {
    const componentName = kebabToTitle(toolKey.replace(/_/g, "-")).replace(/\s+/g, "");
    return `"use client"

import { ${componentName}Page } from "@/features/tools/${slug}/page"

export default function Page() {
    return <${componentName}Page />
}
`;
}

function createRouteFiles({ slug, toolKey, category, relatedTools, keywords }) {
    const dirPath = path.join(ROOT_DIR, ROUTE_ROOT, slug);
    const featureDirPath = path.join(ROOT_DIR, FEATURE_TOOL_ROOT, slug);
    fs.mkdirSync(dirPath, { recursive: true });
    fs.mkdirSync(featureDirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, "layout.tsx"), createLayoutTemplate(slug), "utf8");
    fs.writeFileSync(path.join(dirPath, "page.tsx"), createRoutePageTemplate(slug, toolKey), "utf8");
    fs.writeFileSync(path.join(featureDirPath, "page.tsx"), createFeaturePageTemplate(toolKey), "utf8");
    fs.writeFileSync(path.join(featureDirPath, "types.ts"), createTypesTemplate(), "utf8");
    fs.writeFileSync(path.join(featureDirPath, "constants.ts"), createConstantsTemplate(), "utf8");
    fs.writeFileSync(path.join(featureDirPath, "logic.ts"), createLogicTemplate(), "utf8");
    fs.writeFileSync(path.join(featureDirPath, "samples.ts"), createSamplesTemplate(), "utf8");
    fs.writeFileSync(path.join(featureDirPath, "browser-actions.ts"), createBrowserActionsTemplate(), "utf8");
    fs.writeFileSync(path.join(featureDirPath, "manifest.ts"), createManifestTemplate({
        key: toolKey,
        slug,
        category,
        relatedTools,
        keywords,
    }), "utf8");
}

function updateManifestAggregator(slug) {
    const content = readText(MANIFESTS_PATH);
    const identifier = slugToManifestIdentifier(slug);
    const importLine = `import { toolManifest as ${identifier} } from "@/features/tools/${slug}/manifest"`;

    if (content.includes(importLine)) {
        throw new Error(`Manifest import already exists in ${MANIFESTS_PATH}: ${slug}`);
    }

    const typeImport = 'import type { ToolMeta } from "./types"';
    const typeImportIndex = content.indexOf(typeImport);
    if (typeImportIndex === -1) {
        throw new Error(`Unable to find ToolMeta import in ${MANIFESTS_PATH}`);
    }

    const arrayClose = content.indexOf("\n] satisfies ToolMeta[]");
    if (arrayClose === -1) {
        throw new Error(`Unable to find TOOL_MANIFESTS closing bracket in ${MANIFESTS_PATH}`);
    }

    const withImport = `${content.slice(0, typeImportIndex)}${importLine}\n${content.slice(typeImportIndex)}`;
    const adjustedArrayClose = arrayClose + importLine.length + 1;
    const next = `${withImport.slice(0, adjustedArrayClose)}    ${identifier},\n${withImport.slice(adjustedArrayClose)}`;
    writeText(MANIFESTS_PATH, next);
}

function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.help === "true" || args.h === "true") {
        console.log("Usage: node scripts/scaffolding/create-tool.js --slug my-new-tool --category formatters [--related key1,key2] [--keywords a,b,c]");
        process.exit(0);
    }

    const slug = args.slug;
    const category = args.category;
    assertSlug(slug);
    assertCategory(category);

    const key = args.key ? args.key : kebabToSnake(slug);
    const title = args.title ? args.title : kebabToTitle(slug);

    ensureNotExistsInMeta(key, slug);

    const defaults = CATEGORY_CONFIG[category].defaults.filter((item) => item !== key).slice(0, 4);
    const relatedTools = parseList(args.related, defaults);
    const keywords = parseList(
        args.keywords,
        [
            `${title.toLowerCase()} tool`,
            `${title.toLowerCase()} online`,
            `${title.toLowerCase()} utility`,
            `${slug} helper`,
        ],
    );

    createRouteFiles({
        toolKey: key,
        slug,
        category,
        relatedTools,
        keywords,
    });

    updateManifestAggregator(slug);
    updateTranslations(key, title);

    console.log(`[create-tool] Created route: ${path.join(ROUTE_ROOT, slug)}`);
    console.log(`[create-tool] Created feature page: ${path.join(FEATURE_TOOL_ROOT, slug, "page.tsx")}`);
    console.log(`[create-tool] Created manifest: ${path.join(FEATURE_TOOL_ROOT, slug, "manifest.ts")}`);
    console.log(`[create-tool] Created feature modules: ${path.join(FEATURE_TOOL_ROOT, slug, "{logic,samples,types}.ts")}`);
    console.log(`[create-tool] Updated manifest aggregator: ${MANIFESTS_PATH}`);
    console.log("[create-tool] Updated translations: en, zh-CN, zh-TW, ja, ko, de, fr");
    console.log("[create-tool] Next steps:");
    console.log("  1) npm run generate:tool-index");
    console.log("  2) npm run lint && npm run test && npm run check:i18n && npm run build");
}

try {
    main();
} catch (error) {
    console.error(`[create-tool] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}
