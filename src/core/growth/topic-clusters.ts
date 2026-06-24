import type { Locale } from "@/core/i18n/i18n"
import type { PrimaryMenuGroupKey } from "@/core/registry/menu-groups"
import type { WorkflowSlug } from "@/core/workflows/workflow-hubs"

export type TopicClusterId =
    | "json-structured-data"
    | "api-http-openapi"
    | "jwt-auth-crypto-certificates"
    | "logs-devops-incident-handoff"
    | "text-regex-unicode"
    | "images-svg-css"
    | "generators-ids-test-data"
    | "social-metadata-content-ops"

export type TopicCluster = {
    id: TopicClusterId
    pillarGroupKey: PrimaryMenuGroupKey
    pillarSlug: string
    title: string
    intent: string
    primaryToolKeys: string[]
    workflowSlugs: WorkflowSlug[]
    supportingArticleSlugs: string[]
    adjacentClusterIds: TopicClusterId[]
}

export const TOPIC_CLUSTERS: readonly TopicCluster[] = [
    {
        id: "json-structured-data",
        pillarGroupKey: "data_code_formats",
        pillarSlug: "data-code-formats",
        title: "JSON and structured data ecosystem",
        intent: "Format, validate, compare, query, and convert structured data locally before sharing API or config examples.",
        primaryToolKeys: ["json_formatter", "json_diff_viewer", "json_to_typescript", "jsonpath_playground", "yaml_json_converter"],
        workflowSlugs: ["api-payload-cleanup", "json-typescript-contract-review"],
        supportingArticleSlugs: ["json-formatting-errors", "json-vs-json5-differences", "validate-json-before-api-requests", "json-schema-validation-checklist"],
        adjacentClusterIds: ["api-http-openapi", "logs-devops-incident-handoff"],
    },
    {
        id: "api-http-openapi",
        pillarGroupKey: "web_api_network",
        pillarSlug: "web-api-network",
        title: "API debugging, HTTP, and OpenAPI",
        intent: "Inspect request structure, status codes, headers, cURL handoff, and OpenAPI examples without sending secrets through a backend proxy.",
        primaryToolKeys: ["http_request_builder", "curl_to_code", "openapi_viewer", "openapi_mock", "http_status_codes"],
        workflowSlugs: ["api-payload-cleanup", "log-scrub-before-sharing"],
        supportingArticleSlugs: ["api-auth-header-mistakes", "convert-curl-to-fetch-python", "mock-openapi-quickly", "openapi-debugging-workflow-checklist"],
        adjacentClusterIds: ["json-structured-data", "jwt-auth-crypto-certificates"],
    },
    {
        id: "jwt-auth-crypto-certificates",
        pillarGroupKey: "encoding_crypto",
        pillarSlug: "encoding-crypto",
        title: "JWT, auth, crypto, and certificates",
        intent: "Decode, verify, inspect, and redact token-adjacent material while keeping signature verification separate from readable decoding.",
        primaryToolKeys: ["jwt_decoder", "jwt_verifier", "jwt_workbench", "certificate_decoder", "public_key_jwk_helper"],
        workflowSlugs: ["security-token-review"],
        supportingArticleSlugs: ["jwt-security-best-practices-for-token-handling", "certificate-chain-basics-for-developers", "hash-functions-compared-md5-vs-sha256-vs-sha512"],
        adjacentClusterIds: ["api-http-openapi", "logs-devops-incident-handoff"],
    },
    {
        id: "logs-devops-incident-handoff",
        pillarGroupKey: "devops_logs",
        pillarSlug: "devops-logs",
        title: "Logs, DevOps, and incident handoff",
        intent: "Parse, scrub, diff, and package operational evidence before sharing it in an issue, chat, or incident review.",
        primaryToolKeys: ["log_scrubber", "local_log_parser", "har_viewer_sanitizer", "env_parser", "text_diff_checker"],
        workflowSlugs: ["log-scrub-before-sharing"],
        supportingArticleSlugs: ["api-auth-header-mistakes", "openapi-debugging-workflow-checklist", "dns-records-uptime", "csp-mistakes-that-break-production"],
        adjacentClusterIds: ["api-http-openapi", "text-regex-unicode"],
    },
    {
        id: "text-regex-unicode",
        pillarGroupKey: "text_regex",
        pillarSlug: "text-regex",
        title: "Text, regex, and Unicode",
        intent: "Inspect strings, invisible characters, regex behavior, markdown, and text diffs before data is copied into code or tickets.",
        primaryToolKeys: ["regex_tester", "regex_generator", "unicode_inspector", "text_diff_checker", "markdown_preview"],
        workflowSlugs: ["log-scrub-before-sharing"],
        supportingArticleSlugs: ["url-encoding-explained-common-mistakes-and-solutions", "base64-encoding-when-and-how-to-use-it", "robots-txt-testing-checklist"],
        adjacentClusterIds: ["json-structured-data", "logs-devops-incident-handoff"],
    },
    {
        id: "images-svg-css",
        pillarGroupKey: "images_svg_css",
        pillarSlug: "images-svg-css",
        title: "Images, SVG, and CSS generators",
        intent: "Resize, optimize, inspect colors, generate CSS, and prepare media assets locally before publishing or sharing.",
        primaryToolKeys: ["image_resizer", "image_cropper", "svg_optimizer", "css_gradient_generator", "code_to_image_converter"],
        workflowSlugs: ["image-resize-social-export"],
        supportingArticleSlugs: ["image-optimization-for-web-complete-workflow", "color-extraction-from-images-use-cases-and-tools", "svg-optimization-and-conversion-best-practices", "image-privacy-how-to-censor-and-protect-images"],
        adjacentClusterIds: ["social-metadata-content-ops", "generators-ids-test-data"],
    },
    {
        id: "generators-ids-test-data",
        pillarGroupKey: "generators_calculators",
        pillarSlug: "generators-calculators",
        title: "Generators, IDs, and QA test data",
        intent: "Create identifiers, timestamps, fake test values, QR codes, and fixtures without writing generated payloads to cloud history.",
        primaryToolKeys: ["uuid_generator", "id_generator", "password_generator", "fake_iban_generator", "unix_timestamp"],
        workflowSlugs: ["json-typescript-contract-review"],
        supportingArticleSlugs: ["hash-functions-compared-md5-vs-sha256-vs-sha512", "base64-encoding-when-and-how-to-use-it", "validate-json-before-api-requests"],
        adjacentClusterIds: ["json-structured-data", "images-svg-css"],
    },
    {
        id: "social-metadata-content-ops",
        pillarGroupKey: "social_metadata",
        pillarSlug: "social-metadata",
        title: "Social metadata and content operations",
        intent: "Generate Open Graph metadata, preview social assets, and prepare content operations with explicit external-request boundaries.",
        primaryToolKeys: ["open_graph_meta_generator", "tweet_generator", "tweet_to_image_converter", "youtube_thumbnail_grabber", "vimeo_thumbnail_grabber"],
        workflowSlugs: ["image-resize-social-export"],
        supportingArticleSlugs: ["image-optimization-for-web-complete-workflow", "image-privacy-how-to-censor-and-protect-images", "color-extraction-from-images-use-cases-and-tools"],
        adjacentClusterIds: ["images-svg-css", "api-http-openapi"],
    },
]

