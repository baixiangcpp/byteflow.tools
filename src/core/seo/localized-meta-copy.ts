import type { Locale } from "@/core/i18n/i18n"
import {
    LOCALIZED_ARTICLES,
    getLocalizedArticleDescription,
    getLocalizedArticleTitle,
    type LocalizedArticleSlug,
} from "@/core/seo/localized-articles"

type NonEnglishLocale = Exclude<Locale, "en">

const TITLE_OVERRIDES: Record<string, Partial<Record<NonEnglishLocale, string>>> = {
    "api-auth-header-mistakes": {
        "zh-CN": "常见 API 认证请求头错误",
        "zh-TW": "常見 API 驗證標頭錯誤",
        ja: "API 認証ヘッダーのよくあるミス",
        ko: "흔한 API 인증 헤더 실수",
        de: "Häufige Fehler bei API-Auth-Headern",
        fr: "Erreurs fréquentes des en-têtes d'authentification API",
    },
    "certificate-chain-basics-for-developers": {
        "zh-CN": "开发者证书链基础",
        "zh-TW": "開發者憑證鏈基礎",
        ja: "開発者向け証明書チェーン基礎",
        ko: "개발자를 위한 인증서 체인 기초",
        de: "Grundlagen der Zertifikatskette für Entwickler",
        fr: "Bases de la chaîne de certificats pour les développeurs",
    },
    "convert-curl-to-fetch-python": {
        "zh-CN": "如何将 cURL 转为 fetch/Python",
        "zh-TW": "如何將 cURL 轉為 fetch/Python",
        ja: "cURL を fetch/Python に変換する方法",
        ko: "cURL을 fetch/Python으로 변환하는 방법",
        de: "cURL in fetch/Python umwandeln",
        fr: "Comment convertir cURL en fetch/Python",
    },
    "csp-mistakes-that-break-production": {
        "zh-CN": "会导致生产故障的 CSP 常见错误",
        "zh-TW": "會導致正式環境故障的 CSP 常見錯誤",
        ja: "本番障害を招く CSP のよくあるミス",
        ko: "운영 환경 장애를 부르는 CSP 실수",
        de: "CSP-Fehler, die Produktion lahmlegen",
        fr: "Erreurs CSP qui cassent la production",
    },
    "dns-records-uptime": {
        "zh-CN": "DNS 记录如何影响可用性",
        "zh-TW": "DNS 記錄如何影響可用性",
        ja: "DNS レコードが可用性に与える影響",
        ko: "DNS 레코드가 가용성에 미치는 영향",
        de: "Wie DNS-Records die Verfugbarkeit beeinflussen",
        fr: "Comment les enregistrements DNS affectent la disponibilite",
    },
    "json-formatting-errors": {
        "zh-CN": "JSON 格式错误及修复方法",
        "zh-TW": "JSON 格式錯誤與修復方法",
        ja: "JSON フォーマットエラーと修正方法",
        ko: "JSON 포맷 오류와 해결 방법",
        de: "JSON-Formatierungsfehler und deren Behebung",
        fr: "Erreurs de format JSON et comment les corriger",
    },
    "json-schema-validation-checklist": {
        "zh-CN": "JSON Schema 校验清单",
        "zh-TW": "JSON Schema 驗證檢查清單",
        ja: "JSON Schema バリデーションチェックリスト",
        ko: "JSON Schema 검증 체크리스트",
        de: "JSON-Schema-Validierungscheckliste",
        fr: "Checklist de validation JSON Schema",
    },
    "json-vs-json5-differences": {
        "zh-CN": "JSON 与 JSON5 的差异",
        "zh-TW": "JSON 與 JSON5 差異",
        ja: "JSON と JSON5 の違い",
        ko: "JSON과 JSON5의 차이",
        de: "Unterschiede zwischen JSON und JSON5",
        fr: "Differences entre JSON et JSON5",
    },
    "mock-openapi-quickly": {
        "zh-CN": "如何快速 Mock OpenAPI",
        "zh-TW": "如何快速 Mock OpenAPI",
        ja: "OpenAPI をすばやくモックする方法",
        ko: "OpenAPI를 빠르게 목킹하는 방법",
        de: "OpenAPI schnell mocken",
        fr: "Comment mocker OpenAPI rapidement",
    },
    "openapi-debugging-workflow-checklist": {
        "zh-CN": "OpenAPI 调试流程清单",
        "zh-TW": "OpenAPI 偵錯流程檢查清單",
        ja: "OpenAPI デバッグワークフローチェックリスト",
        ko: "OpenAPI 디버깅 워크플로 체크리스트",
        de: "OpenAPI-Debugging-Workflow-Checkliste",
        fr: "Checklist de workflow de debogage OpenAPI",
    },
    "robots-txt-testing-checklist": {
        "zh-CN": "Robots.txt 测试清单",
        "zh-TW": "Robots.txt 測試檢查清單",
        ja: "Robots.txt テストチェックリスト",
        ko: "Robots.txt 테스트 체크리스트",
        de: "Robots.txt-Testcheckliste",
        fr: "Checklist de test robots.txt",
    },
    "validate-json-before-api-requests": {
        "zh-CN": "API 请求前 JSON 校验指南",
        "zh-TW": "API 請求前 JSON 驗證指南",
        ja: "API リクエスト前に JSON を検証する方法",
        ko: "API 요청 전 JSON 검증 방법",
        de: "JSON vor API-Anfragen validieren",
        fr: "Comment valider le JSON avant les requêtes API",
    },
    "md5-digest-generator": {
        "zh-CN": "MD5 摘要生成器",
        "zh-TW": "MD5 摘要產生器",
        ja: "MD5 ダイジェスト生成",
        ko: "MD5 다이제스트 생성기",
        de: "MD5-Digest-Generator",
        fr: "Générateur de digest MD5",
    },
    "sha1-digest-generator": {
        "zh-CN": "SHA-1 摘要生成器",
        "zh-TW": "SHA-1 摘要產生器",
        ja: "SHA-1 ダイジェスト生成",
        ko: "SHA-1 다이제스트 생성기",
        de: "SHA-1-Digest-Generator",
        fr: "Générateur de digest SHA-1",
    },
    "sha224-digest-generator": {
        "zh-CN": "SHA-224 摘要生成器",
        "zh-TW": "SHA-224 摘要產生器",
        ja: "SHA-224 ダイジェスト生成",
        ko: "SHA-224 다이제스트 생성기",
        de: "SHA-224-Digest-Generator",
        fr: "Générateur de digest SHA-224",
    },
    "sha256-digest-generator": {
        "zh-CN": "SHA-256 摘要生成器",
        "zh-TW": "SHA-256 摘要產生器",
        ja: "SHA-256 ダイジェスト生成",
        ko: "SHA-256 다이제스트 생성기",
        de: "SHA-256-Digest-Generator",
        fr: "Générateur de digest SHA-256",
    },
    "sha384-digest-generator": {
        "zh-CN": "SHA-384 摘要生成器",
        "zh-TW": "SHA-384 摘要產生器",
        ja: "SHA-384 ダイジェスト生成",
        ko: "SHA-384 다이제스트 생성기",
        de: "SHA-384-Digest-Generator",
        fr: "Générateur de digest SHA-384",
    },
    "sha512-digest-generator": {
        "zh-CN": "SHA-512 摘要生成器",
        "zh-TW": "SHA-512 摘要產生器",
        ja: "SHA-512 ダイジェスト生成",
        ko: "SHA-512 다이제스트 생성기",
        de: "SHA-512-Digest-Generator",
        fr: "Générateur de digest SHA-512",
    },
}

