import type { Locale } from "@/core/i18n/i18n"

export type ToolSearchMetadata = {
    aliases?: readonly string[]
    taskSynonyms?: readonly string[]
    categoryTerms?: readonly string[]
    localizedAliases?: Partial<Record<Locale, readonly string[]>>
    popularity?: number
}

const CORE_LOCALIZED_ALIASES: Record<Locale, Record<string, readonly string[]>> = {
    en: {},
    "zh-CN": {
        json_formatter: ["JSON 格式化", "JSON格式化", "JSON 美化", "格式化 JSON", "验证 JSON", "整理 JSON"],
        jwt_decoder: ["JWT 解码", "JWT解码", "令牌解码", "解析 JWT", "解析令牌"],
        base64_encode_decode: ["Base64 解码", "Base64 编码", "base64解码", "base64编码"],
        regex_tester: ["正则 测试", "正则表达式测试", "匹配测试", "测试正则"],
        image_resizer: ["图片 调整大小", "图片缩放", "调整图片尺寸", "图像尺寸"],
        log_scrubber: ["日志 脱敏", "日志清理", "日志敏感信息", "清理日志"],
        qr_code_generator: ["二维码 生成", "QR 码生成", "生成二维码", "制作 QR"],
        password_generator: ["密码 生成", "生成密码", "随机密码", "安全密码"],
    },
    "zh-TW": {
        json_formatter: ["JSON 格式化", "JSON格式化", "JSON 美化", "格式化 JSON", "驗證 JSON", "整理 JSON"],
        jwt_decoder: ["JWT 解碼", "JWT解碼", "權杖解碼", "解析 JWT", "解析權杖"],
        base64_encode_decode: ["Base64 解碼", "Base64 編碼", "base64解碼", "base64編碼"],
        regex_tester: ["正則 測試", "正則表達式測試", "匹配測試", "測試正則"],
        image_resizer: ["圖片 調整大小", "圖片縮放", "調整圖片尺寸", "影像尺寸"],
        log_scrubber: ["日誌 去識別", "日誌脫敏", "日誌清理", "清理日誌"],
        qr_code_generator: ["QR 碼 產生", "QR碼產生", "產生 QR", "產生二維碼"],
        password_generator: ["密碼 產生", "產生密碼", "隨機密碼", "安全密碼"],
    },
    ja: {
        json_formatter: ["JSON フォーマット", "JSON 整形", "JSON 整理", "JSON 検証"],
        jwt_decoder: ["JWT デコード", "JWT 解析", "トークン デコード", "トークン解析"],
        base64_encode_decode: ["Base64 デコード", "Base64 エンコード", "Base64 変換"],
        regex_tester: ["正規表現 テスト", "正規表現チェッカー", "regex テスト", "パターン確認"],
        image_resizer: ["画像 リサイズ", "画像サイズ変更", "画像 縮小", "画像寸法"],
        log_scrubber: ["ログ マスク", "ログ サニタイズ", "ログ 秘密情報", "ログ削除"],
        qr_code_generator: ["QRコード 作成", "QR コード生成", "QR 生成", "QRコード生成"],
        password_generator: ["パスワード 生成", "ランダム パスワード", "安全なパスワード"],
    },
    ko: {
        json_formatter: ["JSON 포맷", "JSON 정리", "JSON 검증", "JSON 예쁘게"],
        jwt_decoder: ["JWT 디코딩", "JWT 파서", "토큰 디코딩", "토큰 파싱"],
        base64_encode_decode: ["Base64 디코딩", "Base64 인코딩", "Base64 변환"],
        regex_tester: ["정규식 테스트", "정규표현식 테스트", "regex 테스트", "패턴 테스트"],
        image_resizer: ["이미지 크기 조정", "이미지 리사이즈", "사진 크기", "이미지 사이즈"],
        log_scrubber: ["로그 마스킹", "로그 정리", "로그 민감정보", "로그 삭제"],
        qr_code_generator: ["QR 코드 생성", "QR 생성", "큐알 코드", "QR 만들기"],
        password_generator: ["비밀번호 생성", "암호 생성", "랜덤 비밀번호", "안전한 비밀번호"],
    },
    de: {
        json_formatter: ["JSON formatieren", "JSON validieren", "JSON verschönern", "JSON strukturieren"],
        jwt_decoder: ["JWT dekodieren", "JWT analysieren", "Token dekodieren", "Token prüfen"],
        base64_encode_decode: ["Base64 dekodieren", "Base64 kodieren", "Base64 umwandeln"],
        regex_tester: ["Regex testen", "RegEx prüfen", "regulären Ausdruck testen", "Muster testen"],
        image_resizer: ["Bildgröße ändern", "Bild skalieren", "Bild verkleinern", "Foto Größe"],
        log_scrubber: ["Logs bereinigen", "Logs schwärzen", "Logdaten maskieren", "Secrets aus Logs"],
        qr_code_generator: ["QR Code erstellen", "QR-Code generieren", "QR erzeugen", "QR machen"],
        password_generator: ["Passwort generieren", "Passwort erstellen", "zufälliges Passwort", "sicheres Passwort"],
    },
    fr: {
        json_formatter: ["formater JSON", "valider JSON", "embellir JSON", "mettre en forme JSON"],
        jwt_decoder: ["décoder JWT", "analyser JWT", "décoder token", "inspecter token"],
        base64_encode_decode: ["décoder Base64", "encoder Base64", "convertir Base64"],
        regex_tester: ["tester regex", "tester expression régulière", "vérifier regex", "tester motif"],
        image_resizer: ["redimensionner image", "changer taille image", "réduire image", "taille photo"],
        log_scrubber: ["nettoyer logs", "masquer logs", "supprimer secrets logs", "assainir logs"],
        qr_code_generator: ["générer QR code", "créer QR code", "générer code QR", "faire QR"],
        password_generator: ["générer mot de passe", "créer mot de passe", "mot de passe aléatoire", "mot de passe sûr"],
    },
}