export type LocalizedSeoLocaleStrategy = {
    locale: Exclude<Locale, "en">
    searchBehavior: string
    keywordMap: Record<TopicClusterId, string[]>
    copyRequirements: string[]
}

const COPY_REQUIREMENTS = [
    "Use localized titles, descriptions, H1 text, body examples, FAQ copy, and schema-visible values.",
    "Link to localized tool, workflow, and guide URLs instead of English fallback pages.",
    "Preserve the privacy-first browser-local promise without claiming server-side processing.",
]

export const LOCALIZED_SEO_STRATEGY: readonly LocalizedSeoLocaleStrategy[] = [
    {
        locale: "zh-CN",
        searchBehavior: "Prefer concise Simplified Chinese technical queries mixed with English acronyms such as JSON, JWT, API, Base64, SVG, and OpenAPI.",
        keywordMap: {
            "json-structured-data": ["JSON 格式化", "JSON 校验", "JSON 对比"],
            "api-http-openapi": ["API 调试", "HTTP 请求生成", "OpenAPI 查看器"],
            "jwt-auth-crypto-certificates": ["JWT 解码", "JWT 验签", "证书解析"],
            "logs-devops-incident-handoff": ["日志脱敏", "HAR 清理", "环境变量解析"],
            "text-regex-unicode": ["正则测试", "Unicode 检查", "文本对比"],
            "images-svg-css": ["图片压缩", "SVG 优化", "CSS 生成器"],
            "generators-ids-test-data": ["UUID 生成器", "测试数据生成", "时间戳转换"],
            "social-metadata-content-ops": ["Open Graph 生成", "社交预览", "缩略图提取"],
        },
        copyRequirements: COPY_REQUIREMENTS,
    },
    {
        locale: "zh-TW",
        searchBehavior: "Use Traditional Chinese phrasing while preserving common English protocol names and developer acronyms.",
        keywordMap: {
            "json-structured-data": ["JSON 格式化", "JSON 驗證", "JSON 比對"],
            "api-http-openapi": ["API 偵錯", "HTTP 請求產生", "OpenAPI 檢視器"],
            "jwt-auth-crypto-certificates": ["JWT 解碼", "JWT 驗簽", "憑證解析"],
            "logs-devops-incident-handoff": ["記錄脫敏", "HAR 清理", "環境變數解析"],
            "text-regex-unicode": ["正則測試", "Unicode 檢查", "文字比對"],
            "images-svg-css": ["圖片調整", "SVG 最佳化", "CSS 產生器"],
            "generators-ids-test-data": ["UUID 產生器", "測試資料產生", "時間戳轉換"],
            "social-metadata-content-ops": ["Open Graph 產生", "社群預覽", "縮圖擷取"],
        },
        copyRequirements: COPY_REQUIREMENTS,
    },
    {
        locale: "ja",
        searchBehavior: "Use natural Japanese task phrases with English acronyms retained for exact tool intent.",
        keywordMap: {
            "json-structured-data": ["JSON 整形", "JSON 検証", "JSON 差分"],
            "api-http-openapi": ["API デバッグ", "HTTP リクエスト生成", "OpenAPI ビューア"],
            "jwt-auth-crypto-certificates": ["JWT デコード", "JWT 検証", "証明書解析"],
            "logs-devops-incident-handoff": ["ログマスク", "HAR サニタイズ", "環境変数解析"],
            "text-regex-unicode": ["正規表現テスト", "Unicode 検査", "テキスト差分"],
            "images-svg-css": ["画像リサイズ", "SVG 最適化", "CSS ジェネレーター"],
            "generators-ids-test-data": ["UUID 生成", "テストデータ生成", "タイムスタンプ変換"],
            "social-metadata-content-ops": ["Open Graph 生成", "SNS プレビュー", "サムネイル取得"],
        },
        copyRequirements: COPY_REQUIREMENTS,
    },
    {
        locale: "ko",
        searchBehavior: "Use Korean task terms with product and protocol acronyms kept in their common English form.",
        keywordMap: {
            "json-structured-data": ["JSON 포맷터", "JSON 검증", "JSON 비교"],
            "api-http-openapi": ["API 디버깅", "HTTP 요청 생성", "OpenAPI 뷰어"],
            "jwt-auth-crypto-certificates": ["JWT 디코더", "JWT 검증", "인증서 분석"],
            "logs-devops-incident-handoff": ["로그 마스킹", "HAR 정리", "환경 변수 파싱"],
            "text-regex-unicode": ["정규식 테스트", "Unicode 검사", "텍스트 비교"],
            "images-svg-css": ["이미지 리사이즈", "SVG 최적화", "CSS 생성기"],
            "generators-ids-test-data": ["UUID 생성기", "테스트 데이터 생성", "타임스탬프 변환"],
            "social-metadata-content-ops": ["Open Graph 생성", "소셜 미리보기", "썸네일 추출"],
        },
        copyRequirements: COPY_REQUIREMENTS,
    },
    {
        locale: "de",
        searchBehavior: "Use German nouns for tasks, but keep established developer tokens like JSON, JWT, API, OpenAPI, and SVG.",
        keywordMap: {
            "json-structured-data": ["JSON formatieren", "JSON validieren", "JSON vergleichen"],
            "api-http-openapi": ["API Debugging", "HTTP Request Generator", "OpenAPI Viewer"],
            "jwt-auth-crypto-certificates": ["JWT Decoder", "JWT verifizieren", "Zertifikat analysieren"],
            "logs-devops-incident-handoff": ["Logs anonymisieren", "HAR bereinigen", "Umgebungsvariablen parsen"],
            "text-regex-unicode": ["Regex testen", "Unicode prüfen", "Text vergleichen"],
            "images-svg-css": ["Bild skalieren", "SVG optimieren", "CSS Generator"],
            "generators-ids-test-data": ["UUID Generator", "Testdaten erzeugen", "Timestamp umrechnen"],
            "social-metadata-content-ops": ["Open Graph Generator", "Social Preview", "Thumbnail abrufen"],
        },
        copyRequirements: COPY_REQUIREMENTS,
    },
    {
        locale: "fr",
        searchBehavior: "Use French task phrasing with common developer acronyms retained for precision.",
        keywordMap: {
            "json-structured-data": ["formater JSON", "valider JSON", "comparer JSON"],
            "api-http-openapi": ["débogage API", "générateur requête HTTP", "visualiseur OpenAPI"],
            "jwt-auth-crypto-certificates": ["décodeur JWT", "vérifier JWT", "analyse certificat"],
            "logs-devops-incident-handoff": ["masquer logs", "nettoyer HAR", "analyser variables env"],
            "text-regex-unicode": ["tester regex", "inspecter Unicode", "comparer texte"],
            "images-svg-css": ["redimensionner image", "optimiser SVG", "générateur CSS"],
            "generators-ids-test-data": ["générateur UUID", "données de test", "convertir timestamp"],
            "social-metadata-content-ops": ["générateur Open Graph", "prévisualisation sociale", "extraire miniature"],
        },
        copyRequirements: COPY_REQUIREMENTS,
    },
]

