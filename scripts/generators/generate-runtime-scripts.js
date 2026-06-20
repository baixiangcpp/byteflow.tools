#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "../..")
const CHECK_ONLY = process.argv.includes("--check")

const I18N_SOURCE_PATH = path.join(ROOT, "src/core/i18n/i18n.ts")
const PWA_CONSTANTS_PATH = path.join(ROOT, "src/core/pwa/constants.ts")
const ROOT_LOCALE_REDIRECT_PATH = path.join(ROOT, "public/runtime/root-locale-redirect.js")
const THEME_MANIFEST_BOOTSTRAP_PATH = path.join(ROOT, "public/runtime/theme-manifest-bootstrap.js")

function toRepoPath(filePath) {
    return path.relative(ROOT, filePath).replace(/\\/g, "/")
}

function readSource(filePath) {
    return fs.readFileSync(filePath, "utf8")
}

function parseStringLiteral(source, name, filePath) {
    const match = source.match(new RegExp(`export const ${name}(?:: [^=]+)? = "([^"]+)"`))
    if (!match) {
        throw new Error(`[generate:runtime-scripts] Could not parse ${name} from ${toRepoPath(filePath)}`)
    }
    return match[1]
}

function parseLocales(source) {
    const match = source.match(/export const LOCALES = (\[[\s\S]*?\]) as const/)
    if (!match) {
        throw new Error(`[generate:runtime-scripts] Could not parse LOCALES from ${toRepoPath(I18N_SOURCE_PATH)}`)
    }

    const locales = JSON.parse(match[1])
    if (!Array.isArray(locales) || locales.some((locale) => typeof locale !== "string" || locale.length === 0)) {
        throw new Error("[generate:runtime-scripts] LOCALES must be a non-empty string array")
    }

    return locales
}

function readRuntimeScriptConfig() {
    const i18nSource = readSource(I18N_SOURCE_PATH)
    const pwaSource = readSource(PWA_CONSTANTS_PATH)
    const locales = parseLocales(i18nSource)
    const defaultLocale = parseStringLiteral(i18nSource, "DEFAULT_LOCALE", I18N_SOURCE_PATH)
    const darkThemeColor = parseStringLiteral(pwaSource, "PWA_THEME_COLOR", PWA_CONSTANTS_PATH)
    const lightThemeColor = parseStringLiteral(pwaSource, "PWA_THEME_COLOR_LIGHT", PWA_CONSTANTS_PATH)

    if (!locales.includes(defaultLocale)) {
        throw new Error(`[generate:runtime-scripts] DEFAULT_LOCALE ${defaultLocale} is not in LOCALES`)
    }

    return {
        locales,
        defaultLocale,
        darkThemeColor,
        lightThemeColor,
    }
}

function json(value) {
    return JSON.stringify(value)
}

function buildLocaleDetectionLines(locales, defaultLocale) {
    const localeSet = new Set(locales)
    const lines = [`    var raw = (navigator.language || ${json(defaultLocale)}).toLowerCase();`]

    if (localeSet.has("zh-CN")) {
        lines.push('    if (raw === "zh-cn" || raw === "zh-sg") return "zh-CN";')
    }
    if (localeSet.has("zh-TW")) {
        lines.push('    if (raw === "zh-tw" || raw === "zh-hk" || raw === "zh-mo") return "zh-TW";')
    }
    if (localeSet.has("zh-CN")) {
        lines.push('    if (raw === "zh" || raw.indexOf("zh-") === 0) return "zh-CN";')
    } else if (localeSet.has("zh-TW")) {
        lines.push('    if (raw === "zh" || raw.indexOf("zh-") === 0) return "zh-TW";')
    }

    for (const locale of locales) {
        if (locale === defaultLocale || locale.startsWith("zh-")) continue
        const browserPrefix = locale.toLowerCase().split("-")[0]
        lines.push(`    if (raw.indexOf(${json(browserPrefix)}) === 0) return ${json(locale)};`)
    }

    lines.push(`    return ${json(defaultLocale)};`)
    return lines.join("\n")
}