export const TOOL_SEARCH_METADATA: Record<string, ToolSearchMetadata> = {
    json_formatter: {
        popularity: 100,
        aliases: ["json beautifier", "json prettifier", "json validator", "pretty json", "format json", "format payload"],
        taskSynonyms: ["pretty print json", "format api payload", "validate json payload", "clean json"],
        categoryTerms: ["data", "api", "payload", "formatter", "validator"],
    },
    jwt_decoder: {
        popularity: 96,
        aliases: ["jwt parser", "jwt inspector", "token decoder", "decode jwt", "decode token"],
        taskSynonyms: ["inspect token", "parse token claims", "decode bearer token", "read jwt claims"],
        categoryTerms: ["security", "token", "claims", "header", "payload"],
    },
    base64_encode_decode: {
        popularity: 94,
        aliases: ["base 64", "base64 decoder", "base64 encoder", "b64", "decode base64", "encode base64"],
        taskSynonyms: ["decode text", "encode text", "decode payload", "convert base64"],
        categoryTerms: ["encoder", "decoder", "conversion"],
    },
    regex_tester: {
        popularity: 92,
        aliases: ["regexp tester", "regular expression tester", "regex checker", "test regex"],
        taskSynonyms: ["match pattern", "debug regex", "test pattern", "validate regex"],
        categoryTerms: ["text", "pattern", "match"],
    },
    url_encode_decode: {
        popularity: 90,
        aliases: ["url decoder", "url encoder", "percent decode", "percent encode", "decode url", "encode url"],
        taskSynonyms: ["decode query string", "encode query", "url safe text"],
        categoryTerms: ["url", "http", "encoder", "decoder"],
    },
    url_parser: {
        popularity: 88,
        aliases: ["parse url", "url query editor", "query string parser", "inspect url"],
        taskSynonyms: ["split url", "edit query params", "parse query string"],
        categoryTerms: ["url", "http", "network", "query"],
    },
    curl_to_code: {
        popularity: 86,
        aliases: ["curl converter", "curl code generator", "convert curl", "curl to fetch", "curl to python"],
        taskSynonyms: ["turn curl into code", "generate request code", "convert curl command"],
        categoryTerms: ["http", "api", "request", "code"],
    },
    openapi_viewer: {
        popularity: 84,
        aliases: ["swagger viewer", "openapi explorer", "api schema viewer", "openapi docs"],
        taskSynonyms: ["inspect openapi", "view swagger", "read api contract"],
        categoryTerms: ["api", "schema", "contract", "http"],
    },
    log_scrubber: {
        popularity: 82,
        aliases: ["log redactor", "log sanitizer", "scrub logs", "sanitize logs", "remove secrets from logs"],
        taskSynonyms: ["mask log secrets", "clean logs", "redact log tokens"],
        categoryTerms: ["logs", "security", "redaction", "privacy"],
    },
    local_log_parser: {
        popularity: 72,
        aliases: ["log parser", "parse logs", "analyze logs", "log analyzer"],
        taskSynonyms: ["inspect log levels", "filter logs", "read logs"],
        categoryTerms: ["logs", "parser", "devops"],
    },
    har_viewer_sanitizer: {
        popularity: 80,
        aliases: ["har sanitizer", "har redactor", "sanitize har", "har viewer", "clean har"],
        taskSynonyms: ["remove secrets from har", "redact har headers", "sanitize network log"],
        categoryTerms: ["har", "logs", "network", "privacy", "redaction"],
    },
    youtube_thumbnail_grabber: {
        popularity: 78,
        aliases: ["thumbnail grabber", "youtube thumbnail", "video thumbnail", "yt thumbnail"],
        taskSynonyms: ["get youtube thumbnail", "preview thumbnail", "download thumbnail"],
        categoryTerms: ["image", "social", "metadata"],
    },
    open_graph_meta_generator: {
        popularity: 76,
        aliases: ["seo meta generator", "meta tags", "open graph", "og tags", "twitter card"],
        taskSynonyms: ["generate seo tags", "preview social share", "make og metadata"],
        categoryTerms: ["seo", "metadata", "social", "html"],
    },
    qr_code_generator: {
        popularity: 74,
        aliases: ["qr generator", "qr code maker", "make qr", "create qr", "generate qr"],
        taskSynonyms: ["make qr code", "create qr code", "turn link into qr"],
        categoryTerms: ["generator", "barcode", "url"],
    },
    password_generator: {
        popularity: 72,
        aliases: ["random password", "secure password", "password maker", "generate password"],
        taskSynonyms: ["make password", "create password", "generate passphrase"],
        categoryTerms: ["security", "generator", "random"],
    },
    image_resizer: {
        popularity: 70,
        aliases: ["resize image", "image resize", "photo resizer", "change image size", "scale image"],
        taskSynonyms: ["make image smaller", "resize photo", "change image dimensions"],
        categoryTerms: ["image", "photo", "media"],
    },
    certificate_decoder: {
        popularity: 68,
        aliases: ["cert decoder", "decode certificate", "x509 decoder", "pem decoder"],
        taskSynonyms: ["inspect certificate", "read certificate", "parse cert"],
        categoryTerms: ["security", "certificate", "tls", "x509"],
    },
    hash_generator: {
        popularity: 66,
        aliases: ["hmac", "hash text", "checksum", "digest", "sha256", "md5"],
        taskSynonyms: ["generate hash", "make checksum", "calculate hmac", "hash payload"],
        categoryTerms: ["security", "crypto", "hash"],
    },
    env_parser: {
        popularity: 64,
        aliases: ["dotenv parser", "env parser", "environment variables", ".env parser"],
        taskSynonyms: ["parse env", "convert dotenv", "inspect env vars"],
        categoryTerms: ["devops", "config", "environment"],
    },
    unix_timestamp: {
        popularity: 62,
        aliases: ["timestamp converter", "unix time", "epoch time", "epoch converter"],
        taskSynonyms: ["convert timestamp", "read epoch", "date to unix"],
        categoryTerms: ["time", "date", "converter"],
    },
    uuid_generator: {
        popularity: 60,
        aliases: ["guid generator", "uuid maker", "generate uuid", "unique id"],
        taskSynonyms: ["make uuid", "create guid", "random uuid"],
        categoryTerms: ["id", "generator", "random"],
    },
    id_generator: {
        popularity: 58,
        aliases: ["random id", "id maker", "unique id generator"],
        taskSynonyms: ["make random id", "generate id"],
        categoryTerms: ["id", "generator", "random"],
    },
    yaml_json_converter: {
        popularity: 58,
        aliases: ["yaml to json", "json to yaml", "toml to json", "config converter"],
        taskSynonyms: ["convert yaml", "convert config", "convert toml"],
        categoryTerms: ["yaml", "json", "toml", "data"],
    },
    csv_json_converter: {
        popularity: 56,
        aliases: ["csv to json", "json to csv", "csv converter"],
        taskSynonyms: ["convert csv", "table to json", "json table"],
        categoryTerms: ["csv", "json", "data"],
    },
    json_diff_viewer: {
        popularity: 54,
        aliases: ["json diff", "diff json", "compare json", "json compare"],
        taskSynonyms: ["compare payloads", "find json changes"],
        categoryTerms: ["json", "diff", "compare"],
    },
    crontab_generator: {
        popularity: 52,
        aliases: ["cron generator", "crontab generator", "cron builder"],
        taskSynonyms: ["build cron", "make cron expression"],
        categoryTerms: ["cron", "schedule", "generator"],
    },
    cron_visualizer: {
        popularity: 52,
        aliases: ["cron explain", "cron visualizer", "crontab explainer"],
        taskSynonyms: ["explain cron", "read cron schedule"],
        categoryTerms: ["cron", "schedule", "time"],
    },
    chmod_calculator: {
        popularity: 50,
        aliases: ["chmod", "permissions calculator", "unix permissions"],
        taskSynonyms: ["calculate chmod", "file mode", "permission bits"],
        categoryTerms: ["unix", "permissions", "calculator"],
    },
    csp_parser: {
        popularity: 50,
        aliases: ["csp", "content security policy", "csp analyzer"],
        taskSynonyms: ["parse csp", "inspect csp", "analyze security policy"],
        categoryTerms: ["security", "headers", "policy"],
    },
    saml_decoder: {
        popularity: 50,
        aliases: ["saml", "saml decoder", "saml response decoder", "decode saml"],
        taskSynonyms: ["parse saml", "inspect saml assertion"],
        categoryTerms: ["security", "sso", "xml"],
    },
}

