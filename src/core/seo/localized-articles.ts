import type { Locale } from "@/core/i18n/i18n"

export type LocalizedArticleSlug =
    | "api-auth-header-mistakes"
    | "base64-encoding-when-and-how-to-use-it"
    | "certificate-chain-basics-for-developers"
    | "color-extraction-from-images-use-cases-and-tools"
    | "convert-curl-to-fetch-python"
    | "csp-mistakes-that-break-production"
    | "css-animations-and-transitions-guide"
    | "css-border-radius-and-shapes-guide"
    | "css-layout-patterns-for-developers"
    | "dns-records-uptime"
    | "hash-functions-compared-md5-vs-sha256-vs-sha512"
    | "image-optimization-for-web-complete-workflow"
    | "image-privacy-how-to-censor-and-protect-images"
    | "json-formatting-errors"
    | "json-schema-validation-checklist"
    | "json-vs-json5-differences"
    | "jwt-security-best-practices-for-token-handling"
    | "mock-openapi-quickly"
    | "modern-css-effects-guide"
    | "openapi-debugging-workflow-checklist"
    | "robots-txt-testing-checklist"
    | "svg-optimization-and-conversion-best-practices"
    | "url-encoding-explained-common-mistakes-and-solutions"
    | "validate-json-before-api-requests"

export type NonEnglishLocale = Exclude<Locale, "en">

type ClusterId = "c1" | "c2" | "c3" | "c4" | "c5" | "c6"
type ToolSectionKind = "json" | "api" | "security" | "css" | "image" | "encoding"

export type RelatedArticleTool = {
    slug: string
    toolKey?: string
    labelByLocale?: Partial<Record<NonEnglishLocale, string>>
}

export type LocalizedArticleSection = {
    title: string
    paragraphs?: string[]
    bullets?: string[]
    ordered?: string[]
}

export type LocalizedArticleCopy = {
    title: string
    description: string
    sections: LocalizedArticleSection[]
    exampleInput: string
    exampleOutput: string
}

type LocalizedArticleDefinition = {
    cluster: ClusterId
    toolSectionKind: ToolSectionKind
    relatedTools: RelatedArticleTool[]
    next?: LocalizedArticleSlug
    sibling?: LocalizedArticleSlug
    locales: Record<NonEnglishLocale, LocalizedArticleCopy>
}

export const ARTICLE_UI_COPY: Record<NonEnglishLocale, {
    exampleTitle: string
    inputLabel: string
    outputLabel: string
    nextLabel: string
    siblingLabel: string
}> = {
    "zh-CN": {
        exampleTitle: "实用输入/输出示例",
        inputLabel: "输入",
        outputLabel: "输出",
        nextLabel: "专题下一篇：",
        siblingLabel: "同专题延伸：",
    },
    "zh-TW": {
        exampleTitle: "實用輸入/輸出範例",
        inputLabel: "輸入",
        outputLabel: "輸出",
        nextLabel: "專題下一篇：",
        siblingLabel: "同專題延伸：",
    },
    ja: {
        exampleTitle: "実用的な入出力例",
        inputLabel: "入力",
        outputLabel: "出力",
        nextLabel: "次のクラスター記事:",
        siblingLabel: "関連する読み物:",
    },
    ko: {
        exampleTitle: "실무 입력/출력 예시",
        inputLabel: "입력",
        outputLabel: "출력",
        nextLabel: "클러스터 다음 글:",
        siblingLabel: "연관 읽을거리:",
    },
    de: {
        exampleTitle: "Praktisches Ein-/Ausgabe-Beispiel",
        inputLabel: "Eingabe",
        outputLabel: "Ausgabe",
        nextLabel: "Nächster Cluster-Artikel:",
        siblingLabel: "Verwandter Beitrag:",
    },
    fr: {
        exampleTitle: "Exemple pratique entrée/sortie",
        inputLabel: "Entrée",
        outputLabel: "Sortie",
        nextLabel: "Article suivant du cluster :",
        siblingLabel: "Lecture associée :",
    },
}

export const CLUSTER_LABELS: Record<NonEnglishLocale, Record<ClusterId, string>> = {
    "zh-CN": {
        c1: "专题 C1：JSON 生态",
        c2: "专题 C2：API 调试",
        c3: "专题 C3：网络与安全",
        c4: "专题 C4：CSS 与设计",
        c5: "专题 C5：图像处理",
        c6: "专题 C6：编码与哈希",
    },
    "zh-TW": {
        c1: "專題 C1：JSON 生態",
        c2: "專題 C2：API 偵錯",
        c3: "專題 C3：網路與安全",
        c4: "專題 C4：CSS 與設計",
        c5: "專題 C5：影像處理",
        c6: "專題 C6：編碼與雜湊",
    },
    ja: {
        c1: "クラスター C1: JSON エコシステム",
        c2: "クラスター C2: API デバッグ",
        c3: "クラスター C3: ネットワークとセキュリティ",
        c4: "クラスター C4: CSS とデザイン",
        c5: "クラスター C5: 画像処理",
        c6: "クラスター C6: エンコードとハッシュ",
    },
    ko: {
        c1: "클러스터 C1: JSON 생태계",
        c2: "클러스터 C2: API 디버깅",
        c3: "클러스터 C3: 네트워크 및 보안",
        c4: "클러스터 C4: CSS 및 디자인",
        c5: "클러스터 C5: 이미지 처리",
        c6: "클러스터 C6: 인코딩 및 해시",
    },
    de: {
        c1: "Cluster C1: JSON-Ökosystem",
        c2: "Cluster C2: API-Debugging",
        c3: "Cluster C3: Netzwerk und Sicherheit",
        c4: "Cluster C4: CSS und Design",
        c5: "Cluster C5: Bildverarbeitung",
        c6: "Cluster C6: Kodierung und Hashing",
    },
    fr: {
        c1: "Cluster C1 : Écosystème JSON",
        c2: "Cluster C2 : Débogage API",
        c3: "Cluster C3 : Réseau et sécurité",
        c4: "Cluster C4 : CSS et design",
        c5: "Cluster C5 : Traitement d'image",
        c6: "Cluster C6 : Encodage et hachage",
    },
}

export const TOOL_SECTION_TITLES: Record<NonEnglishLocale, Record<ToolSectionKind, string>> = {
    "zh-CN": {
        json: "推荐 JSON 工具",
        api: "推荐 API 工具",
        security: "推荐安全工具",
        css: "推荐 CSS 工具",
        image: "推荐图像工具",
        encoding: "推荐编码与哈希工具",
    },
    "zh-TW": {
        json: "推薦 JSON 工具",
        api: "推薦 API 工具",
        security: "推薦安全工具",
        css: "推薦 CSS 工具",
        image: "推薦影像工具",
        encoding: "推薦編碼與雜湊工具",
    },
    ja: {
        json: "おすすめの JSON ツール",
        api: "おすすめの API ツール",
        security: "おすすめのセキュリティツール",
        css: "おすすめの CSS ツール",
        image: "おすすめの画像ツール",
        encoding: "おすすめのエンコード/ハッシュツール",
    },
    ko: {
        json: "추천 JSON 도구",
        api: "추천 API 도구",
        security: "추천 보안 도구",
        css: "추천 CSS 도구",
        image: "추천 이미지 도구",
        encoding: "추천 인코딩/해시 도구",
    },
    de: {
        json: "Empfohlene JSON-Tools",
        api: "Empfohlene API-Tools",
        security: "Empfohlene Sicherheitstools",
        css: "Empfohlene CSS-Tools",
        image: "Empfohlene Bild-Tools",
        encoding: "Empfohlene Encoding- und Hash-Tools",
    },
    fr: {
        json: "Outils JSON recommandés",
        api: "Outils API recommandés",
        security: "Outils de sécurité recommandés",
        css: "Outils CSS recommandés",
        image: "Outils image recommandés",
        encoding: "Outils d'encodage et de hachage recommandés",
    },
}