export const TOPIC_CLUSTER_ROADMAP = [
    {
        window: "30 days",
        focus: "Refresh the pillar pages and top tool guides in each cluster with concrete examples, error cases, and localized metadata checks.",
    },
    {
        window: "60 days",
        focus: "Publish or expand supporting articles for long-tail fix, how-to, comparison, and workflow queries in each cluster.",
    },
    {
        window: "90 days",
        focus: "Use aggregate Search Console clusters to prioritize localized rewrites and add internal links from high-impression pages.",
    },
] as const

export const TOPIC_CLUSTER_UI_COPY: Record<Locale, {
    eyebrow: string
    supportingGuides: string
}> = {
    en: {
        eyebrow: "Topic cluster",
        supportingGuides: "Supporting guides",
    },
    "zh-CN": {
        eyebrow: "主题集群",
        supportingGuides: "配套指南",
    },
    "zh-TW": {
        eyebrow: "主題集群",
        supportingGuides: "配套指南",
    },
    ja: {
        eyebrow: "トピッククラスター",
        supportingGuides: "関連ガイド",
    },
    ko: {
        eyebrow: "주제 클러스터",
        supportingGuides: "지원 가이드",
    },
    de: {
        eyebrow: "Themencluster",
        supportingGuides: "Ergänzende Leitfäden",
    },
    fr: {
        eyebrow: "Cluster thématique",
        supportingGuides: "Guides associés",
    },
}
