import type { Locale } from "@/core/i18n/i18n"
import type { PrimaryMenuGroupKey } from "@/core/registry/menu-groups"

export type WorkflowSlug =
    | "api-payload-cleanup"
    | "security-token-review"
    | "log-scrub-before-sharing"
    | "image-resize-social-export"
    | "json-typescript-contract-review"

export type WorkflowStep = {
    title: string
    body: string
    toolKey: string
}

export type WorkflowFaq = {
    question: string
    answer: string
}

export type WorkflowDefinition = {
    slug: WorkflowSlug
    title: string
    description: string
    scenario: string
    outcome: string
    primaryGroupKeys: PrimaryMenuGroupKey[]
    relatedToolKeys: string[]
    tutorialSlugs: string[]
    steps: WorkflowStep[]
    safetyNotes: string[]
    faqs: WorkflowFaq[]
    localized?: Partial<Record<Locale, {
        title: string
        description: string
    }>>
}

export type TutorialLink = {
    slug: string
    title: string
    description: string
}

export type CategoryHubContent = {
    groupKey: PrimaryMenuGroupKey
    intro: string
    tasks: string[]
    workflowSlugs: WorkflowSlug[]
    tutorialSlugs: string[]
    faqs: WorkflowFaq[]
}

export const WORKFLOW_DEFINITIONS: readonly WorkflowDefinition[] = [
    {
        slug: "api-payload-cleanup",
        title: "API payload cleanup",
        description: "Validate, convert, diff, and document request payloads before they leave your browser.",
        scenario: "Use this path when an API request body has been copied from logs, staging traffic, or a teammate's example and needs to be normalized before review.",
        outcome: "A formatted payload, a clear schema or type shape, and a short diff that explains exactly what changed.",
        primaryGroupKeys: ["data_code_formats", "web_api_network", "devops_logs"],
        relatedToolKeys: [
            "json_formatter",
            "yaml_json_converter",
            "json_to_typescript",
            "json_schema_workbench",
            "json_diff_viewer",
            "openapi_diff",
            "graphql_workbench",
            "http_request_builder",
        ],
        tutorialSlugs: ["validate-json-before-api-requests", "json-schema-validation-checklist", "convert-curl-to-fetch-python"],
        steps: [
            {
                title: "Normalize the payload",
                body: "Paste representative JSON, YAML, or CSV into the local formatter and remove accidental whitespace, comments, and malformed fields.",
                toolKey: "json_formatter",
            },
            {
                title: "Convert when the source format differs",
                body: "Convert YAML or CSV examples into JSON so the rest of the review uses one predictable structure.",
                toolKey: "yaml_json_converter",
            },
            {
                title: "Create a typed contract",
                body: "Generate TypeScript types from the cleaned payload to reveal optional fields, nested arrays, and unexpected value shapes.",
                toolKey: "json_to_typescript",
            },
            {
                title: "Compare before sharing",
                body: "Diff the original and cleaned versions so reviewers can see only intentional changes.",
                toolKey: "json_diff_viewer",
            },
            {
                title: "Replay the request locally",
                body: "Build the HTTP request after the payload is clean, keeping tokens and private headers out of shared examples.",
                toolKey: "http_request_builder",
            },
        ],
        safetyNotes: [
            "Do not paste production secrets unless you have verified the tool boundary in DevTools Network.",
            "Remove authorization headers, session identifiers, and customer records before sharing cleaned examples.",
            "Keep the final payload local until the team has agreed which fields are safe to send.",
        ],
        faqs: [
            {
                question: "Should I clean the payload before or after generating types?",
                answer: "Clean it first. Type generation is more useful when comments, trailing commas, and accidental wrapper fields have already been removed.",
            },
            {
                question: "Can I use this workflow for YAML and CSV examples?",
                answer: "Yes. Convert the source format into JSON first, then format, type, diff, and replay the request.",
            },
            {
                question: "What should not go into the shared example?",
                answer: "Avoid tokens, account identifiers, production customer records, raw logs, and any field that is not needed to reproduce the API behavior.",
            },
        ],
        localized: {
            "zh-CN": { title: "API payload 清理", description: "在浏览器本地校验、转换、对比并整理 API 请求 payload。" },
            "zh-TW": { title: "API payload 清理", description: "在瀏覽器本地驗證、轉換、比對並整理 API 請求 payload。" },
            ja: { title: "API payload クリーンアップ", description: "API リクエスト payload をブラウザ内で検証、変換、比較、整理します。" },
            ko: { title: "API payload 정리", description: "API 요청 payload를 브라우저에서 검증, 변환, 비교, 정리합니다." },
            de: { title: "API-Payload bereinigen", description: "API-Payloads lokal validieren, konvertieren, vergleichen und dokumentieren." },
            fr: { title: "Nettoyage de payload API", description: "Validez, convertissez, comparez et documentez les payloads API dans le navigateur." },
        },
    },
    {
        slug: "security-token-review",
        title: "Security token review",
        description: "Decode, inspect, and verify token material without confusing decoding with signature verification.",
        scenario: "Use this path before debugging JWT claims, certificates, JWKs, or hash evidence copied from an auth incident or staging integration.",
        outcome: "A separated view of decoded fields, verification status, weak algorithms, expiry timestamps, and supporting certificate material.",
        primaryGroupKeys: ["encoding_crypto", "web_api_network"],
        relatedToolKeys: ["jwt_decoder", "jwt_workbench", "jwt_verifier", "oauth_jwks_workbench", "public_key_jwk_helper", "certificate_decoder", "hash_generator"],
        tutorialSlugs: ["jwt-security-best-practices-for-token-handling", "certificate-chain-basics-for-developers", "hash-functions-compared-md5-vs-sha256-vs-sha512"],
        steps: [
            {
                title: "Decode claims without assuming trust",
                body: "Start with the local token decoder to inspect header and payload fields while keeping signature verification as a separate step.",
                toolKey: "jwt_decoder",
            },
            {
                title: "Check expiry and algorithm risk",
                body: "Review exp, nbf, iat, and alg values, especially none, MD5-era hashes, and tokens copied from untrusted channels.",
                toolKey: "jwt_workbench",
            },
            {
                title: "Verify the signature",
                body: "Use the verifier with the expected secret or public key before treating decoded claims as trustworthy.",
                toolKey: "jwt_verifier",
            },
            {
                title: "Inspect key material",
                body: "Normalize JWKs, public keys, and certificate data when the verification key is unclear.",
                toolKey: "public_key_jwk_helper",
            },
        ],
        safetyNotes: [
            "Decoded JWT claims are not verified claims until the signature has been checked.",
            "Never persist production tokens in notes, browser storage, screenshots, or analytics payloads.",
            "Treat alg none and unexpected key IDs as security findings until proven otherwise.",
        ],
        faqs: [
            {
                question: "Does decoding a JWT prove it is valid?",
                answer: "No. Decoding only makes the header and payload readable. Verification requires the expected algorithm and key material.",
            },
            {
                question: "When should I inspect certificates in this workflow?",
                answer: "Inspect certificates when the signing key chain, public key format, or issuer data is part of the verification question.",
            },
            {
                question: "Can I share decoded claims with teammates?",
                answer: "Share only redacted claims that are necessary for the review. Remove tokens, subject identifiers, emails, and organization-specific secrets.",
            },
        ],
        localized: {
            "zh-CN": { title: "安全令牌检查", description: "区分 JWT 解码与签名验证，在本地检查 token、证书和 key material。" },
            "zh-TW": { title: "安全權杖檢查", description: "區分 JWT 解碼與簽章驗證，在本地檢查 token、憑證與 key material。" },
            ja: { title: "セキュリティトークン確認", description: "JWT のデコードと署名検証を分けて、トークンと鍵素材を確認します。" },
            ko: { title: "보안 토큰 검토", description: "JWT 디코딩과 서명 검증을 구분해 토큰과 키 자료를 확인합니다." },
            de: { title: "Security-Token prüfen", description: "Token, Zertifikate und Schlüsselmaterial lokal prüfen, ohne Decode mit Verify zu verwechseln." },
            fr: { title: "Revue de token sécurité", description: "Inspectez tokens, certificats et clés en séparant décodage et vérification." },
        },
    },
    {
        slug: "log-scrub-before-sharing",
        title: "Log scrub before sharing",
        description: "Parse logs, remove secrets, and compare sanitized output before posting it to an issue or chat.",
        scenario: "Use this path when a stack trace, HAR export, environment file, or application log needs to be shared outside the original incident channel.",
        outcome: "A minimized log excerpt with secrets removed, timestamps preserved, and a diff that confirms the redaction pass.",
        primaryGroupKeys: ["devops_logs", "text_regex", "web_api_network"],
        relatedToolKeys: ["log_scrubber", "local_log_parser", "har_viewer_sanitizer", "text_diff_checker", "env_parser"],
        tutorialSlugs: ["api-auth-header-mistakes", "openapi-debugging-workflow-checklist", "dns-records-uptime"],
        steps: [
            {
                title: "Extract the useful slice",
                body: "Trim unrelated lines so the shared sample contains the failing request, timestamp window, and nearby context only.",
                toolKey: "local_log_parser",
            },
            {
                title: "Redact common secrets",
                body: "Run the log through local scrubbing rules for bearer tokens, API keys, cookies, emails, and private identifiers.",
                toolKey: "log_scrubber",
            },
            {
                title: "Sanitize network captures",
                body: "If the evidence is a HAR file, remove sensitive headers and request bodies before exporting a reduced artifact.",
                toolKey: "har_viewer_sanitizer",
            },
            {
                title: "Verify the redaction diff",
                body: "Compare original and scrubbed text so only expected sensitive fields changed.",
                toolKey: "text_diff_checker",
            },
        ],
        safetyNotes: [
            "Do not rely on a single redaction pass for incident data. Review the diff before sharing.",
            "Remove cookies, authorization headers, user identifiers, file paths, and environment-specific hostnames when they are not required.",
            "Keep raw logs in the original secure incident channel and share only the scrubbed excerpt.",
        ],
        faqs: [
            {
                question: "Can this workflow guarantee every secret is removed?",
                answer: "No automated scrubber can guarantee that. Use the redaction pass, then inspect the diff and the final excerpt manually.",
            },
            {
                question: "Should file names be kept in shared logs?",
                answer: "Keep only file names that are necessary to understand the failure. Remove user names, private paths, and customer identifiers.",
            },
            {
                question: "When should I sanitize a HAR file instead of plain text?",
                answer: "Use the HAR sanitizer when the evidence includes browser requests, headers, timings, or response metadata.",
            },
        ],
        localized: {
            "zh-CN": { title: "分享前清理日志", description: "在本地解析日志、移除敏感信息，并在分享前对比清理结果。" },
            "zh-TW": { title: "分享前清理記錄", description: "在本地解析記錄、移除敏感資訊，並在分享前比對清理結果。" },
            ja: { title: "共有前のログ消去", description: "ログを解析し、秘密情報を削除し、共有前に差分を確認します。" },
            ko: { title: "공유 전 로그 정리", description: "로그를 파싱하고 민감 정보를 제거한 뒤 공유 전 차이를 확인합니다." },
            de: { title: "Logs vor dem Teilen bereinigen", description: "Logs lokal parsen, Geheimnisse entfernen und das bereinigte Ergebnis vergleichen." },
            fr: { title: "Nettoyer les logs avant partage", description: "Analysez les logs, retirez les secrets et comparez le résultat avant partage." },
        },
    },
    {
        slug: "image-resize-social-export",
        title: "Image resize and social export",
        description: "Resize, crop, optimize, and generate social metadata assets with local image processing first.",
        scenario: "Use this path when a product image, screenshot, or social preview needs consistent dimensions before publishing.",
        outcome: "A resized image asset, optional crop variants, extracted colors, and social metadata ready for inspection.",
        primaryGroupKeys: ["images_svg_css", "social_metadata"],
        relatedToolKeys: ["image_privacy_workbench", "image_resizer", "image_cropper", "image_color_extractor", "open_graph_meta_generator", "seo_metadata_workbench", "code_to_image_converter"],
        tutorialSlugs: ["image-optimization-for-web-complete-workflow", "image-privacy-how-to-censor-and-protect-images", "color-extraction-from-images-use-cases-and-tools"],
        steps: [
            {
                title: "Remove private details first",
                body: "Strip metadata and review screenshots for visible secrets before resizing, cropping, or preparing share assets.",
                toolKey: "image_privacy_workbench",
            },
            {
                title: "Resize to the target surface",
                body: "Start with the final placement, such as Open Graph, app icon, blog header, or documentation screenshot.",
                toolKey: "image_resizer",
            },
            {
                title: "Crop only after resizing intent is clear",
                body: "Create a deliberate crop for the social or documentation surface instead of relying on platform defaults.",
                toolKey: "image_cropper",
            },
            {
                title: "Extract visual cues",
                body: "Pull colors from the final image when the preview card or CSS accent needs to match the asset.",
                toolKey: "image_color_extractor",
            },
            {
                title: "Generate metadata preview",
                body: "Create and inspect Open Graph metadata so title, description, and image dimensions align.",
                toolKey: "open_graph_meta_generator",
            },
        ],
        safetyNotes: [
            "Review screenshots for emails, tokens, private tabs, and internal hostnames before export.",
            "Do not upload private image content to external services unless the workflow and policy allow it.",
            "Prefer local redaction before resizing if the image includes sensitive interface state.",
        ],
        faqs: [
            {
                question: "Should I redact before or after resizing?",
                answer: "Redact first. Resizing can make sensitive details harder to notice during the final review.",
            },
            {
                question: "Which image should be used for social cards?",
                answer: "Use the final inspected export with the target dimensions and enough contrast for small previews.",
            },
            {
                question: "Can color extraction replace design review?",
                answer: "No. Color extraction gives useful candidates, but contrast, brand fit, and readability still need review.",
            },
        ],
        localized: {
            "zh-CN": { title: "图片尺寸与社交导出", description: "本地调整图片尺寸、裁剪、优化，并生成社交分享素材。" },
            "zh-TW": { title: "圖片尺寸與社群匯出", description: "本地調整圖片尺寸、裁切、最佳化，並產生社群分享素材。" },
            ja: { title: "画像リサイズとソーシャル出力", description: "画像をローカルでリサイズ、切り抜き、最適化し、共有素材を作成します。" },
            ko: { title: "이미지 크기 조정 및 소셜 내보내기", description: "이미지를 로컬에서 조정, 자르기, 최적화하고 소셜 자산을 만듭니다." },
            de: { title: "Bildgröße und Social-Export", description: "Bilder lokal zuschneiden, optimieren und Social-Metadata-Assets vorbereiten." },
            fr: { title: "Redimensionnement image et export social", description: "Redimensionnez, recadrez, optimisez et préparez les assets sociaux localement." },
        },
    },
    {
        slug: "json-typescript-contract-review",
        title: "JSON to TypeScript contract review",
        description: "Turn representative JSON into TypeScript, query edge fields, and compare contract changes before implementation.",
        scenario: "Use this path when a backend response, webhook sample, or configuration payload is about to become a frontend or SDK contract.",
        outcome: "A typed model, queried edge cases, and a small change review that separates schema drift from implementation work.",
        primaryGroupKeys: ["data_code_formats", "generators_calculators"],
        relatedToolKeys: ["json_formatter", "json_schema_workbench", "json_to_typescript", "jsonpath_playground", "structured_data_visualizer", "json_diff_viewer", "openapi_diff", "graphql_workbench"],
        tutorialSlugs: ["json-schema-validation-checklist", "json-vs-json5-differences", "validate-json-before-api-requests"],
        steps: [
            {
                title: "Format the representative sample",
                body: "Use a payload with real structure but no private data so optional fields and nested arrays are visible.",
                toolKey: "json_formatter",
            },
            {
                title: "Generate TypeScript types",
                body: "Create the first contract and inspect whether nulls, arrays, and numeric IDs are represented correctly.",
                toolKey: "json_to_typescript",
            },
            {
                title: "Probe edge fields",
                body: "Query nested values and optional branches so the implementation does not rely on one happy path sample.",
                toolKey: "jsonpath_playground",
            },
            {
                title: "Review contract drift",
                body: "Diff old and new payloads or generated types before updating consumers.",
                toolKey: "json_diff_viewer",
            },
        ],
        safetyNotes: [
            "Use representative but scrubbed payloads when building public contracts.",
            "Do not infer security meaning from TypeScript types. Validate authorization and claims separately.",
            "Document nullable and optional fields before code generation becomes a hidden migration.",
        ],
        faqs: [
            {
                question: "Can generated TypeScript replace runtime validation?",
                answer: "No. It improves developer ergonomics, but runtime validation is still needed at trust boundaries.",
            },
            {
                question: "How many samples should I use?",
                answer: "Use at least one normal case and one edge case with optional or nullable fields before treating the contract as stable.",
            },
            {
                question: "When should JSONPath be part of the review?",
                answer: "Use JSONPath when nested arrays or deeply nested fields drive UI behavior or API compatibility decisions.",
            },
        ],
        localized: {
            "zh-CN": { title: "JSON 到 TypeScript 契约检查", description: "把代表性 JSON 转成 TypeScript，并在实现前检查契约变化。" },
            "zh-TW": { title: "JSON 到 TypeScript 契約檢查", description: "將代表性 JSON 轉成 TypeScript，並在實作前檢查契約變化。" },
            ja: { title: "JSON から TypeScript 契約確認", description: "代表的な JSON を TypeScript 化し、実装前に契約差分を確認します。" },
            ko: { title: "JSON to TypeScript 계약 검토", description: "대표 JSON을 TypeScript로 바꾸고 구현 전 계약 변화를 검토합니다." },
            de: { title: "JSON-zu-TypeScript-Vertragsprüfung", description: "JSON in TypeScript überführen und Vertragsänderungen vor der Umsetzung prüfen." },
            fr: { title: "Revue de contrat JSON vers TypeScript", description: "Transformez un JSON représentatif en TypeScript et vérifiez les changements de contrat." },
        },
    },
]