function buildRootLocaleRedirectScript(config) {
    const supported = json(config.locales)
    const defaultLocale = json(config.defaultLocale)

    return `(function () {
  var supported = ${supported};
  var lang = ${defaultLocale};

  function detectBrowserLocale() {
${buildLocaleDetectionLines(config.locales, config.defaultLocale)}
  }

  try {
    var saved = localStorage.getItem("byteflow:preferred-locale");
    lang = saved && supported.indexOf(saved) >= 0 ? saved : detectBrowserLocale();
  } catch {
    lang = detectBrowserLocale();
  }

  if (supported.indexOf(lang) < 0) lang = ${defaultLocale};

  var search = window.location.search || "";
  var hash = window.location.hash || "";
  if (search.indexOf("handoff=") >= 0 || search.indexOf("handoff_ref=") >= 0) {
    hash = "#" + search.slice(1);
    search = "";
  }

  window.location.replace("/" + lang + search + hash);
})();
`
}

function buildThemeManifestBootstrapScript(config) {
    const locales = json(config.locales)
    const defaultLocale = json(config.defaultLocale)
    const lightThemeColor = json(config.lightThemeColor)
    const darkThemeColor = json(config.darkThemeColor)

    return `(function () {
  try {
    var locales = ${locales};
    var p = window.location.pathname || "/";
    var seg = p.split("/").filter(Boolean)[0];
    var activeLang = locales.indexOf(seg) >= 0 ? seg : ${defaultLocale};
    document.documentElement.setAttribute("lang", activeLang);

    var t = localStorage.getItem("theme");
    if (!t) {
      var m = document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);
      t = m ? m[1] : null;
    }
    if (!t) t = "dark";
    if (t === "system") {
      t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;

    var manifestHref = activeLang === ${defaultLocale} ? "/manifest.json" : "/manifest." + activeLang + ".json";
    var manifestLink = document.getElementById("app-manifest");
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.id = "app-manifest";
      manifestLink.rel = "manifest";
      var currentScript = document.currentScript;
      if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(manifestLink, currentScript.nextSibling);
      } else {
        document.head.appendChild(manifestLink);
      }
    }
    manifestLink.href = manifestHref;

    var themeColor = t === "light" ? ${lightThemeColor} : ${darkThemeColor};
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", themeColor);
  } catch {}
})();
`
}

function buildRuntimeScripts() {
    const config = readRuntimeScriptConfig()
    return [
        {
            label: "root-locale-redirect",
            outputPath: ROOT_LOCALE_REDIRECT_PATH,
            source: buildRootLocaleRedirectScript(config),
        },
        {
            label: "theme-manifest-bootstrap",
            outputPath: THEME_MANIFEST_BOOTSTRAP_PATH,
            source: buildThemeManifestBootstrapScript(config),
        },
    ]
}

function runCheck(runtimeScripts) {
    const staleFiles = runtimeScripts
        .filter(({ outputPath, source }) => !fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== source)
        .map(({ outputPath }) => toRepoPath(outputPath))

    if (staleFiles.length > 0) {
        console.error("[check:runtime-scripts] FAILED: runtime scripts are stale. Run npm run generate:runtime-scripts.")
        for (const file of staleFiles) {
            console.error(`- ${file}`)
        }
        process.exit(1)
    }

    console.log("[check:runtime-scripts] OK")
}

function main() {
    const runtimeScripts = buildRuntimeScripts()
    if (!CHECK_ONLY) {
        for (const { outputPath, source } of runtimeScripts) {
            fs.writeFileSync(outputPath, source, "utf8")
            console.log(`[generate:runtime-scripts] wrote ${toRepoPath(outputPath)}`)
        }
    }

    runCheck(runtimeScripts)
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
    main()
}

export {
    buildRootLocaleRedirectScript,
    buildRuntimeScripts,
    buildThemeManifestBootstrapScript,
    readRuntimeScriptConfig,
    runCheck,
}
