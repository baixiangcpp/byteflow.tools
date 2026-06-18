#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "src");
const TEXT_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;
const IGNORE_DIRS = new Set([".next", "node_modules", "out", "output"]);

const HEAVY_DEPENDENCY_RULES = [
    {
        packageName: "@monaco-editor/react",
        description: "Monaco must stay dynamically loaded by the shared editor wrapper.",
        allowedFiles: ["src/features/tool-shell/monaco-editors.tsx"],
        requireDynamicRuntimeImport: true,
    },
    {
        packageName: "monaco-editor",
        description: "Monaco core must stay dynamically loaded by the shared editor wrapper.",
        allowedFiles: ["src/features/tool-shell/monaco-editors.tsx"],
        requireDynamicRuntimeImport: true,
    },
    {
        packageName: "jq-wasm",
        description: "jq-wasm must stay in the jq playground browser action chunk.",
        allowedFiles: ["src/features/tools/jq-playground/browser-actions.ts"],
        requireDynamicRuntimeImport: true,
    },
    {
        packageName: "pdf-lib",
        description: "pdf-lib must stay lazy-loaded by the scanned PDF tool.",
        allowedFiles: ["src/features/tools/scanned-pdf-converter/page.tsx"],
        requireDynamicRuntimeImport: true,
    },
    {
        packageName: "qrcode",
        description: "qrcode must stay lazy-loaded by QR browser actions.",
        allowedFiles: ["src/features/tools/qr-code-generator/browser-actions.ts"],
        requireDynamicRuntimeImport: true,
    },
    {
        packageName: "react-markdown",
        description: "react-markdown must stay isolated to the markdown renderer template.",
        allowedFiles: ["src/features/tool-templates/markdown-preview-renderer.tsx"],
    },
    {
        packageName: "remark-gfm",
        description: "remark-gfm must stay isolated to the markdown renderer template.",
        allowedFiles: ["src/features/tool-templates/markdown-preview-renderer.tsx"],
    },
    {
        packageName: "pdf-lib",
        description: "pdf-lib must not be imported from shared shell/core code.",
        disallowedPathPrefixes: ["src/app/", "src/core/", "src/features/tool-shell/"],
    },
    {
        packageName: "jq-wasm",
        description: "jq-wasm must not be imported from shared shell/core code.",
        disallowedPathPrefixes: ["src/app/", "src/core/", "src/features/tool-shell/"],
    },
    {
        packageName: "qrcode",
        description: "qrcode must not be imported from shared shell/core code.",
        disallowedPathPrefixes: ["src/app/", "src/core/", "src/features/tool-shell/"],
    },
    {
        packageName: "react-markdown",
        description: "markdown rendering must not be imported from shared shell/core code.",
        disallowedPathPrefixes: ["src/app/", "src/core/", "src/features/tool-shell/"],
    },
    {
        packageName: "remark-gfm",
        description: "markdown rendering must not be imported from shared shell/core code.",
        disallowedPathPrefixes: ["src/app/", "src/core/", "src/features/tool-shell/"],
    },
];

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
            continue;
        }
        if (entry.isFile() && TEXT_FILE_PATTERN.test(entry.name)) {
            files.push(fullPath);
        }
    }

    return files;
}

function toRelative(file) {
    return path.relative(ROOT, file).replace(/\\/g, "/");
}

function stripTypeOnlyImports(source) {
    return source
        .replace(/^\s*import\s+type\s+[^;]+;?\s*$/gm, "")
        .replace(/^\s*import\s+\{[^}]*\btype\b[^}]*\}\s+from\s+["'][^"']+["'];?\s*$/gm, "")
        .replace(/\btypeof\s+import\(\s*["'][^"']+["']\s*\)/g, "unknown");
}

function dependencyUsedAtRuntime(source, packageName) {
    const runtimeSource = stripTypeOnlyImports(source);
    const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const staticImport = new RegExp(`\\bimport\\s+(?!type\\b)[\\s\\S]*?from\\s+["']${escaped}["']`);
    const sideEffectImport = new RegExp(`\\bimport\\s+["']${escaped}["']`);
    const dynamicImport = new RegExp(`\\bimport\\(\\s*["']${escaped}["']\\s*\\)`);
    const requireCall = new RegExp(`\\brequire\\(\\s*["']${escaped}["']\\s*\\)`);
    return staticImport.test(runtimeSource) || sideEffectImport.test(runtimeSource) || dynamicImport.test(runtimeSource) || requireCall.test(runtimeSource);
}

function dependencyUsedStatically(source, packageName) {
    const runtimeSource = stripTypeOnlyImports(source);
    const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const staticImportLine = new RegExp(`^\\s*import\\s+(?!type\\b).*?(?:from\\s+["']${escaped}["']|["']${escaped}["'])`);
    const requireCallLine = new RegExp(`\\brequire\\(\\s*["']${escaped}["']\\s*\\)`);
    return runtimeSource.split(/\r?\n/).some((line) => staticImportLine.test(line) || requireCallLine.test(line));
}

function dependencyUsedDynamically(source, packageName) {
    const runtimeSource = stripTypeOnlyImports(source);
    const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\bimport\\(\\s*["']${escaped}["']\\s*\\)`).test(runtimeSource);
}

const files = walk(SOURCE_ROOT).map((file) => ({
    relativePath: toRelative(file),
    source: fs.readFileSync(file, "utf8"),
}));

const failures = [];

for (const rule of HEAVY_DEPENDENCY_RULES) {
    const hits = files.filter((file) => dependencyUsedAtRuntime(file.source, rule.packageName));

    if (rule.allowedFiles) {
        const allowed = new Set(rule.allowedFiles);
        const unexpected = hits.filter((file) => !allowed.has(file.relativePath));
        for (const file of unexpected) {
            failures.push(`${file.relativePath}: unexpected ${rule.packageName} import. ${rule.description}`);
        }
    }

    if (rule.disallowedPathPrefixes) {
        const disallowed = hits.filter((file) => rule.disallowedPathPrefixes.some((prefix) => file.relativePath.startsWith(prefix)));
        for (const file of disallowed) {
            failures.push(`${file.relativePath}: disallowed ${rule.packageName} import. ${rule.description}`);
        }
    }

    if (rule.requireDynamicRuntimeImport) {
        for (const file of hits) {
            if (dependencyUsedStatically(file.source, rule.packageName) || !dependencyUsedDynamically(file.source, rule.packageName)) {
                failures.push(`${file.relativePath}: ${rule.packageName} must be loaded with import(...). ${rule.description}`);
            }
        }
    }
}

if (failures.length > 0) {
    console.error(`[check:bundle-boundaries] FAILED: ${failures.length} bundle boundary violation(s).`);
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log("[check:bundle-boundaries] OK: heavy dependencies stay behind approved lazy boundaries.");