export const WORKFLOW_ROUTE_SLUGS = WORKFLOW_DEFINITIONS.map((workflow) => `workflows/${workflow.slug}` as const)

export const TUTORIAL_LINKS: Record<string, TutorialLink> = {
    "validate-json-before-api-requests": {
        slug: "validate-json-before-api-requests",
        title: "Validate JSON before API requests",
        description: "A checklist for validating request payloads before replaying or sharing them.",
    },
    "json-schema-validation-checklist": {
        slug: "json-schema-validation-checklist",
        title: "JSON Schema validation checklist",
        description: "Review schema coverage, required fields, and compatibility before implementation.",
    },
    "convert-curl-to-fetch-python": {
        slug: "convert-curl-to-fetch-python",
        title: "Convert cURL to fetch and Python",
        description: "Turn captured requests into readable client examples after payload cleanup.",
    },
    "jwt-security-best-practices-for-token-handling": {
        slug: "jwt-security-best-practices-for-token-handling",
        title: "JWT security best practices",
        description: "Avoid common JWT handling mistakes when reviewing decoded or verified tokens.",
    },
    "certificate-chain-basics-for-developers": {
        slug: "certificate-chain-basics-for-developers",
        title: "Certificate chain basics",
        description: "Understand certificate chain fields before debugging key and token verification.",
    },
    "hash-functions-compared-md5-vs-sha256-vs-sha512": {
        slug: "hash-functions-compared-md5-vs-sha256-vs-sha512",
        title: "Hash functions compared",
        description: "Choose hash algorithms deliberately when reviewing evidence or compatibility.",
    },
    "api-auth-header-mistakes": {
        slug: "api-auth-header-mistakes",
        title: "API auth header mistakes",
        description: "Find authorization header mistakes before sharing request examples.",
    },
    "openapi-debugging-workflow-checklist": {
        slug: "openapi-debugging-workflow-checklist",
        title: "OpenAPI debugging workflow checklist",
        description: "Connect request, schema, mock, and documentation checks into one review.",
    },
    "dns-records-uptime": {
        slug: "dns-records-uptime",
        title: "DNS records and uptime",
        description: "Understand DNS evidence before sharing availability or routing notes.",
    },
    "image-optimization-for-web-complete-workflow": {
        slug: "image-optimization-for-web-complete-workflow",
        title: "Image optimization workflow",
        description: "Prepare web images with sizing, compression, and delivery checks.",
    },
    "image-privacy-how-to-censor-and-protect-images": {
        slug: "image-privacy-how-to-censor-and-protect-images",
        title: "Image privacy and redaction",
        description: "Remove sensitive regions before image assets leave the original context.",
    },
    "color-extraction-from-images-use-cases-and-tools": {
        slug: "color-extraction-from-images-use-cases-and-tools",
        title: "Color extraction from images",
        description: "Use extracted colors as candidates for previews, accents, and documentation.",
    },
    "json-vs-json5-differences": {
        slug: "json-vs-json5-differences",
        title: "JSON vs JSON5 differences",
        description: "Know which syntax belongs in strict JSON contracts and which does not.",
    },
}