export const LOCALIZED_ARTICLES: Record<LocalizedArticleSlug, LocalizedArticleDefinition> = {
    "json-schema-validation-checklist": {
        cluster: "c1",
        toolSectionKind: "json",
        relatedTools: [
            { slug: "json-formatter", toolKey: "json_formatter" },
            { slug: "json-diff-viewer", toolKey: "json_diff_viewer" },
            { slug: "jsonpath-playground", toolKey: "jsonpath_playground" },
            { slug: "json-to-typescript", toolKey: "json_to_typescript" },
        ],
        next: "json-formatting-errors",
        sibling: "json-vs-json5-differences",
        locales: {
            "zh-CN": {
                title: "JSON Schema 校验清单",
                description: "在接口或配置变更上线前，用一份可执行的 JSON Schema 清单统一字段约束、示例和回归检查。",
                sections: [
                    {
                        title: "先把契约写清楚",
                        paragraphs: [
                            "Schema 的价值不只是校验器能不能通过，而是让团队对必填字段、可空字段和枚举范围有一致认知。",
                            "如果接口说明、示例数据和运行时校验规则不一致，问题通常不会在开发阶段暴露，而会在联调或发布时集中爆发。",
                        ],
                    },
                    {
                        title: "上线前至少检查这些点",
                        bullets: [
                            "确认 required、type、enum、format 与真实接口约束一致。",
                            "为嵌套对象和数组准备至少一组成功样例与一组失败样例。",
                            "把 Schema 校验加入 CI，避免靠人工 review 发现字段回归。",
                        ],
                    },
                ],
                exampleInput: "{\n  \"type\": \"object\",\n  \"required\": [\"id\", \"status\"],\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"status\": { \"enum\": [\"ready\", \"failed\"] }\n  }\n}",
                exampleOutput: "校验结果：\n- payload.id 缺失时失败\n- payload.status 只能是 ready / failed",
            },
            "zh-TW": {
                title: "JSON Schema 驗證檢查清單",
                description: "在 API 或設定變更上線前，以可執行的 JSON Schema 檢查清單統一欄位約束、範例與回歸驗證。",
                sections: [
                    {
                        title: "先把資料契約寫清楚",
                        paragraphs: [
                            "Schema 的價值不只是能不能通過驗證，而是讓團隊對必填欄位、可空欄位與列舉值範圍有一致理解。",
                            "如果文件、範例資料與實際驗證規則不一致，問題通常會在聯調或發佈前後才集中暴露。",
                        ],
                    },
                    {
                        title: "發布前至少檢查這些點",
                        bullets: [
                            "確認 required、type、enum、format 與真實介面限制一致。",
                            "為巢狀物件與陣列準備至少一組成功樣例與一組失敗樣例。",
                            "把 Schema 驗證納入 CI，避免只靠人工審查發現回歸。",
                        ],
                    },
                ],
                exampleInput: "{\n  \"type\": \"object\",\n  \"required\": [\"id\", \"status\"],\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"status\": { \"enum\": [\"ready\", \"failed\"] }\n  }\n}",
                exampleOutput: "驗證結果：\n- payload.id 缺失時失敗\n- payload.status 只能是 ready / failed",
            },
            ja: {
                title: "JSON Schema バリデーションチェックリスト",
                description: "API や設定変更を出す前に、JSON Schema を使って必須項目、例、回帰確認を揃えるための実務チェックリストです。",
                sections: [
                    {
                        title: "契約を先に固定する",
                        paragraphs: [
                            "Schema は単にバリデーターを通すためではなく、必須項目、null 許容、列挙値をチームで共有するためにあります。",
                            "仕様書、サンプル、実際の検証ルールがずれると、問題は実装後ではなく結合やリリース直前に表面化しやすくなります。",
                        ],
                    },
                    {
                        title: "最低限見るべき項目",
                        bullets: [
                            "required、type、enum、format が実際の API 制約と一致しているか確認する。",
                            "ネストした object や配列に対して成功例と失敗例を 1 つ以上用意する。",
                            "Schema 検証を CI に入れ、レビュー時の見落としを減らす。",
                        ],
                    },
                ],
                exampleInput: "{\n  \"type\": \"object\",\n  \"required\": [\"id\", \"status\"],\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"status\": { \"enum\": [\"ready\", \"failed\"] }\n  }\n}",
                exampleOutput: "検証結果:\n- payload.id がない場合は失敗\n- payload.status は ready / failed のみ許可",
            },
            ko: {
                title: "JSON Schema 검증 체크리스트",
                description: "API 또는 설정 변경을 배포하기 전에 JSON Schema 로 필수 필드, 예시, 회귀 검증을 맞추기 위한 실무 체크리스트입니다.",
                sections: [
                    {
                        title: "먼저 계약을 고정하세요",
                        paragraphs: [
                            "Schema 는 단순히 검증기를 통과하기 위한 문서가 아니라 필수 필드, nullable 정책, enum 범위를 팀 전체가 동일하게 이해하기 위한 기준입니다.",
                            "문서, 예시 payload, 실제 검증 규칙이 어긋나면 문제는 개발 중보다 통합 테스트나 릴리스 직전에 더 크게 드러납니다.",
                        ],
                    },
                    {
                        title: "배포 전에 확인할 핵심 항목",
                        bullets: [
                            "required, type, enum, format 이 실제 API 제약과 일치하는지 확인합니다.",
                            "중첩 객체와 배열에 대해 성공 예시와 실패 예시를 각각 준비합니다.",
                            "Schema 검증을 CI 에 넣어 리뷰 단계의 누락을 줄입니다.",
                        ],
                    },
                ],
                exampleInput: "{\n  \"type\": \"object\",\n  \"required\": [\"id\", \"status\"],\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"status\": { \"enum\": [\"ready\", \"failed\"] }\n  }\n}",
                exampleOutput: "검증 결과:\n- payload.id 가 없으면 실패\n- payload.status 는 ready / failed 만 허용",
            },
            de: {
                title: "JSON-Schema-Validierungscheckliste",
                description: "Vor API- oder Konfigurationsänderungen hilft diese Checkliste, Pflichtfelder, Beispiele und Regressionstests mit JSON Schema sauber abzusichern.",
                sections: [
                    {
                        title: "Den Vertrag zuerst festziehen",
                        paragraphs: [
                            "Ein Schema ist nicht nur dafür da, einen Validator zufriedenzustellen. Es definiert gemeinsam verstandene Regeln für Pflichtfelder, Nullable-Verhalten und erlaubte Werte.",
                            "Wenn Dokumentation, Beispielpayloads und echte Laufzeitregeln auseinanderlaufen, tauchen Fehler meist erst in Integration oder Release auf.",
                        ],
                    },
                    {
                        title: "Diese Punkte sollten immer geprüft werden",
                        bullets: [
                            "required, type, enum und format müssen zu den echten API-Anforderungen passen.",
                            "Für verschachtelte Objekte und Arrays braucht es mindestens ein gültiges und ein ungültiges Beispiel.",
                            "Schema-Prüfungen gehören in CI, damit Feldregressionen nicht nur manuell entdeckt werden.",
                        ],
                    },
                ],
                exampleInput: "{\n  \"type\": \"object\",\n  \"required\": [\"id\", \"status\"],\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"status\": { \"enum\": [\"ready\", \"failed\"] }\n  }\n}",
                exampleOutput: "Validierung:\n- payload.id fehlt -> Fehler\n- payload.status darf nur ready oder failed sein",
            },
            fr: {
                title: "Checklist de validation JSON Schema",
                description: "Avant de publier une évolution d'API ou de configuration, cette checklist aide à aligner champs requis, exemples et contrôles de régression autour de JSON Schema.",
                sections: [
                    {
                        title: "Fixer le contrat avant le code",
                        paragraphs: [
                            "Le rôle d'un schema n'est pas seulement de faire passer un validateur. Il sert aussi à aligner l'équipe sur les champs requis, les valeurs nulles autorisées et les enums.",
                            "Quand la documentation, les exemples et les règles réelles divergent, les incidents apparaissent souvent en intégration ou juste avant la mise en ligne.",
                        ],
                    },
                    {
                        title: "Points à vérifier avant livraison",
                        bullets: [
                            "required, type, enum et format doivent refléter les vraies contraintes de l'API.",
                            "Préparez au moins un exemple valide et un exemple invalide pour les objets imbriqués et les tableaux.",
                            "Ajoutez la validation Schema au CI pour éviter les régressions silencieuses.",
                        ],
                    },
                ],
                exampleInput: "{\n  \"type\": \"object\",\n  \"required\": [\"id\", \"status\"],\n  \"properties\": {\n    \"id\": { \"type\": \"string\" },\n    \"status\": { \"enum\": [\"ready\", \"failed\"] }\n  }\n}",
                exampleOutput: "Résultat :\n- échec si payload.id manque\n- payload.status doit être ready ou failed",
            },
        },
    },
    "json-formatting-errors": {
        cluster: "c1",
        toolSectionKind: "json",
        relatedTools: [
            { slug: "json-formatter", toolKey: "json_formatter" },
            { slug: "json-diff-viewer", toolKey: "json_diff_viewer" },
            { slug: "jsonpath-playground", toolKey: "jsonpath_playground" },
            { slug: "json-to-typescript", toolKey: "json_to_typescript" },
        ],
        next: "json-vs-json5-differences",
        sibling: "validate-json-before-api-requests",
        locales: {
            "zh-CN": {
                title: "JSON 格式错误及修复方法",
                description: "用一套稳定的排查顺序定位 JSON 语法错误，避免畸形 payload 进入 API、配置或 CI 流程。",
                sections: [
                    {
                        title: "最常见的破坏点",
                        paragraphs: [
                            "尾随逗号、未加双引号的键名、单引号字符串、以及从日志中复制出来的转义字符，都是最常见的 JSON 失败来源。",
                            "另一个高频问题是多系统样例混拼后编码不一致，看起来正常的文本在解析器里却会因为隐藏字符直接报错。",
                        ],
                    },
                    {
                        title: "一套可重复的修复顺序",
                        ordered: [
                            "先把最小可复现对象单独拿出来，确认错误到底来自结构还是内容。",
                            "先格式化再校验，缩进后的结构更容易看出缺括号、缺引号或多余逗号。",
                            "在提交前用固定样例再跑一次验证，确认修复没有引入新的字段问题。",
                        ],
                    },
                ],
                exampleInput: "{\"user\":\"ana\",\"roles\":[\"admin\",],}",
                exampleOutput: "{\"user\":\"ana\",\"roles\":[\"admin\"]}",
            },
            "zh-TW": {
                title: "JSON 格式錯誤與修復方法",
                description: "用固定的排查順序定位 JSON 語法錯誤，避免畸形 payload 進入 API、設定或 CI 流程。",
                sections: [
                    {
                        title: "最常見的破壞點",
                        paragraphs: [
                            "尾隨逗號、未加雙引號的鍵名、單引號字串，以及從日誌複製出的轉義片段，都是常見的 JSON 失敗來源。",
                            "另一個高頻問題是多系統樣例拼接後的編碼不一致，肉眼看起來正常的內容在解析器中卻會因隱藏字元失敗。",
                        ],
                    },
                    {
                        title: "可重複執行的修復順序",
                        ordered: [
                            "先抽出最小可重現物件，確認錯誤來自結構還是內容。",
                            "先格式化再驗證，展開縮排後更容易看出缺括號、缺引號或多餘逗號。",
                            "提交前再用固定樣例跑一次驗證，確認修復沒有帶入新的欄位問題。",
                        ],
                    },
                ],
                exampleInput: "{\"user\":\"ana\",\"roles\":[\"admin\",],}",
                exampleOutput: "{\"user\":\"ana\",\"roles\":[\"admin\"]}",
            },
            ja: {
                title: "JSON フォーマットエラーと修正方法",
                description: "再現しやすい手順で JSON 構文エラーを切り分け、壊れた payload が API や設定ファイルに流れ込むのを防ぐためのガイドです。",
                sections: [
                    {
                        title: "壊れやすいポイントを先に知る",
                        paragraphs: [
                            "末尾のカンマ、ダブルクォートのないキー、シングルクォートの文字列、ログ由来のエスケープ断片は典型的な失敗要因です。",
                            "複数システムのサンプルを混ぜた結果、見た目は正しいのに隠し文字やエンコーディング差分で失敗するケースもよくあります。",
                        ],
                    },
                    {
                        title: "修正の順番を固定する",
                        ordered: [
                            "最小再現オブジェクトを取り出して、構造エラーか内容エラーかを分ける。",
                            "先に整形し、その後に検証する。インデントされた JSON のほうが括弧や引用符の抜けを見つけやすい。",
                            "修正後は固定サンプルでもう一度検証し、別のフィールドを壊していないか確認する。",
                        ],
                    },
                ],
                exampleInput: "{\"user\":\"ana\",\"roles\":[\"admin\",],}",
                exampleOutput: "{\"user\":\"ana\",\"roles\":[\"admin\"]}",
            },
            ko: {
                title: "JSON 포맷 오류와 해결 방법",
                description: "재현 가능한 순서로 JSON 문법 오류를 좁혀서 깨진 payload 가 API, 설정, CI 흐름으로 들어가는 일을 막기 위한 가이드입니다.",
                sections: [
                    {
                        title: "가장 자주 깨지는 지점",
                        paragraphs: [
                            "마지막 쉼표, 큰따옴표 없는 키, 작은따옴표 문자열, 로그에서 복사된 이스케이프 조각은 대표적인 실패 원인입니다.",
                            "여러 시스템의 샘플을 섞는 과정에서 숨은 문자나 인코딩 차이 때문에 눈에는 정상처럼 보여도 파서가 실패하는 경우도 많습니다.",
                        ],
                    },
                    {
                        title: "수정 순서를 고정하세요",
                        ordered: [
                            "최소 재현 객체를 먼저 분리해 구조 문제인지 내용 문제인지 나눕니다.",
                            "먼저 포맷팅하고 그다음 검증합니다. 들여쓰기된 JSON 이 괄호, 따옴표, 쉼표 오류를 더 빨리 드러냅니다.",
                            "수정 후에는 고정 샘플로 한 번 더 검증해 다른 필드를 깨뜨리지 않았는지 확인합니다.",
                        ],
                    },
                ],
                exampleInput: "{\"user\":\"ana\",\"roles\":[\"admin\",],}",
                exampleOutput: "{\"user\":\"ana\",\"roles\":[\"admin\"]}",
            },
            de: {
                title: "JSON-Formatierungsfehler und deren Behebung",
                description: "Mit einer festen Prüfreihenfolge lassen sich JSON-Syntaxfehler schnell eingrenzen, bevor fehlerhafte Payloads in APIs, Konfigurationen oder CI landen.",
                sections: [
                    {
                        title: "Typische Bruchstellen",
                        paragraphs: [
                            "Nachgestellte Kommata, unquotierte Schlüssel, einfache Anführungszeichen und aus Logs kopierte Escape-Fragmente verursachen die meisten JSON-Fehler.",
                            "Ebenso häufig sind Mischungen aus Beispielen verschiedener Systeme, bei denen unsichtbare Zeichen oder Encoding-Unterschiede Parserfehler auslösen.",
                        ],
                    },
                    {
                        title: "Eine wiederholbare Reihenfolge zur Behebung",
                        ordered: [
                            "Zuerst das kleinste reproduzierbare Objekt isolieren, um Struktur- und Inhaltsfehler zu trennen.",
                            "Zuerst formatieren, dann validieren. Saubere Einrückung zeigt fehlende Klammern, Anführungszeichen und Kommas schneller.",
                            "Nach dem Fix dieselben Referenzbeispiele erneut prüfen, um Folgefehler auszuschließen.",
                        ],
                    },
                ],
                exampleInput: "{\"user\":\"ana\",\"roles\":[\"admin\",],}",
                exampleOutput: "{\"user\":\"ana\",\"roles\":[\"admin\"]}",
            },
            fr: {
                title: "Erreurs de format JSON et comment les corriger",
                description: "Un ordre de vérification stable aide à isoler les erreurs de syntaxe JSON avant qu'un payload cassé n'entre dans une API, une config ou le CI.",
                sections: [
                    {
                        title: "Les points de casse les plus fréquents",
                        paragraphs: [
                            "Virgule finale, clés sans guillemets doubles, chaînes entre apostrophes et fragments échappés copiés depuis des logs sont des causes classiques d'échec JSON.",
                            "Les incidents viennent aussi de la fusion de plusieurs exemples système avec des encodages différents ou des caractères invisibles.",
                        ],
                    },
                    {
                        title: "Un ordre de correction réutilisable",
                        ordered: [
                            "Isolez d'abord l'objet minimal qui reproduit l'erreur pour séparer structure et contenu.",
                            "Formatez avant de valider : un JSON indenté rend les crochets, guillemets et virgules plus faciles à vérifier.",
                            "Relancez ensuite la validation sur un exemple connu pour confirmer qu'aucun autre champ n'a été cassé.",
                        ],
                    },
                ],
                exampleInput: "{\"user\":\"ana\",\"roles\":[\"admin\",],}",
                exampleOutput: "{\"user\":\"ana\",\"roles\":[\"admin\"]}",
            },
        },
    },
    "json-vs-json5-differences": {
        cluster: "c1",
        toolSectionKind: "json",
        relatedTools: [
            { slug: "json-formatter", toolKey: "json_formatter" },
            { slug: "json-diff-viewer", toolKey: "json_diff_viewer" },
            { slug: "jsonpath-playground", toolKey: "jsonpath_playground" },
            { slug: "json-to-typescript", toolKey: "json_to_typescript" },
        ],
        next: "validate-json-before-api-requests",
        sibling: "json-schema-validation-checklist",
        locales: {
            "zh-CN": {
                title: "JSON 与 JSON5 的差异",
                description: "理解 JSON5 允许的语法糖，以及为什么很多生产接口最终仍然要求严格 JSON。",
                sections: [
                    {
                        title: "JSON5 更适合编辑，不一定适合传输",
                        paragraphs: [
                            "JSON5 支持注释、尾随逗号、未加引号的键名和更宽松的数字写法，编辑体验更好。",
                            "但多数 API、配置加载器和数据库驱动只接受严格 JSON，所以 JSON5 常常只能作为作者友好的中间格式。",
                        ],
                    },
                    {
                        title: "什么时候必须转回严格 JSON",
                        bullets: [
                            "要发送给外部 API、Webhook 或浏览器标准解析器时。",
                            "要把配置放进 CI、容器镜像或基础设施模板时。",
                            "当团队需要统一 diff、校验和类型生成流程时。",
                        ],
                    },
                ],
                exampleInput: "{\n  user: \"ana\",\n  roles: [\"admin\",],\n  // comment\n}",
                exampleOutput: "{\n  \"user\": \"ana\",\n  \"roles\": [\"admin\"]\n}",
            },
            "zh-TW": {
                title: "JSON 與 JSON5 差異",
                description: "理解 JSON5 允許的語法糖，以及為何多數正式環境最終仍要求嚴格 JSON。",
                sections: [
                    {
                        title: "JSON5 更適合編輯，不一定適合傳輸",
                        paragraphs: [
                            "JSON5 支援註解、尾隨逗號、未加引號鍵名與更寬鬆的數字格式，手動編輯更方便。",
                            "但多數 API、設定載入器與資料庫驅動只接受嚴格 JSON，因此 JSON5 常常只是作者友好的中間格式。",
                        ],
                    },
                    {
                        title: "什麼時候必須轉回嚴格 JSON",
                        bullets: [
                            "要送給外部 API、Webhook 或瀏覽器標準解析器時。",
                            "要把設定帶進 CI、容器映像或基礎設施樣板時。",
                            "團隊需要統一 diff、驗證與型別產生流程時。",
                        ],
                    },
                ],
                exampleInput: "{\n  user: \"ana\",\n  roles: [\"admin\",],\n  // comment\n}",
                exampleOutput: "{\n  \"user\": \"ana\",\n  \"roles\": [\"admin\"]\n}",
            },
            ja: {
                title: "JSON と JSON5 の違い",
                description: "JSON5 の書きやすさと、なぜ本番の多くの入出力が依然として厳密な JSON を要求するのかを整理します。",
                sections: [
                    {
                        title: "JSON5 は編集向き、JSON は交換向き",
                        paragraphs: [
                            "JSON5 ではコメント、末尾カンマ、引用符なしキーなどが許容されるため、人が書く設定には便利です。",
                            "一方で多くの API や標準パーサーは厳密な JSON しか受け取らないため、最終出力は JSON に戻す前提で考えるべきです。",
                        ],
                    },
                    {
                        title: "厳密 JSON に戻すべき場面",
                        bullets: [
                            "外部 API や Webhook に送るとき。",
                            "CI や IaC、コンテナ設定に組み込むとき。",
                            "diff、検証、型生成を共通フローにしたいとき。",
                        ],
                    },
                ],
                exampleInput: "{\n  user: \"ana\",\n  roles: [\"admin\",],\n  // comment\n}",
                exampleOutput: "{\n  \"user\": \"ana\",\n  \"roles\": [\"admin\"]\n}",
            },
            ko: {
                title: "JSON과 JSON5의 차이",
                description: "JSON5 의 편의 문법과, 왜 대부분의 운영 환경 입력은 여전히 엄격한 JSON 을 요구하는지 정리합니다.",
                sections: [
                    {
                        title: "JSON5 는 작성용, JSON 은 교환용",
                        paragraphs: [
                            "JSON5 는 주석, 마지막 쉼표, 따옴표 없는 키 등 사람이 쓰기 편한 문법을 허용합니다.",
                            "하지만 대부분의 API 와 표준 파서는 엄격한 JSON 만 받아들이기 때문에 최종 산출물은 JSON 으로 정리해야 하는 경우가 많습니다.",
                        ],
                    },
                    {
                        title: "엄격한 JSON 으로 되돌려야 하는 경우",
                        bullets: [
                            "외부 API 나 Webhook 으로 데이터를 보낼 때.",
                            "CI, IaC, 컨테이너 설정에 포함할 때.",
                            "diff, 검증, 타입 생성 흐름을 공통으로 맞추고 싶을 때.",
                        ],
                    },
                ],
                exampleInput: "{\n  user: \"ana\",\n  roles: [\"admin\",],\n  // comment\n}",
                exampleOutput: "{\n  \"user\": \"ana\",\n  \"roles\": [\"admin\"]\n}",
            },
            de: {
                title: "Unterschiede zwischen JSON und JSON5",
                description: "JSON5 ist bequemer zu schreiben, aber viele Produktionspfade verlangen weiterhin strikt valides JSON.",
                sections: [
                    {
                        title: "JSON5 hilft Autoren, JSON hilft Schnittstellen",
                        paragraphs: [
                            "JSON5 erlaubt Kommentare, nachgestellte Kommata und lockerere Schreibweisen, was das Bearbeiten von Konfigurationen angenehmer macht.",
                            "Viele APIs, Standardparser und Laufzeitumgebungen akzeptieren jedoch nur striktes JSON. Deshalb sollte JSON5 meist als Zwischenformat gesehen werden.",
                        ],
                    },
                    {
                        title: "Wann Sie zurück zu strengem JSON müssen",
                        bullets: [
                            "Vor dem Senden an externe APIs oder Webhooks.",
                            "Vor der Nutzung in CI, Infrastrukturvorlagen oder Container-Konfigurationen.",
                            "Wenn Teams Diff, Validierung und Typgenerierung konsistent halten wollen.",
                        ],
                    },
                ],
                exampleInput: "{\n  user: \"ana\",\n  roles: [\"admin\",],\n  // comment\n}",
                exampleOutput: "{\n  \"user\": \"ana\",\n  \"roles\": [\"admin\"]\n}",
            },
            fr: {
                title: "Différences entre JSON et JSON5",
                description: "JSON5 facilite l'écriture humaine, mais la plupart des flux de production exigent toujours du JSON strict.",
                sections: [
                    {
                        title: "JSON5 est confortable à éditer, JSON reste le format d'échange",
                        paragraphs: [
                            "JSON5 autorise commentaires, virgules finales et clés non citées, ce qui le rend pratique pour rédiger des configs à la main.",
                            "Mais la majorité des API, parseurs standard et runtimes n'acceptent que du JSON strict. Il faut donc souvent reconvertir avant l'intégration réelle.",
                        ],
                    },
                    {
                        title: "Quand revenir à du JSON strict",
                        bullets: [
                            "Avant d'envoyer des données vers une API ou un webhook externe.",
                            "Avant de stocker une config dans le CI, l'IaC ou une image de conteneur.",
                            "Quand l'équipe veut aligner diff, validation et génération de types.",
                        ],
                    },
                ],
                exampleInput: "{\n  user: \"ana\",\n  roles: [\"admin\",],\n  // comment\n}",
                exampleOutput: "{\n  \"user\": \"ana\",\n  \"roles\": [\"admin\"]\n}",
            },
        },
    },
    "validate-json-before-api-requests": {
        cluster: "c1",
        toolSectionKind: "json",
        relatedTools: [
            { slug: "json-formatter", toolKey: "json_formatter" },
            { slug: "json-diff-viewer", toolKey: "json_diff_viewer" },
            { slug: "jsonpath-playground", toolKey: "jsonpath_playground" },
            { slug: "json-to-typescript", toolKey: "json_to_typescript" },
        ],
        next: "json-schema-validation-checklist",
        sibling: "json-formatting-errors",
        locales: {
            "zh-CN": {
                title: "API 请求前 JSON 校验指南",
                description: "把 JSON 格式化、Schema 校验和示例比对放到发送请求之前，能显著减少接口调试时间。",
                sections: [
                    {
                        title: "为什么要在发送前校验",
                        paragraphs: [
                            "很多 API 报错看起来像后端问题，实际根因是请求体字段缺失、类型错误或语法损坏。",
                            "在本地先跑一次格式化和校验，通常比到网关日志里追问题要快得多。",
                        ],
                    },
                    {
                        title: "建议的调用前检查",
                        ordered: [
                            "先格式化 payload，确认结构和嵌套层级正确。",
                            "用 Schema 或约定字段规则检查 required、type 和枚举值。",
                            "把即将发送的内容与已知成功样例做一次 diff，比对字段名和默认值。",
                        ],
                    },
                ],
                exampleInput: "{\"status\":\"ready\",\"meta\":{\"retry\":\"3\"}}",
                exampleOutput: "发送前发现：\n- retry 应为 number，不应是 string\n- payload 需要补充 id",
            },
            "zh-TW": {
                title: "API 請求前 JSON 驗證指南",
                description: "在送出請求前先做 JSON 格式化、Schema 驗證與樣例比對，能明顯降低 API 偵錯成本。",
                sections: [
                    {
                        title: "為什麼要在送出前驗證",
                        paragraphs: [
                            "許多 API 錯誤表面上像後端故障，實際根因卻是請求體欄位遺漏、型別錯誤或語法損壞。",
                            "在本地先跑一次格式化與驗證，通常比直接翻網關日誌更快找到問題。",
                        ],
                    },
                    {
                        title: "建議的送出前檢查",
                        ordered: [
                            "先格式化 payload，確認結構與巢狀層級正確。",
                            "用 Schema 或欄位規則檢查 required、type 與 enum。",
                            "把即將送出的內容與已知成功樣例做一次 diff，比對欄位名稱與預設值。",
                        ],
                    },
                ],
                exampleInput: "{\"status\":\"ready\",\"meta\":{\"retry\":\"3\"}}",
                exampleOutput: "送出前發現：\n- retry 應為 number，不應是 string\n- payload 需要補上 id",
            },
            ja: {
                title: "API リクエスト前に JSON を検証する方法",
                description: "送信前に JSON の整形、Schema 検証、成功例との差分確認を行うと、API デバッグの往復を大きく減らせます。",
                sections: [
                    {
                        title: "送信前検証が効く理由",
                        paragraphs: [
                            "多くの API エラーはサーバー障害に見えても、実際にはリクエスト本文の欠落フィールドや型不一致が原因です。",
                            "ゲートウェイログを追う前に、ローカルで構造と型を確認したほうが早く切り分けできます。",
                        ],
                    },
                    {
                        title: "送信前に通したいチェック",
                        ordered: [
                            "まず payload を整形して、ネスト構造を読みやすくする。",
                            "Schema や契約ルールで required、type、enum を確認する。",
                            "直近の成功例と diff を取り、フィールド名や既定値の違いを見る。",
                        ],
                    },
                ],
                exampleInput: "{\"status\":\"ready\",\"meta\":{\"retry\":\"3\"}}",
                exampleOutput: "送信前チェック:\n- retry は number であるべき\n- payload に id が必要",
            },
            ko: {
                title: "API 요청 전 JSON 검증 방법",
                description: "전송 전에 JSON 포맷팅, Schema 검증, 성공 예시 diff 를 수행하면 API 디버깅 왕복을 크게 줄일 수 있습니다.",
                sections: [
                    {
                        title: "전송 전 검증이 필요한 이유",
                        paragraphs: [
                            "많은 API 오류는 서버 문제처럼 보이지만 실제 원인은 요청 본문의 누락 필드나 타입 불일치인 경우가 많습니다.",
                            "게이트웨이 로그를 보기 전에 로컬에서 구조와 타입을 확인하는 편이 훨씬 빠릅니다.",
                        ],
                    },
                    {
                        title: "전송 전에 돌릴 체크 순서",
                        ordered: [
                            "payload 를 먼저 포맷팅해 구조와 중첩을 읽기 쉽게 만듭니다.",
                            "Schema 나 계약 규칙으로 required, type, enum 을 검사합니다.",
                            "직전 성공 예시와 diff 를 비교해 필드명과 기본값 차이를 확인합니다.",
                        ],
                    },
                ],
                exampleInput: "{\"status\":\"ready\",\"meta\":{\"retry\":\"3\"}}",
                exampleOutput: "전송 전 확인:\n- retry 는 number 여야 함\n- payload 에 id 필요",
            },
            de: {
                title: "JSON vor API-Anfragen validieren",
                description: "Formatierung, Schema-Prüfung und Vergleich mit bekannten Erfolgsbeispielen vor dem Senden sparen viel API-Debugging.",
                sections: [
                    {
                        title: "Warum vor dem Senden prüfen",
                        paragraphs: [
                            "Viele API-Fehler sehen nach Backend-Problemen aus, kommen aber in Wirklichkeit von fehlenden Feldern, falschen Typen oder kaputtem JSON im Request Body.",
                            "Lokale Prüfung von Struktur und Typen ist meist schneller als spätes Debugging in Gateway-Logs.",
                        ],
                    },
                    {
                        title: "Sinnvolle Checks vor dem Request",
                        ordered: [
                            "Payload zuerst formatieren, damit Struktur und Verschachtelung klar sichtbar sind.",
                            "Schema oder Vertragsregeln gegen required, type und enum prüfen.",
                            "Den finalen Body mit einem bekannten Erfolgsbeispiel diffen, um Feld- und Default-Abweichungen zu sehen.",
                        ],
                    },
                ],
                exampleInput: "{\"status\":\"ready\",\"meta\":{\"retry\":\"3\"}}",
                exampleOutput: "Vor dem Senden erkannt:\n- retry sollte number sein\n- payload benötigt zusätzlich id",
            },
            fr: {
                title: "Comment valider le JSON avant les requêtes API",
                description: "Formatter, valider et comparer le JSON avant l'envoi réduit fortement les allers-retours de debug API.",
                sections: [
                    {
                        title: "Pourquoi valider avant d'envoyer",
                        paragraphs: [
                            "Beaucoup d'erreurs API ressemblent à des bugs backend alors que la cause réelle est un champ manquant, un mauvais type ou un body JSON cassé.",
                            "Vérifier structure et types localement est souvent plus rapide que fouiller les logs de gateway après coup.",
                        ],
                    },
                    {
                        title: "Contrôles utiles avant la requête",
                        ordered: [
                            "Formatez d'abord le payload pour rendre la structure lisible.",
                            "Validez required, type et enum avec un schema ou les règles du contrat.",
                            "Comparez ensuite le body final avec un exemple connu comme valide pour repérer les écarts.",
                        ],
                    },
                ],
                exampleInput: "{\"status\":\"ready\",\"meta\":{\"retry\":\"3\"}}",
                exampleOutput: "Détecté avant l'envoi :\n- retry doit être un number\n- il manque id dans le payload",
            },
        },
    },
    "api-auth-header-mistakes": {
        cluster: "c2",
        toolSectionKind: "api",
        relatedTools: [
            { slug: "http-request-builder", toolKey: "http_request_builder" },
            { slug: "curl-to-code", toolKey: "curl_to_code" },
            { slug: "jwt-decoder", toolKey: "jwt_decoder" },
            { slug: "url-encode-decode", toolKey: "url_encode_decode" },
        ],
        next: "convert-curl-to-fetch-python",
        sibling: "mock-openapi-quickly",
        locales: {
            "zh-CN": {
                title: "常见 API 认证请求头错误",
                description: "很多 401/403 并不是权限系统坏了，而是认证头格式、前缀或转发链路出了问题。",
                sections: [
                    {
                        title: "头部错误比 token 错误更常见",
                        paragraphs: [
                            "实际故障里最常见的是缺少 `Bearer` 前缀、头名拼错、代理层没有透传 `Authorization`，而不是 token 本身无效。",
                            "如果服务间、浏览器和 CLI 请求的结果不一致，优先比对完整请求头，而不是先怀疑业务逻辑。",
                        ],
                    },
                    {
                        title: "排查时先对齐这三件事",
                        bullets: [
                            "确认 header 名称、大小写和前缀格式是否符合服务端要求。",
                            "检查反向代理、网关、CDN 是否清洗或覆盖了认证头。",
                            "把原始 cURL、应用代码和服务器日志里的最终请求逐项对比。",
                        ],
                    },
                ],
                exampleInput: "Authorization: token abc123\nX-API-Key: <missing>",
                exampleOutput: "Authorization: Bearer abc123\n或改为服务端要求的 X-API-Key 头",
            },
            "zh-TW": {
                title: "常見 API 驗證標頭錯誤",
                description: "許多 401/403 並不是權限系統故障，而是驗證標頭格式、前綴或轉發鏈路出了問題。",
                sections: [
                    {
                        title: "標頭錯誤比 token 錯誤更常見",
                        paragraphs: [
                            "實務上最常見的是缺少 `Bearer` 前綴、標頭名稱拼錯，或代理層沒有正確傳遞 `Authorization`。",
                            "如果服務間、瀏覽器與 CLI 請求結果不同，應先比對完整標頭，而不是立刻懷疑後端邏輯。",
                        ],
                    },
                    {
                        title: "排查時先對齊這三件事",
                        bullets: [
                            "確認 header 名稱、大小寫與前綴格式符合服務端要求。",
                            "檢查反向代理、網關、CDN 是否清洗或覆寫了驗證標頭。",
                            "把原始 cURL、應用程式程式碼與伺服器日誌中的最終請求逐項比對。",
                        ],
                    },
                ],
                exampleInput: "Authorization: token abc123\nX-API-Key: <missing>",
                exampleOutput: "Authorization: Bearer abc123\n或改成服務端要求的 X-API-Key 標頭",
            },
            ja: {
                title: "API 認証ヘッダーのよくあるミス",
                description: "401/403 の多くは権限ロジックではなく、認証ヘッダーの形式や転送経路の問題で発生します。",
                sections: [
                    {
                        title: "Token よりヘッダー形状を先に疑う",
                        paragraphs: [
                            "典型例は `Bearer` の欠落、ヘッダー名の誤記、プロキシでの `Authorization` 落ちです。",
                            "ブラウザ、CLI、バックエンド間で挙動がずれるときは、まず最終送信ヘッダーを並べて比較すべきです。",
                        ],
                    },
                    {
                        title: "切り分け時の確認点",
                        bullets: [
                            "ヘッダー名、大小文字、プレフィックスがサーバー仕様と一致しているか。",
                            "CDN やゲートウェイが認証ヘッダーを除去していないか。",
                            "cURL、アプリコード、サーバーログのヘッダー差分を残して検証する。",
                        ],
                    },
                ],
                exampleInput: "Authorization: token abc123\nX-API-Key: <missing>",
                exampleOutput: "Authorization: Bearer abc123\nまたは仕様どおりの X-API-Key を送信",
            },
            ko: {
                title: "흔한 API 인증 헤더 실수",
                description: "많은 401/403 은 권한 시스템이 아니라 인증 헤더 형식, 접두사, 프록시 전달 문제에서 시작됩니다.",
                sections: [
                    {
                        title: "토큰보다 헤더 형식을 먼저 확인하세요",
                        paragraphs: [
                            "대표적인 원인은 `Bearer` 누락, 헤더 이름 오타, 프록시 계층에서 `Authorization` 이 제거되는 경우입니다.",
                            "브라우저, CLI, 서버 간 결과가 다르면 비즈니스 로직보다 최종 전송 헤더를 먼저 비교해야 합니다.",
                        ],
                    },
                    {
                        title: "점검 시 우선 맞출 항목",
                        bullets: [
                            "헤더 이름, 대소문자, 접두사가 서버 요구사항과 일치하는지 확인합니다.",
                            "CDN, 게이트웨이, 프록시가 인증 헤더를 덮어쓰거나 제거하지 않는지 봅니다.",
                            "cURL, 앱 코드, 서버 로그의 최종 헤더를 나란히 비교합니다.",
                        ],
                    },
                ],
                exampleInput: "Authorization: token abc123\nX-API-Key: <missing>",
                exampleOutput: "Authorization: Bearer abc123\n또는 서버가 요구하는 X-API-Key 로 수정",
            },
            de: {
                title: "Häufige Fehler bei API-Auth-Headern",
                description: "Viele 401/403-Antworten entstehen nicht durch Berechtigungslogik, sondern durch Header-Format, Präfixe oder verlorene Weiterleitung.",
                sections: [
                    {
                        title: "Headerfehler sind häufiger als Tokenfehler",
                        paragraphs: [
                            "Typische Ursachen sind fehlendes `Bearer`, falsche Headernamen oder Proxies, die `Authorization` nicht weiterreichen.",
                            "Wenn sich Browser, CLI und Services unterschiedlich verhalten, sollten zuerst die finalen Header verglichen werden.",
                        ],
                    },
                    {
                        title: "Diese Punkte zuerst prüfen",
                        bullets: [
                            "Headername, Schreibweise und Präfix gegen die Serveranforderung abgleichen.",
                            "CDN, Gateway und Reverse Proxy auf Header-Manipulation prüfen.",
                            "Rohes cURL, Anwendungscode und Serverlog nebeneinander vergleichen.",
                        ],
                    },
                ],
                exampleInput: "Authorization: token abc123\nX-API-Key: <missing>",
                exampleOutput: "Authorization: Bearer abc123\noder auf den geforderten X-API-Key umstellen",
            },
            fr: {
                title: "Erreurs fréquentes des en-têtes d'authentification API",
                description: "Beaucoup de 401/403 viennent d'un problème d'en-tête d'authentification, de préfixe ou de transit proxy, pas du système d'autorisations lui-même.",
                sections: [
                    {
                        title: "Les erreurs d'en-tête sont plus fréquentes que les erreurs de token",
                        paragraphs: [
                            "Les causes typiques sont l'oubli de `Bearer`, un nom d'en-tête incorrect ou un proxy qui ne relaie pas `Authorization`.",
                            "Si navigateur, CLI et service n'obtiennent pas le même résultat, il faut comparer la requête finale avant d'accuser la logique métier.",
                        ],
                    },
                    {
                        title: "Vérifications prioritaires",
                        bullets: [
                            "Comparer nom d'en-tête, casse et préfixe avec la règle côté serveur.",
                            "Vérifier que CDN, gateway et proxy ne nettoient pas l'en-tête d'authentification.",
                            "Aligner le cURL brut, le code applicatif et les logs serveur pour trouver l'écart.",
                        ],
                    },
                ],
                exampleInput: "Authorization: token abc123\nX-API-Key: <missing>",
                exampleOutput: "Authorization: Bearer abc123\nou utiliser l'en-tête X-API-Key attendu",
            },
        },
    },
    "base64-encoding-when-and-how-to-use-it": {
        cluster: "c6",
        toolSectionKind: "encoding",
        relatedTools: [
            { slug: "base64-encode-decode", toolKey: "base64_encode_decode" },
            { slug: "url-encode-decode", toolKey: "url_encode_decode" },
            { slug: "image-base64", toolKey: "image_base64" },
            { slug: "jwt-decoder", toolKey: "jwt_decoder" },
        ],
        next: "hash-functions-compared-md5-vs-sha256-vs-sha512",
        sibling: "url-encoding-explained-common-mistakes-and-solutions",
        locales: {
            "zh-CN": {
                title: "Base64 编码：何时使用，如何正确使用",
                description: "Base64 适合把二进制变成可传输文本，但它不是加密，也不应该替代真正的安全控制。",
                sections: [
                    {
                        title: "Base64 解决的是传输兼容，不是保密",
                        paragraphs: [
                            "当协议、表单或配置字段只能接受文本时，Base64 能把图片、文件或字节流包装成可传输字符串。",
                            "但任何人都能还原 Base64 内容，所以它只负责编码兼容，不提供机密性。",
                        ],
                    },
                    {
                        title: "落地时最容易踩的坑",
                        bullets: [
                            "混淆标准 Base64 与 URL-safe Base64。",
                            "忽略 `=` padding 导致解码端行为不一致。",
                            "把大型二进制长期嵌入 JSON，导致体积暴涨和调试困难。",
                        ],
                    },
                ],
                exampleInput: "hello 42",
                exampleOutput: "aGVsbG8gNDI=",
            },
            "zh-TW": {
                title: "Base64 編碼：何時使用，如何正確使用",
                description: "Base64 適合把二進位內容轉成可傳輸文字，但它不是加密，也不能取代真正的安全機制。",
                sections: [
                    {
                        title: "Base64 解決的是傳輸相容，不是保密",
                        paragraphs: [
                            "當協議、表單或設定欄位只能接受文字時，Base64 能把圖片、檔案或位元組流包成可傳輸字串。",
                            "但任何人都能還原 Base64 內容，因此它只提供編碼相容，不提供機密性。",
                        ],
                    },
                    {
                        title: "實務上最常見的坑",
                        bullets: [
                            "混淆標準 Base64 與 URL-safe Base64。",
                            "忽略 `=` padding，導致解碼端行為不一致。",
                            "把大型二進位長期嵌入 JSON，讓 payload 體積暴增。",
                        ],
                    },
                ],
                exampleInput: "hello 42",
                exampleOutput: "aGVsbG8gNDI=",
            },
            ja: {
                title: "Base64 エンコード: いつ使い、どう使うか",
                description: "Base64 はバイナリをテキストへ載せ替えるための手段であり、暗号化ではありません。",
                sections: [
                    {
                        title: "Base64 は互換性のための符号化",
                        paragraphs: [
                            "テキストしか受け取れないプロトコルやフィールドで、画像やファイルを文字列として運びたいときに有効です。",
                            "ただし復号は誰でもできるため、機密保護には別の対策が必要です。",
                        ],
                    },
                    {
                        title: "よくある落とし穴",
                        bullets: [
                            "標準 Base64 と URL-safe 版を混同する。",
                            "padding を削って相手実装と互換性が崩れる。",
                            "大きなバイナリを JSON に埋め込み続けて payload が肥大化する。",
                        ],
                    },
                ],
                exampleInput: "hello 42",
                exampleOutput: "aGVsbG8gNDI=",
            },
            ko: {
                title: "Base64 인코딩: 언제 쓰고 어떻게 써야 하는가",
                description: "Base64 는 바이너리를 텍스트로 옮겨 전송 호환성을 높이는 방식이지, 암호화 수단은 아닙니다.",
                sections: [
                    {
                        title: "Base64 는 전송 호환을 위한 인코딩입니다",
                        paragraphs: [
                            "텍스트만 허용하는 프로토콜이나 필드에 이미지, 파일, 바이트 데이터를 실어야 할 때 유용합니다.",
                            "하지만 누구나 다시 디코딩할 수 있으므로 기밀성은 별도 메커니즘으로 보장해야 합니다.",
                        ],
                    },
                    {
                        title: "자주 생기는 실수",
                        bullets: [
                            "표준 Base64 와 URL-safe Base64 를 혼동한다.",
                            "padding 을 제거해 수신 측 구현과 호환이 깨진다.",
                            "큰 바이너리를 JSON 안에 오래 넣어 payload 를 과도하게 키운다.",
                        ],
                    },
                ],
                exampleInput: "hello 42",
                exampleOutput: "aGVsbG8gNDI=",
            },
            de: {
                title: "Base64-Encoding: wann und wie man es richtig nutzt",
                description: "Base64 hilft beim Transport von Binärdaten in Textpfaden, ersetzt aber keine Verschlüsselung.",
                sections: [
                    {
                        title: "Base64 löst Kompatibilität, nicht Vertraulichkeit",
                        paragraphs: [
                            "Es eignet sich, wenn Protokolle oder Felder nur Text akzeptieren und Binärdaten trotzdem übertragen werden müssen.",
                            "Da die Rückumwandlung trivial ist, darf Base64 nie als Sicherheitsmaßnahme missverstanden werden.",
                        ],
                    },
                    {
                        title: "Typische Fehler",
                        bullets: [
                            "Standard- und URL-safe-Variante verwechseln.",
                            "Padding entfernen und dadurch Decoder-Inkompatibilitäten erzeugen.",
                            "Große Binärartefakte dauerhaft in JSON einbetten.",
                        ],
                    },
                ],
                exampleInput: "hello 42",
                exampleOutput: "aGVsbG8gNDI=",
            },
            fr: {
                title: "Encodage Base64 : quand et comment l'utiliser",
                description: "Base64 sert à transporter du binaire dans des canaux texte, mais ne fournit aucune confidentialité.",
                sections: [
                    {
                        title: "Base64 règle un problème de transport, pas de sécurité",
                        paragraphs: [
                            "Il est utile quand un protocole ou un champ n'accepte que du texte alors que vous devez envoyer des octets ou un fichier.",
                            "Comme le décodage est trivial, Base64 ne doit jamais être présenté comme un mécanisme de protection.",
                        ],
                    },
                    {
                        title: "Erreurs fréquentes",
                        bullets: [
                            "Confondre Base64 standard et Base64 URL-safe.",
                            "Supprimer le padding et casser la compatibilité de décodage.",
                            "Laisser de gros binaires encodés dans du JSON trop longtemps.",
                        ],
                    },
                ],
                exampleInput: "hello 42",
                exampleOutput: "aGVsbG8gNDI=",
            },
        },
    },
    "certificate-chain-basics-for-developers": {
        cluster: "c3",
        toolSectionKind: "security",
        relatedTools: [            { slug: "certificate-decoder", toolKey: "certificate_decoder" },
            { slug: "security-header-analyzer", toolKey: "security_header_analyzer" },        ],
        next: "csp-mistakes-that-break-production",
        sibling: "robots-txt-testing-checklist",
        locales: {
            "zh-CN": {
                title: "开发者证书链基础",
                description: "理解叶子证书、中间证书和根证书如何协同，能更快定位 TLS 握手与信任链问题。",
                sections: [
                    {
                        title: "链顺序和中间证书决定握手成功率",
                        paragraphs: [
                            "服务端往往不是“证书有无”出问题，而是链顺序错误、漏发中间证书，导致客户端无法把叶子证书连到受信根。",
                            "浏览器、移动端和自动化探针对链完整性的容忍度不同，所以线上环境更容易暴露这类问题。",
                        ],
                    },
                    {
                        title: "排查时看这几个对象",
                        bullets: [
                            "确认叶子证书的 SAN、有效期和域名是否匹配。",
                            "检查中间证书是否完整、顺序是否正确。",
                            "区分根证书信任问题和服务端链配置问题，避免误换证书。",
                        ],
                    },
                ],
                exampleInput: "Leaf cert for api.example.com\nIntermediate missing from server chain",
                exampleOutput: "TLS client cannot build trust path\n补齐中间证书后握手恢复正常",
            },
            "zh-TW": {
                title: "開發者憑證鏈基礎",
                description: "理解葉子憑證、中繼憑證與根憑證如何串接，能更快定位 TLS 握手與信任鏈問題。",
                sections: [
                    {
                        title: "鏈順序與中繼憑證會直接影響握手",
                        paragraphs: [
                            "正式環境常見問題不是沒有憑證，而是鏈順序錯誤或少送中繼憑證，讓客戶端無法連到受信根。",
                            "不同瀏覽器、行動端與探針對鏈完整性的容忍度不同，因此這類錯誤很容易只在某些環境出現。",
                        ],
                    },
                    {
                        title: "排查時要看這些物件",
                        bullets: [
                            "確認葉子憑證的 SAN、有效期與網域是否相符。",
                            "檢查中繼憑證是否完整且順序正確。",
                            "分清楚是根憑證信任問題還是服務端鏈配置問題。",
                        ],
                    },
                ],
                exampleInput: "Leaf cert for api.example.com\nIntermediate missing from server chain",
                exampleOutput: "TLS client cannot build trust path\n補齊中繼憑證後握手恢復正常",
            },
            ja: {
                title: "開発者向け証明書チェーン基礎",
                description: "リーフ証明書、中間証明書、ルート証明書のつながりを理解すると TLS と信頼失敗の切り分けが速くなります。",
                sections: [
                    {
                        title: "失敗の本体はチェーン不備であることが多い",
                        paragraphs: [
                            "証明書の有無よりも、中間証明書の欠落や送信順の誤りが握手失敗の原因になることが多いです。",
                            "ブラウザ、モバイル、監視プローブで再現条件がずれるため、本番でだけ見える TLS 問題になりやすいのも特徴です。",
                        ],
                    },
                    {
                        title: "確認すべきポイント",
                        bullets: [
                            "リーフ証明書の SAN、期限、対象ホスト名。",
                            "中間証明書が揃っているか、順序が正しいか。",
                            "ルート信頼の問題なのか、サーバー送信チェーンの問題なのかを切り分ける。",
                        ],
                    },
                ],
                exampleInput: "Leaf cert for api.example.com\nIntermediate missing from server chain",
                exampleOutput: "TLS クライアントが信頼パスを構築できない\n中間証明書を追加すると握手が成功",
            },
            ko: {
                title: "개발자를 위한 인증서 체인 기초",
                description: "리프, 중간, 루트 인증서가 어떻게 연결되는지 이해하면 TLS 핸드셰이크와 신뢰 실패를 더 빨리 좁힐 수 있습니다.",
                sections: [
                    {
                        title: "실패 원인은 체인 누락인 경우가 많습니다",
                        paragraphs: [
                            "운영 환경에서는 인증서 자체보다 중간 인증서 누락이나 순서 오류 때문에 클라이언트가 신뢰 경로를 만들지 못하는 경우가 흔합니다.",
                            "브라우저, 모바일, 모니터링 프로브의 허용 범위가 달라 특정 환경에서만 TLS 오류가 보이기도 합니다.",
                        ],
                    },
                    {
                        title: "확인해야 할 핵심 항목",
                        bullets: [
                            "리프 인증서의 SAN, 만료일, 호스트명 일치 여부.",
                            "중간 인증서가 모두 포함되었는지와 순서가 맞는지.",
                            "루트 신뢰 문제인지 서버 체인 구성 문제인지 구분하기.",
                        ],
                    },
                ],
                exampleInput: "Leaf cert for api.example.com\nIntermediate missing from server chain",
                exampleOutput: "TLS client cannot build trust path\n중간 인증서를 추가하면 핸드셰이크가 복구됨",
            },
            de: {
                title: "Grundlagen der Zertifikatskette für Entwickler",
                description: "Wer Leaf-, Intermediate- und Root-Zertifikate sauber unterscheiden kann, findet TLS- und Trust-Probleme deutlich schneller.",
                sections: [
                    {
                        title: "Handshake-Fehler kommen oft von unvollständigen Ketten",
                        paragraphs: [
                            "Häufig fehlt nicht das Zertifikat selbst, sondern ein Intermediate oder die Auslieferungsreihenfolge ist falsch.",
                            "Weil Browser, mobile Clients und Prüftools unterschiedlich tolerant sind, tauchen solche Fehler oft nur in bestimmten Umgebungen auf.",
                        ],
                    },
                    {
                        title: "Diese Objekte sollten geprüft werden",
                        bullets: [
                            "SAN, Ablaufdatum und Hostname des Leaf-Zertifikats.",
                            "Vollständigkeit und Reihenfolge der Intermediate-Zertifikate.",
                            "Ob das Problem in der Root-Trust-Chain oder in der Serverkonfiguration liegt.",
                        ],
                    },
                ],
                exampleInput: "Leaf cert for api.example.com\nIntermediate missing from server chain",
                exampleOutput: "TLS-Client kann keinen Vertrauenspfad aufbauen\nNach Ergänzung des Intermediate funktioniert der Handshake",
            },
            fr: {
                title: "Bases de la chaîne de certificats pour les développeurs",
                description: "Comprendre le rôle des certificats leaf, intermédiaires et racine aide à isoler beaucoup plus vite les problèmes TLS.",
                sections: [
                    {
                        title: "Les erreurs viennent souvent d'une chaîne incomplète",
                        paragraphs: [
                            "Le problème n'est souvent pas le certificat lui-même mais l'absence d'un intermédiaire ou un ordre de chaîne incorrect.",
                            "Comme navigateurs, mobiles et sondes ont des tolérances différentes, l'incident n'apparaît parfois qu'en production.",
                        ],
                    },
                    {
                        title: "Points à contrôler",
                        bullets: [
                            "SAN, date d'expiration et nom de domaine du certificat leaf.",
                            "Présence et ordre des certificats intermédiaires.",
                            "Différencier un problème de confiance racine d'un problème de chaîne côté serveur.",
                        ],
                    },
                ],
                exampleInput: "Leaf cert for api.example.com\nIntermediate missing from server chain",
                exampleOutput: "Le client TLS ne peut pas construire la chaîne de confiance\nL'ajout de l'intermédiaire corrige le handshake",
            },
        },
    },
    "color-extraction-from-images-use-cases-and-tools": {
        cluster: "c5",
        toolSectionKind: "image",
        relatedTools: [
            { slug: "image-color-extractor", toolKey: "image_color_extractor" },
            { slug: "image-color-picker", toolKey: "image_color_picker" },
            { slug: "image-average-color-finder", toolKey: "image_average_color_finder" },
            { slug: "ai-color-palette-generator", toolKey: "ai_color_palette_generator" },
        ],
        next: "svg-optimization-and-conversion-best-practices",
        sibling: "image-privacy-how-to-censor-and-protect-images",
        locales: {
            "zh-CN": {
                title: "从图片提取颜色：使用场景与工具",
                description: "颜色提取不仅用于设计配色，也适合品牌审计、社媒复刻和素材一致性检查。",
                sections: [
                    {
                        title: "什么时候该提取主色和辅助色",
                        paragraphs: [
                            "当你要复用品牌视觉、分析竞品素材，或从一张图生成网页/海报配色时，先提取稳定主色最省时间。",
                            "不同任务关注的颜色粒度不同，品牌色适合看主色块，摄影素材则更适合看平均色与局部取色。",
                        ],
                    },
                    {
                        title: "让颜色结果更可信的方法",
                        bullets: [
                            "先裁掉水印、边框和大面积留白。",
                            "区分主色、点缀色和背景色，不要只看数量最多的像素。",
                            "把提取结果和实际 UI / 设计稿一起验证，避免只看一张图做最终决策。",
                        ],
                    },
                ],
                exampleInput: "营销海报截图\n目标：提取品牌主色与 CTA 点缀色",
                exampleOutput: "主色：#0F172A\n点缀色：#F97316\n辅助色：#E2E8F0",
            },
            "zh-TW": {
                title: "從圖片擷取顏色：使用情境與工具",
                description: "顏色擷取不只用於設計配色，也適合品牌稽核、社群素材復刻與視覺一致性檢查。",
                sections: [
                    {
                        title: "什麼時候需要擷取主色與輔助色",
                        paragraphs: [
                            "當你要重用品牌視覺、分析競品素材，或從一張圖延伸出網站/海報配色時，先抓出穩定主色最有效率。",
                            "不同任務需要的顏色粒度不同，品牌識別更看主色塊，攝影素材則更適合看平均色與局部取色。",
                        ],
                    },
                    {
                        title: "讓結果更可信的做法",
                        bullets: [
                            "先裁掉浮水印、邊框與大面積留白。",
                            "區分主色、點綴色與背景色，不要只看像素數量最多的顏色。",
                            "把提取結果帶回真實 UI 或設計稿驗證。",
                        ],
                    },
                ],
                exampleInput: "行銷海報截圖\n目標：擷取品牌主色與 CTA 點綴色",
                exampleOutput: "主色：#0F172A\n點綴色：#F97316\n輔助色：#E2E8F0",
            },
            ja: {
                title: "画像から色を抽出する: 使いどころとツール",
                description: "色抽出は配色づくりだけでなく、ブランド監査や素材の再現、UI 一貫性確認にも役立ちます。",
                sections: [
                    {
                        title: "主色と補助色を取り出す場面",
                        paragraphs: [
                            "ブランドビジュアルの再利用や競合のクリエイティブ分析では、まず安定した主色を把握するのが近道です。",
                            "写真系素材では平均色と局所色の両方を見ることで、実際の UI に使える色が見つけやすくなります。",
                        ],
                    },
                    {
                        title: "抽出精度を上げるコツ",
                        bullets: [
                            "透かし、枠線、余白を先に除く。",
                            "主色・アクセント色・背景色を分けて評価する。",
                            "抽出した色を実際の画面やデザイン案に当てて確認する。",
                        ],
                    },
                ],
                exampleInput: "キャンペーン画像\n目的: ブランド色と CTA 色を抽出",
                exampleOutput: "主色: #0F172A\nアクセント: #F97316\n補助色: #E2E8F0",
            },
            ko: {
                title: "이미지에서 색 추출: 활용 사례와 도구",
                description: "색 추출은 단순 팔레트 생성뿐 아니라 브랜드 점검, 경쟁사 분석, 시각 일관성 확인에도 유용합니다.",
                sections: [
                    {
                        title: "주색과 보조색이 필요한 순간",
                        paragraphs: [
                            "브랜드 비주얼을 재사용하거나 경쟁사 크리에이티브를 분석할 때는 먼저 안정적인 주색을 파악하는 것이 빠릅니다.",
                            "사진 기반 소재는 평균색과 부분 색상을 함께 봐야 실제 UI 에 쓸 색을 더 잘 고를 수 있습니다.",
                        ],
                    },
                    {
                        title: "추출 결과를 더 신뢰할 수 있게 하려면",
                        bullets: [
                            "워터마크, 테두리, 큰 여백을 먼저 제거합니다.",
                            "주색, 포인트색, 배경색을 구분해서 봅니다.",
                            "추출 색을 실제 화면이나 디자인 초안에 적용해 검증합니다.",
                        ],
                    },
                ],
                exampleInput: "마케팅 포스터 캡처\n목표: 브랜드 주색과 CTA 포인트색 추출",
                exampleOutput: "주색: #0F172A\n포인트색: #F97316\n보조색: #E2E8F0",
            },
            de: {
                title: "Farben aus Bildern extrahieren: Anwendungsfälle und Tools",
                description: "Farbextraktion hilft nicht nur beim Palette-Building, sondern auch bei Brand-Audits und visueller Konsistenz.",
                sections: [
                    {
                        title: "Wann Haupt- und Akzentfarben gebraucht werden",
                        paragraphs: [
                            "Für Markenübernahmen, Wettbewerbsanalysen oder visuelle Ableitungen aus Kampagnenmotiven ist die Hauptfarbe der beste Startpunkt.",
                            "Bei Fotos sollten Mittelwert- und Lokalwerte kombiniert werden, damit die spätere UI-Farbe nicht nur statistisch, sondern praktisch sinnvoll ist.",
                        ],
                    },
                    {
                        title: "So werden Ergebnisse belastbarer",
                        bullets: [
                            "Wasserzeichen, Rahmen und Leerflächen zuerst entfernen.",
                            "Haupt-, Akzent- und Hintergrundfarbe getrennt bewerten.",
                            "Extrahierte Farben in echten Layouts gegenprüfen.",
                        ],
                    },
                ],
                exampleInput: "Marketing-Poster\nZiel: Haupt- und CTA-Farbe extrahieren",
                exampleOutput: "Hauptfarbe: #0F172A\nAkzent: #F97316\nHilfsfarbe: #E2E8F0",
            },
            fr: {
                title: "Extraction des couleurs d'images : cas d'usage et outils",
                description: "L'extraction de couleurs sert autant à construire une palette qu'à auditer une identité visuelle ou reproduire un visuel marketing.",
                sections: [
                    {
                        title: "Quand extraire couleur principale et accents",
                        paragraphs: [
                            "Pour réutiliser une identité de marque, analyser un visuel concurrent ou dériver une palette web, la couleur dominante est le meilleur point de départ.",
                            "Sur des images photographiques, combiner couleur moyenne et couleurs locales donne un résultat plus exploitable qu'un simple top pixel.",
                        ],
                    },
                    {
                        title: "Comment fiabiliser le résultat",
                        bullets: [
                            "Retirer d'abord filigranes, cadres et grandes zones blanches.",
                            "Séparer couleur principale, couleur d'accent et couleur de fond.",
                            "Tester ensuite les couleurs extraites dans une vraie maquette.",
                        ],
                    },
                ],
                exampleInput: "Visuel marketing\nObjectif : extraire la couleur de marque et la couleur CTA",
                exampleOutput: "Couleur principale : #0F172A\nAccent : #F97316\nCouleur secondaire : #E2E8F0",
            },
        },
    },
    "convert-curl-to-fetch-python": {
        cluster: "c2",
        toolSectionKind: "api",
        relatedTools: [
            { slug: "curl-to-code", toolKey: "curl_to_code" },
            { slug: "http-request-builder", toolKey: "http_request_builder" },
            { slug: "openapi-viewer", toolKey: "openapi_viewer" },
            { slug: "openapi-mock", toolKey: "openapi_mock" },
        ],
        next: "mock-openapi-quickly",
        sibling: "openapi-debugging-workflow-checklist",
        locales: {
            "zh-CN": {
                title: "如何将 cURL 转为 fetch/Python",
                description: "把 cURL 改写成 fetch 或 Python 代码时，真正容易丢的是方法、头部、编码和超时语义。",
                sections: [
                    {
                        title: "先拆请求，再写代码",
                        paragraphs: [
                            "不要直接把整行 cURL 机械翻译成代码。先单独标出 method、URL、query、headers 和 body，才能看出哪些参数真的参与请求。",
                            "尤其要注意 `--data` 是表单还是 JSON、是否需要序列化，以及哪些 header 是运行时动态生成的。",
                        ],
                    },
                    {
                        title: "转换后一定要做回放验证",
                        bullets: [
                            "让原始 cURL 和目标语言代码都打到同一个 sandbox 端点。",
                            "逐项比对最终 headers、body 和 query string。",
                            "把通过验证的代码片段沉淀到文档或仓库示例中，减少下一次手工改写。",
                        ],
                    },
                ],
                exampleInput: "curl -X POST https://api.example.com/v1/tasks -H \"Authorization: Bearer $TOKEN\" -d '{\"id\":42}'",
                exampleOutput: "fetch(...) / requests.post(...)\n保持相同 method、headers、body 和 URL 参数",
            },
            "zh-TW": {
                title: "如何將 cURL 轉為 fetch/Python",
                description: "把 cURL 改寫成 fetch 或 Python 程式碼時，最容易遺失的是 method、header、編碼與 timeout 語意。",
                sections: [
                    {
                        title: "先拆請求，再寫程式碼",
                        paragraphs: [
                            "不要直接把整行 cURL 機械翻譯成程式碼。先拆出 method、URL、query、headers 與 body，才能看出真正參與請求的欄位。",
                            "尤其要注意 `--data` 是表單還是 JSON、是否需要序列化，以及哪些 header 是執行期動態補上的。",
                        ],
                    },
                    {
                        title: "轉換後一定要回放驗證",
                        bullets: [
                            "讓原始 cURL 與目標語言程式碼都打到同一個 sandbox 端點。",
                            "逐項比對最終 headers、body 與 query string。",
                            "把驗證過的程式片段沉澱到文件或 repo 範例中。",
                        ],
                    },
                ],
                exampleInput: "curl -X POST https://api.example.com/v1/tasks -H \"Authorization: Bearer $TOKEN\" -d '{\"id\":42}'",
                exampleOutput: "fetch(...) / requests.post(...)\n保持相同 method、headers、body 與 URL 參數",
            },
            ja: {
                title: "cURL を fetch/Python に変換する方法",
                description: "cURL をアプリコードへ移すときは、method、header、body、timeout の意味を落とさないことが重要です。",
                sections: [
                    {
                        title: "まずリクエストを分解する",
                        paragraphs: [
                            "cURL 全体をそのままコードへ写すのではなく、method、URL、query、headers、body を先に分離して確認します。",
                            "`--data` が JSON なのか form なのか、実行時に付与される header は何かをここで整理しておくと変換ミスが減ります。",
                        ],
                    },
                    {
                        title: "変換後は必ず同条件で再生する",
                        bullets: [
                            "元の cURL と生成したコードを同じ検証用エンドポイントに送る。",
                            "最終的な headers、body、query の差分を比較する。",
                            "確認済みスニペットを社内ドキュメントやサンプルに残す。",
                        ],
                    },
                ],
                exampleInput: "curl -X POST https://api.example.com/v1/tasks -H \"Authorization: Bearer $TOKEN\" -d '{\"id\":42}'",
                exampleOutput: "fetch(...) / requests.post(...)\nmethod、headers、body、URL パラメータを一致させる",
            },
            ko: {
                title: "cURL을 fetch/Python으로 변환하는 방법",
                description: "cURL 을 애플리케이션 코드로 옮길 때는 method, header, body, timeout 의미를 잃지 않는 것이 핵심입니다.",
                sections: [
                    {
                        title: "먼저 요청을 분해하세요",
                        paragraphs: [
                            "cURL 한 줄을 그대로 코드로 바꾸지 말고 method, URL, query, headers, body 를 먼저 나눠 확인해야 합니다.",
                            "`--data` 가 JSON 인지 form 인지, 어떤 header 가 런타임에 동적으로 들어가는지도 이 단계에서 정리해야 합니다.",
                        ],
                    },
                    {
                        title: "변환 후에는 같은 조건으로 재생하세요",
                        bullets: [
                            "원본 cURL 과 생성한 코드를 같은 sandbox 엔드포인트로 보냅니다.",
                            "최종 headers, body, query string 을 하나씩 비교합니다.",
                            "검증된 코드 조각을 문서나 예제 저장소에 남겨 재사용합니다.",
                        ],
                    },
                ],
                exampleInput: "curl -X POST https://api.example.com/v1/tasks -H \"Authorization: Bearer $TOKEN\" -d '{\"id\":42}'",
                exampleOutput: "fetch(...) / requests.post(...)\nmethod, headers, body, URL 파라미터를 동일하게 유지",
            },
            de: {
                title: "cURL in fetch/Python umwandeln",
                description: "Bei der Übersetzung von cURL in Anwendungscode gehen oft Methode, Headersemantik, Body-Encoding oder Timeouts verloren.",
                sections: [
                    {
                        title: "Den Request zuerst zerlegen",
                        paragraphs: [
                            "Nicht die ganze cURL-Zeile blind in Code übersetzen. Zuerst Methode, URL, Query, Header und Body trennen.",
                            "Dabei klären, ob `--data` JSON oder Formdaten bedeutet und welche Header erst zur Laufzeit gesetzt werden.",
                        ],
                    },
                    {
                        title: "Nach der Umwandlung aktiv gegenprüfen",
                        bullets: [
                            "Original-cURL und Zielcode gegen denselben Sandbox-Endpunkt ausführen.",
                            "Headers, Body und Query-Parameter im finalen Request vergleichen.",
                            "Verifizierte Snippets in Doku oder Repo-Beispielen sichern.",
                        ],
                    },
                ],
                exampleInput: "curl -X POST https://api.example.com/v1/tasks -H \"Authorization: Bearer $TOKEN\" -d '{\"id\":42}'",
                exampleOutput: "fetch(...) / requests.post(...)\nMethode, Header, Body und URL-Parameter identisch halten",
            },
            fr: {
                title: "Comment convertir cURL en fetch/Python",
                description: "Quand on transforme une commande cURL en code applicatif, on perd souvent la méthode, les headers, l'encodage du body ou les timeouts.",
                sections: [
                    {
                        title: "Décomposer la requête avant de coder",
                        paragraphs: [
                            "Ne traduisez pas toute la ligne cURL d'un bloc. Séparez d'abord méthode, URL, query, headers et body.",
                            "Il faut notamment clarifier si `--data` représente du JSON ou un formulaire, et quels headers sont ajoutés à l'exécution.",
                        ],
                    },
                    {
                        title: "Rejouer après conversion",
                        bullets: [
                            "Exécuter le cURL d'origine et le code généré contre le même endpoint sandbox.",
                            "Comparer le résultat final des headers, du body et de la query string.",
                            "Conserver les snippets validés dans la documentation ou le dépôt.",
                        ],
                    },
                ],
                exampleInput: "curl -X POST https://api.example.com/v1/tasks -H \"Authorization: Bearer $TOKEN\" -d '{\"id\":42}'",
                exampleOutput: "fetch(...) / requests.post(...)\nconserver la même méthode, les mêmes headers, le même body et les mêmes paramètres d'URL",
            },
        },
    },
    "csp-mistakes-that-break-production": {
        cluster: "c3",
        toolSectionKind: "security",
        relatedTools: [
            { slug: "csp-parser", toolKey: "csp_parser" },
            { slug: "security-header-analyzer", toolKey: "security_header_analyzer" },
            { slug: "header-diff", toolKey: "header_diff" },
            { slug: "http-request-builder", toolKey: "http_request_builder" },
        ],
        next: "robots-txt-testing-checklist",
        sibling: "dns-records-uptime",
        locales: {
            "zh-CN": {
                title: "会导致生产故障的 CSP 常见错误",
                description: "CSP 真正危险的地方不是写不出来，而是上线后静默拦截脚本、字体和第三方资源。",
                sections: [
                    {
                        title: "最常见的问题是策略与真实资源不一致",
                        paragraphs: [
                            "团队经常在测试环境只验证页面能打开，却没有覆盖第三方脚本、内联样式、字体和异步加载资源。",
                            "一旦 `script-src`、`connect-src`、`frame-src` 与真实依赖不匹配，生产上会出现功能缺失但接口仍然 200 的隐蔽故障。",
                        ],
                    },
                    {
                        title: "更安全的发布方式",
                        bullets: [
                            "先用 Report-Only 收集真实拦截，再收紧正式策略。",
                            "每次接入新第三方脚本或域名时同步更新策略和回归用例。",
                            "把响应头 diff 纳入部署检查，防止 CDN 或反向代理覆盖 CSP。",
                        ],
                    },
                ],
                exampleInput: "Content-Security-Policy: script-src 'self'; connect-src 'self'",
                exampleOutput: "前端调用 https://api.partner.com 被拦截\n需要补充 connect-src https://api.partner.com",
            },
            "zh-TW": {
                title: "會導致正式環境故障的 CSP 常見錯誤",
                description: "CSP 最危險的地方不在於不會寫，而在於上線後靜默攔截腳本、字型與第三方資源。",
                sections: [
                    {
                        title: "最常見的問題是策略與真實資源不一致",
                        paragraphs: [
                            "團隊常常只確認頁面能開，卻沒有覆蓋第三方腳本、內嵌樣式、字型與延遲載入資源。",
                            "只要 `script-src`、`connect-src`、`frame-src` 與實際依賴不符，就會在正式環境出現功能缺失但請求仍然 200 的隱性故障。",
                        ],
                    },
                    {
                        title: "更安全的發布方式",
                        bullets: [
                            "先用 Report-Only 收集真實攔截，再收斂正式策略。",
                            "每次新增第三方腳本或網域時同步更新策略與回歸案例。",
                            "把回應標頭 diff 納入部署檢查，避免 CDN 或代理覆寫 CSP。",
                        ],
                    },
                ],
                exampleInput: "Content-Security-Policy: script-src 'self'; connect-src 'self'",
                exampleOutput: "前端呼叫 https://api.partner.com 被攔截\n需要補上 connect-src https://api.partner.com",
            },
            ja: {
                title: "本番障害を招く CSP のよくあるミス",
                description: "CSP は書けるかどうかより、本番で本当に必要なリソースと合っているかが重要です。",
                sections: [
                    {
                        title: "壊れる原因はポリシーと依存先のズレ",
                        paragraphs: [
                            "画面が開くことだけ確認して、本番で使うサードパーティスクリプト、フォント、API 接続先まで検証していないケースが多くあります。",
                            "`script-src` や `connect-src` が実運用の依存先とずれると、HTTP は成功していても機能だけ壊れる障害になります。",
                        ],
                    },
                    {
                        title: "安全な展開手順",
                        bullets: [
                            "まず Report-Only で実際の違反を集める。",
                            "新しいドメインやスクリプトを追加したら CSP と回帰テストも更新する。",
                            "CDN やプロキシでヘッダーが変わっていないか差分を監視する。",
                        ],
                    },
                ],
                exampleInput: "Content-Security-Policy: script-src 'self'; connect-src 'self'",
                exampleOutput: "https://api.partner.com への接続がブロック\nconnect-src に対象ドメインを追加",
            },
            ko: {
                title: "운영 환경 장애를 부르는 CSP 실수",
                description: "CSP 의 위험은 문법보다 실제 리소스와 정책이 맞지 않아 운영에서 조용히 기능을 막는 데 있습니다.",
                sections: [
                    {
                        title: "가장 흔한 원인은 정책과 의존성의 불일치",
                        paragraphs: [
                            "페이지가 열린다는 이유만으로 배포하고, 실제로 쓰는 서드파티 스크립트, 폰트, API 엔드포인트까지 확인하지 않는 경우가 많습니다.",
                            "`script-src`, `connect-src`, `frame-src` 가 실제 의존성과 어긋나면 응답은 200 이어도 기능은 망가지는 장애가 발생합니다.",
                        ],
                    },
                    {
                        title: "더 안전한 배포 순서",
                        bullets: [
                            "먼저 Report-Only 로 실제 위반을 수집합니다.",
                            "새 도메인이나 스크립트를 추가할 때 CSP 와 회귀 테스트를 함께 갱신합니다.",
                            "CDN 과 프록시에서 헤더가 바뀌지 않았는지 diff 로 확인합니다.",
                        ],
                    },
                ],
                exampleInput: "Content-Security-Policy: script-src 'self'; connect-src 'self'",
                exampleOutput: "https://api.partner.com 연결이 차단됨\nconnect-src 에 해당 도메인 추가 필요",
            },
            de: {
                title: "CSP-Fehler, die Produktion lahmlegen",
                description: "Das eigentliche Risiko einer CSP liegt nicht im Schreiben der Policy, sondern in still blockierten Ressourcen nach dem Rollout.",
                sections: [
                    {
                        title: "Am häufigsten passt die Policy nicht zu den echten Abhängigkeiten",
                        paragraphs: [
                            "Oft wird nur geprüft, ob die Seite lädt, nicht aber ob Dritt-Skripte, Fonts, Frames oder externe APIs tatsächlich erlaubt sind.",
                            "Wenn `script-src`, `connect-src` oder `frame-src` reale Abhängigkeiten vergessen, entsteht ein Produktionsfehler mit 200er Antworten, aber kaputter Funktionalität.",
                        ],
                    },
                    {
                        title: "Sicherer ausrollen",
                        bullets: [
                            "Zuerst Report-Only aktivieren und echte Verstöße sammeln.",
                            "Bei neuen Domains oder Skripten CSP und Regressionstests gemeinsam aktualisieren.",
                            "Header-Diffs in Deployments prüfen, damit CDN oder Proxy die Policy nicht überschreiben.",
                        ],
                    },
                ],
                exampleInput: "Content-Security-Policy: script-src 'self'; connect-src 'self'",
                exampleOutput: "Frontend-Request zu https://api.partner.com blockiert\nconnect-src muss erweitert werden",
            },
            fr: {
                title: "Erreurs CSP qui cassent la production",
                description: "Le vrai danger d'une CSP n'est pas sa syntaxe mais le blocage silencieux de ressources après déploiement.",
                sections: [
                    {
                        title: "Le problème le plus fréquent : la politique ne reflète pas les vraies dépendances",
                        paragraphs: [
                            "Les équipes vérifient souvent que la page s'ouvre, mais pas que scripts tiers, polices, frames et endpoints externes sont bien autorisés.",
                            "Si `script-src`, `connect-src` ou `frame-src` oublient un domaine réel, la production casse sans forcément produire des erreurs HTTP visibles.",
                        ],
                    },
                    {
                        title: "Déployer plus proprement",
                        bullets: [
                            "Commencer par Report-Only pour collecter les violations réelles.",
                            "Mettre à jour CSP et tests de régression à chaque nouveau domaine ou script tiers.",
                            "Comparer les headers en déploiement pour détecter une réécriture par CDN ou proxy.",
                        ],
                    },
                ],
                exampleInput: "Content-Security-Policy: script-src 'self'; connect-src 'self'",
                exampleOutput: "Appel frontend vers https://api.partner.com bloqué\nil faut ajouter ce domaine à connect-src",
            },
        },
    },
    "css-animations-and-transitions-guide": {
        cluster: "c4",
        toolSectionKind: "css",
        relatedTools: [
            { slug: "css-cubic-bezier-generator", toolKey: "css_cubic_bezier_generator" },
            { slug: "css-loader-generator", toolKey: "css_loader_generator" },
            { slug: "css-switch-generator", toolKey: "css_switch_generator" },
            { slug: "css-text-glitch-effect-generator", toolKey: "css_text_glitch_effect_generator" },
        ],
        next: "css-border-radius-and-shapes-guide",
        sibling: "css-layout-patterns-for-developers",
        locales: {
            "zh-CN": {
                title: "CSS 动画与过渡完整指南",
                description: "动画应该强化状态变化，而不是干扰内容阅读。把过渡、关键帧和 easing 规则收敛到一套系统里，界面会更稳定。",
                sections: [
                    {
                        title: "先区分过渡和关键帧",
                        paragraphs: [
                            "过渡更适合 hover、focus、展开收起这类 A 到 B 的状态变化，因为它们可预测、易复用，也更容易控制时长。",
                            "关键帧更适合加载器、引导动效和强调路径，但循环动画必须克制，并且要给 reduced-motion 用户提供回退。",
                        ],
                    },
                    {
                        title: "团队里要统一的动效规则",
                        bullets: [
                            "优先动画 `transform` 和 `opacity`，避免引发布局抖动。",
                            "只保留少量 easing token，例如进入、退出、强调三类。",
                            "把时长和 easing 当作设计系统令牌管理，避免组件各自乱写 cubic-bezier。",
                        ],
                    },
                ],
                exampleInput: "组件：开关按钮\n目标：切换时有明确但不拖沓的反馈",
                exampleOutput: "transform 180ms cubic-bezier(.2,.8,.2,1)\ncolor 140ms ease-out",
            },
            "zh-TW": {
                title: "CSS 動畫與過渡完整指南",
                description: "動畫應該強化狀態變化，而不是打擾內容閱讀。把 transition、keyframes 與 easing 收斂成系統，介面會更穩定。",
                sections: [
                    {
                        title: "先分清楚過渡與關鍵影格",
                        paragraphs: [
                            "過渡更適合 hover、focus、展開收合這類 A 到 B 的狀態切換，因為可預期、可重用，也較容易控制節奏。",
                            "關鍵影格更適合 loader、引導動效與敘事式移動，但循環動畫要節制，也要提供 reduced-motion 回退。",
                        ],
                    },
                    {
                        title: "團隊應統一的動效規則",
                        bullets: [
                            "優先動畫 `transform` 與 `opacity`，避免造成版面抖動。",
                            "只保留少量 easing token，例如進場、退場、強調三類。",
                            "把時長與 easing 納入設計系統，避免各元件自行亂寫 cubic-bezier。",
                        ],
                    },
                ],
                exampleInput: "元件：切換開關\n目標：切換時有明確但不拖泥帶水的回饋",
                exampleOutput: "transform 180ms cubic-bezier(.2,.8,.2,1)\ncolor 140ms ease-out",
            },
            ja: {
                title: "CSS アニメーションとトランジション完全ガイド",
                description: "動きは状態変化を明確にするために使うべきで、装飾のために増やすべきではありません。遷移、キーフレーム、easing を体系化すると UI が安定します。",
                sections: [
                    {
                        title: "トランジションとキーフレームを使い分ける",
                        paragraphs: [
                            "トランジションは hover、focus、開閉のような A から B の状態変化に向いています。小さく、予測可能で、再利用もしやすいからです。",
                            "キーフレームはローダーやガイド動線に向いていますが、繰り返し動作は控えめにし、reduced-motion への配慮を忘れてはいけません。",
                        ],
                    },
                    {
                        title: "チームで揃えるべきルール",
                        bullets: [
                            "基本は `transform` と `opacity` を中心に動かす。",
                            "easing は入場・退出・強調など少数のトークンに絞る。",
                            "duration と easing を設計トークン化して、場当たり的な値を増やさない。",
                        ],
                    },
                ],
                exampleInput: "コンポーネント: トグルスイッチ\n目的: 素早く分かりやすい状態フィードバック",
                exampleOutput: "transform 180ms cubic-bezier(.2,.8,.2,1)\ncolor 140ms ease-out",
            },
            ko: {
                title: "CSS 애니메이션과 트랜지션 완전 가이드",
                description: "모션은 상태 변화를 분명하게 만드는 데 써야지, 화면을 산만하게 만드는 데 쓰면 안 됩니다. transition, keyframes, easing 을 체계화하면 UI 가 더 안정됩니다.",
                sections: [
                    {
                        title: "트랜지션과 키프레임을 구분하세요",
                        paragraphs: [
                            "트랜지션은 hover, focus, 열기/닫기처럼 A 에서 B 로 가는 상태 변화에 적합합니다. 예측 가능하고 재사용하기 쉽기 때문입니다.",
                            "키프레임은 로더나 강조 흐름에 유리하지만, 반복 애니메이션은 절제해야 하고 reduced-motion 대응도 준비해야 합니다.",
                        ],
                    },
                    {
                        title: "팀 차원에서 고정할 모션 규칙",
                        bullets: [
                            "기본은 `transform` 과 `opacity` 중심으로 애니메이션합니다.",
                            "easing 은 입장, 퇴장, 강조 정도의 소수 토큰으로 제한합니다.",
                            "duration 과 easing 을 디자인 토큰으로 관리해 컴포넌트별 제각각 값을 막습니다.",
                        ],
                    },
                ],
                exampleInput: "컴포넌트: 토글 스위치\n목표: 빠르고 명확한 상태 피드백",
                exampleOutput: "transform 180ms cubic-bezier(.2,.8,.2,1)\ncolor 140ms ease-out",
            },
            de: {
                title: "Kompletter Leitfaden zu CSS-Animationen und Transitions",
                description: "Bewegung sollte Zustandswechsel erklären und nicht vom Inhalt ablenken. Wenn Transitions, Keyframes und Easing systematisch eingesetzt werden, wirkt die UI kontrollierter.",
                sections: [
                    {
                        title: "Transitions und Keyframes bewusst trennen",
                        paragraphs: [
                            "Transitions eignen sich für Hover, Fokus und Ein-/Ausklappen, also für klare Zustandswechsel zwischen zwei Punkten.",
                            "Keyframes sind besser für Loader oder gerichtete Aufmerksamkeit, müssen aber subtil bleiben und eine Reduced-Motion-Alternative haben.",
                        ],
                    },
                    {
                        title: "Welche Regeln Teams festziehen sollten",
                        bullets: [
                            "Bevorzugt `transform` und `opacity` animieren.",
                            "Nur wenige Easing-Token wie Eintritt, Austritt und Hervorhebung definieren.",
                            "Dauer und Easing als Design-Token pflegen statt pro Komponente neu zu erfinden.",
                        ],
                    },
                ],
                exampleInput: "Komponente: Toggle-Switch\nZiel: schnelles, klares Zustandsfeedback",
                exampleOutput: "transform 180ms cubic-bezier(.2,.8,.2,1)\ncolor 140ms ease-out",
            },
            fr: {
                title: "Guide complet des animations et transitions CSS",
                description: "Le mouvement doit clarifier l'état de l'interface, pas détourner l'attention du contenu. Structurer transitions, keyframes et easing rend l'expérience plus cohérente.",
                sections: [
                    {
                        title: "Choisir entre transition et keyframes",
                        paragraphs: [
                            "Les transitions conviennent aux changements d'état simples comme hover, focus ou ouverture de panneau, car elles restent prévisibles et faciles à réutiliser.",
                            "Les keyframes sont plus adaptées aux loaders et aux mouvements narratifs, mais doivent rester discrètes et respecter reduced-motion.",
                        ],
                    },
                    {
                        title: "Règles à standardiser dans l'équipe",
                        bullets: [
                            "Animer d'abord `transform` et `opacity`.",
                            "Limiter les courbes à quelques tokens d'easing bien nommés.",
                            "Gérer durées et easing dans le design system pour éviter les valeurs ad hoc.",
                        ],
                    },
                ],
                exampleInput: "Composant : interrupteur\nBesoin : retour d'état rapide et clair",
                exampleOutput: "transform 180ms cubic-bezier(.2,.8,.2,1)\ncolor 140ms ease-out",
            },
        },
    },
    "css-border-radius-and-shapes-guide": {
        cluster: "c4",
        toolSectionKind: "css",
        relatedTools: [
            { slug: "css-border-radius-generator", toolKey: "css_border_radius_generator" },
            { slug: "css-triangle-generator", toolKey: "css_triangle_generator" },
            { slug: "css-clip-path-generator", toolKey: "css_clip_path_generator" },
            { slug: "css-background-pattern-generator", toolKey: "css_background_pattern_generator" },
        ],
        next: "css-layout-patterns-for-developers",
        sibling: "modern-css-effects-guide",
        locales: {
            "zh-CN": {
                title: "CSS 圆角与形状视觉指南",
                description: "圆角和形状会直接影响层级、可点击感和品牌气质。把它们做成体系，比临时堆样式更可靠。",
                sections: [
                    {
                        title: "圆角要用 token，不要随手写",
                        paragraphs: [
                            "卡片、输入框、按钮和弹层如果各自定义圆角，很快就会出现视觉漂移。最稳妥的方式是先固定一组半径等级，再映射到组件角色。",
                            "统一的圆角尺度还能帮助你更早发现异常组件，让视觉审查不再依赖主观感觉。",
                        ],
                    },
                    {
                        title: "形状表达要服务语义",
                        bullets: [
                            "三角形、缺口和 clip-path 更适合提示、气泡和方向性强调，不适合无意义装饰。",
                            "复杂 clip-path 只放在受控区域，并准备矩形回退样式。",
                            "把主形状、背景图案和边角变化放进同一套视觉语言里管理。",
                        ],
                    },
                ],
                exampleInput: "组件：促销卡片\n需求：16px 柔和圆角 + 右上角缺口",
                exampleOutput: "border-radius: 16px\nclip-path: polygon(...)\n低兼容环境回退为纯圆角卡片",
            },
            "zh-TW": {
                title: "CSS 圓角與形狀視覺指南",
                description: "圓角與形狀會直接影響層級、可點擊感與品牌語氣。把它們做成系統，比臨時堆樣式更可靠。",
                sections: [
                    {
                        title: "圓角要用 token，不要隨手指定",
                        paragraphs: [
                            "卡片、輸入框、按鈕與彈層若各自定義圓角，很快就會產生視覺漂移。最穩妥的方式是先固定半徑級距，再對應到元件角色。",
                            "一致的圓角尺度也能讓你更快發現異常元件，減少只靠主觀感受做視覺審查。",
                        ],
                    },
                    {
                        title: "形狀表達要服務語意",
                        bullets: [
                            "三角形、缺口與 clip-path 更適合提示、氣泡與方向性強調，不適合無意義裝飾。",
                            "複雜 clip-path 只放在受控區域，並保留矩形回退樣式。",
                            "把主形狀、背景圖樣與角落變化納入同一套視覺語言管理。",
                        ],
                    },
                ],
                exampleInput: "元件：促銷卡片\n需求：16px 柔和圓角 + 右上角缺口",
                exampleOutput: "border-radius: 16px\nclip-path: polygon(...)\n低相容環境回退為純圓角卡片",
            },
            ja: {
                title: "CSS の角丸とシェイプのビジュアルガイド",
                description: "角丸や形状は階層感、押せそうかどうか、ブランドトーンに直結します。場当たり的に値を増やすより、体系化したほうが安定します。",
                sections: [
                    {
                        title: "角丸はトークン化する",
                        paragraphs: [
                            "カード、入力欄、ボタン、ダイアログがそれぞれ別の radius を持つと、UI 全体が寄せ集めのように見えます。",
                            "まず半径スケールを決め、コンポーネント役割ごとに割り当てると、レビュー基準も明確になります。",
                        ],
                    },
                    {
                        title: "シェイプは意味のある場面で使う",
                        bullets: [
                            "三角形や切り欠きは吹き出し、ポインター、案内導線に向いています。",
                            "複雑な clip-path は限定的に使い、矩形ベースのフォールバックを持つ。",
                            "形状アクセントは装飾ではなく意味づけと一貫性のために使う。",
                        ],
                    },
                ],
                exampleInput: "コンポーネント: プロモカード\n要件: 16px の柔らかい角丸 + 右上のノッチ",
                exampleOutput: "border-radius: 16px\nclip-path: polygon(...)\n低機能環境では角丸のみへフォールバック",
            },
            ko: {
                title: "CSS 보더 라디우스와 도형 시각 가이드",
                description: "모서리와 도형 언어는 위계, 클릭 가능성, 브랜드 톤에 직접 영향을 줍니다. 즉흥적인 값보다 시스템이 더 오래 갑니다.",
                sections: [
                    {
                        title: "라디우스는 토큰으로 고정하세요",
                        paragraphs: [
                            "카드, 입력창, 버튼, 다이얼로그가 제각각 다른 라디우스를 쓰면 화면이 조립식처럼 보입니다.",
                            "반경 스케일을 먼저 정하고 컴포넌트 역할별로 매핑하면 리뷰 기준도 훨씬 명확해집니다.",
                        ],
                    },
                    {
                        title: "도형은 의미 있는 신호에만 사용",
                        bullets: [
                            "삼각형, 노치, clip-path 는 콜아웃, 포인터, 온보딩 강조에 적합합니다.",
                            "복잡한 clip-path 는 제한된 영역에만 쓰고 직사각형 fallback 을 준비합니다.",
                            "배경 패턴, 모서리 변화, 형태 언어를 한 시스템에서 관리합니다.",
                        ],
                    },
                ],
                exampleInput: "컴포넌트: 프로모 카드\n요구사항: 16px 부드러운 모서리 + 우상단 노치",
                exampleOutput: "border-radius: 16px\nclip-path: polygon(...)\n저사양 환경에서는 라디우스만 유지",
            },
            de: {
                title: "Visueller Leitfaden zu CSS Border Radius und Formen",
                description: "Radius und Formen beeinflussen Hierarchie, Klickbarkeit und Markenton direkt. Ein kleines System ist belastbarer als spontane Einzelwerte.",
                sections: [
                    {
                        title: "Radiuswerte als Token definieren",
                        paragraphs: [
                            "Wenn Karten, Inputs, Buttons und Dialoge unterschiedliche Eckradien haben, verliert die Oberfläche schnell ihre visuelle Ordnung.",
                            "Eine kleine Radius-Skala mit festen Rollen erleichtert Konsistenz und Review gleichermaßen.",
                        ],
                    },
                    {
                        title: "Formen nur mit semantischem Zweck einsetzen",
                        bullets: [
                            "Dreiecke, Kerben und Clip-Path-Flächen eignen sich für Hinweise und Richtungsakzente.",
                            "Komplexe Clip-Paths nur auf kontrollierten Flächen nutzen und Rechteck-Fallbacks behalten.",
                            "Form, Hintergrund und Ecken als zusammengehörige visuelle Sprache behandeln.",
                        ],
                    },
                ],
                exampleInput: "Komponente: Promo-Karte\nBedarf: weiche 16px-Ecken + Kerbe oben rechts",
                exampleOutput: "border-radius: 16px\nclip-path: polygon(...)\nFallback in schwächeren Umgebungen: nur Radius",
            },
            fr: {
                title: "Guide visuel CSS : border-radius et formes",
                description: "Le rayon et les formes influencent directement la hiérarchie visuelle, la sensation de clic et le ton de la marque. Une logique de système tient mieux que des valeurs improvisées.",
                sections: [
                    {
                        title: "Définir les rayons comme des tokens",
                        paragraphs: [
                            "Si cartes, champs, boutons et modales utilisent chacun leurs propres valeurs, l'interface perd rapidement sa cohérence.",
                            "Une petite échelle de rayons reliée à des rôles de composants simplifie à la fois la production et la revue.",
                        ],
                    },
                    {
                        title: "Utiliser les formes pour porter du sens",
                        bullets: [
                            "Triangles, encoches et clip-path servent bien les callouts et les indices directionnels.",
                            "Réserver les clip-path complexes aux surfaces contrôlées avec un fallback rectangulaire.",
                            "Gérer formes, motifs et variations d'angles comme un même langage visuel.",
                        ],
                    },
                ],
                exampleInput: "Composant : carte promo\nBesoin : coins doux en 16px + encoche en haut à droite",
                exampleOutput: "border-radius: 16px\nclip-path: polygon(...)\nfallback : carte à coins arrondis uniquement",
            },
        },
    },
    "css-layout-patterns-for-developers": {
        cluster: "c4",
        toolSectionKind: "css",
        relatedTools: [
            { slug: "css-gradient-generator", toolKey: "css_gradient_generator" },
            { slug: "css-box-shadow-generator", toolKey: "css_box_shadow_generator" },
            { slug: "css-border-radius-generator", toolKey: "css_border_radius_generator" },
            { slug: "css-clip-path-generator", toolKey: "css_clip_path_generator" },
        ],
        next: "modern-css-effects-guide",
        sibling: "css-animations-and-transitions-guide",
        locales: {
            "zh-CN": {
                title: "开发者必须掌握的 CSS 布局模式",
                description: "布局模式不是炫技，而是帮助团队减少重复决策、让响应式行为更可预测的基础设施。",
                sections: [
                    {
                        title: "先按任务选择布局模式",
                        paragraphs: [
                            "表单和设置页更适合垂直 stack；对比、预览和编辑更适合 split；高密度工具页更适合 sidebar + content。",
                            "如果每个页面都从零开始决定结构，团队会在响应式断点、间距和操作区位置上持续返工。",
                        ],
                    },
                    {
                        title: "让布局在不同断点都可用",
                        bullets: [
                            "双栏布局在窄屏下要有明确的纵向堆叠顺序和面板标签。",
                            "关键操作条尽量固定在输入/结果附近，不要藏进密集侧边栏。",
                            "把间距、最大宽度和 sticky 行为做成可复用规则，而不是页面私有实现。",
                        ],
                    },
                ],
                exampleInput: "页面：数据比对\n需求：左侧输入，右侧结果\n断点：1024px 以下改为上下堆叠",
                exampleOutput: "桌面端：双栏 split layout\n移动端：纵向 stack，并保留面板标题与置顶操作条",
            },
            "zh-TW": {
                title: "開發者必學的 CSS 版面模式",
                description: "版面模式不是炫技，而是幫助團隊減少重複決策、讓響應式行為更可預測的基礎設施。",
                sections: [
                    {
                        title: "先依任務選擇版面模式",
                        paragraphs: [
                            "表單與設定頁適合垂直 stack；比對、預覽與編輯適合 split；高密度工具頁則更適合 sidebar + content。",
                            "如果每個頁面都從零開始決定結構，團隊會在斷點、間距與操作區位置上反覆返工。",
                        ],
                    },
                    {
                        title: "讓版面在不同斷點都能工作",
                        bullets: [
                            "雙欄在窄螢幕下要有明確的垂直堆疊順序與面板標籤。",
                            "關鍵操作列應靠近輸入/結果區，不要埋進密集側欄。",
                            "把間距、最大寬度與 sticky 行為做成可重用規則。",
                        ],
                    },
                ],
                exampleInput: "頁面：資料比對\n需求：左側輸入，右側結果\n斷點：1024px 以下改為上下堆疊",
                exampleOutput: "桌面：雙欄 split layout\n手機：縱向 stack，保留面板標題與置頂操作列",
            },
            ja: {
                title: "開発者が知っておくべき CSS レイアウトパターン",
                description: "レイアウトパターンは見た目の話だけでなく、再利用性とレスポンシブ挙動の予測可能性を高めるための基盤です。",
                sections: [
                    {
                        title: "タスクからレイアウトを選ぶ",
                        paragraphs: [
                            "フォーム中心なら縦 stack、比較やプレビューなら split、パワーツールなら sidebar + content というように役割で選ぶと迷いが減ります。",
                            "毎回ゼロから画面構造を決めると、ブレークポイントやアクション配置で同じ議論を繰り返すことになります。",
                        ],
                    },
                    {
                        title: "狭い画面でも意味が残るようにする",
                        bullets: [
                            "2 カラムは狭幅で縦積みにし、各ペインの見出しを残す。",
                            "主要アクションは入力や結果の近くに置き、密なサイドバーに埋め込まない。",
                            "余白、最大幅、sticky ルールをページごとでなく共通化する。",
                        ],
                    },
                ],
                exampleInput: "画面: データ比較\n要件: 左に入力、右に結果\n1024px 以下では縦積み",
                exampleOutput: "デスクトップ: 2 カラム split\nモバイル: 縦 stack + ペイン見出し + 固定アクションバー",
            },
            ko: {
                title: "개발자가 알아야 할 CSS 레이아웃 패턴",
                description: "레이아웃 패턴은 장식이 아니라 반복 의사결정을 줄이고 반응형 동작을 예측 가능하게 만드는 기반입니다.",
                sections: [
                    {
                        title: "작업에 맞춰 레이아웃을 고르세요",
                        paragraphs: [
                            "폼 중심 화면은 세로 stack, 비교/미리보기는 split, 고밀도 도구는 sidebar + content 가 잘 맞습니다.",
                            "매 화면마다 구조를 새로 정하면 브레이크포인트, 간격, 액션 위치에서 같은 논쟁이 반복됩니다.",
                        ],
                    },
                    {
                        title: "좁은 화면에서도 의미가 유지돼야 합니다",
                        bullets: [
                            "2열 레이아웃은 좁은 화면에서 세로로 쌓고 패널 라벨을 유지합니다.",
                            "핵심 액션은 입력/결과 가까이에 두고 사이드바 깊숙이 숨기지 않습니다.",
                            "간격, 최대 너비, sticky 동작을 공통 규칙으로 만듭니다.",
                        ],
                    },
                ],
                exampleInput: "화면: 데이터 비교\n요구사항: 왼쪽 입력, 오른쪽 결과\n1024px 이하에서는 세로 스택",
                exampleOutput: "데스크톱: 2열 split layout\n모바일: 세로 stack + 패널 라벨 + 고정 액션 바",
            },
            de: {
                title: "CSS-Layoutmuster, die Entwickler kennen sollten",
                description: "Layoutmuster sind keine Deko, sondern helfen Teams, wiederkehrende Entscheidungen zu standardisieren und Responsive-Verhalten planbar zu machen.",
                sections: [
                    {
                        title: "Das Muster nach Aufgabe wählen",
                        paragraphs: [
                            "Formlastige Screens profitieren von vertikalen Stacks, Vergleichsansichten von Splits und Power-Tools von Sidebar-plus-Content.",
                            "Wenn jede neue Seite bei null beginnt, entstehen immer wieder dieselben Diskussionen zu Breakpoints, Abständen und Aktionsleisten.",
                        ],
                    },
                    {
                        title: "Auch auf kleinen Viewports verständlich bleiben",
                        bullets: [
                            "Zweispaltige Ansichten auf schmalen Geräten vertikal stapeln und Paneelüberschriften erhalten.",
                            "Wichtige Aktionen nah an Eingabe und Ergebnis platzieren.",
                            "Abstände, Maximalbreiten und Sticky-Regeln als wiederverwendbare Standards definieren.",
                        ],
                    },
                ],
                exampleInput: "Screen: Datenvergleich\nAnforderung: links Eingabe, rechts Ergebnis\nunter 1024px vertikal stapeln",
                exampleOutput: "Desktop: 2-Spalten-Split\nMobil: vertikaler Stack mit Paneel-Labels und Sticky-Action-Bar",
            },
            fr: {
                title: "Les patterns de layout CSS à connaître côté développeur",
                description: "Les patterns de layout servent à réduire les décisions répétitives et à rendre le responsive plus prévisible, pas à faire joli pour lui-même.",
                sections: [
                    {
                        title: "Choisir le layout selon la tâche",
                        paragraphs: [
                            "Les flux de formulaires gagnent avec un stack vertical, les écrans de comparaison avec un split, et les outils puissants avec un couple sidebar + content.",
                            "Quand chaque page repart de zéro, l'équipe refait sans cesse les mêmes arbitrages sur les breakpoints, l'espacement et les actions.",
                        ],
                    },
                    {
                        title: "Garder le sens sur mobile",
                        bullets: [
                            "Passer les doubles colonnes en empilement vertical avec des titres de panneaux explicites.",
                            "Laisser les actions principales près des zones d'entrée et de résultat.",
                            "Standardiser espacements, largeurs maximales et comportements sticky.",
                        ],
                    },
                ],
                exampleInput: "Écran : comparaison de données\nBesoin : saisie à gauche, résultat à droite\nsous 1024px empiler verticalement",
                exampleOutput: "Desktop : split en 2 colonnes\nMobile : stack vertical avec labels de panneaux et barre d'action fixe",
            },
        },
    },
    "dns-records-uptime": {
        cluster: "c3",
        toolSectionKind: "security",
        relatedTools: [            { slug: "certificate-decoder", toolKey: "certificate_decoder" },        ],
        next: "certificate-chain-basics-for-developers",
        sibling: "csp-mistakes-that-break-production",
        locales: {
            "zh-CN": {
                title: "DNS 记录如何影响可用性",
                description: "DNS 常被当成静态基础设施，但 TTL、记录切换和解析链路的小错误，足以把一次发布放大成真实故障。",
                sections: [
                    {
                        title: "哪些 DNS 失误最容易放大宕机",
                        paragraphs: [
                            "TTL 设置过长会让旧缓存停留太久；A/AAAA 记录不一致会导致不同网络看到不同结果；悬空 CNAME 则会让切流后请求直接失败。",
                            "这些问题最危险的地方在于，它们经常不是立即全量爆炸，而是按地区、运营商和解析器版本分批出现。",
                        ],
                    },
                    {
                        title: "切流前后要做的检查",
                        bullets: [
                            "在变更窗口前提前下调 TTL，而不是变更瞬间才改。",
                            "目标记录、证书链和回源健康检查要先完成预验证。",
                            "同时观察解析结果和应用健康，避免“DNS 已生效但服务还没准备好”的假恢复。",
                        ],
                    },
                ],
                exampleInput: "A 记录 TTL: 3600\n切换时间: 10:00 UTC",
                exampleOutput: "提前 24 小时降到 TTL 300\n切换后的解析收敛风险明显下降",
            },
            "zh-TW": {
                title: "DNS 記錄如何影響可用性",
                description: "DNS 常被當成靜態基礎設施，但 TTL、記錄切換與解析鏈路的小錯誤，足以把一次發布放大成真實故障。",
                sections: [
                    {
                        title: "哪些 DNS 失誤最容易放大停機",
                        paragraphs: [
                            "TTL 太長會讓舊快取停留過久；A/AAAA 記錄不一致會讓不同網路看到不同結果；懸空 CNAME 則會讓切流後請求直接失敗。",
                            "這些問題最危險之處在於，它們通常不是立刻全域爆炸，而是依地區、ISP 與 resolver 逐步浮現。",
                        ],
                    },
                    {
                        title: "切流前後要做的檢查",
                        bullets: [
                            "在變更窗口前提早下調 TTL，而不是變更當下才改。",
                            "目標記錄、憑證鏈與回源健康檢查要先完成預驗證。",
                            "同時監看 DNS 解析與應用健康，避免假恢復判斷。",
                        ],
                    },
                ],
                exampleInput: "A 記錄 TTL: 3600\n切換時間: 10:00 UTC",
                exampleOutput: "提前 24 小時降到 TTL 300\n切換後的解析收斂風險明顯下降",
            },
            ja: {
                title: "DNS レコードが可用性に与える影響",
                description: "DNS は静的な基盤に見えますが、TTL やレコード切り替えの小さな判断ミスが、公開障害を大きくします。",
                sections: [
                    {
                        title: "可用性を落としやすい DNS ミス",
                        paragraphs: [
                            "TTL が長すぎると古い宛先が長く残り、A/AAAA の不整合は利用者ごとに違う到達先を生みます。孤立した CNAME も移行時に危険です。",
                            "厄介なのは、こうした障害が一斉ではなく地域やリゾルバごとに段階的に現れることです。",
                        ],
                    },
                    {
                        title: "切り替え前後の実務チェック",
                        bullets: [
                            "変更直前ではなく、十分前に TTL を下げる。",
                            "新しい宛先、証明書チェーン、到達性を事前検証する。",
                            "DNS 解決結果とアプリ健全性を同時に監視する。",
                        ],
                    },
                ],
                exampleInput: "A レコード TTL: 3600\n切り替え時刻: 10:00 UTC",
                exampleOutput: "24 時間前に TTL 300 へ変更\n切り替え後の伝播リスクが低下",
            },
            ko: {
                title: "DNS 레코드가 가용성에 미치는 영향",
                description: "DNS 는 정적인 인프라처럼 보이지만 TTL, 레코드 전환, 해석 경로의 작은 실수가 실제 장애를 크게 키웁니다.",
                sections: [
                    {
                        title: "가용성을 가장 자주 깨뜨리는 DNS 실수",
                        paragraphs: [
                            "TTL 이 너무 길면 오래된 캐시가 남고, A/AAAA 불일치는 네트워크별로 다른 결과를 만들며, 끊어진 CNAME 은 전환 후 요청 실패를 부릅니다.",
                            "문제는 이런 장애가 한 번에 터지지 않고 지역과 리졸버별로 천천히 나타난다는 점입니다.",
                        ],
                    },
                    {
                        title: "전환 전후에 꼭 할 점검",
                        bullets: [
                            "변경 직전이 아니라 충분히 앞서 TTL 을 낮춥니다.",
                            "대상 레코드, 인증서 체인, 오리진 준비 상태를 사전 검증합니다.",
                            "DNS 해석 결과와 애플리케이션 건강 상태를 함께 모니터링합니다.",
                        ],
                    },
                ],
                exampleInput: "A 레코드 TTL: 3600\n전환 시각: 10:00 UTC",
                exampleOutput: "24시간 전에 TTL 300 으로 낮춤\n전환 후 전파 리스크 감소",
            },
            de: {
                title: "Wie DNS-Records die Verfügbarkeit beeinflussen",
                description: "DNS wirkt oft statisch, doch kleine Fehler bei TTL, Umschaltungen oder Auflösungspfaden können echte Ausfälle massiv verstärken.",
                sections: [
                    {
                        title: "Welche DNS-Fehler Ausfälle vergrößern",
                        paragraphs: [
                            "Zu hohe TTLs halten alte Ziele zu lange im Cache. Inkonsistente A/AAAA-Records führen zu unterschiedlichen Ergebnissen je nach Netzwerk. Verwaiste CNAMEs brechen Cutovers.",
                            "Gefährlich ist vor allem, dass solche Probleme nicht überall gleichzeitig sichtbar werden, sondern regional und resolverabhängig.",
                        ],
                    },
                    {
                        title: "Checks rund um den Cutover",
                        bullets: [
                            "TTL deutlich vor dem Change-Fenster reduzieren.",
                            "Zielrecords, Zertifikate und Origin-Erreichbarkeit vorab prüfen.",
                            "DNS-Auflösung und Anwendungs-Health parallel überwachen.",
                        ],
                    },
                ],
                exampleInput: "A-Record TTL: 3600\nCutover: 10:00 UTC",
                exampleOutput: "24h vorher TTL auf 300 senken\nniedrigeres Propagationsrisiko beim Wechsel",
            },
            fr: {
                title: "Comment les enregistrements DNS affectent la disponibilité",
                description: "Le DNS paraît statique, mais de petites erreurs de TTL ou de bascule peuvent transformer un déploiement en incident visible.",
                sections: [
                    {
                        title: "Les erreurs DNS qui amplifient le downtime",
                        paragraphs: [
                            "Un TTL trop long laisse vivre d'anciens caches, des A/AAAA incohérents donnent des résultats différents selon les réseaux, et un CNAME orphelin casse une bascule.",
                            "Le plus piégeux est que ces incidents apparaissent souvent par région ou par resolver, pas partout d'un coup.",
                        ],
                    },
                    {
                        title: "Contrôles à faire autour de la bascule",
                        bullets: [
                            "Réduire le TTL bien avant la fenêtre de changement.",
                            "Valider à l'avance les nouvelles cibles, la chaîne de certificats et l'état de l'origine.",
                            "Surveiller à la fois la résolution DNS et la santé applicative.",
                        ],
                    },
                ],
                exampleInput: "TTL du A record : 3600\nheure de bascule : 10:00 UTC",
                exampleOutput: "TTL réduit à 300 la veille\nrisque de propagation plus faible au moment du switch",
            },
        },
    },
    "hash-functions-compared-md5-vs-sha256-vs-sha512": {
        cluster: "c6",
        toolSectionKind: "encoding",
        relatedTools: [
            { slug: "hash-generator", toolKey: "hash_generator" },
            { slug: "md5-generator", toolKey: "md5_generator" },
            {
                slug: "sha256-digest-generator",
                labelByLocale: {
                    "zh-CN": "SHA-256 摘要生成器",
                    "zh-TW": "SHA-256 摘要產生器",
                    ja: "SHA-256 ダイジェスト生成",
                    ko: "SHA-256 다이제스트 생성기",
                    de: "SHA-256-Digest-Generator",
                    fr: "Générateur de digest SHA-256",
                },
            },
            {
                slug: "sha512-digest-generator",
                labelByLocale: {
                    "zh-CN": "SHA-512 摘要生成器",
                    "zh-TW": "SHA-512 摘要產生器",
                    ja: "SHA-512 ダイジェスト生成",
                    ko: "SHA-512 다이제스트 생성기",
                    de: "SHA-512-Digest-Generator",
                    fr: "Générateur de digest SHA-512",
                },
            },
        ],
        next: "url-encoding-explained-common-mistakes-and-solutions",
        sibling: "jwt-security-best-practices-for-token-handling",
        locales: {
            "zh-CN": {
                title: "哈希函数对比：MD5、SHA-256 与 SHA-512",
                description: "选哈希算法不能靠习惯。要先分清你是在做兼容性校验，还是在做真正的安全场景。",
                sections: [
                    {
                        title: "完整性校验和安全防护不是一回事",
                        paragraphs: [
                            "如果只是做下载包校验、缓存指纹或遗留系统对接，团队通常更关心兼容性和速度；但一旦进入安全敏感场景，抗碰撞与抗预映像能力就变成硬要求。",
                            "这也是为什么 MD5 仍可能出现在旧系统里，但已经不适合新的安全决策链路。",
                        ],
                    },
                    {
                        title: "工程上怎么选更稳",
                        bullets: [
                            "默认优先 SHA-256，适合大多数现代完整性校验场景。",
                            "策略或平台要求更长摘要时用 SHA-512。",
                            "MD5 只在明确接受风险、并且需要遗留兼容时使用；如果需要真实性，还要配合 HMAC 或签名。",
                        ],
                    },
                ],
                exampleInput: "部署产物 + 预期摘要\n目标：下载后做完整性校验",
                exampleOutput: "计算 SHA-256 / SHA-512 摘要\n输出匹配或不匹配结论",
            },
            "zh-TW": {
                title: "雜湊函式比較：MD5、SHA-256 與 SHA-512",
                description: "選雜湊演算法不能只靠習慣，要先分清楚你是在做相容性校驗，還是真正的安全用途。",
                sections: [
                    {
                        title: "完整性檢查與安全防護不是同一件事",
                        paragraphs: [
                            "如果只是做下載包校驗、快取指紋或舊系統對接，團隊通常更在意相容性與速度；但只要進入安全敏感場景，抗碰撞能力就變成硬需求。",
                            "這也是為什麼 MD5 可能仍存在於舊環境裡，但不再適合新的安全決策鏈路。",
                        ],
                    },
                    {
                        title: "工程上更穩的選擇方式",
                        bullets: [
                            "預設優先 SHA-256，適合多數現代完整性檢查場景。",
                            "如果政策或平台要求更長摘要，再使用 SHA-512。",
                            "MD5 只在明確接受風險且需要遺留相容時使用；若要保證真實性，仍需搭配 HMAC 或簽章。",
                        ],
                    },
                ],
                exampleInput: "部署產物 + 預期摘要\n目標：下載後做完整性驗證",
                exampleOutput: "計算 SHA-256 / SHA-512 摘要\n輸出比對一致或不一致判斷",
            },
            ja: {
                title: "ハッシュ関数比較: MD5 vs SHA-256 vs SHA-512",
                description: "ハッシュ選定は慣習ではなく要件で決めるべきです。互換性確認なのか、セキュリティ判断なのかを最初に分けます。",
                sections: [
                    {
                        title: "整合性確認とセキュリティ用途を分ける",
                        paragraphs: [
                            "ダウンロード検証やキャッシュ指紋では互換性と速度が重視されますが、セキュリティ用途では衝突耐性が前提になります。",
                            "MD5 が旧環境で残っていても、新しい安全設計の標準にはできません。",
                        ],
                    },
                    {
                        title: "実務上の選び方",
                        bullets: [
                            "現代的な既定値はまず SHA-256。",
                            "より長いダイジェスト幅が求められるなら SHA-512。",
                            "MD5 はリスクを理解したうえでのレガシー互換専用。真正性が必要なら HMAC や署名を組み合わせる。",
                        ],
                    },
                ],
                exampleInput: "配布アーティファクト + 期待ダイジェスト\n目的: ダウンロード後の整合性確認",
                exampleOutput: "SHA-256 / SHA-512 を計算\n一致 / 不一致を判断",
            },
            ko: {
                title: "해시 함수 비교: MD5 vs SHA-256 vs SHA-512",
                description: "해시 알고리즘 선택은 습관이 아니라 요구사항으로 결정해야 합니다. 호환성 검증인지, 보안 목적 인지부터 구분해야 합니다.",
                sections: [
                    {
                        title: "무결성 검사와 보안 목적은 다릅니다",
                        paragraphs: [
                            "다운로드 검증, 캐시 지문, 레거시 연동에서는 속도와 호환성이 중요할 수 있지만, 보안 민감 영역에서는 충돌 저항성이 필수입니다.",
                            "MD5 가 레거시 시스템에 남아 있을 수는 있어도, 새로운 보안 설계의 기본값이 되어서는 안 됩니다.",
                        ],
                    },
                    {
                        title: "실무에서의 선택 기준",
                        bullets: [
                            "현대적인 기본값은 SHA-256.",
                            "더 긴 다이제스트 폭이 필요하면 SHA-512.",
                            "MD5 는 위험을 문서화한 레거시 호환용으로만 사용하고, 진위 보장이 필요하면 HMAC 또는 서명을 함께 사용합니다.",
                        ],
                    },
                ],
                exampleInput: "배포 산출물 + 기대 다이제스트\n목표: 다운로드 후 무결성 검증",
                exampleOutput: "SHA-256 / SHA-512 계산\n일치 / 불일치 판단",
            },
            de: {
                title: "Hashfunktionen im Vergleich: MD5, SHA-256 und SHA-512",
                description: "Hash-Algorithmen sollten nicht aus Gewohnheit gewählt werden. Zuerst muss klar sein, ob es um Kompatibilität oder echte Sicherheitsanforderungen geht.",
                sections: [
                    {
                        title: "Integrität ist nicht dasselbe wie kryptografische Sicherheit",
                        paragraphs: [
                            "Für Artefaktprüfungen oder Legacy-Schnittstellen zählen oft Geschwindigkeit und Kompatibilität. In sicherheitskritischen Pfaden ist Kollisionsresistenz jedoch Pflicht.",
                            "Deshalb kann MD5 in alten Systemen noch vorkommen, sollte aber nicht in neue Sicherheitsentscheidungen hineinragen.",
                        ],
                    },
                    {
                        title: "Praktische Auswahlregeln",
                        bullets: [
                            "SHA-256 als breiten Standard verwenden.",
                            "SHA-512 einsetzen, wenn Richtlinien oder Plattformen längere Digests verlangen.",
                            "MD5 nur mit dokumentiertem Restrisiko für Legacy-Kompatibilität nutzen; für Authentizität zusätzlich HMAC oder Signaturen einsetzen.",
                        ],
                    },
                ],
                exampleInput: "Deploy-Artefakt + erwarteter Digest\nZiel: Integritätsprüfung nach dem Download",
                exampleOutput: "SHA-256 / SHA-512 berechnen\nTreffer oder Mismatch entscheiden",
            },
            fr: {
                title: "Comparatif des fonctions de hachage : MD5, SHA-256 et SHA-512",
                description: "Le choix d'un algorithme de hachage ne doit pas être automatique. Il faut d'abord distinguer compatibilité technique et besoin réel de sécurité.",
                sections: [
                    {
                        title: "Contrôle d'intégrité et sécurité ne répondent pas au même besoin",
                        paragraphs: [
                            "Pour vérifier un artefact ou rester compatible avec un ancien système, vitesse et compatibilité peuvent primer. En contexte sensible, la résistance aux collisions devient indispensable.",
                            "C'est pour cela que MD5 peut subsister en legacy, mais ne doit plus servir de base à une décision de sécurité moderne.",
                        ],
                    },
                    {
                        title: "Règles de choix pragmatiques",
                        bullets: [
                            "Prendre SHA-256 comme choix par défaut.",
                            "Passer à SHA-512 quand une politique ou une plateforme l'impose.",
                            "Réserver MD5 à la compatibilité legacy avec risque assumé, et ajouter HMAC ou signature si l'authenticité compte.",
                        ],
                    },
                ],
                exampleInput: "Artefact de déploiement + digest attendu\nObjectif : vérifier l'intégrité après téléchargement",
                exampleOutput: "Calcul du digest SHA-256 / SHA-512\nverdict de correspondance ou d'écart",
            },
        },
    },
    "image-optimization-for-web-complete-workflow": {
        cluster: "c5",
        toolSectionKind: "image",
        relatedTools: [
            { slug: "image-resizer", toolKey: "image_resizer" },
            { slug: "svg-optimizer", toolKey: "svg_optimizer" },
            { slug: "svg-to-png-converter", toolKey: "svg_to_png_converter" },
            { slug: "image-filters", toolKey: "image_filters" },
        ],
        next: "color-extraction-from-images-use-cases-and-tools",
        sibling: "svg-optimization-and-conversion-best-practices",
        locales: {
            "zh-CN": {
                title: "Web 图片优化完整工作流",
                description: "图片优化不是单次压缩，而是一套从展示尺寸、格式策略到发布校验都可重复执行的流程。",
                sections: [
                    {
                        title: "先从展示约束出发",
                        paragraphs: [
                            "优化的起点不是压缩率，而是图片在真实页面里会被以多大尺寸展示。先确定容器宽度和比例，才能避免拿大图做无意义传输。",
                            "Hero、卡片、缩略图和图标的尺寸策略应该分别定义，不要把所有资产都套一个导出规则。",
                        ],
                    },
                    {
                        title: "格式策略和发布门禁要同时存在",
                        bullets: [
                            "照片优先走现代有损格式，矢量和 UI 图形优先保持无损或直接用 SVG。",
                            "把体积上限、响应式变体和视觉抽查写进发布清单。",
                            "保留至少一个失败样例给 QA，确认超标图片会被拦住，而不是上线后才发现。",
                        ],
                    },
                ],
                exampleInput: "Hero 图：3840x2160，5.4MB PNG\n卡片图：1920x1080，1.3MB JPG",
                exampleOutput: "Hero：导出 1920x1080 响应式变体集\n卡片：压缩到 800x450，目标 <180KB",
            },
            "zh-TW": {
                title: "Web 影像最佳化完整流程",
                description: "影像最佳化不是一次壓縮，而是一套從展示尺寸、格式策略到發布驗證都能重複執行的流程。",
                sections: [
                    {
                        title: "先從展示限制出發",
                        paragraphs: [
                            "最佳化的起點不是壓縮率，而是圖片在真實頁面中的呈現尺寸。先確定容器寬度與比例，才能避免無意義地傳輸大圖。",
                            "Hero、卡片、縮圖與圖示應各自有尺寸策略，不要所有資產都套同一套輸出規則。",
                        ],
                    },
                    {
                        title: "格式策略與發布門檻要一起存在",
                        bullets: [
                            "照片優先使用現代有損格式，向量與 UI 圖形則保持無損或直接使用 SVG。",
                            "把檔案大小上限、響應式變體與視覺抽查寫進發布清單。",
                            "保留至少一個失敗樣例給 QA，確認超標圖片真的會被攔下。",
                        ],
                    },
                ],
                exampleInput: "Hero 圖：3840x2160，5.4MB PNG\n卡片圖：1920x1080，1.3MB JPG",
                exampleOutput: "Hero：輸出 1920x1080 響應式變體集\n卡片：壓縮到 800x450，目標 <180KB",
            },
            ja: {
                title: "Web 向け画像最適化の完全ワークフロー",
                description: "画像最適化は単発の圧縮作業ではなく、表示サイズ、形式選定、公開前チェックまで含む運用フローです。",
                sections: [
                    {
                        title: "まず表示サイズから決める",
                        paragraphs: [
                            "最適化の起点は圧縮率ではなく、実際の画面でどのサイズで表示されるかです。コンテナ幅と比率を先に決めることで、不要に大きい画像配信を避けられます。",
                            "ヒーロー、カード、サムネイル、アイコンは同じ基準で扱わず、それぞれ役割ごとの出力方針を持つべきです。",
                        ],
                    },
                    {
                        title: "形式ポリシーと公開チェックを揃える",
                        bullets: [
                            "写真はモダンな lossy 形式、UI グラフィックやベクターは lossless または SVG を優先する。",
                            "容量上限、レスポンシブ派生、見た目確認を公開手順に入れる。",
                            "失敗サンプルも QA に残し、基準外ファイルが本当に弾かれるか確認する。",
                        ],
                    },
                ],
                exampleInput: "Hero 画像: 3840x2160, 5.4MB PNG\nCard 画像: 1920x1080, 1.3MB JPG",
                exampleOutput: "Hero: 1920x1080 の派生セット\nCard: 800x450 に圧縮し 180KB 未満を目標",
            },
            ko: {
                title: "웹 이미지 최적화 전체 워크플로",
                description: "이미지 최적화는 한 번의 압축이 아니라 표시 크기, 포맷 정책, 배포 검증까지 포함한 반복 가능한 흐름입니다.",
                sections: [
                    {
                        title: "먼저 표시 제약부터 정의하세요",
                        paragraphs: [
                            "최적화의 시작점은 압축률이 아니라 실제 화면에서 얼마나 크게 보일지입니다. 컨테이너 폭과 비율을 먼저 정하면 불필요하게 큰 자산 전송을 줄일 수 있습니다.",
                            "히어로, 카드, 썸네일, 아이콘은 같은 규칙이 아니라 역할별 출력 정책을 가져야 합니다.",
                        ],
                    },
                    {
                        title: "포맷 정책과 배포 게이트를 함께 두세요",
                        bullets: [
                            "사진은 현대적인 손실 포맷, UI 그래픽과 벡터는 무손실 또는 SVG 를 우선합니다.",
                            "용량 상한, 반응형 변형, 시각 점검을 배포 체크리스트에 넣습니다.",
                            "실패 샘플도 QA 에 포함해 기준 초과 이미지가 실제로 차단되는지 확인합니다.",
                        ],
                    },
                ],
                exampleInput: "히어로 이미지: 3840x2160, 5.4MB PNG\n카드 이미지: 1920x1080, 1.3MB JPG",
                exampleOutput: "히어로: 1920x1080 반응형 변형 세트\n카드: 800x450, 목표 <180KB",
            },
            de: {
                title: "Bildoptimierung für das Web: kompletter Workflow",
                description: "Bildoptimierung ist keine Einzelaktion, sondern ein wiederholbarer Ablauf aus Display-Größe, Formatpolitik und Release-Prüfung.",
                sections: [
                    {
                        title: "Mit den Darstellungsgrenzen beginnen",
                        paragraphs: [
                            "Nicht die Kompression ist der erste Schritt, sondern die Frage, wie groß das Bild im echten Layout angezeigt wird. Erst daraus ergeben sich sinnvolle Exportgrößen.",
                            "Hero-Bilder, Karten, Thumbnails und Icons brauchen unterschiedliche Regeln statt eines universellen Exportschemas.",
                        ],
                    },
                    {
                        title: "Formatregeln und Release-Gates kombinieren",
                        bullets: [
                            "Fotos in moderne verlustbehaftete Formate, UI-Grafiken und Vektoren möglichst verlustfrei oder direkt als SVG.",
                            "Dateigrößenbudgets, responsive Varianten und Sichtprüfung in den Release-Prozess aufnehmen.",
                            "Mindestens ein Fehlbeispiel in QA behalten, damit Grenzverletzungen sichtbar blockiert werden.",
                        ],
                    },
                ],
                exampleInput: "Hero-Bild: 3840x2160, 5.4MB PNG\nKartenbild: 1920x1080, 1.3MB JPG",
                exampleOutput: "Hero: 1920x1080-Variantenset\nKarte: auf 800x450 komprimiert, Ziel <180KB",
            },
            fr: {
                title: "Optimisation d'image pour le web : workflow complet",
                description: "Optimiser une image ne se résume pas à compresser un fichier. Il faut une méthode répétable qui couvre taille d'affichage, format et contrôle avant publication.",
                sections: [
                    {
                        title: "Partir des contraintes d'affichage",
                        paragraphs: [
                            "Le bon point de départ n'est pas le taux de compression mais la taille réelle d'affichage dans la page. Définir largeur et ratio évite d'envoyer des fichiers inutilement énormes.",
                            "Hero, carte, miniature et icône doivent avoir des règles d'export distinctes selon leur rôle.",
                        ],
                    },
                    {
                        title: "Associer politique de format et garde-fous de release",
                        bullets: [
                            "Réserver les formats modernes avec perte aux photos, et garder les visuels UI en lossless ou en SVG.",
                            "Ajouter budgets de poids, variantes responsive et contrôle visuel au process de release.",
                            "Conserver un exemple volontairement hors budget pour vérifier que la QA bloque bien le fichier.",
                        ],
                    },
                ],
                exampleInput: "Image hero : 3840x2160, PNG 5.4MB\nImage carte : 1920x1080, JPG 1.3MB",
                exampleOutput: "Hero : variantes responsives en 1920x1080\nCarte : 800x450 compressé avec cible <180KB",
            },
        },
    },
    "image-privacy-how-to-censor-and-protect-images": {
        cluster: "c5",
        toolSectionKind: "image",
        relatedTools: [
            { slug: "photo-censor", toolKey: "photo_censor" },
            { slug: "image-cropper", toolKey: "image_cropper" },
            { slug: "image-filters", toolKey: "image_filters" },
            { slug: "image-resizer", toolKey: "image_resizer" },
        ],
        next: "image-optimization-for-web-complete-workflow",
        sibling: "color-extraction-from-images-use-cases-and-tools",
        locales: {
            "zh-CN": {
                title: "图片隐私：如何打码并保护图像",
                description: "截图和照片里的敏感区域常常在赶时间时被忽略。把识别、打码和复核变成固定步骤，才能真正降低泄露风险。",
                sections: [
                    {
                        title: "先标出高风险区域",
                        paragraphs: [
                            "邮箱、手机号、账号编号、API Key、内部地址和聊天记录都属于分享前必须检查的敏感区域。",
                            "如果上传后才临时决定“哪里需要遮”，团队成员往往会对风险边界理解不一致，导致漏遮或过度处理。",
                        ],
                    },
                    {
                        title: "默认采用不可逆处理",
                        bullets: [
                            "不需要保留上下文时优先裁剪。",
                            "高敏感字段优先使用实色遮挡，而不是模糊。",
                            "分享前做一次放大复核，并检查元数据是否仍携带隐私信息。",
                        ],
                    },
                ],
                exampleInput: "工单截图，包含邮箱和 token\n目标：发到公开 issue",
                exampleOutput: "敏感字段被实色遮挡或裁掉\n导出为可安全分享的扁平图片",
            },
            "zh-TW": {
                title: "圖片隱私：如何打碼並保護影像",
                description: "截圖與照片中的敏感區域常在趕時間時被忽略。把辨識、遮罩與複核變成固定流程，才能真正降低外洩風險。",
                sections: [
                    {
                        title: "先標出高風險區域",
                        paragraphs: [
                            "信箱、手機號碼、帳號編號、API Key、內部網址與對話內容，都屬於分享前必查的敏感資訊。",
                            "如果上傳後才臨時決定要遮哪裡，團隊成員對風險邊界常常理解不一致，容易漏遮。",
                        ],
                    },
                    {
                        title: "預設採用不可逆處理",
                        bullets: [
                            "不需要保留上下文時優先裁切。",
                            "高敏感欄位優先使用實色遮罩，而不是模糊。",
                            "分享前放大檢查一次，並確認中繼資料沒有殘留隱私。",
                        ],
                    },
                ],
                exampleInput: "工單截圖，包含信箱與 token\n目標：發到公開 issue",
                exampleOutput: "敏感欄位以實色遮罩或裁掉\n輸出為可安全分享的扁平影像",
            },
            ja: {
                title: "画像プライバシー: 画像を隠して保護する方法",
                description: "スクリーンショットや写真の共有事故は、見落とした機密領域から始まります。検出、隠蔽、最終確認を固定手順にすると事故を減らせます。",
                sections: [
                    {
                        title: "先に高リスク領域を洗い出す",
                        paragraphs: [
                            "メールアドレス、個人名、口座番号、API キー、内部 URL などは共有前に必ず確認すべき代表例です。",
                            "編集を始めてから場当たり的に隠す範囲を決めると、レビュー観点が人によってぶれて漏れが出やすくなります。",
                        ],
                    },
                    {
                        title: "基本は不可逆なマスキング",
                        bullets: [
                            "文脈が不要ならクロップを優先する。",
                            "高機密情報はぼかしではなく塗りつぶしで隠す。",
                            "共有前に拡大確認し、メタデータも残っていないか見る。",
                        ],
                    },
                ],
                exampleInput: "サポート用スクリーンショットにメールと token が含まれる\n目的: 公開 issue に貼る",
                exampleOutput: "機密領域を完全に隠蔽またはクロップ\n共有用のフラット画像として出力",
            },
            ko: {
                title: "이미지 프라이버시: 이미지 검열과 보호 방법",
                description: "스크린샷과 사진의 민감 영역은 급할 때 가장 잘 놓칩니다. 식별, 마스킹, 최종 검토를 고정 절차로 만들면 유출 위험을 크게 줄일 수 있습니다.",
                sections: [
                    {
                        title: "먼저 고위험 영역을 표시하세요",
                        paragraphs: [
                            "이메일, 전화번호, 계정 ID, API 키, 내부 URL, 채팅 내용은 공유 전에 반드시 확인해야 할 대표적인 민감 정보입니다.",
                            "업로드 직전에 즉흥적으로 가릴 부분을 정하면 사람마다 경계가 달라져 누락이 생기기 쉽습니다.",
                        ],
                    },
                    {
                        title: "기본은 되돌릴 수 없는 마스킹",
                        bullets: [
                            "맥락이 필요 없으면 크롭을 우선합니다.",
                            "고민감 정보는 블러보다 실색 블록 마스킹을 우선합니다.",
                            "공유 전 확대 확인과 메타데이터 점검을 마지막 단계로 둡니다.",
                        ],
                    },
                ],
                exampleInput: "지원용 스크린샷에 이메일과 token 포함\n목표: 공개 이슈에 공유",
                exampleOutput: "민감 필드를 완전히 가리거나 잘라냄\n안전하게 공유 가능한 평면 이미지로 출력",
            },
            de: {
                title: "Bildschutz: So zensieren und schützen Sie Bilder",
                description: "In Screenshots und Fotos bleiben sensible Bereiche unter Zeitdruck leicht sichtbar. Ein fester Ablauf aus Erkennung, Redaktion und Abschlussprüfung senkt das Risiko deutlich.",
                sections: [
                    {
                        title: "Risikobereiche zuerst markieren",
                        paragraphs: [
                            "E-Mail-Adressen, Telefonnummern, Kontonummern, API-Schlüssel und interne URLs sollten vor jeder Freigabe gezielt markiert werden.",
                            "Wer erst beim Export entscheidet, was verborgen werden muss, produziert oft uneinheitliche und lückenhafte Ergebnisse.",
                        ],
                    },
                    {
                        title: "Standardmäßig irreversibel redigieren",
                        bullets: [
                            "Wenn Kontext nicht nötig ist, lieber zuschneiden.",
                            "Hochsensible Inhalte mit Vollflächen statt Blur verdecken.",
                            "Vor Veröffentlichung vergrößert prüfen und Metadaten kontrollieren.",
                        ],
                    },
                ],
                exampleInput: "Support-Screenshot mit E-Mail und Token\nZiel: in öffentlichem Issue teilen",
                exampleOutput: "Sensible Felder hart redigiert oder ausgeschnitten\nflache, sicher teilbare Bilddatei",
            },
            fr: {
                title: "Confidentialité d'image : comment censurer et protéger une image",
                description: "Les captures et photos contiennent souvent des zones sensibles oubliées dans la précipitation. Un workflow de détection, masquage et vérification finale réduit fortement le risque.",
                sections: [
                    {
                        title: "Identifier d'abord les zones à risque",
                        paragraphs: [
                            "Adresse email, numéro de téléphone, identifiant, clé API, URL interne ou extrait de conversation doivent être repérés avant partage.",
                            "Si l'équipe décide trop tard quoi masquer, chacun applique sa propre lecture du risque et les oublis deviennent probables.",
                        ],
                    },
                    {
                        title: "Privilégier un masquage irréversible",
                        bullets: [
                            "Si le contexte n'est pas utile, recadrer.",
                            "Pour les données très sensibles, préférer un bloc plein au flou.",
                            "Avant diffusion, zoomer, relire et contrôler les métadonnées.",
                        ],
                    },
                ],
                exampleInput: "Capture support avec email et token\nObjectif : partage dans une issue publique",
                exampleOutput: "Champs sensibles masqués ou supprimés\nimage aplatie sûre pour le partage",
            },
        },
    },
    "jwt-security-best-practices-for-token-handling": {
        cluster: "c6",
        toolSectionKind: "encoding",
        relatedTools: [
            { slug: "jwt-decoder", toolKey: "jwt_decoder" },
            { slug: "jwt-workbench", toolKey: "jwt_workbench" },
            { slug: "jwt-verifier", toolKey: "jwt_verifier" },
            { slug: "base64-encode-decode", toolKey: "base64_encode_decode" },
        ],
        next: "base64-encoding-when-and-how-to-use-it",
        sibling: "hash-functions-compared-md5-vs-sha256-vs-sha512",
        locales: {
            "zh-CN": {
                title: "JWT 安全：Token 处理最佳实践",
                description: "JWT 出问题时，真正的根因往往不是算法理论，而是验证不完整、密钥轮换混乱和客户端存储不当。",
                sections: [
                    {
                        title: "每次受保护请求都要做完整验证",
                        paragraphs: [
                            "签名、issuer、audience、过期时间和必要 claims 应该在每次请求里被一致校验。只校一部分，是很多绕过问题的起点。",
                            "一旦网关、后端和边缘函数各自实现一套校验逻辑，行为分叉几乎是必然的。",
                        ],
                    },
                    {
                        title: "把生命周期控制写进设计里",
                        bullets: [
                            "高风险操作优先使用短生命周期 access token。",
                            "密钥轮换、refresh token 撤销和失败审计不能靠人工补救。",
                            "客户端存储方案要基于威胁模型选，而不是默认把 token 丢进任何方便的位置。",
                        ],
                    },
                ],
                exampleInput: "来自 API Gateway 的 JWT\n目标：在访问路由前完成验证",
                exampleOutput: "签名 + claims 校验通过\n记录审计日志后放行，否则拒绝",
            },
            "zh-TW": {
                title: "JWT 安全：Token 處理最佳實踐",
                description: "JWT 問題真正的根因通常不是演算法理論，而是驗證不完整、金鑰輪換混亂與客戶端儲存不當。",
                sections: [
                    {
                        title: "每次受保護請求都要做完整驗證",
                        paragraphs: [
                            "簽章、issuer、audience、過期時間與必要 claims 應在每次請求中一致驗證。只驗一部分，是許多繞過問題的起點。",
                            "只要 gateway、後端與 edge function 各自寫一套驗證邏輯，行為分叉幾乎是必然的。",
                        ],
                    },
                    {
                        title: "把生命週期控制寫進設計",
                        bullets: [
                            "高風險操作優先使用短生命週期 access token。",
                            "金鑰輪換、refresh token 撤銷與失敗審計不能靠人工補救。",
                            "客戶端儲存方案要依威脅模型選擇，而不是把 token 隨手放到方便的位置。",
                        ],
                    },
                ],
                exampleInput: "來自 API Gateway 的 JWT\n目標：在路由放行前完成驗證",
                exampleOutput: "簽章 + claims 驗證通過\n寫入稽核紀錄後放行，否則拒絕",
            },
            ja: {
                title: "JWT セキュリティ: トークン処理のベストプラクティス",
                description: "JWT の事故は理論より運用で起きます。不完全な検証、鍵ローテーション不足、保存場所の選択ミスが典型です。",
                sections: [
                    {
                        title: "保護されたリクエストごとに完全検証する",
                        paragraphs: [
                            "署名、issuer、audience、exp、必要 claims は毎回一貫して検証すべきです。一部だけ見る実装は簡単に穴になります。",
                            "ゲートウェイ、API、エッジで別々の検証ロジックを持つと、挙動差から事故が生まれます。",
                        ],
                    },
                    {
                        title: "ライフサイクル制御を設計に含める",
                        bullets: [
                            "高リスク操作には短命な access token を使う。",
                            "鍵ローテーション、refresh token 失効、失敗監査を運用手順に組み込む。",
                            "保存場所は脅威モデルで決め、便利さだけで選ばない。",
                        ],
                    },
                ],
                exampleInput: "API Gateway から来た JWT\n目的: ルート許可前に検証する",
                exampleOutput: "署名と claims を検証\n監査ログを残して許可、失敗なら拒否",
            },
            ko: {
                title: "JWT 보안: 토큰 처리 모범 사례",
                description: "JWT 문제의 핵심은 이론보다 운영입니다. 불완전한 검증, 키 회전 부재, 부적절한 저장 방식이 실제 사고를 만듭니다.",
                sections: [
                    {
                        title: "보호된 요청마다 완전 검증이 필요합니다",
                        paragraphs: [
                            "서명, issuer, audience, 만료 시간, 필요한 claims 를 매 요청마다 일관되게 검증해야 합니다. 일부만 확인하면 우회 가능성이 생깁니다.",
                            "게이트웨이, API, 에지 함수가 서로 다른 검증 로직을 가지면 동작 차이로 사고가 발생합니다.",
                        ],
                    },
                    {
                        title: "수명 주기 제어를 설계에 넣으세요",
                        bullets: [
                            "고위험 작업에는 짧은 access token 수명을 사용합니다.",
                            "키 회전, refresh token 폐기, 실패 감사 로그를 운영 절차에 포함합니다.",
                            "저장 위치는 위협 모델에 따라 결정하고 편의성만 보고 고르지 않습니다.",
                        ],
                    },
                ],
                exampleInput: "API Gateway 에서 전달된 JWT\n목표: 라우트 접근 전 검증",
                exampleOutput: "서명 + claims 검증 완료\n감사 로그 남기고 허용, 실패 시 거부",
            },
            de: {
                title: "JWT-Sicherheit: Best Practices für den Umgang mit Tokens",
                description: "JWT-Probleme entstehen selten in der Theorie, sondern durch unvollständige Validierung, schwache Schlüsselrotation und unsichere Speicherung.",
                sections: [
                    {
                        title: "Jede geschützte Anfrage vollständig validieren",
                        paragraphs: [
                            "Signatur, Issuer, Audience, Ablaufzeit und erforderliche Claims müssen bei jedem Request konsistent geprüft werden.",
                            "Sobald Gateway, Backend und Edge unterschiedliche Prüfpfade haben, entstehen leicht Sicherheitslücken und Inkonsistenzen.",
                        ],
                    },
                    {
                        title: "Lebenszyklus kontrolliert gestalten",
                        bullets: [
                            "Kurze Access-Token-Laufzeiten für risikoreiche Aktionen.",
                            "Schlüsselrotation, Refresh-Revocation und Audit-Logs fest einplanen.",
                            "Speicherorte nach Threat Model wählen, nicht nach Bequemlichkeit.",
                        ],
                    },
                ],
                exampleInput: "JWT vom API-Gateway\nZiel: vor dem Routen-Zugriff prüfen",
                exampleOutput: "Signatur + Claims validiert\nAudit-Log schreiben und freigeben oder ablehnen",
            },
            fr: {
                title: "Sécurité JWT : bonnes pratiques de gestion des tokens",
                description: "Les incidents JWT viennent rarement de la théorie. Les causes réelles sont surtout la validation partielle, la rotation de clés faible et un stockage client mal choisi.",
                sections: [
                    {
                        title: "Valider complètement chaque requête protégée",
                        paragraphs: [
                            "Signature, issuer, audience, expiration et claims obligatoires doivent être contrôlés à chaque requête.",
                            "Dès que gateway, backend et edge appliquent des règles différentes, les écarts de comportement deviennent dangereux.",
                        ],
                    },
                    {
                        title: "Penser le cycle de vie des tokens",
                        bullets: [
                            "Utiliser des access tokens courts pour les actions sensibles.",
                            "Prévoir rotation des clés, révocation des refresh tokens et journaux d'audit.",
                            "Choisir le stockage côté client selon le threat model, pas selon la facilité.",
                        ],
                    },
                ],
                exampleInput: "JWT reçu depuis l'API Gateway\nObjectif : vérifier avant accès à la route",
                exampleOutput: "Signature + claims validées\njournal d'audit puis autorisation, sinon rejet",
            },
        },
    },
    "mock-openapi-quickly": {
        cluster: "c2",
        toolSectionKind: "api",
        relatedTools: [
            { slug: "openapi-mock", toolKey: "openapi_mock" },
            { slug: "openapi-viewer", toolKey: "openapi_viewer" },
            { slug: "http-request-builder", toolKey: "http_request_builder" },
            { slug: "curl-to-code", toolKey: "curl_to_code" },
        ],
        next: "openapi-debugging-workflow-checklist",
        sibling: "api-auth-header-mistakes",
        locales: {
            "zh-CN": {
                title: "如何快速 Mock OpenAPI",
                description: "高质量 Mock 的关键不是“快返回点数据”，而是让响应码、字段结构和示例数据始终跟规范保持同步。",
                sections: [
                    {
                        title: "快速 Mock 的正确顺序",
                        paragraphs: [
                            "先确认目标 operation、请求参数和响应 schema 是否齐全，再决定要生成哪些示例 payload。",
                            "如果一开始就直接手写假数据，而不管 schema，Mock 很快会变成前后端都不信任的摆设。",
                        ],
                    },
                    {
                        title: "让 Mock 在迭代中保持可用",
                        bullets: [
                            "固定状态码和关键头部，避免同一路径每次返回不同语义。",
                            "把样例数据做成可回放的 fixture，而不是临时拼 JSON。",
                            "规范变更批准后，连同 Mock 快照一起更新，避免文档和示例脱钩。",
                        ],
                    },
                ],
                exampleInput: "GET /users/{id}\nresponse schema: User",
                exampleOutput: "200 application/json\n{\"id\":\"u_123\",\"name\":\"Ava\",\"role\":\"admin\"}",
            },
            "zh-TW": {
                title: "如何快速 Mock OpenAPI",
                description: "高品質 Mock 的關鍵不是快速回幾筆假資料，而是讓狀態碼、欄位結構與範例始終和規格同步。",
                sections: [
                    {
                        title: "快速 Mock 的正確順序",
                        paragraphs: [
                            "先確認目標 operation、請求參數與回應 schema 是否完整，再決定要產出哪些範例 payload。",
                            "如果一開始就直接手寫假資料、不理 schema，Mock 很快就會變成前後端都不信任的樣板。",
                        ],
                    },
                    {
                        title: "讓 Mock 在迭代中持續可用",
                        bullets: [
                            "固定狀態碼與關鍵 header，避免同一路徑每次回傳不同語意。",
                            "把樣例資料做成可重播 fixture，而不是臨時拼 JSON。",
                            "規格變更核准後連同 Mock 快照一起更新，避免文件與範例脫鉤。",
                        ],
                    },
                ],
                exampleInput: "GET /users/{id}\nresponse schema: User",
                exampleOutput: "200 application/json\n{\"id\":\"u_123\",\"name\":\"Ava\",\"role\":\"admin\"}",
            },
            ja: {
                title: "OpenAPI をすばやくモックする方法",
                description: "良いモックは単に早く返るだけでは不十分です。ステータスコード、スキーマ、サンプルが仕様と揃っていることが重要です。",
                sections: [
                    {
                        title: "素早く作るための順序",
                        paragraphs: [
                            "まず対象 operation、入力パラメータ、レスポンス schema を確定させ、そのうえで決定的なサンプル payload を作ります。",
                            "仕様を見ずに適当なダミー JSON を先に置くと、モックはすぐに信用できない存在になります。",
                        ],
                    },
                    {
                        title: "モックを運用に耐える状態に保つ",
                        bullets: [
                            "ステータスコードと重要ヘッダーを固定する。",
                            "サンプルは一時生成ではなく fixture 化して再生可能にする。",
                            "仕様変更時はモックの snapshot も同時に更新する。",
                        ],
                    },
                ],
                exampleInput: "GET /users/{id}\nresponse schema: User",
                exampleOutput: "200 application/json\n{\"id\":\"u_123\",\"name\":\"Ava\",\"role\":\"admin\"}",
            },
            ko: {
                title: "OpenAPI를 빠르게 목킹하는 방법",
                description: "좋은 Mock 의 핵심은 단순히 빨리 데이터를 돌려주는 것이 아니라 상태 코드, 필드 구조, 예시가 스펙과 계속 맞는 데 있습니다.",
                sections: [
                    {
                        title: "빠르게 만들기 위한 순서",
                        paragraphs: [
                            "먼저 대상 operation, 요청 파라미터, 응답 schema 를 확인하고 그다음 결정적인 예시 payload 를 만듭니다.",
                            "스펙을 보지 않고 임의의 더미 JSON 부터 만들면 Mock 은 금방 신뢰를 잃습니다.",
                        ],
                    },
                    {
                        title: "반복 개발에서도 Mock 을 유지하는 법",
                        bullets: [
                            "상태 코드와 핵심 헤더를 고정합니다.",
                            "예시는 임시 JSON 이 아니라 fixture 로 보관해 재생 가능하게 만듭니다.",
                            "스펙 변경이 승인되면 Mock snapshot 도 함께 갱신합니다.",
                        ],
                    },
                ],
                exampleInput: "GET /users/{id}\nresponse schema: User",
                exampleOutput: "200 application/json\n{\"id\":\"u_123\",\"name\":\"Ava\",\"role\":\"admin\"}",
            },
            de: {
                title: "OpenAPI schnell mocken",
                description: "Ein brauchbarer Mock liefert nicht nur schnell Daten, sondern bleibt bei Statuscodes, Feldern und Beispielen sauber am Vertrag.",
                sections: [
                    {
                        title: "Die richtige Reihenfolge für schnelles Mocking",
                        paragraphs: [
                            "Zuerst Operation, Request-Parameter und Response-Schema prüfen, dann deterministische Beispielpayloads erzeugen.",
                            "Wer ohne Schema direkt Dummy-JSON schreibt, baut schnell einen Mock, dem weder Frontend noch Backend trauen.",
                        ],
                    },
                    {
                        title: "Mocks über Iterationen stabil halten",
                        bullets: [
                            "Statuscodes und kritische Header konstant halten.",
                            "Beispiele als Fixtures statt als ad-hoc JSON pflegen.",
                            "Bei Vertragsänderungen Mock-Snapshots direkt mitziehen.",
                        ],
                    },
                ],
                exampleInput: "GET /users/{id}\nresponse schema: User",
                exampleOutput: "200 application/json\n{\"id\":\"u_123\",\"name\":\"Ava\",\"role\":\"admin\"}",
            },
            fr: {
                title: "Comment mocker OpenAPI rapidement",
                description: "Un bon mock ne consiste pas seulement à renvoyer des données vite. Il doit rester aligné sur les codes de statut, les champs et les schémas du contrat.",
                sections: [
                    {
                        title: "Le bon ordre pour mocker vite",
                        paragraphs: [
                            "Commencer par confirmer l'operation ciblée, les paramètres et le schema de réponse, puis générer des exemples déterministes.",
                            "Si on écrit du faux JSON avant de regarder le schema, le mock devient rapidement peu fiable pour tout le monde.",
                        ],
                    },
                    {
                        title: "Garder le mock utile dans la durée",
                        bullets: [
                            "Stabiliser codes HTTP et headers critiques.",
                            "Conserver les exemples sous forme de fixtures rejouables.",
                            "Mettre à jour en même temps le mock et ses snapshots quand le contrat change.",
                        ],
                    },
                ],
                exampleInput: "GET /users/{id}\nresponse schema: User",
                exampleOutput: "200 application/json\n{\"id\":\"u_123\",\"name\":\"Ava\",\"role\":\"admin\"}",
            },
        },
    },
    "modern-css-effects-guide": {
        cluster: "c4",
        toolSectionKind: "css",
        relatedTools: [
            { slug: "css-glassmorphism-generator", toolKey: "css_glassmorphism_generator" },
            { slug: "css-gradient-generator", toolKey: "css_gradient_generator" },
            { slug: "css-loader-generator", toolKey: "css_loader_generator" },
            { slug: "color-mixer", toolKey: "color_mixer" },
        ],
        next: "css-animations-and-transitions-guide",
        sibling: "css-border-radius-and-shapes-guide",
        locales: {
            "zh-CN": {
                title: "现代 CSS 视觉效果：玻璃拟态、渐变等",
                description: "视觉效果的目标不是装饰越多越好，而是在可读性、性能和品牌表达之间找到稳定边界。",
                sections: [
                    {
                        title: "玻璃拟态和渐变要有阅读纪律",
                        paragraphs: [
                            "半透明面板和 backdrop blur 可以把浮层从复杂背景里分离出来，但如果叠太多层，会直接损伤可读性。",
                            "渐变也应该被当成设计 token 管理，用在 hero、描边和重点状态，而不是页面上随处飘。",
                        ],
                    },
                    {
                        title: "每个效果都要有性能边界",
                        bullets: [
                            "大面积背景降低饱和度，小范围强调再提高对比。",
                            "模糊、阴影和动画渐变要在受限设备上做实际 profile。",
                            "为复杂效果准备纯色或更轻量的回退样式。",
                        ],
                    },
                ],
                exampleInput: "Hero 面板叠在噪点背景图上\n需求：标题和 CTA 必须清晰可读",
                exampleOutput: "panel: rgba(15,23,42,0.45)\nbackdrop-blur: 10px\nborder: 1px rgba(255,255,255,0.18)",
            },
            "zh-TW": {
                title: "現代 CSS 視覺效果：玻璃擬態、漸層等",
                description: "視覺效果的目標不是裝飾越多越好，而是在可讀性、效能與品牌表達之間找到穩定邊界。",
                sections: [
                    {
                        title: "玻璃擬態與漸層要有閱讀紀律",
                        paragraphs: [
                            "半透明面板與 backdrop blur 能把浮層從複雜背景中拉出來，但如果疊太多層，會直接傷害可讀性。",
                            "漸層也應該當作設計權杖管理，用在 hero、描邊與重點狀態，而不是全頁隨意鋪滿。",
                        ],
                    },
                    {
                        title: "每個效果都要有性能邊界",
                        bullets: [
                            "大面積背景降低飽和度，小範圍強調再提高對比。",
                            "模糊、陰影與動畫漸層要在受限裝置上實測。",
                            "為複雜效果準備純色或更輕量的回退樣式。",
                        ],
                    },
                ],
                exampleInput: "Hero 面板覆蓋在雜訊背景圖上\n需求：標題與 CTA 必須清楚可讀",
                exampleOutput: "panel: rgba(15,23,42,0.45)\nbackdrop-blur: 10px\nborder: 1px rgba(255,255,255,0.18)",
            },
            ja: {
                title: "モダン CSS エフェクト: グラスモーフィズムやグラデーション",
                description: "視覚効果の目的は飾りを増やすことではなく、可読性と性能を守りながら強調点を作ることです。",
                sections: [
                    {
                        title: "グラス効果とグラデーションを読みやすさの中で使う",
                        paragraphs: [
                            "半透明パネルと backdrop blur は情報を背景から分離できますが、重ねすぎると文字の読みやすさを損ないます。",
                            "グラデーションもデザイントークンとして管理し、ヒーロー面やアクセントに用途を絞るべきです。",
                        ],
                    },
                    {
                        title: "性能上限を先に決める",
                        bullets: [
                            "大きな背景では彩度を抑え、小さな焦点要素で強めに使う。",
                            "blur、shadow、アニメーション付きグラデーションは実機プロファイルで確認する。",
                            "複雑な効果には単色など軽いフォールバックを持たせる。",
                        ],
                    },
                ],
                exampleInput: "ノイズ背景上のヒーローパネル\n要件: 見出しと CTA を明瞭に見せたい",
                exampleOutput: "panel: rgba(15,23,42,0.45)\nbackdrop-blur: 10px\nborder: 1px rgba(255,255,255,0.18)",
            },
            ko: {
                title: "현대 CSS 효과: 글래스모피즘, 그라디언트 등",
                description: "시각 효과의 목적은 장식을 늘리는 것이 아니라 가독성, 성능, 브랜드 표현 사이의 균형을 잡는 데 있습니다.",
                sections: [
                    {
                        title: "글래스 효과와 그라디언트는 읽기 경험을 해치면 안 됩니다",
                        paragraphs: [
                            "반투명 패널과 backdrop blur 는 복잡한 배경에서 콘텐츠를 분리하는 데 좋지만, 너무 많이 겹치면 텍스트 가독성이 떨어집니다.",
                            "그라디언트도 디자인 토큰으로 관리해 히어로와 강조 영역에만 사용해야 합니다.",
                        ],
                    },
                    {
                        title: "효과마다 성능 한계를 정하세요",
                        bullets: [
                            "넓은 배경은 채도를 낮추고, 작은 초점 요소에서 대비를 높입니다.",
                            "블러, 그림자, 애니메이션 그라디언트는 실제 저사양 환경에서 프로파일링합니다.",
                            "복잡한 효과에는 단색 등 가벼운 fallback 을 준비합니다.",
                        ],
                    },
                ],
                exampleInput: "노이즈 배경 위 히어로 패널\n요구사항: 제목과 CTA 가 충분히 읽혀야 함",
                exampleOutput: "panel: rgba(15,23,42,0.45)\nbackdrop-blur: 10px\nborder: 1px rgba(255,255,255,0.18)",
            },
            de: {
                title: "Moderne CSS-Effekte: Glassmorphism, Verläufe und mehr",
                description: "Visuelle Effekte sollen nicht maximal dekorativ sein, sondern Lesbarkeit, Performance und Markenwirkung sauber ausbalancieren.",
                sections: [
                    {
                        title: "Glassmorphism und Gradients mit Disziplin einsetzen",
                        paragraphs: [
                            "Transparente Panels mit Blur können Inhalte von unruhigen Hintergründen abheben, verlieren aber bei Übernutzung schnell an Lesbarkeit.",
                            "Verläufe sollten als Tokens gepflegt und gezielt für Hero-Flächen oder Akzente eingesetzt werden.",
                        ],
                    },
                    {
                        title: "Jeder Effekt braucht Performance-Grenzen",
                        bullets: [
                            "Große Flächen mit geringerer Sättigung, kleine Fokusbereiche mit stärkerem Kontrast gestalten.",
                            "Blur, Schatten und animierte Gradients auf gedrosselten Geräten testen.",
                            "Für komplexe Effekte solide Fallbacks definieren.",
                        ],
                    },
                ],
                exampleInput: "Hero-Panel auf unruhigem Bildhintergrund\nAnforderung: Heading und CTA klar lesbar",
                exampleOutput: "panel: rgba(15,23,42,0.45)\nbackdrop-blur: 10px\nborder: 1px rgba(255,255,255,0.18)",
            },
            fr: {
                title: "Effets CSS modernes : glassmorphism, dégradés et plus",
                description: "Un bon effet visuel ne cherche pas la décoration maximale. Il doit équilibrer lisibilité, performance et personnalité produit.",
                sections: [
                    {
                        title: "Utiliser glassmorphism et dégradés avec discipline",
                        paragraphs: [
                            "Les panneaux translucides avec blur détachent bien un contenu d'un fond chargé, mais deviennent vite illisibles s'ils sont multipliés.",
                            "Les dégradés doivent être gérés comme des tokens et réservés aux surfaces hero ou aux accents importants.",
                        ],
                    },
                    {
                        title: "Fixer des limites de performance",
                        bullets: [
                            "Baisser la saturation sur les grandes surfaces et réserver le contraste fort aux petits points focaux.",
                            "Profiler blur, shadow et dégradés animés sur des appareils contraints.",
                            "Prévoir des fallbacks unis pour les effets lourds.",
                        ],
                    },
                ],
                exampleInput: "Panneau hero sur image bruitée\nBesoin : titre et CTA parfaitement lisibles",
                exampleOutput: "panel: rgba(15,23,42,0.45)\nbackdrop-blur: 10px\nborder: 1px rgba(255,255,255,0.18)",
            },
        },
    },
    "openapi-debugging-workflow-checklist": {
        cluster: "c2",
        toolSectionKind: "api",
        relatedTools: [
            { slug: "openapi-viewer", toolKey: "openapi_viewer" },
            { slug: "openapi-mock", toolKey: "openapi_mock" },
            { slug: "http-request-builder", toolKey: "http_request_builder" },
            { slug: "curl-to-code", toolKey: "curl_to_code" },
        ],
        next: "api-auth-header-mistakes",
        sibling: "convert-curl-to-fetch-python",
        locales: {
            "zh-CN": {
                title: "OpenAPI 调试流程清单",
                description: "很多 API 故障并不是代码本身坏了，而是规范、客户端和服务实现之间对契约理解不一致。",
                sections: [
                    {
                        title: "按顺序排查，别跳步骤",
                        paragraphs: [
                            "先确认到底命中了哪一个 operation，再核对 path 参数、query、headers 和 request body 的真实结构。",
                            "如果连目标契约都没对准，就直接抓服务日志，通常只会越看越乱。",
                        ],
                    },
                    {
                        title: "重放与比对要看原始数据",
                        bullets: [
                            "用可重复的工具重放请求，并保留原始 headers 和 body。",
                            "把真实响应码和 schema 与规范逐项对比，而不是只看“成功/失败”。",
                            "问题修复后同时更新实现或规范，再跑一次契约检查，避免同样问题回归。",
                        ],
                    },
                ],
                exampleInput: "spec: POST /orders -> 201\nactual: POST /orders -> 200",
                exampleOutput: "发现 contract mismatch\n动作：修正服务实现或更新规范中的响应状态",
            },
            "zh-TW": {
                title: "OpenAPI 偵錯流程檢查清單",
                description: "很多 API 故障不是程式碼壞掉，而是規格、客戶端與服務實作之間對契約理解不一致。",
                sections: [
                    {
                        title: "按順序排查，不要跳步",
                        paragraphs: [
                            "先確認命中了哪個 operation，再核對 path 參數、query、headers 與 request body 的真實結構。",
                            "如果連目標契約都沒對準，就直接翻服務日誌，通常只會越看越亂。",
                        ],
                    },
                    {
                        title: "重播與比對要看原始資料",
                        bullets: [
                            "用可重複工具重播請求，保留原始 headers 與 body。",
                            "把真實狀態碼與 schema 跟規格逐項比對，而不是只看成功或失敗。",
                            "修正後同步更新實作或規格，再跑一次契約檢查。",
                        ],
                    },
                ],
                exampleInput: "spec: POST /orders -> 201\nactual: POST /orders -> 200",
                exampleOutput: "發現 contract mismatch\n動作：修正服務實作或更新規格中的狀態碼",
            },
            ja: {
                title: "OpenAPI デバッグワークフローチェックリスト",
                description: "多くの API バグはコードそのものではなく、仕様、クライアント、実装の契約ずれから生まれます。",
                sections: [
                    {
                        title: "順番に切り分ける",
                        paragraphs: [
                            "まず対象 operation を確定し、path パラメータ、query、headers、body の実データを仕様と揃えて確認します。",
                            "契約がずれたままログだけ見ても、原因の切り分けはほとんど進みません。",
                        ],
                    },
                    {
                        title: "再現と比較は生データで行う",
                        bullets: [
                            "再現可能なツールでリクエストを送信し、headers と body を保存する。",
                            "実際のステータスコードと schema を仕様と項目単位で比較する。",
                            "修正後は実装か仕様のどちらかを更新し、契約チェックを再実行する。",
                        ],
                    },
                ],
                exampleInput: "spec: POST /orders -> 201\nactual: POST /orders -> 200",
                exampleOutput: "contract mismatch を検出\n対応: サービス実装または仕様のレスポンス定義を修正",
            },
            ko: {
                title: "OpenAPI 디버깅 워크플로 체크리스트",
                description: "많은 API 버그는 코드 자체보다 스펙, 클라이언트, 서비스 구현 사이의 계약 불일치에서 시작됩니다.",
                sections: [
                    {
                        title: "순서대로 좁혀야 합니다",
                        paragraphs: [
                            "먼저 어떤 operation 을 호출했는지 확정한 뒤 path 파라미터, query, headers, body 의 실제 구조를 비교합니다.",
                            "계약 자체가 어긋난 상태에서 로그만 보면 원인 파악이 더 어려워집니다.",
                        ],
                    },
                    {
                        title: "재현과 비교는 원본 데이터로",
                        bullets: [
                            "재현 가능한 도구로 요청을 다시 보내고 headers 와 body 를 보관합니다.",
                            "실제 상태 코드와 schema 를 스펙과 항목별로 비교합니다.",
                            "수정 후 구현 또는 스펙을 함께 갱신하고 계약 검사를 다시 돌립니다.",
                        ],
                    },
                ],
                exampleInput: "spec: POST /orders -> 201\nactual: POST /orders -> 200",
                exampleOutput: "contract mismatch 발견\n조치: 서비스 구현 또는 스펙 응답 상태 코드 정렬",
            },
            de: {
                title: "OpenAPI-Debugging-Workflow-Checkliste",
                description: "Viele API-Fehler entstehen nicht im Code selbst, sondern durch Vertragsabweichungen zwischen Spezifikation, Client und Service.",
                sections: [
                    {
                        title: "In fester Reihenfolge debuggen",
                        paragraphs: [
                            "Zuerst die exakte Operation bestimmen und dann Pfadparameter, Query, Header und Body mit dem Vertrag abgleichen.",
                            "Wer den falschen Vertrag prüft und direkt in Logs springt, verliert schnell die Orientierung.",
                        ],
                    },
                    {
                        title: "Replay und Vergleich auf Rohdatenbasis",
                        bullets: [
                            "Requests reproduzierbar senden und rohe Header sowie Body speichern.",
                            "Tatsächliche Statuscodes und Response-Schemas gegen die Spezifikation prüfen.",
                            "Nach dem Fix entweder Implementierung oder Spec aktualisieren und den Contract-Check erneut laufen lassen.",
                        ],
                    },
                ],
                exampleInput: "spec: POST /orders -> 201\nactual: POST /orders -> 200",
                exampleOutput: "Contract-Mismatch erkannt\nMaßnahme: Service oder Spezifikation auf denselben Status ausrichten",
            },
            fr: {
                title: "Checklist de workflow de débogage OpenAPI",
                description: "Beaucoup de bugs API ne viennent pas du code lui-même, mais d'un décalage de contrat entre la spec, le client et le service.",
                sections: [
                    {
                        title: "Déboguer dans le bon ordre",
                        paragraphs: [
                            "Commencer par confirmer l'operation exacte, puis comparer paramètres de chemin, query, headers et body réel.",
                            "Si le contrat ciblé n'est pas le bon, consulter les logs trop tôt ne fait qu'ajouter de la confusion.",
                        ],
                    },
                    {
                        title: "Comparer à partir des données brutes",
                        bullets: [
                            "Rejouer la requête avec un outil déterministe et conserver headers + body.",
                            "Comparer code de statut et schema de réponse à la spec point par point.",
                            "Après correction, mettre à jour l'implémentation ou la spec puis relancer la vérification de contrat.",
                        ],
                    },
                ],
                exampleInput: "spec: POST /orders -> 201\nactual: POST /orders -> 200",
                exampleOutput: "mismatch de contrat détecté\naction : aligner le service ou la spec sur le code de statut",
            },
        },
    },
    "robots-txt-testing-checklist": {
        cluster: "c3",
        toolSectionKind: "security",
        relatedTools: [
            { slug: "robots-txt-tester", toolKey: "robots_txt_tester" },            { slug: "certificate-decoder", toolKey: "certificate_decoder" },
            { slug: "header-diff", toolKey: "header_diff" },
        ],
        next: "dns-records-uptime",
        sibling: "certificate-chain-basics-for-developers",
        locales: {
            "zh-CN": {
                title: "Robots.txt 测试清单",
                description: "错误的 robots 规则足以让关键页面直接失去抓取资格。上线前的模拟检查，比事后追索引损失便宜得多。",
                sections: [
                    {
                        title: "发布前必须确认的抓取规则",
                        paragraphs: [
                            "先确认 locale 路径、工具页和专题页没有被全局 `Disallow` 误伤，再检查 sitemap 声明和 canonical 是否仍可抓取。",
                            "很多误封都发生在环境切换或框架升级之后，因为团队只看了 `robots.txt` 文件本身，没有去模拟真实 crawler 行为。",
                        ],
                    },
                    {
                        title: "不要只看文件内容，要看抓取结果",
                        bullets: [
                            "对核心 landing page 和高价值工具页逐一做 crawler 模拟。",
                            "把 preview / staging / production 的 robots 差异纳入部署检查。",
                            "出现异常时同时检查 `X-Robots-Tag` 和缓存/CDN 层是否覆盖了响应头。",
                        ],
                    },
                ],
                exampleInput: "User-agent: *\nDisallow: /",
                exampleOutput: "抓取访问：已阻止\n索引风险：严重",
            },
            "zh-TW": {
                title: "Robots.txt 測試檢查清單",
                description: "錯誤的 robots 規則足以讓關鍵頁面直接失去抓取資格。上線前先模擬，比事後追索引損失便宜得多。",
                sections: [
                    {
                        title: "發布前必查的抓取規則",
                        paragraphs: [
                            "先確認 locale 路徑、工具頁與專題頁沒有被全域 `Disallow` 誤傷，再檢查 sitemap 與 canonical 是否仍可抓取。",
                            "很多誤封都發生在環境切換或框架升級之後，因為團隊只看檔案內容，沒有模擬真實 crawler 行為。",
                        ],
                    },
                    {
                        title: "不要只看檔案，要看抓取結果",
                        bullets: [
                            "對核心 landing page 與高價值工具頁逐一做 crawler 模擬。",
                            "把 preview / staging / production 的 robots 差異納入部署檢查。",
                            "異常時同步檢查 `X-Robots-Tag` 與 CDN/快取層是否覆寫標頭。",
                        ],
                    },
                ],
                exampleInput: "User-agent: *\nDisallow: /",
                exampleOutput: "爬取存取：已封鎖\n索引風險：嚴重",
            },
            ja: {
                title: "Robots.txt テストチェックリスト",
                description: "誤った robots ルールは重要ページのクロールを即座に止めます。公開前の検証は、後から索引損失を追うよりはるかに安価です。",
                sections: [
                    {
                        title: "公開前に必ず見る項目",
                        paragraphs: [
                            "各 locale のパス、主要ツール、特集ページが誤って `Disallow` されていないか確認し、sitemap と canonical の到達性も見るべきです。",
                            "誤設定の多くは環境切り替えやアップグレード時に起こり、ファイルの見た目だけでは見逃されます。",
                        ],
                    },
                    {
                        title: "ファイルではなくクロール結果を確認する",
                        bullets: [
                            "主要 landing page と高価値ページを crawler シミュレーションする。",
                            "preview / staging / production 間の robots 差分をデプロイ検査に入れる。",
                            "`X-Robots-Tag` や CDN キャッシュの上書きも同時に確認する。",
                        ],
                    },
                ],
                exampleInput: "User-agent: *\nDisallow: /",
                exampleOutput: "クロールアクセス: ブロック\nインデックスリスク: 重大",
            },
            ko: {
                title: "Robots.txt 테스트 체크리스트",
                description: "잘못된 robots 규칙 하나만으로도 핵심 페이지가 바로 크롤링 대상에서 빠질 수 있습니다. 배포 전 검증이 사후 복구보다 훨씬 싸게 먹힙니다.",
                sections: [
                    {
                        title: "배포 전에 반드시 확인할 규칙",
                        paragraphs: [
                            "locale 경로, 핵심 도구 페이지, 주제 페이지가 전역 `Disallow` 에 걸리지 않았는지 먼저 확인하고 sitemap 과 canonical 접근성도 봐야 합니다.",
                            "많은 오차단은 환경 전환이나 프레임워크 업그레이드 때 발생하며, 파일 내용만 보면 놓치기 쉽습니다.",
                        ],
                    },
                    {
                        title: "파일보다 실제 크롤링 결과를 보세요",
                        bullets: [
                            "핵심 landing page 와 고가치 도구 페이지를 crawler 시뮬레이션합니다.",
                            "preview / staging / production 간 robots 차이를 배포 점검에 포함합니다.",
                            "이상 시 `X-Robots-Tag` 와 CDN/캐시 헤더 덮어쓰기도 함께 확인합니다.",
                        ],
                    },
                ],
                exampleInput: "User-agent: *\nDisallow: /",
                exampleOutput: "크롤러 접근: 차단됨\n색인 위험: 치명적",
            },
            de: {
                title: "Robots.txt-Testcheckliste",
                description: "Eine falsche robots-Regel kann wichtige Seiten sofort aus der Crawl-Pipeline nehmen. Vorabtests sind deutlich günstiger als spätere Indexierungsverluste.",
                sections: [
                    {
                        title: "Pflichtprüfungen vor dem Release",
                        paragraphs: [
                            "Zuerst sicherstellen, dass Locale-Pfade, Toolseiten und Cluster-Inhalte nicht versehentlich global blockiert werden, und zugleich Sitemap sowie Canonical-Erreichbarkeit prüfen.",
                            "Viele Fehler entstehen bei Umgebungswechseln oder Framework-Upgrades und werden im Dateitext allein nicht sichtbar.",
                        ],
                    },
                    {
                        title: "Nicht nur die Datei, sondern das Crawl-Ergebnis prüfen",
                        bullets: [
                            "Wichtige Landing Pages und Tool-Routen mit einem Crawler simulieren.",
                            "Robots-Unterschiede zwischen Preview, Staging und Produktion in den Deployment-Check aufnehmen.",
                            "`X-Robots-Tag` und Header-Umschreibungen durch CDN oder Cache mitprüfen.",
                        ],
                    },
                ],
                exampleInput: "User-agent: *\nDisallow: /",
                exampleOutput: "Crawler-Zugriff: blockiert\nIndexierungsrisiko: kritisch",
            },
            fr: {
                title: "Checklist de test robots.txt",
                description: "Une règle robots incorrecte peut bloquer immédiatement l'exploration de pages stratégiques. Les vérifications avant mise en ligne coûtent bien moins qu'une perte d'indexation.",
                sections: [
                    {
                        title: "Ce qu'il faut contrôler avant release",
                        paragraphs: [
                            "Vérifier d'abord que les chemins de langue, pages outils et contenus piliers ne sont pas touchés par un `Disallow` global, puis contrôler sitemap et canonical.",
                            "Beaucoup d'erreurs apparaissent lors d'un changement d'environnement ou d'un upgrade framework et ne se voient pas à la simple lecture du fichier.",
                        ],
                    },
                    {
                        title: "Tester le résultat de crawl, pas seulement le fichier",
                        bullets: [
                            "Simuler le crawl sur les landing pages et routes à forte valeur.",
                            "Comparer preview, staging et production dans le pipeline de déploiement.",
                            "En cas d'anomalie, vérifier aussi `X-Robots-Tag` et les réécritures de headers par CDN/cache.",
                        ],
                    },
                ],
                exampleInput: "User-agent: *\nDisallow: /",
                exampleOutput: "accès crawler: bloqué\nrisque d'indexation: critique",
            },
        },
    },
    "svg-optimization-and-conversion-best-practices": {
        cluster: "c5",
        toolSectionKind: "image",
        relatedTools: [
            { slug: "svg-optimizer", toolKey: "svg_optimizer" },
            { slug: "svg-blob-generator", toolKey: "svg_blob_generator" },
            { slug: "svg-pattern-generator", toolKey: "svg_pattern_generator" },
            { slug: "svg-to-png-converter", toolKey: "svg_to_png_converter" },
        ],
        next: "image-privacy-how-to-censor-and-protect-images",
        sibling: "image-optimization-for-web-complete-workflow",
        locales: {
            "zh-CN": {
                title: "SVG 优化与转换最佳实践",
                description: "SVG 很高效，但设计工具导出的文件常夹带冗余 metadata、冗长路径和不稳定的 viewBox。没有管线，性能和渲染都会慢慢变差。",
                sections: [
                    {
                        title: "优化要以安全变换为主",
                        paragraphs: [
                            "真正适合生产的优化，是删除编辑器 metadata、未使用定义和多余精度，而不是一上来就做激进重写。",
                            "每改一组优化 preset，都要检查图标对齐、描边和 viewBox 是否仍然正确，否则节省的字节可能换来错位渲染。",
                        ],
                    },
                    {
                        title: "转换应该发生在交付边界",
                        bullets: [
                            "设计源文件尽量保持 SVG 为单一真源。",
                            "只有当目标平台必须要位图时，再导出 PNG 等衍生版本。",
                            "不要把位图反过来当主资产继续编辑，否则质量和一致性会快速劣化。",
                        ],
                    },
                ],
                exampleInput: "120KB 的导出 SVG，包含编辑器 metadata\n目标：网页图标 + 社媒预览 PNG",
                exampleOutput: "优化后 SVG <20KB\n按目标尺寸导出 PNG 衍生文件",
            },
            "zh-TW": {
                title: "SVG 最佳化與轉換最佳實踐",
                description: "SVG 很高效，但設計工具輸出的檔案常帶著多餘 metadata、冗長 path 與不穩定的 viewBox。沒有管線，效能和渲染都會慢慢惡化。",
                sections: [
                    {
                        title: "最佳化要以安全變換為主",
                        paragraphs: [
                            "真正適合正式環境的最佳化，是移除編輯器 metadata、未使用定義與過多精度，而不是一開始就做激進重寫。",
                            "每次調整最佳化 preset，都要檢查圖示對齊、筆畫與 viewBox 是否仍然正確。",
                        ],
                    },
                    {
                        title: "轉換應該發生在交付邊界",
                        bullets: [
                            "設計主資產盡量維持 SVG 為唯一真源。",
                            "只有目標平台必須使用點陣圖時，才導出 PNG 等衍生版本。",
                            "不要把點陣輸出反過來當主資產繼續編輯。",
                        ],
                    },
                ],
                exampleInput: "120KB 匯出的 SVG，包含設計工具 metadata\n目標：網站圖示 + 社群預覽 PNG",
                exampleOutput: "最佳化後 SVG <20KB\n依目標尺寸輸出 PNG 衍生檔",
            },
            ja: {
                title: "SVG 最適化と変換のベストプラクティス",
                description: "SVG は効率的ですが、エディタ書き出しのままでは余計な metadata や長い path、ずれた viewBox を抱えがちです。運用パイプラインが必要です。",
                sections: [
                    {
                        title: "最適化は安全な変換から始める",
                        paragraphs: [
                            "本番向きの最適化は、エディタ metadata、未使用定義、過剰精度の削除です。いきなり攻めた再構成をする必要はありません。",
                            "preset を変えるたびにアイコン位置、stroke、viewBox の整合性を検証すべきです。",
                        ],
                    },
                    {
                        title: "変換は配信境界で行う",
                        bullets: [
                            "ソース・オブ・トゥルースは SVG のまま保つ。",
                            "PNG などのラスタ変換は必要な配信先だけに限定する。",
                            "変換後ビットマップを主資産として編集し続けない。",
                        ],
                    },
                ],
                exampleInput: "120KB の書き出し SVG (metadata 含む)\n目的: Web アイコン + SNS プレビュー PNG",
                exampleOutput: "最適化後 SVG は 20KB 未満\n必要サイズの PNG を派生生成",
            },
            ko: {
                title: "SVG 최적화와 변환 모범 사례",
                description: "SVG 는 효율적이지만 디자인 툴 출력물 그대로 두면 불필요한 metadata, 장황한 path, 불안정한 viewBox 를 끌고 갑니다. 파이프라인이 필요합니다.",
                sections: [
                    {
                        title: "최적화는 안전한 변환부터 시작하세요",
                        paragraphs: [
                            "운영에 적합한 최적화는 편집기 metadata, 미사용 정의, 과도한 정밀도 제거입니다. 무리한 재작성부터 시작할 필요는 없습니다.",
                            "preset 을 바꿀 때마다 아이콘 정렬, stroke, viewBox 정합성을 검증해야 합니다.",
                        ],
                    },
                    {
                        title: "변환은 전달 경계에서만 하세요",
                        bullets: [
                            "원본의 단일 진실은 SVG 로 유지합니다.",
                            "플랫폼이 비트맵을 요구할 때만 PNG 등 파생 파일을 만듭니다.",
                            "변환된 비트맵을 다시 주 자산처럼 편집하지 않습니다.",
                        ],
                    },
                ],
                exampleInput: "에디터 metadata 가 포함된 120KB SVG\n목표: 웹 아이콘 + 소셜 미리보기 PNG",
                exampleOutput: "최적화 후 SVG <20KB\n필요한 크기의 PNG 파생본 생성",
            },
            de: {
                title: "Best Practices für SVG-Optimierung und -Konvertierung",
                description: "SVG ist effizient, doch Exportdateien aus Design-Tools enthalten oft unnötige Metadaten, lange Pfade und inkonsistente viewBox-Werte. Ohne Pipeline leidet Qualität und Performance.",
                sections: [
                    {
                        title: "Mit sicheren Optimierungen beginnen",
                        paragraphs: [
                            "Für Produktion eignen sich vor allem das Entfernen von Editor-Metadaten, ungenutzten Definitionen und überflüssiger Präzision.",
                            "Nach jeder Preset-Änderung sollten Ausrichtung, Stroke-Verhalten und viewBox geprüft werden.",
                        ],
                    },
                    {
                        title: "Konvertierung nur an Liefergrenzen",
                        bullets: [
                            "SVG als Source of Truth behalten.",
                            "PNG und andere Rasterformate nur für Zielplattformen erzeugen, die sie wirklich brauchen.",
                            "Rasterderivate nicht als primäre Assets weiterbearbeiten.",
                        ],
                    },
                ],
                exampleInput: "120KB exportiertes SVG mit Editor-Metadaten\nZiel: Web-Icon + Social-Preview-PNG",
                exampleOutput: "Optimiertes SVG unter 20KB\nPNG-Ableitungen in den benötigten Größen",
            },
            fr: {
                title: "Bonnes pratiques d'optimisation et de conversion SVG",
                description: "Le SVG est très efficace, mais les exports de design embarquent souvent trop de metadata, de paths verbeux et des viewBox incohérents. Une pipeline dédiée évite ces dérives.",
                sections: [
                    {
                        title: "Commencer par des optimisations sûres",
                        paragraphs: [
                            "En production, il vaut mieux retirer metadata d'éditeur, définitions inutilisées et précision excessive plutôt que de réécrire agressivement l'asset.",
                            "Après chaque changement de preset, il faut revérifier alignement, strokes et viewBox.",
                        ],
                    },
                    {
                        title: "Convertir seulement au moment de la livraison",
                        bullets: [
                            "Garder le SVG comme source unique de vérité.",
                            "Produire des PNG seulement pour les plateformes qui en ont besoin.",
                            "Éviter de rééditer les bitmaps dérivés comme s'ils étaient l'asset source.",
                        ],
                    },
                ],
                exampleInput: "SVG exporté de 120KB avec metadata d'éditeur\nObjectif : icône web + PNG pour aperçu social",
                exampleOutput: "SVG optimisé <20KB\nPNGs dérivés générés aux tailles requises",
            },
        },
    },
    "url-encoding-explained-common-mistakes-and-solutions": {
        cluster: "c6",
        toolSectionKind: "encoding",
        relatedTools: [
            { slug: "url-encode-decode", toolKey: "url_encode_decode" },
            { slug: "url-parser", toolKey: "url_parser" },
            { slug: "curl-to-code", toolKey: "curl_to_code" },
            { slug: "http-request-builder", toolKey: "http_request_builder" },
        ],
        next: "jwt-security-best-practices-for-token-handling",
        sibling: "base64-encoding-when-and-how-to-use-it",
        locales: {
            "zh-CN": {
                title: "URL 编码详解：常见错误与解决方案",
                description: "URL 编码问题多数不是不会用函数，而是在错误边界上编码、重复编码，或让解析行为在多个层之间失控。",
                sections: [
                    {
                        title: "编码的是值，不是整条 URL",
                        paragraphs: [
                            "最常见的错误是把完整 URL 整串做编码。真正该编码的是 query value、path segment 等动态数据，而不是 `/`、`?`、`&` 这些结构分隔符。",
                            "只要边界一错，重定向、API 调用和追踪链接就会出现肉眼难查的细碎故障。",
                        ],
                    },
                    {
                        title: "避免双重编码和解析分叉",
                        bullets: [
                            "明确最后一次编码由客户端还是服务端负责。",
                            "原始值尽量以未编码形式存储，在传输边界再统一编码。",
                            "对 `+`、空格、Unicode 和保留字符准备回归样例，统一解析库行为。",
                        ],
                    },
                ],
                exampleInput: "搜索值：\"email + alias\"\n目标：作为 API 请求 query 参数发送",
                exampleOutput: "只编码 query value 本身\n服务端解码后恢复原始字符串",
            },
            "zh-TW": {
                title: "URL 編碼詳解：常見錯誤與解法",
                description: "URL 編碼問題通常不是不會用函式，而是在錯誤邊界上編碼、重複編碼，或讓解析行為在多個層之間失控。",
                sections: [
                    {
                        title: "應該編碼的是值，不是整條 URL",
                        paragraphs: [
                            "最常見的錯誤是把完整 URL 整串做編碼。真正該編碼的是 query value、path segment 等動態資料，而不是 `/`、`?`、`&` 這些結構符號。",
                            "只要邊界一錯，redirect、API 呼叫與追蹤連結就會出現難以定位的細碎故障。",
                        ],
                    },
                    {
                        title: "避免雙重編碼與解析分叉",
                        bullets: [
                            "明確最後一次編碼由客戶端還是服務端負責。",
                            "原始值盡量以未編碼形式儲存，在傳輸邊界再統一編碼。",
                            "針對 `+`、空格、Unicode 與保留字元準備回歸樣例。",
                        ],
                    },
                ],
                exampleInput: "搜尋值：\"email + alias\"\n目標：作為 API query 參數送出",
                exampleOutput: "只編碼 query value 本身\n服務端解碼後恢復原始字串",
            },
            ja: {
                title: "URL エンコード解説: よくあるミスと対処法",
                description: "URL エンコードの問題は関数の使い方より、どこでエンコードするかを誤ることや二重エンコードから生まれます。",
                sections: [
                    {
                        title: "URL 全体ではなく値だけをエンコードする",
                        paragraphs: [
                            "最も多いミスは URL 全体を一括でエンコードしてしまうことです。query value や path segment など、動的な値だけを対象にすべきです。",
                            "境界を間違えると、リダイレクトや API リクエストで細かな不具合が継続的に発生します。",
                        ],
                    },
                    {
                        title: "二重エンコードと解析差を防ぐ",
                        bullets: [
                            "最終エンコードをクライアントとサーバーのどちらが担うか決める。",
                            "元値は未エンコードで保持し、送信境界で一度だけエンコードする。",
                            "`+`、空白、Unicode、予約文字の回帰ケースを持つ。",
                        ],
                    },
                ],
                exampleInput: "検索値: \"email + alias\"\n目的: API の query parameter として送る",
                exampleOutput: "query value のみエンコード\nサーバー側で元の文字列へ復元",
            },
            ko: {
                title: "URL 인코딩 설명: 흔한 실수와 해결 방법",
                description: "URL 인코딩 문제는 함수 사용법보다 어디서 인코딩할지, 중복 인코딩을 어떻게 막을지가 핵심입니다.",
                sections: [
                    {
                        title: "전체 URL 이 아니라 값만 인코딩하세요",
                        paragraphs: [
                            "가장 흔한 실수는 URL 전체 문자열을 한 번에 인코딩하는 것입니다. query value, path segment 같은 동적 값만 인코딩해야 합니다.",
                            "경계를 잘못 잡으면 리다이렉트, API 호출, 추적 링크에서 자잘하지만 치명적인 오류가 계속 생깁니다.",
                        ],
                    },
                    {
                        title: "이중 인코딩과 파서 차이를 막으세요",
                        bullets: [
                            "최종 인코딩 책임이 클라이언트인지 서버인지 명확히 정합니다.",
                            "원본 값은 비인코딩 상태로 저장하고 전송 경계에서 한 번만 인코딩합니다.",
                            "`+`, 공백, Unicode, 예약 문자에 대한 회귀 케이스를 유지합니다.",
                        ],
                    },
                ],
                exampleInput: "검색 값: \"email + alias\"\n목표: API query 파라미터로 전달",
                exampleOutput: "query value 만 인코딩\n서버에서 원문 문자열로 복원",
            },
            de: {
                title: "URL-Encoding erklärt: häufige Fehler und Lösungen",
                description: "Die meisten URL-Encoding-Probleme entstehen nicht durch fehlende Funktionen, sondern durch falsche Grenzen, doppelte Encodings und uneinheitliche Parserpfade.",
                sections: [
                    {
                        title: "Werte kodieren, nicht die ganze URL",
                        paragraphs: [
                            "Der klassische Fehler ist, eine komplette URL als String zu encodieren. Kodiert werden sollten nur dynamische Werte wie Query-Werte oder Path-Segmente.",
                            "Sobald diese Grenze falsch gezogen ist, tauchen subtile Probleme bei Redirects, APIs und Tracking-Links auf.",
                        ],
                    },
                    {
                        title: "Doppeltes Encoding und Parserabweichungen vermeiden",
                        bullets: [
                            "Klar festlegen, ob Client oder Server den letzten Encoding-Schritt ausführt.",
                            "Rohwerte unencoded speichern und erst an der Transportgrenze kodieren.",
                            "Regressionstests für `+`, Leerzeichen, Unicode und reservierte Zeichen pflegen.",
                        ],
                    },
                ],
                exampleInput: "Suchwert: \"email + alias\"\nZiel: als Query-Parameter an eine API senden",
                exampleOutput: "Nur den Query-Wert encodieren\nServer decodiert zurück zum Originalstring",
            },
            fr: {
                title: "Encodage d'URL expliqué : erreurs fréquentes et solutions",
                description: "Les bugs d'encodage d'URL viennent rarement d'un manque d'outil. Ils apparaissent surtout quand on encode au mauvais endroit ou plusieurs fois.",
                sections: [
                    {
                        title: "Encoder les valeurs, pas l'URL complète",
                        paragraphs: [
                            "L'erreur classique consiste à encoder toute l'URL d'un bloc. Il faut en réalité encoder seulement les éléments dynamiques comme les query values ou les segments de chemin.",
                            "Dès que cette frontière est mal posée, des bugs subtils apparaissent sur les redirects, les appels API et les liens de tracking.",
                        ],
                    },
                    {
                        title: "Éviter la double transformation et les écarts de parsing",
                        bullets: [
                            "Définir clairement si le client ou le serveur fait l'encodage final.",
                            "Stocker les valeurs sources non encodées et n'encoder qu'à la frontière de transport.",
                            "Maintenir des cas de régression pour `+`, espaces, Unicode et caractères réservés.",
                        ],
                    },
                ],
                exampleInput: "Valeur de recherche : \"email + alias\"\nObjectif : l'envoyer en paramètre de query API",
                exampleOutput: "Encodage uniquement de la query value\nle serveur retrouve ensuite la chaîne d'origine",
            },
        },
    },
}

export function getLocalizedArticle(slug: LocalizedArticleSlug, locale: NonEnglishLocale) {
    const definition = LOCALIZED_ARTICLES[slug]
    const copy = definition.locales[locale]

    return {
        ...definition,
        copy,
        clusterLabel: CLUSTER_LABELS[locale][definition.cluster],
        toolsTitle: TOOL_SECTION_TITLES[locale][definition.toolSectionKind],
        ui: ARTICLE_UI_COPY[locale],
    }
}

export function getLocalizedArticleTitle(slug: LocalizedArticleSlug, locale: NonEnglishLocale) {
    return LOCALIZED_ARTICLES[slug].locales[locale].title
}

export function getLocalizedArticleDescription(slug: LocalizedArticleSlug, locale: NonEnglishLocale) {
    return LOCALIZED_ARTICLES[slug].locales[locale].description
}