const DESCRIPTION_OVERRIDES: Record<string, Partial<Record<NonEnglishLocale, string>>> = {
    "md5-digest-generator": {
        "zh-CN": "在浏览器本地生成 MD5 摘要，用于兼容性校验与历史系统对接。",
        "zh-TW": "在瀏覽器本地產生 MD5 摘要，用於相容性檢查與既有系統維護。",
        ja: "ブラウザ内で MD5 ダイジェストを生成し、互換性確認や既存システム検証に利用できます。",
        ko: "브라우저에서 MD5 다이제스트를 생성해 호환성 점검과 레거시 검증에 활용할 수 있습니다.",
        de: "Erzeugen Sie MD5-Digests lokal im Browser für Kompatibilitätsprüfungen und Legacy-Workflows.",
        fr: "Générez des empreintes MD5 localement dans le navigateur pour les contrôles de compatibilité et les flux hérités.",
    },
    "sha1-digest-generator": {
        "zh-CN": "在浏览器本地生成 SHA-1 摘要用于兼容性检查。SHA-1 不适合新的安全场景。",
        "zh-TW": "在瀏覽器本地產生 SHA-1 摘要用於相容性檢查。SHA-1 不適合新的安全場景。",
        ja: "SHA-1 ダイジェストをブラウザ内で生成できます。SHA-1 は新規のセキュリティ用途には非推奨です。",
        ko: "브라우저에서 SHA-1 다이제스트를 생성할 수 있습니다. SHA-1은 새로운 보안 용도에는 권장되지 않습니다.",
        de: "Erzeugen Sie SHA-1-Digests lokal für Kompatibilitätsprüfungen. Für neue Sicherheitsszenarien ist SHA-1 ungeeignet.",
        fr: "Générez des empreintes SHA-1 localement pour la compatibilité. SHA-1 n'est pas recommandé pour les nouveaux usages de sécurité.",
    },
    "sha224-digest-generator": {
        "zh-CN": "在浏览器本地生成 SHA-224 摘要，用于校验与完整性验证。",
        "zh-TW": "在瀏覽器本地產生 SHA-224 摘要，用於校驗與完整性驗證。",
        ja: "SHA-224 ダイジェストをブラウザ内で生成し、検証や整合性確認に利用できます。",
        ko: "브라우저에서 SHA-224 다이제스트를 생성해 검증과 무결성 확인에 활용할 수 있습니다.",
        de: "Erzeugen Sie SHA-224-Digests lokal im Browser für Prüfsummen und Integritätsprüfungen.",
        fr: "Générez des empreintes SHA-224 localement dans le navigateur pour les contrôles d'intégrité.",
    },
    "sha256-digest-generator": {
        "zh-CN": "在浏览器本地生成 SHA-256 摘要，支持文本、文件与 HMAC 场景。",
        "zh-TW": "在瀏覽器本地產生 SHA-256 摘要，支援文字、檔案與 HMAC 情境。",
        ja: "SHA-256 ダイジェストをブラウザ内で生成し、テキスト・ファイル・HMAC の検証に対応します。",
        ko: "브라우저에서 SHA-256 다이제스트를 생성하고 텍스트, 파일, HMAC 검증에 사용할 수 있습니다.",
        de: "Erzeugen Sie SHA-256-Digests lokal für Text-, Datei- und HMAC-Workflows.",
        fr: "Générez des empreintes SHA-256 localement pour les workflows texte, fichier et HMAC.",
    },
    "sha384-digest-generator": {
        "zh-CN": "在浏览器本地生成 SHA-384 摘要，用于校验、签名与完整性验证。",
        "zh-TW": "在瀏覽器本地產生 SHA-384 摘要，用於校驗、簽章與完整性驗證。",
        ja: "SHA-384 ダイジェストをブラウザ内で生成し、検証・署名・整合性確認に利用できます。",
        ko: "브라우저에서 SHA-384 다이제스트를 생성해 검증, 서명, 무결성 확인에 활용할 수 있습니다.",
        de: "Erzeugen Sie SHA-384-Digests lokal im Browser für Prüfsummen, Signaturen und Integrität.",
        fr: "Générez des empreintes SHA-384 localement pour les contrôles, signatures et vérifications d'intégrité.",
    },
    "sha512-digest-generator": {
        "zh-CN": "在浏览器本地生成 SHA-512 摘要，支持文本、文件、HMAC 与批量处理。",
        "zh-TW": "在瀏覽器本地產生 SHA-512 摘要，支援文字、檔案、HMAC 與批次處理。",
        ja: "SHA-512 ダイジェストをブラウザ内で生成し、テキスト・ファイル・HMAC・一括処理に対応します。",
        ko: "브라우저에서 SHA-512 다이제스트를 생성하고 텍스트, 파일, HMAC, 일괄 처리에 사용할 수 있습니다.",
        de: "Erzeugen Sie SHA-512-Digests lokal für Text-, Datei-, HMAC- und Batch-Workflows.",
        fr: "Générez des empreintes SHA-512 localement pour les workflows texte, fichier, HMAC et par lot.",
    },
}