export const CATEGORY_HUB_CONTENT: Record<PrimaryMenuGroupKey, CategoryHubContent> = {
    data_code_formats: {
        groupKey: "data_code_formats",
        intro: "Use this hub when structured data needs to move from pasted sample to contract, request, or review artifact.",
        tasks: [
            "Normalize JSON, YAML, CSV, XML, and code-shaped data before review.",
            "Generate typed contracts from representative payloads.",
            "Compare payload revisions and explain schema drift before implementation.",
        ],
        workflowSlugs: ["api-payload-cleanup", "json-typescript-contract-review"],
        tutorialSlugs: ["validate-json-before-api-requests", "json-schema-validation-checklist", "json-vs-json5-differences"],
        faqs: [
            {
                question: "Which data sample should start the review?",
                answer: "Use a representative sample that preserves structure while removing secrets, account identifiers, and production customer records.",
            },
            {
                question: "When should I generate TypeScript types?",
                answer: "Generate types after formatting and cleanup, then diff the contract when payload shape changes.",
            },
        ],
    },
    encoding_crypto: {
        groupKey: "encoding_crypto",
        intro: "Use this hub for encoded payloads, hashes, token material, certificates, and verification tasks.",
        tasks: [
            "Base64 decode, URL decode, and inspect token payloads without treating readable data as trusted data.",
            "Compare hashes and HMAC outputs for integrity and compatibility checks.",
            "Inspect certificates, JWKs, and JWT signatures before sharing conclusions.",
        ],
        workflowSlugs: ["security-token-review", "api-payload-cleanup"],
        tutorialSlugs: ["jwt-security-best-practices-for-token-handling", "certificate-chain-basics-for-developers", "hash-functions-compared-md5-vs-sha256-vs-sha512"],
        faqs: [
            {
                question: "Is decoding the same as verification?",
                answer: "No. Decoding makes data readable. Verification proves the expected key and algorithm signed it.",
            },
            {
                question: "Can encoded payloads contain secrets?",
                answer: "Yes. Treat Base64, JWT, URL, and certificate text as sensitive until you understand what it contains.",
            },
        ],
    },
    web_api_network: {
        groupKey: "web_api_network",
        intro: "Use this hub when API behavior, HTTP headers, OpenAPI definitions, or network evidence need a repeatable review path.",
        tasks: [
            "Build or replay HTTP requests only after payloads and headers have been scrubbed.",
            "Inspect OpenAPI and mock behavior before creating examples for teammates.",
            "Review headers, URLs, robots rules, and network captures with explicit context.",
        ],
        workflowSlugs: ["api-payload-cleanup", "security-token-review", "log-scrub-before-sharing"],
        tutorialSlugs: ["convert-curl-to-fetch-python", "openapi-debugging-workflow-checklist", "api-auth-header-mistakes"],
        faqs: [
            {
                question: "Should I paste production headers into request builders?",
                answer: "No. Replace secrets and user identifiers first, then build the request with safe placeholder values.",
            },
            {
                question: "How do workflow pages help API debugging?",
                answer: "They connect payload cleanup, request replay, schema review, and redaction into a repeatable path.",
            },
        ],
    },
    devops_logs: {
        groupKey: "devops_logs",
        intro: "Use this hub to prepare logs, environment snippets, HAR files, cron expressions, and operational evidence before sharing.",
        tasks: [
            "Trim incident evidence to the smallest useful time window.",
            "Remove tokens, cookies, private hostnames, and environment-specific identifiers.",
            "Compare sanitized output so only intentional redactions changed.",
        ],
        workflowSlugs: ["log-scrub-before-sharing", "api-payload-cleanup"],
        tutorialSlugs: ["api-auth-header-mistakes", "openapi-debugging-workflow-checklist", "dns-records-uptime"],
        faqs: [
            {
                question: "What belongs in a shared log sample?",
                answer: "Keep the error, timestamp, request context, and sanitized fields needed to reproduce the issue.",
            },
            {
                question: "Should raw logs be saved in presets?",
                answer: "No. Keep raw logs out of saved presets and share only reviewed scrubbed excerpts.",
            },
        ],
    },
    text_regex: {
        groupKey: "text_regex",
        intro: "Use this hub for text cleanup, regex validation, markdown review, Unicode inspection, and before-sharing text checks.",
        tasks: [
            "Clean copied text and normalize whitespace before it becomes documentation or a sample payload.",
            "Test regex patterns against scrubbed examples, not production logs.",
            "Compare before and after text so accidental content changes are visible.",
        ],
        workflowSlugs: ["log-scrub-before-sharing", "json-typescript-contract-review"],
        tutorialSlugs: ["json-schema-validation-checklist", "api-auth-header-mistakes", "json-vs-json5-differences"],
        faqs: [
            {
                question: "Can text tools be part of a security review?",
                answer: "Yes. They help normalize, diff, and inspect shared text, but they do not replace manual review.",
            },
            {
                question: "When should I use regex tools in a workflow?",
                answer: "Use them after creating safe sample text so pattern tests do not expose private logs or tokens.",
            },
        ],
    },
    images_svg_css: {
        groupKey: "images_svg_css",
        intro: "Use this hub for local image editing, SVG optimization, CSS asset generation, and visual review before publishing.",
        tasks: [
            "Resize, crop, and inspect images before using them in docs or social previews.",
            "Redact sensitive visual regions before optimization or export.",
            "Generate CSS and SVG assets with predictable dimensions and reusable output.",
        ],
        workflowSlugs: ["image-resize-social-export"],
        tutorialSlugs: ["image-optimization-for-web-complete-workflow", "image-privacy-how-to-censor-and-protect-images", "color-extraction-from-images-use-cases-and-tools"],
        faqs: [
            {
                question: "Should I resize private screenshots before redaction?",
                answer: "No. Redact first, then resize and optimize the safe asset.",
            },
            {
                question: "Which image tools are best for social previews?",
                answer: "Start with resizing and cropping, then generate or inspect Open Graph metadata with the final asset.",
            },
        ],
    },
    generators_calculators: {
        groupKey: "generators_calculators",
        intro: "Use this hub for local IDs, timestamps, QR codes, barcodes, passwords, random lists, and test fixtures.",
        tasks: [
            "Generate stable placeholder values for examples and documentation.",
            "Create timestamps, UUIDs, and random data without embedding real user records.",
            "Prepare repeatable fixture values before contract and payload review.",
        ],
        workflowSlugs: ["json-typescript-contract-review", "api-payload-cleanup"],
        tutorialSlugs: ["json-schema-validation-checklist", "validate-json-before-api-requests", "json-vs-json5-differences"],
        faqs: [
            {
                question: "Can generated values replace real production examples?",
                answer: "Often yes. Generated IDs and timestamps are safer when the exact production value is not needed.",
            },
            {
                question: "Where do generators fit in workflow pages?",
                answer: "They provide safe placeholder values for payload, contract, and documentation examples.",
            },
        ],
    },
    social_metadata: {
        groupKey: "social_metadata",
        intro: "Use this hub for Open Graph metadata, social previews, thumbnails, and share-ready assets.",
        tasks: [
            "Prepare final image dimensions before writing metadata.",
            "Inspect titles, descriptions, and preview assets together.",
            "Avoid sharing private screenshots or unreviewed thumbnails.",
        ],
        workflowSlugs: ["image-resize-social-export"],
        tutorialSlugs: ["image-optimization-for-web-complete-workflow", "image-privacy-how-to-censor-and-protect-images", "color-extraction-from-images-use-cases-and-tools"],
        faqs: [
            {
                question: "What should I check before publishing social metadata?",
                answer: "Check title length, description clarity, image dimensions, contrast, and whether the image reveals private information.",
            },
            {
                question: "Do social metadata tools need external requests?",
                answer: "Most generation is local. Tools that load external preview assets disclose the network boundary when applicable.",
            },
        ],
    },
}