for (const [locale, aliasesByTool] of Object.entries(CORE_LOCALIZED_ALIASES) as Array<[Locale, Record<string, readonly string[]>]>) {
    for (const [toolKey, aliases] of Object.entries(aliasesByTool)) {
        const metadata = TOOL_SEARCH_METADATA[toolKey] ?? {}
        TOOL_SEARCH_METADATA[toolKey] = {
            ...metadata,
            localizedAliases: {
                ...(metadata.localizedAliases ?? {}),
                [locale]: aliases,
            },
        }
    }
}

function unique(values: readonly (string | undefined)[]): string[] {
    const seen = new Set<string>()
    const next: string[] = []
    for (const value of values) {
        const normalized = value?.trim()
        if (!normalized || seen.has(normalized)) continue
        seen.add(normalized)
        next.push(normalized)
    }
    return next
}

export function getToolSearchMetadata(toolKey?: string): ToolSearchMetadata {
    if (!toolKey) return {}
    return TOOL_SEARCH_METADATA[toolKey] ?? {}
}

export function getToolSearchPopularity(toolKey?: string): number {
    return getToolSearchMetadata(toolKey).popularity ?? 0
}

export function getToolLocalizedSearchAliases(toolKey: string | undefined, locale?: string): string[] {
    if (!toolKey || !locale) return []
    return [...(getToolSearchMetadata(toolKey).localizedAliases?.[locale as Locale] ?? [])]
}

export function getToolSearchMetadataTerms(toolKey: string | undefined, locale?: string): string[] {
    const metadata = getToolSearchMetadata(toolKey)
    return unique([
        ...(metadata.aliases ?? []),
        ...(metadata.taskSynonyms ?? []),
        ...(metadata.categoryTerms ?? []),
        ...getToolLocalizedSearchAliases(toolKey, locale),
    ])
}