function getGenericLocalizedDescription(locale: NonEnglishLocale, localizedTitle: string): string {
    if (locale === "zh-CN") return `${localizedTitle}。提供可执行的检查步骤与示例，帮助你快速定位问题。`
    if (locale === "zh-TW") return `${localizedTitle}。提供可執行的檢查步驟與範例，協助你快速定位問題。`
    if (locale === "ja") return `${localizedTitle}。すぐに実行できるチェック手順と例で、原因の切り分けを素早く進められます。`
    if (locale === "ko") return `${localizedTitle}. 바로 실행 가능한 점검 단계와 예시로 원인을 빠르게 좁힐 수 있습니다.`
    if (locale === "de") return `${localizedTitle}. Enthält direkt umsetzbare Prüfschritte und Beispiele, um Ursachen schnell einzugrenzen.`
    return `${localizedTitle}. Inclut des étapes de vérification concrètes et des exemples pour isoler rapidement la cause.`
}

export function getLocalizedMetaCopy({
    slug,
    locale,
    fallbackTitle,
    fallbackDescription,
}: {
    slug: string
    locale: Locale
    fallbackTitle: string
    fallbackDescription: string
}) {
    if (locale === "en") {
        return {
            title: fallbackTitle,
            description: fallbackDescription,
        }
    }

    if (Object.prototype.hasOwnProperty.call(LOCALIZED_ARTICLES, slug)) {
        return {
            title: getLocalizedArticleTitle(slug as LocalizedArticleSlug, locale),
            description: getLocalizedArticleDescription(slug as LocalizedArticleSlug, locale),
        }
    }

    const localizedTitle = TITLE_OVERRIDES[slug]?.[locale] ?? fallbackTitle
    const localizedDescription =
        DESCRIPTION_OVERRIDES[slug]?.[locale] ??
        getGenericLocalizedDescription(locale, localizedTitle)

    return {
        title: localizedTitle,
        description: localizedDescription,
    }
}