const WORKFLOW_BY_SLUG = new Map(WORKFLOW_DEFINITIONS.map((workflow) => [workflow.slug, workflow]))

export function getWorkflowBySlug(slug: string): WorkflowDefinition | undefined {
    return WORKFLOW_BY_SLUG.get(slug as WorkflowSlug)
}

export function getLocalizedWorkflowCopy(workflow: WorkflowDefinition, locale: Locale) {
    const localized = workflow.localized?.[locale]
    return {
        title: localized?.title ?? workflow.title,
        description: localized?.description ?? workflow.description,
    }
}

export function getWorkflowsForToolKey(toolKey: string): WorkflowDefinition[] {
    return WORKFLOW_DEFINITIONS.filter((workflow) => workflow.relatedToolKeys.includes(toolKey))
}

export function getWorkflowsForGroup(groupKey: PrimaryMenuGroupKey): WorkflowDefinition[] {
    return WORKFLOW_DEFINITIONS.filter((workflow) => workflow.primaryGroupKeys.includes(groupKey))
}

export function getCategoryHubContent(groupKey: PrimaryMenuGroupKey): CategoryHubContent {
    return CATEGORY_HUB_CONTENT[groupKey]
}

export function getTutorialLink(slug: string): TutorialLink | undefined {
    return TUTORIAL_LINKS[slug]
}
