import type { Locale } from "@/core/i18n/i18n"

export type GrowthPageKind = "comparison" | "alternative" | "how-to" | "fix"

export type GrowthPageSlug =
    | "compare/byteflow-vs-cyberchef"
    | "compare/byteflow-vs-jwt-io"
    | "compare/md5-vs-sha256"
    | "compare/json-formatter-vs-json-validator"
    | "compare/base64-encoding-vs-encryption"
    | "compare/har-sanitizer-vs-log-scrubber"
    | "compare/curl-to-code-vs-http-request-builder"
    | "compare/svg-optimizer-vs-svg-converter"
    | "alternatives/json-formatter-privacy-first"
    | "how-to/decode-jwt-locally"
    | "fix/base64-invalid-length"

export type GrowthIndexSlug = "compare" | "alternatives" | "how-to" | "fix"

export type GrowthSection = {
    heading: string
    body: string[]
    bullets?: string[]
}

export type GrowthStep = {
    name: string
    text: string
    toolKey?: string
}

export type GrowthComparisonRow = {
    factor: string
    byteflow: string
    other: string
    note: string
}

export type GrowthFaq = {
    question: string
    answer: string
}

export type GrowthPageCopy = {
    eyebrow: string
    title: string
    description: string
    intent: string
    summaryPoints: string[]
    trustCenterAngle: string
    sections: GrowthSection[]
    comparisonRows?: GrowthComparisonRow[]
    steps?: GrowthStep[]
    faq: GrowthFaq[]
}

export type GrowthPage = {
    slug: GrowthPageSlug
    kind: GrowthPageKind
    relatedToolKeys: string[]
    copy: Record<Locale, GrowthPageCopy>
}

export type GrowthIndex = {
    slug: GrowthIndexSlug
    kind: GrowthPageKind
    eyebrow: Record<Locale, string>
    title: Record<Locale, string>
    description: Record<Locale, string>
}

export type GrowthUiCopy = {
    keyTakeaways: string
    decisionFactors: string
    factor: string
    byteflow: string
    otherOption: string
    practicalNote: string
    steps: string
    toolsInWorkflow: string
    toolsInWorkflowDescription: string
    trustCheck: string
    faq: string
    toolCount: (count: number) => string
    trustBaselineTitle: string
    trustBaselineDescription: string
}

export const GROWTH_UI_COPY: Record<Locale, GrowthUiCopy> = {
    en: {
        keyTakeaways: "Key takeaways",
        decisionFactors: "Decision factors",
        factor: "Factor",
        byteflow: "Byteflow",
        otherOption: "Other option",
        practicalNote: "Practical note",
        steps: "Steps",
        toolsInWorkflow: "Tools in this workflow",
        toolsInWorkflowDescription: "Open the focused tools directly. These links use the same registry data as search and sitemap generation.",
        trustCheck: "Trust check",
        faq: "FAQ",
        toolCount: (count) => `${count} tools`,
        trustBaselineTitle: "Trust and privacy baseline",
        trustBaselineDescription: "These pages link to browser-local tools where possible and call out sensitive input boundaries before production data is used. The central policy and verification checklist live in the Trust Center.",
    },
    "zh-CN": {
        keyTakeaways: "关键结论",
        decisionFactors: "决策因素",
        factor: "因素",
        byteflow: "Byteflow",
        otherOption: "另一种选择",
        practicalNote: "实践说明",
        steps: "步骤",
        toolsInWorkflow: "此工作流中的工具",
        toolsInWorkflowDescription: "直接打开聚焦工具。这些链接使用与搜索和 sitemap 生成相同的 registry 数据。",
        trustCheck: "信任检查",
        faq: "常见问题",
        toolCount: (count) => `${count} 个工具`,
        trustBaselineTitle: "信任与隐私基线",
        trustBaselineDescription: "这些页面会尽量链接到浏览器本地工具，并在使用生产数据前说明敏感输入边界。集中策略和验证清单位于隐私与信任中心。",
    },
    "zh-TW": {
        keyTakeaways: "關鍵結論",
        decisionFactors: "決策因素",
        factor: "因素",
        byteflow: "Byteflow",
        otherOption: "另一種選擇",
        practicalNote: "實務說明",
        steps: "步驟",
        toolsInWorkflow: "此工作流中的工具",
        toolsInWorkflowDescription: "直接開啟聚焦工具。這些連結使用與搜尋和 sitemap 產生相同的 registry 資料。",
        trustCheck: "信任檢查",
        faq: "常見問題",
        toolCount: (count) => `${count} 個工具`,
        trustBaselineTitle: "信任與隱私基線",
        trustBaselineDescription: "這些頁面會盡量連到瀏覽器本地工具，並在使用正式資料前說明敏感輸入邊界。集中策略與驗證清單位於隱私與信任中心。",
    },
    ja: {
        keyTakeaways: "要点",
        decisionFactors: "判断材料",
        factor: "項目",
        byteflow: "Byteflow",
        otherOption: "もう一つの選択肢",
        practicalNote: "実務上の注意",
        steps: "手順",
        toolsInWorkflow: "このワークフローのツール",
        toolsInWorkflowDescription: "目的別のツールを直接開けます。これらのリンクは検索や sitemap 生成と同じ registry データを使います。",
        trustCheck: "信頼性チェック",
        faq: "よくある質問",
        toolCount: (count) => `${count} 個のツール`,
        trustBaselineTitle: "信頼とプライバシーの基準",
        trustBaselineDescription: "これらのページは可能な限りブラウザ内ツールへリンクし、本番データを扱う前に機密入力の境界を示します。中央の方針と確認手順はプライバシーと信頼センターにあります。",
    },
    ko: {
        keyTakeaways: "핵심 요약",
        decisionFactors: "결정 기준",
        factor: "항목",
        byteflow: "Byteflow",
        otherOption: "다른 선택지",
        practicalNote: "실무 메모",
        steps: "단계",
        toolsInWorkflow: "이 워크플로의 도구",
        toolsInWorkflowDescription: "목적별 도구를 바로 엽니다. 이 링크는 검색 및 sitemap 생성과 같은 registry 데이터를 사용합니다.",
        trustCheck: "신뢰 확인",
        faq: "자주 묻는 질문",
        toolCount: (count) => `도구 ${count}개`,
        trustBaselineTitle: "신뢰 및 개인정보 기준",
        trustBaselineDescription: "이 페이지들은 가능한 경우 브라우저 로컬 도구로 연결하며 운영 데이터를 사용하기 전에 민감한 입력 경계를 설명합니다. 중앙 정책과 검증 체크리스트는 개인정보 및 신뢰 센터에 있습니다.",
    },
    de: {
        keyTakeaways: "Wichtigste Punkte",
        decisionFactors: "Entscheidungskriterien",
        factor: "Kriterium",
        byteflow: "Byteflow",
        otherOption: "Andere Option",
        practicalNote: "Praktischer Hinweis",
        steps: "Schritte",
        toolsInWorkflow: "Tools in diesem Workflow",
        toolsInWorkflowDescription: "Öffne die passenden Tools direkt. Diese Links nutzen dieselben Registry-Daten wie Suche und Sitemap-Erzeugung.",
        trustCheck: "Vertrauensprüfung",
        faq: "FAQ",
        toolCount: (count) => `${count} Tools`,
        trustBaselineTitle: "Vertrauens- und Datenschutzbasis",
        trustBaselineDescription: "Diese Seiten verlinken nach Möglichkeit auf browserlokale Tools und benennen sensible Eingabegrenzen, bevor Produktionsdaten genutzt werden. Die zentrale Richtlinie und Prüfliste stehen im Datenschutz- und Vertrauenszentrum.",
    },
    fr: {
        keyTakeaways: "Points clés",
        decisionFactors: "Critères de décision",
        factor: "Critère",
        byteflow: "Byteflow",
        otherOption: "Autre option",
        practicalNote: "Note pratique",
        steps: "Étapes",
        toolsInWorkflow: "Outils dans ce workflow",
        toolsInWorkflowDescription: "Ouvrez directement les outils ciblés. Ces liens utilisent les mêmes données de registry que la recherche et la génération du sitemap.",
        trustCheck: "Contrôle de confiance",
        faq: "FAQ",
        toolCount: (count) => `${count} outils`,
        trustBaselineTitle: "Base de confiance et de confidentialité",
        trustBaselineDescription: "Ces pages renvoient si possible vers des outils locaux dans le navigateur et signalent les limites des entrées sensibles avant l'usage de données de production. La politique centrale et la liste de vérification sont dans le Centre de confiance.",
    },
}

export const GROWTH_INDEXES: GrowthIndex[] = [
    {
        slug: "compare",
        kind: "comparison",
        eyebrow: {
            en: "Comparisons",
            "zh-CN": "对比",
            "zh-TW": "比較",
            ja: "比較",
            ko: "비교",
            de: "Vergleiche",
            fr: "Comparatifs",
        },
        title: {
            en: "Developer tool comparisons",
            "zh-CN": "开发者工具对比",
            "zh-TW": "開發者工具比較",
            ja: "開発者ツール比較",
            ko: "개발자 도구 비교",
            de: "Vergleiche für Entwickler-Tools",
            fr: "Comparatifs d'outils développeur",
        },
        description: {
            en: "Fair, practical comparisons for local developer tools, token debugging, and data transformation workflows.",
            "zh-CN": "面向本地开发者工具、token 调试和数据转换流程的中性实用对比。",
            "zh-TW": "面向本地開發者工具、token 偵錯與資料轉換流程的中性實用比較。",
            ja: "ローカル開発者ツール、token 調査、データ変換ワークフローの実用的で公平な比較です。",
            ko: "로컬 개발자 도구, token 점검, 데이터 변환 워크플로를 위한 공정하고 실용적인 비교입니다.",
            de: "Faire und praktische Vergleiche für lokale Entwickler-Tools, Token-Debugging und Datentransformation.",
            fr: "Comparatifs équilibrés et pratiques pour les outils locaux, le débogage de tokens et les transformations de données.",
        },
    },
    {
        slug: "alternatives",
        kind: "alternative",
        eyebrow: {
            en: "Alternatives",
            "zh-CN": "替代方案",
            "zh-TW": "替代方案",
            ja: "代替案",
            ko: "대안",
            de: "Alternativen",
            fr: "Alternatives",
        },
        title: {
            en: "Privacy-first developer tool alternatives",
            "zh-CN": "隐私优先开发者工具替代方案",
            "zh-TW": "隱私優先開發者工具替代方案",
            ja: "プライバシー重視の開発者ツール代替案",
            ko: "개인정보 우선 개발자 도구 대안",
            de: "Datenschutzfreundliche Entwickler-Tool-Alternativen",
            fr: "Alternatives d'outils développeur respectueuses de la vie privée",
        },
        description: {
            en: "Browser-local alternatives for everyday developer tasks that may involve sensitive payloads.",
            "zh-CN": "适合日常开发任务的浏览器本地替代方案，可用于可能涉及敏感 payload 的场景。",
            "zh-TW": "適合日常開發任務的瀏覽器本地替代方案，可用於可能涉及敏感 payload 的情境。",
            ja: "機密性の高い payload を扱う可能性がある日常開発作業向けのブラウザ内代替案です。",
            ko: "민감한 payload가 포함될 수 있는 일상 개발 작업용 브라우저 로컬 대안입니다.",
            de: "Browserlokale Alternativen für alltägliche Entwickleraufgaben, die sensible Payloads enthalten können.",
            fr: "Alternatives locales dans le navigateur pour les tâches développeur qui peuvent contenir des payloads sensibles.",
        },
    },
    {
        slug: "how-to",
        kind: "how-to",
        eyebrow: {
            en: "How-to guides",
            "zh-CN": "操作指南",
            "zh-TW": "操作指南",
            ja: "手順ガイド",
            ko: "방법 가이드",
            de: "Anleitungen",
            fr: "Guides pratiques",
        },
        title: {
            en: "Local developer workflow guides",
            "zh-CN": "本地开发工作流指南",
            "zh-TW": "本地開發工作流指南",
            ja: "ローカル開発ワークフローガイド",
            ko: "로컬 개발 워크플로 가이드",
            de: "Lokale Entwickler-Workflow-Anleitungen",
            fr: "Guides de workflows développeur locaux",
        },
        description: {
            en: "Step-by-step workflows for inspecting tokens, payloads, and developer data without unnecessary upload steps.",
            "zh-CN": "用于检查 token、payload 和开发数据的逐步工作流，避免不必要的上传步骤。",
            "zh-TW": "用於檢查 token、payload 與開發資料的逐步工作流，避免不必要的上傳步驟。",
            ja: "不要なアップロードを避けながら token、payload、開発データを確認するための段階的なワークフローです。",
            ko: "불필요한 업로드 없이 token, payload, 개발 데이터를 점검하는 단계별 워크플로입니다.",
            de: "Schrittweise Workflows zum Prüfen von Tokens, Payloads und Entwicklerdaten ohne unnötige Uploads.",
            fr: "Workflows étape par étape pour inspecter tokens, payloads et données développeur sans upload inutile.",
        },
    },
    {
        slug: "fix",
        kind: "fix",
        eyebrow: {
            en: "Fix guides",
            "zh-CN": "修复指南",
            "zh-TW": "修復指南",
            ja: "修正ガイド",
            ko: "해결 가이드",
            de: "Fehlerbehebungen",
            fr: "Guides de correction",
        },
        title: {
            en: "Developer troubleshooting fixes",
            "zh-CN": "开发者排障修复指南",
            "zh-TW": "開發者排障修復指南",
            ja: "開発者向けトラブルシュート修正",
            ko: "개발자 문제 해결 가이드",
            de: "Fehlerbehebung für Entwickler",
            fr: "Corrections de diagnostic développeur",
        },
        description: {
            en: "Focused fixes for common parser, encoding, token, and data-format errors.",
            "zh-CN": "针对解析、编码、token 和数据格式常见错误的聚焦修复指南。",
            "zh-TW": "針對解析、編碼、token 與資料格式常見錯誤的聚焦修復指南。",
            ja: "パーサー、エンコード、token、データ形式のよくあるエラーに絞った修正手順です。",
            ko: "파서, 인코딩, token, 데이터 형식 오류를 위한 집중 해결 가이드입니다.",
            de: "Gezielte Korrekturen für typische Parser-, Encoding-, Token- und Datenformatfehler.",
            fr: "Corrections ciblées pour les erreurs courantes de parsing, d'encodage, de token et de format de données.",
        },
    },
]

export const GROWTH_PAGES: GrowthPage[] = [
    {
        slug: "compare/byteflow-vs-cyberchef",
        kind: "comparison",
        relatedToolKeys: ["json_formatter", "base64_encode_decode", "hash_generator", "url_encode_decode"],
        copy: {
            en: {
                eyebrow: "Comparison",
                title: "Byteflow vs CyberChef",
                description: "Compare Byteflow and CyberChef for local developer transformations, repeatable workflows, and privacy checks.",
                intent: "Use this page when you need to choose between a broad recipe workbench and focused browser-local developer tools.",
                summaryPoints: [
                    "Byteflow favors task-specific pages, localized metadata, and trust labels on each tool.",
                    "CyberChef is useful when a single chained recipe is the best mental model for the job.",
                    "For sensitive payloads, verify the runtime boundary in the browser Network panel before pasting production data.",
                ],
                trustCenterAngle: "Byteflow's Trust Center explains browser-local labels, external request labels, storage boundaries, and DevTools checks.",
                comparisonRows: [
                    {
                        factor: "Workflow shape",
                        byteflow: "Focused pages for common developer jobs such as JSON formatting, Base64 conversion, hashing, and URL encoding.",
                        other: "Recipe-style transformations that can be chained inside one workbench.",
                        note: "Choose the model that matches how your team documents repeatable work.",
                    },
                    {
                        factor: "Privacy signaling",
                        byteflow: "Tool pages surface local processing, sensitive input, offline capability, and external request labels from manifests.",
                        other: "Review the running app and deployment policy for the exact privacy boundary you need.",
                        note: "The safest check is to inspect Network activity with sample data.",
                    },
                    {
                        factor: "Discoverability",
                        byteflow: "Each workflow has a crawlable route, localized metadata, and related tool links.",
                        other: "A recipe workbench can be faster when users already know the operation sequence.",
                        note: "For team onboarding, deep links to one focused tool can reduce ambiguity.",
                    },
                ],
                sections: [
                    {
                        heading: "When Byteflow is the better fit",
                        body: [
                            "Pick Byteflow when the task is a common developer workflow and you want a clear page that a teammate can open, verify, and reuse.",
                        ],
                        bullets: [
                            "Format API JSON before a pull request.",
                            "Decode Base64 payloads from logs without storing the value.",
                            "Generate a checksum while keeping the file in the browser.",
                            "Document a repeatable workflow with stable tool URLs.",
                        ],
                    },
                    {
                        heading: "When a recipe workbench is the better fit",
                        body: [
                            "A recipe workbench can be the right choice when the important artifact is a chain of transformations, not a single tool page.",
                        ],
                    },
                ],
                faq: [
                    {
                        question: "Is this comparison saying one tool is universally better?",
                        answer: "No. It explains workflow tradeoffs. Byteflow is optimized for focused local developer tools; a recipe workbench can be better for long transformation chains.",
                    },
                    {
                        question: "How should I verify privacy before using sensitive data?",
                        answer: "Use sample input first, open DevTools Network, clear the log, run the tool, and confirm whether any request is made after your action.",
                    },
                ],
            },
            "zh-CN": {
                eyebrow: "对比",
                title: "Byteflow 与 CyberChef 对比",
                description: "从本地开发者转换、可重复工作流和隐私检查角度比较 Byteflow 与 CyberChef。",
                intent: "当你需要在通用 recipe 工作台和聚焦的浏览器本地开发者工具之间选择时，可使用本页。",
                summaryPoints: [
                    "Byteflow 更偏向任务专属页面、本地化 metadata，以及每个工具上的信任标签。",
                    "当单条链式 recipe 是最清晰的工作方式时，CyberChef 这类工作台很适合。",
                    "处理敏感 payload 前，请先在浏览器 Network 面板验证运行边界。",
                ],
                trustCenterAngle: "Byteflow 的隐私与信任中心解释浏览器本地标签、外部请求标签、存储边界和 DevTools 检查方法。",
                comparisonRows: [
                    {
                        factor: "工作流形态",
                        byteflow: "面向 JSON 格式化、Base64 转换、hash 和 URL 编码等常见开发任务的聚焦页面。",
                        other: "可以在一个工作台内串联多步操作的 recipe 式转换。",
                        note: "选择与你团队记录可重复工作方式匹配的模型。",
                    },
                    {
                        factor: "隐私信号",
                        byteflow: "工具页从 manifest 展示本地处理、敏感输入、离线能力和外部请求标签。",
                        other: "需要根据正在运行的应用和部署策略确认具体隐私边界。",
                        note: "最稳妥的检查方式是用样例数据观察 Network 活动。",
                    },
                    {
                        factor: "可发现性",
                        byteflow: "每个工作流都有可抓取路由、本地化 metadata 和相关工具链接。",
                        other: "当用户已经熟悉操作顺序时，recipe 工作台可能更快。",
                        note: "团队入门时，指向单个聚焦工具的深链接能减少歧义。",
                    },
                ],
                sections: [
                    {
                        heading: "什么时候 Byteflow 更合适",
                        body: [
                            "当任务是常见开发工作流，并且你希望队友能打开、验证并复用一个清晰页面时，选择 Byteflow 更合适。",
                        ],
                        bullets: [
                            "在 pull request 前格式化 API JSON。",
                            "从日志中解码 Base64 payload，同时不保存该值。",
                            "在文件保留于浏览器内的情况下生成 checksum。",
                            "用稳定工具 URL 记录可重复工作流。",
                        ],
                    },
                    {
                        heading: "什么时候 recipe 工作台更合适",
                        body: [
                            "如果关键产物是一串转换步骤，而不是单个工具页面，那么 recipe 工作台可能是更合适的选择。",
                        ],
                    },
                ],
                faq: [
                    {
                        question: "这个对比是在说某个工具永远更好吗？",
                        answer: "不是。本页说明工作流取舍。Byteflow 面向聚焦的本地开发者工具；长转换链可能更适合 recipe 工作台。",
                    },
                    {
                        question: "使用敏感数据前如何验证隐私边界？",
                        answer: "先使用样例输入，打开 DevTools Network，清空记录，运行工具，并确认操作后是否出现请求。",
                    },
                ],
            },
            "zh-TW": {
                eyebrow: "比較",
                title: "Byteflow 與 CyberChef 比較",
                description: "從本地開發者轉換、可重複工作流與隱私檢查角度比較 Byteflow 與 CyberChef。",
                intent: "當你需要在通用 recipe 工作台與聚焦的瀏覽器本地開發者工具之間選擇時，可使用本頁。",
                summaryPoints: [
                    "Byteflow 更偏向任務專屬頁面、本地化 metadata，以及每個工具上的信任標籤。",
                    "當單條鏈式 recipe 是最清楚的工作方式時，CyberChef 這類工作台很適合。",
                    "處理敏感 payload 前，請先在瀏覽器 Network 面板驗證執行邊界。",
                ],
                trustCenterAngle: "Byteflow 的隱私與信任中心說明瀏覽器本地標籤、外部請求標籤、儲存邊界與 DevTools 檢查方法。",
                comparisonRows: [
                    {
                        factor: "工作流形態",
                        byteflow: "面向 JSON 格式化、Base64 轉換、hash 與 URL 編碼等常見開發任務的聚焦頁面。",
                        other: "可以在一個工作台內串接多步操作的 recipe 式轉換。",
                        note: "選擇與團隊記錄可重複工作方式相符的模型。",
                    },
                    {
                        factor: "隱私信號",
                        byteflow: "工具頁從 manifest 顯示本地處理、敏感輸入、離線能力與外部請求標籤。",
                        other: "需要依據正在執行的應用與部署策略確認具體隱私邊界。",
                        note: "最穩妥的檢查方式是用範例資料觀察 Network 活動。",
                    },
                    {
                        factor: "可發現性",
                        byteflow: "每個工作流都有可抓取路由、本地化 metadata 與相關工具連結。",
                        other: "當使用者已熟悉操作順序時，recipe 工作台可能更快。",
                        note: "團隊導入時，指向單一聚焦工具的深層連結能減少歧義。",
                    },
                ],
                sections: [
                    {
                        heading: "什麼時候 Byteflow 更合適",
                        body: [
                            "當任務是常見開發工作流，且你希望隊友能開啟、驗證並重複使用一個清楚頁面時，Byteflow 更合適。",
                        ],
                        bullets: [
                            "在 pull request 前格式化 API JSON。",
                            "從日誌中解碼 Base64 payload，同時不儲存該值。",
                            "在檔案保留於瀏覽器內的情況下產生 checksum。",
                            "用穩定工具 URL 記錄可重複工作流。",
                        ],
                    },
                    {
                        heading: "什麼時候 recipe 工作台更合適",
                        body: [
                            "如果關鍵產物是一串轉換步驟，而不是單一工具頁面，那麼 recipe 工作台可能是更合適的選擇。",
                        ],
                    },
                ],
                faq: [
                    {
                        question: "這個比較是在說某個工具永遠更好嗎？",
                        answer: "不是。本頁說明工作流取捨。Byteflow 面向聚焦的本地開發者工具；長轉換鏈可能更適合 recipe 工作台。",
                    },
                    {
                        question: "使用敏感資料前如何驗證隱私邊界？",
                        answer: "先使用範例輸入，開啟 DevTools Network，清空紀錄，執行工具，並確認操作後是否出現請求。",
                    },
                ],
            },
            ja: {
                eyebrow: "比較",
                title: "Byteflow と CyberChef の比較",
                description: "ローカルな開発者向け変換、再利用できるワークフロー、プライバシー確認の観点で Byteflow と CyberChef を比較します。",
                intent: "汎用的な recipe ワークベンチと、目的別のブラウザ内開発者ツールのどちらを使うか決めるときに参照してください。",
                summaryPoints: [
                    "Byteflow はタスク別ページ、ローカライズされた metadata、各ツールの信頼ラベルを重視します。",
                    "単一の chained recipe が最も分かりやすい場合は、CyberChef のようなワークベンチが有効です。",
                    "機密 payload を貼り付ける前に、ブラウザの Network パネルで実行境界を確認してください。",
                ],
                trustCenterAngle: "Byteflow のプライバシーと信頼センターでは、ブラウザ内ラベル、外部リクエストラベル、保存境界、DevTools での確認方法を説明しています。",
                comparisonRows: [
                    {
                        factor: "ワークフロー形態",
                        byteflow: "JSON 整形、Base64 変換、hash、URL エンコードなど、よくある開発作業向けの個別ページ。",
                        other: "一つのワークベンチ内で複数の変換を連結する recipe 型の作業。",
                        note: "チームが再利用手順をどう記録するかに合うモデルを選びます。",
                    },
                    {
                        factor: "プライバシー表示",
                        byteflow: "ツールページは manifest からローカル処理、機密入力、オフライン対応、外部リクエストを表示します。",
                        other: "必要な境界は、実行中のアプリとデプロイ方針で確認します。",
                        note: "最も安全なのは、サンプルデータで Network 活動を確認することです。",
                    },
                    {
                        factor: "見つけやすさ",
                        byteflow: "各ワークフローにはクロール可能なルート、ローカライズされた metadata、関連ツールリンクがあります。",
                        other: "操作順が既に分かっている場合、recipe ワークベンチの方が速いことがあります。",
                        note: "チーム導入では、特定ツールへの深いリンクが曖昧さを減らします。",
                    },
                ],
                sections: [
                    {
                        heading: "Byteflow が合う場面",
                        body: [
                            "作業が一般的な開発ワークフローで、同僚が開いて確認し再利用できる明確なページが必要な場合は Byteflow が向いています。",
                        ],
                        bullets: [
                            "pull request 前に API JSON を整形する。",
                            "ログ内の Base64 payload を保存せずにデコードする。",
                            "ファイルをブラウザ内に置いたまま checksum を生成する。",
                            "安定したツール URL で再利用手順を記録する。",
                        ],
                    },
                    {
                        heading: "recipe ワークベンチが合う場面",
                        body: [
                            "重要な成果物が単一ツールページではなく変換ステップの連鎖である場合、recipe ワークベンチが適しています。",
                        ],
                    },
                ],
                faq: [
                    {
                        question: "この比較はどちらかが常に優れていると言っていますか？",
                        answer: "いいえ。ワークフロー上の違いを説明しています。Byteflow は目的別のローカル開発者ツール向けで、長い変換チェーンには recipe ワークベンチが合う場合があります。",
                    },
                    {
                        question: "機密データを使う前に何を確認すべきですか？",
                        answer: "まずサンプル入力を使い、DevTools Network を開いてログを消去し、ツール実行後にリクエストが出るか確認します。",
                    },
                ],
            },
            ko: {
                eyebrow: "비교",
                title: "Byteflow와 CyberChef 비교",
                description: "로컬 개발자 변환, 반복 가능한 워크플로, 개인정보 확인 관점에서 Byteflow와 CyberChef를 비교합니다.",
                intent: "범용 recipe 워크벤치와 목적별 브라우저 로컬 개발자 도구 중 무엇을 선택할지 판단할 때 사용합니다.",
                summaryPoints: [
                    "Byteflow는 작업별 페이지, 지역화된 metadata, 각 도구의 신뢰 라벨을 중시합니다.",
                    "하나의 chained recipe가 가장 명확한 작업 모델이라면 CyberChef 같은 워크벤치가 적합합니다.",
                    "민감한 payload를 붙여넣기 전에 브라우저 Network 패널에서 실행 경계를 확인하세요.",
                ],
                trustCenterAngle: "Byteflow의 개인정보 및 신뢰 센터는 브라우저 로컬 라벨, 외부 요청 라벨, 저장 경계, DevTools 확인 방법을 설명합니다.",
                comparisonRows: [
                    {
                        factor: "워크플로 형태",
                        byteflow: "JSON 정리, Base64 변환, hash, URL 인코딩 같은 흔한 개발 작업을 위한 집중 페이지.",
                        other: "하나의 워크벤치에서 여러 변환을 연결하는 recipe 방식.",
                        note: "팀이 반복 작업을 문서화하는 방식에 맞는 모델을 선택하세요.",
                    },
                    {
                        factor: "개인정보 표시",
                        byteflow: "도구 페이지가 manifest를 기반으로 로컬 처리, 민감 입력, 오프라인 가능 여부, 외부 요청 라벨을 표시합니다.",
                        other: "정확한 개인정보 경계는 실행 중인 앱과 배포 정책에서 확인해야 합니다.",
                        note: "가장 안전한 확인은 샘플 데이터로 Network 활동을 살펴보는 것입니다.",
                    },
                    {
                        factor: "탐색성",
                        byteflow: "각 워크플로에는 크롤링 가능한 경로, 지역화된 metadata, 관련 도구 링크가 있습니다.",
                        other: "사용자가 이미 작업 순서를 알고 있다면 recipe 워크벤치가 더 빠를 수 있습니다.",
                        note: "팀 온보딩에서는 특정 도구로 가는 딥링크가 혼동을 줄입니다.",
                    },
                ],
                sections: [
                    {
                        heading: "Byteflow가 더 맞는 경우",
                        body: [
                            "작업이 흔한 개발 워크플로이고 동료가 열어 확인하고 재사용할 수 있는 명확한 페이지가 필요하면 Byteflow가 적합합니다.",
                        ],
                        bullets: [
                            "pull request 전에 API JSON을 정리합니다.",
                            "로그의 Base64 payload를 저장하지 않고 디코딩합니다.",
                            "파일을 브라우저 안에 둔 채 checksum을 생성합니다.",
                            "안정적인 도구 URL로 반복 가능한 워크플로를 문서화합니다.",
                        ],
                    },
                    {
                        heading: "recipe 워크벤치가 더 맞는 경우",
                        body: [
                            "중요한 산출물이 단일 도구 페이지가 아니라 변환 단계의 체인이라면 recipe 워크벤치가 더 적합할 수 있습니다.",
                        ],
                    },
                ],
                faq: [
                    {
                        question: "이 비교는 한 도구가 항상 더 좋다는 뜻인가요?",
                        answer: "아닙니다. 워크플로의 차이를 설명합니다. Byteflow는 목적별 로컬 개발자 도구에 최적화되어 있고, 긴 변환 체인은 recipe 워크벤치가 더 나을 수 있습니다.",
                    },
                    {
                        question: "민감한 데이터를 쓰기 전에 어떻게 확인해야 하나요?",
                        answer: "먼저 샘플 입력을 사용하고 DevTools Network를 연 뒤 로그를 비우고 도구 실행 후 요청이 발생하는지 확인하세요.",
                    },
                ],
            },
            de: {
                eyebrow: "Vergleich",
                title: "Byteflow und CyberChef im Vergleich",
                description: "Vergleiche Byteflow und CyberChef für lokale Entwickler-Transformationen, wiederholbare Workflows und Datenschutzprüfungen.",
                intent: "Nutze diese Seite, wenn du zwischen einer breiten Recipe-Workbench und fokussierten browserlokalen Entwickler-Tools entscheiden musst.",
                summaryPoints: [
                    "Byteflow setzt auf aufgabenspezifische Seiten, lokalisierte Metadata und Vertrauenslabels pro Tool.",
                    "Eine Workbench wie CyberChef ist sinnvoll, wenn eine einzelne verkettete Recipe das beste Arbeitsmodell ist.",
                    "Prüfe bei sensiblen Payloads vor dem Einfügen die Laufzeitgrenze im Network-Panel des Browsers.",
                ],
                trustCenterAngle: "Das Datenschutz- und Vertrauenszentrum von Byteflow erklärt browserlokale Labels, externe Anfragen, Speichergrenzen und DevTools-Prüfungen.",
                comparisonRows: [
                    {
                        factor: "Workflow-Form",
                        byteflow: "Fokussierte Seiten für typische Entwickleraufgaben wie JSON-Formatierung, Base64-Konvertierung, Hashing und URL-Encoding.",
                        other: "Recipe-artige Transformationen, die in einer Workbench verkettet werden können.",
                        note: "Wähle das Modell, das zur Dokumentation wiederholbarer Arbeit im Team passt.",
                    },
                    {
                        factor: "Datenschutzsignale",
                        byteflow: "Toolseiten zeigen lokale Verarbeitung, sensible Eingaben, Offline-Fähigkeit und externe Anfragen aus Manifesten.",
                        other: "Prüfe laufende App und Deployment-Richtlinie für die genaue Datenschutzgrenze.",
                        note: "Am sichersten ist die Prüfung der Network-Aktivität mit Beispieldaten.",
                    },
                    {
                        factor: "Auffindbarkeit",
                        byteflow: "Jeder Workflow hat eine crawlbare Route, lokalisierte Metadata und verwandte Tool-Links.",
                        other: "Eine Recipe-Workbench kann schneller sein, wenn die Reihenfolge der Operationen bereits bekannt ist.",
                        note: "Für Team-Onboarding verringern Deeplinks zu einem fokussierten Tool die Mehrdeutigkeit.",
                    },
                ],
                sections: [
                    {
                        heading: "Wann Byteflow besser passt",
                        body: [
                            "Byteflow passt, wenn die Aufgabe ein häufiger Entwickler-Workflow ist und du eine klare Seite brauchst, die Teammitglieder öffnen, prüfen und wiederverwenden können.",
                        ],
                        bullets: [
                            "API-JSON vor einem Pull Request formatieren.",
                            "Base64-Payloads aus Logs decodieren, ohne den Wert zu speichern.",
                            "Eine Checksum erzeugen, während die Datei im Browser bleibt.",
                            "Einen wiederholbaren Workflow mit stabilen Tool-URLs dokumentieren.",
                        ],
                    },
                    {
                        heading: "Wann eine Recipe-Workbench besser passt",
                        body: [
                            "Eine Recipe-Workbench kann richtig sein, wenn das wichtige Artefakt eine Kette von Transformationen und nicht eine einzelne Toolseite ist.",
                        ],
                    },
                ],
                faq: [
                    {
                        question: "Sagt dieser Vergleich, dass ein Tool immer besser ist?",
                        answer: "Nein. Er erklärt Workflow-Abwägungen. Byteflow ist für fokussierte lokale Entwickler-Tools optimiert; lange Transformationsketten können besser zu einer Recipe-Workbench passen.",
                    },
                    {
                        question: "Wie prüfe ich Datenschutz vor sensiblen Daten?",
                        answer: "Nutze zuerst Beispieleingaben, öffne DevTools Network, lösche das Log, führe das Tool aus und prüfe, ob nach deiner Aktion Anfragen entstehen.",
                    },
                ],
            },
            fr: {
                eyebrow: "Comparatif",
                title: "Comparatif Byteflow et CyberChef",
                description: "Comparez Byteflow et CyberChef pour les transformations locales, les workflows répétables et les contrôles de confidentialité.",
                intent: "Utilisez cette page pour choisir entre une workbench de recipes générale et des outils développeur ciblés qui s'exécutent dans le navigateur.",
                summaryPoints: [
                    "Byteflow privilégie des pages par tâche, des metadata localisées et des labels de confiance par outil.",
                    "Une workbench comme CyberChef est utile lorsqu'une recipe chaînée est le modèle de travail le plus clair.",
                    "Pour les payloads sensibles, vérifiez la limite d'exécution dans le panneau Network du navigateur avant de coller des données de production.",
                ],
                trustCenterAngle: "Le Centre de confiance de Byteflow explique les labels locaux, les requêtes externes, les limites de stockage et les contrôles DevTools.",
                comparisonRows: [
                    {
                        factor: "Forme du workflow",
                        byteflow: "Pages ciblées pour les tâches courantes comme formater JSON, convertir Base64, générer un hash et encoder une URL.",
                        other: "Transformations de type recipe qui peuvent être chaînées dans une seule workbench.",
                        note: "Choisissez le modèle qui correspond à la manière dont votre équipe documente le travail répétable.",
                    },
                    {
                        factor: "Signaux de confidentialité",
                        byteflow: "Les pages d'outil affichent traitement local, entrée sensible, capacité hors ligne et requêtes externes depuis les manifests.",
                        other: "Vérifiez l'application en cours d'exécution et la politique de déploiement pour connaître la limite exacte.",
                        note: "Le contrôle le plus sûr consiste à observer l'activité Network avec des données d'exemple.",
                    },
                    {
                        factor: "Découvrabilité",
                        byteflow: "Chaque workflow dispose d'une route indexable, de metadata localisées et de liens vers des outils liés.",
                        other: "Une workbench de recipes peut être plus rapide si l'utilisateur connaît déjà l'ordre des opérations.",
                        note: "Pour l'onboarding, un lien profond vers un outil ciblé réduit l'ambiguïté.",
                    },
                ],
                sections: [
                    {
                        heading: "Quand Byteflow convient mieux",
                        body: [
                            "Byteflow convient quand la tâche est un workflow développeur courant et qu'une page claire doit pouvoir être ouverte, vérifiée et réutilisée par l'équipe.",
                        ],
                        bullets: [
                            "Formater du JSON d'API avant une pull request.",
                            "Décoder des payloads Base64 depuis des logs sans conserver la valeur.",
                            "Générer une checksum en gardant le fichier dans le navigateur.",
                            "Documenter un workflow répétable avec des URL d'outils stables.",
                        ],
                    },
                    {
                        heading: "Quand une workbench de recipes convient mieux",
                        body: [
                            "Une workbench de recipes peut convenir lorsque l'artefact important est une chaîne de transformations plutôt qu'une seule page d'outil.",
                        ],
                    },
                ],
                faq: [
                    {
                        question: "Ce comparatif dit-il qu'un outil est toujours meilleur ?",
                        answer: "Non. Il explique des compromis de workflow. Byteflow vise les outils développeur locaux et ciblés ; une longue chaîne de transformations peut mieux convenir à une workbench de recipes.",
                    },
                    {
                        question: "Comment vérifier la confidentialité avant d'utiliser des données sensibles ?",
                        answer: "Utilisez d'abord un exemple, ouvrez DevTools Network, videz le journal, exécutez l'outil et vérifiez si une requête apparaît après votre action.",
                    },
                ],
            },
        },
    },
    {
        slug: "compare/byteflow-vs-jwt-io",
        kind: "comparison",
        relatedToolKeys: ["jwt_decoder", "jwt_workbench", "jwt_verifier", "base64_encode_decode"],
        copy: {
            en: jwtPageCopy("Comparison", "Byteflow vs jwt.io"),
            "zh-CN": jwtPageCopyZhCN(),
            "zh-TW": jwtPageCopyZhTW(),
            ja: jwtPageCopyJa(),
            ko: jwtPageCopyKo(),
            de: jwtPageCopyDe(),
            fr: jwtPageCopyFr(),
        },
    },
    {
        slug: "alternatives/json-formatter-privacy-first",
        kind: "alternative",
        relatedToolKeys: ["json_formatter", "json_diff_viewer", "json_to_typescript", "jsonpath_playground"],
        copy: {
            en: jsonAlternativeCopyEn(),
            "zh-CN": jsonAlternativeCopyZhCN(),
            "zh-TW": jsonAlternativeCopyZhTW(),
            ja: jsonAlternativeCopyJa(),
            ko: jsonAlternativeCopyKo(),
            de: jsonAlternativeCopyDe(),
            fr: jsonAlternativeCopyFr(),
        },
    },
    {
        slug: "compare/md5-vs-sha256",
        kind: "comparison",
        relatedToolKeys: ["hash_generator", "md5_generator", "base64_encode_decode", "jwt_decoder"],
        copy: {
            en: hashComparisonCopyEn(),
            "zh-CN": hashComparisonCopyZhCN(),
            "zh-TW": hashComparisonCopyZhTW(),
            ja: hashComparisonCopyJa(),
            ko: hashComparisonCopyKo(),
            de: hashComparisonCopyDe(),
            fr: hashComparisonCopyFr(),
        },
    },
    {
        slug: "compare/json-formatter-vs-json-validator",
        kind: "comparison",
        relatedToolKeys: ["json_formatter", "json_schema_workbench", "json_diff_viewer", "json_to_typescript"],
        copy: comparisonPageCopy({
            eyebrow: "Data format comparison",
            title: "JSON Formatter vs JSON Validator",
            description: "Decide when to format JSON for readability and when to validate JSON against syntax, schema, or contract expectations.",
            intent: "Use this comparison when a payload looks messy, fails an API contract, or needs to move from quick inspection into repeatable review.",
            summaryPoints: [
                "Formatting improves readability and stable diffs, but it does not prove the payload matches an API contract.",
                "Validation should run when syntax, required fields, enum values, or schema compatibility are part of the decision.",
                "A practical review often formats first, validates second, then diffs or generates types for the final contract check.",
            ],
            trustCenterAngle: "JSON payloads can include internal IDs, customer fields, or secrets. Use redacted samples and verify that local tools do not store payloads.",
            comparisonRows: [
                { factor: "Primary job", byteflow: "JSON Formatter normalizes whitespace and structure so reviewers can inspect nested fields quickly.", other: "JSON validation confirms syntax or schema rules before a payload is accepted by another system.", note: "Use both when readability and correctness both matter." },
                { factor: "Failure signal", byteflow: "Formatter errors usually point to broken syntax such as trailing commas, unmatched braces, or invalid strings.", other: "Validator errors can point to missing fields, wrong types, enum mismatches, or contract drift.", note: "A formatted payload can still be semantically wrong." },
                { factor: "Next step", byteflow: "After formatting, use JSON Diff Viewer or JSON to TypeScript when the review moves into contract changes.", other: "After validation, update the schema, fixture, or producer behavior that caused the mismatch.", note: "Keep examples small and redacted before sharing." },
            ],
            sections: [
                { heading: "Use a formatter for human review", body: ["Choose formatting when the payload is valid enough to parse but too dense to inspect in logs, test fixtures, or pull request comments."], bullets: ["Pretty-print a minified API response.", "Normalize indentation before a diff.", "Sort through nested arrays while removing secrets."] },
                { heading: "Use validation for contract confidence", body: ["Choose validation when a consumer needs guarantees about shape, required fields, and allowed values. Schema validation answers a different question than whitespace cleanup."] },
            ],
            faq: [
                { question: "Can formatted JSON still be invalid for my API?", answer: "Yes. Formatting only proves the text can be parsed as JSON. It does not check schema rules, required fields, or domain constraints." },
                { question: "What is the safest review order?", answer: "Format a redacted sample, validate against the expected schema, then use a diff or generated type to document the final shape." },
            ],
        }),
    },
    {
        slug: "compare/base64-encoding-vs-encryption",
        kind: "comparison",
        relatedToolKeys: ["base64_encode_decode", "hash_generator", "jwt_decoder", "url_encode_decode"],
        copy: comparisonPageCopy({
            eyebrow: "Encoding comparison",
            title: "Base64 Encoding vs Encryption",
            description: "Understand why Base64 changes representation but does not protect data, and when encryption or hashing is the correct next step.",
            intent: "Use this comparison when a token, log value, or file fragment looks encoded and someone may mistake that encoding for secrecy.",
            summaryPoints: [
                "Base64 is reversible encoding for moving bytes through text channels; it is not encryption.",
                "Encryption requires keys and a threat model, while hashing creates one-way digests for comparison or integrity checks.",
                "Encoded secrets are still secrets, so local inspection should avoid storage, logs, analytics, and shared screenshots.",
            ],
            trustCenterAngle: "Base64 strings often contain JWTs, binary fragments, credentials, or logs. Treat decoded output as sensitive until proven otherwise.",
            comparisonRows: [
                { factor: "Goal", byteflow: "Base64 Encode/Decode converts bytes to text and back for transport, debugging, and payload inspection.", other: "Encryption protects confidentiality with keys and a defined decrypt path.", note: "If anyone can decode it without a key, it is not encrypted." },
                { factor: "Security meaning", byteflow: "Base64 has no secrecy guarantee and should not be used to hide API keys, passwords, or private records.", other: "Encryption strength depends on algorithm, key management, nonce handling, and implementation details.", note: "Do not call Base64 obfuscation a security control." },
                { factor: "Related tools", byteflow: "Use hashing for stable digests and JWT tools for token inspection when the Base64 value is part of a token.", other: "Use a vetted encryption library or platform service for real confidentiality requirements.", note: "This site does not turn encoded secrets into safe public data." },
            ],
            sections: [
                { heading: "When Base64 is the right tool", body: ["Use Base64 when a system needs binary data represented as ASCII text, such as data URLs, basic payload transport, or manual inspection of encoded fields."] },
                { heading: "When encryption is required", body: ["Use encryption when unauthorized readers must not learn the original content. That requires key handling and implementation decisions outside a simple encoder."] },
            ],
            faq: [
                { question: "Is a Base64 API key safe to share?", answer: "No. Anyone can decode it. Treat the original and encoded forms as the same sensitivity." },
                { question: "Should I hash or encrypt instead?", answer: "Hash when you need comparison or integrity without recovery. Encrypt when someone must decrypt later and confidentiality matters." },
            ],
        }),
    },
    {
        slug: "compare/har-sanitizer-vs-log-scrubber",
        kind: "comparison",
        relatedToolKeys: ["har_viewer_sanitizer", "log_scrubber", "local_log_parser", "text_diff_checker"],
        copy: comparisonPageCopy({
            eyebrow: "Redaction comparison",
            title: "HAR Sanitizer vs Log Scrubber",
            description: "Choose the right redaction workflow for browser network captures, application logs, headers, cookies, and incident snippets.",
            intent: "Use this comparison before sharing evidence in an issue, ticket, vendor portal, or chat thread.",
            summaryPoints: [
                "HAR files need structured redaction for headers, cookies, request bodies, response bodies, timings, and URLs.",
                "Log scrubbing works best for plain text traces, stack snippets, environment fragments, and mixed application output.",
                "Both workflows need a final human review because incident data can contain domain-specific identifiers.",
            ],
            trustCenterAngle: "HAR files and logs commonly contain credentials, cookies, account IDs, full URLs, and private request or response bodies. Keep sanitization local and review before export.",
            comparisonRows: [
                { factor: "Input shape", byteflow: "HAR Sanitizer parses browser capture structure and redacts sensitive network fields defensively.", other: "Log Scrubber scans text for common secrets, PII patterns, tokens, and identifiers.", note: "Use the parser that understands your evidence format." },
                { factor: "Redaction scope", byteflow: "HAR workflows can target headers, cookies, query strings, request bodies, and response bodies.", other: "Log workflows can target bearer tokens, keys, emails, IPs, paths, and repeated secret-like strings.", note: "Structured captures and free text fail in different ways." },
                { factor: "Review step", byteflow: "Export only after comparing sanitized output and confirming that URLs and bodies are safe to share.", other: "Diff scrubbed logs against the original so expected context remains while secrets are removed.", note: "Automated redaction is a first pass, not a legal or security approval." },
            ],
            sections: [
                { heading: "Use HAR Sanitizer for browser evidence", body: ["Choose the HAR workflow when the source is a browser export or network troubleshooting capture with request and response metadata."] },
                { heading: "Use Log Scrubber for text evidence", body: ["Choose the log workflow when the source is application output, shell logs, stack traces, CI logs, or pasted incident notes."] },
            ],
            faq: [
                { question: "Can I sanitize a HAR file with a plain text scrubber?", answer: "You can catch some patterns, but a HAR-aware sanitizer is safer because it understands headers, cookies, URLs, and body fields." },
                { question: "Is sanitized output automatically safe to post publicly?", answer: "No. Review the result, check domain-specific identifiers, and share the smallest useful excerpt." },
            ],
        }),
    },
    {
        slug: "compare/curl-to-code-vs-http-request-builder",
        kind: "comparison",
        relatedToolKeys: ["curl_to_code", "http_request_builder", "header_diff", "url_parser"],
        copy: comparisonPageCopy({
            eyebrow: "HTTP workflow comparison",
            title: "cURL to Code vs HTTP Request Builder",
            description: "Decide whether to convert an existing cURL command into client code or build a clean HTTP request example from fields.",
            intent: "Use this comparison when documenting an API call, translating a terminal repro, or preparing a shareable request snippet without sending it.",
            summaryPoints: [
                "cURL to Code is best when a working terminal command already exists and needs translation.",
                "HTTP Request Builder is best when you are assembling method, URL, headers, body, and generated code from scratch.",
                "Both tools should avoid sending the request; they generate code and examples locally for review.",
            ],
            trustCenterAngle: "HTTP examples often include bearer tokens, cookies, private URLs, and request bodies. Redact credentials before sharing generated snippets.",
            comparisonRows: [
                { factor: "Starting point", byteflow: "cURL to Code starts from an existing cURL command copied from docs, logs, or a repro.", other: "HTTP Request Builder starts from structured fields and generates request code without executing it.", note: "Choose based on what artifact you already have." },
                { factor: "Risk to remove", byteflow: "Converted cURL may carry Authorization headers, cookies, or production URLs from the original command.", other: "Manually built requests can omit secrets and use placeholder headers from the beginning.", note: "Redaction should happen before the snippet leaves your browser." },
                { factor: "Best output", byteflow: "Use conversion to create fetch, Python, or Node examples that match a terminal repro.", other: "Use request building to document a clean, educational API example for teammates.", note: "Neither flow should proxy user secrets through byteflow.tools." },
            ],
            sections: [
                { heading: "Use cURL conversion for repros", body: ["When an issue starts with a terminal command that already reproduces behavior, conversion preserves the request shape and reduces manual transcription mistakes."] },
                { heading: "Use request building for clean docs", body: ["When you are writing examples for docs or onboarding, structured fields make it easier to keep placeholders, comments, and redacted headers intentional."] },
            ],
            faq: [
                { question: "Do these tools send HTTP requests?", answer: "No. They generate request code and examples locally. Use DevTools Network to confirm no tool-processing request is made while generating snippets." },
                { question: "Which one should I use for API documentation?", answer: "Use HTTP Request Builder when creating a clean example from scratch; use cURL to Code when translating a verified command." },
            ],
        }),
    },
    {
        slug: "compare/svg-optimizer-vs-svg-converter",
        kind: "comparison",
        relatedToolKeys: ["svg_optimizer", "svg_to_png_converter", "svg_stroke_to_fill_converter", "image_resizer"],
        copy: comparisonPageCopy({
            eyebrow: "SVG workflow comparison",
            title: "SVG Optimizer vs SVG Converter",
            description: "Choose between optimizing an SVG source file and converting SVG artwork into PNG or other delivery-friendly outputs.",
            intent: "Use this comparison when preparing icons, diagrams, social images, or design assets for production delivery.",
            summaryPoints: [
                "SVG optimization keeps the asset as SVG while removing metadata, comments, unsafe active content, and redundant markup.",
                "SVG conversion creates raster or transformed outputs when a target channel cannot safely or consistently render SVG.",
                "Security review matters for both workflows because SVG can contain active content, external references, and hidden metadata.",
            ],
            trustCenterAngle: "Treat uploaded SVGs as untrusted input. Sanitization and conversion should happen locally and should not preserve hidden metadata by default.",
            comparisonRows: [
                { factor: "Output format", byteflow: "SVG Optimizer returns a smaller sanitized SVG for web delivery and source control.", other: "SVG conversion creates PNG or transformed vector output for platforms that need a different format.", note: "Keep SVG when scalability and CSS styling matter." },
                { factor: "Security boundary", byteflow: "Optimization should remove scripts, event handlers, external references, and editor metadata.", other: "Conversion can neutralize some SVG risks by rasterizing, but source review is still important.", note: "Do not assume every SVG from a third party is safe." },
                { factor: "Quality tradeoff", byteflow: "Optimized SVG remains sharp at any size and can be inspected as text.", other: "Raster conversion fixes dimensions and may be easier for emails, social previews, or legacy tools.", note: "Pick the format your target renderer supports reliably." },
            ],
            sections: [
                { heading: "Use optimization for web SVG delivery", body: ["Choose optimization when the final asset should remain scalable, text-readable, cacheable, and easy to review in version control."] },
                { heading: "Use conversion for fixed targets", body: ["Choose conversion when the destination requires PNG, has inconsistent SVG support, or needs a fixed-size preview image."] },
            ],
            faq: [
                { question: "Does optimizing SVG change the visual result?", answer: "It should preserve the intended appearance while removing unnecessary or unsafe markup. Always preview the result before shipping." },
                { question: "Is converting SVG to PNG safer?", answer: "Rasterizing can remove active SVG behavior from the delivered asset, but you should still treat the original SVG as untrusted input." },
            ],
        }),
    },
    {
        slug: "how-to/decode-jwt-locally",
        kind: "how-to",
        relatedToolKeys: ["jwt_decoder", "jwt_workbench", "jwt_verifier", "url_encode_decode"],
        copy: {
            en: jwtHowToCopyEn(),
            "zh-CN": jwtHowToCopyZhCN(),
            "zh-TW": jwtHowToCopyZhTW(),
            ja: jwtHowToCopyJa(),
            ko: jwtHowToCopyKo(),
            de: jwtHowToCopyDe(),
            fr: jwtHowToCopyFr(),
        },
    },
    {
        slug: "fix/base64-invalid-length",
        kind: "fix",
        relatedToolKeys: ["base64_encode_decode", "url_encode_decode", "jwt_decoder", "hash_generator"],
        copy: {
            en: base64FixCopyEn(),
            "zh-CN": base64FixCopyZhCN(),
            "zh-TW": base64FixCopyZhTW(),
            ja: base64FixCopyJa(),
            ko: base64FixCopyKo(),
            de: base64FixCopyDe(),
            fr: base64FixCopyFr(),
        },
    },
]

function jwtPageCopy(eyebrow: string, title: string): GrowthPageCopy {
    return {
        eyebrow,
        title,
        description: "Compare Byteflow's JWT tools with jwt.io-style token debugging, including decode and verification boundaries.",
        intent: "Use this page when a team needs to decode JWTs locally without confusing decoding with signature verification.",
        summaryPoints: [
            "Byteflow separates decode-only inspection from verification workflows.",
            "JWT signature verification still requires the right algorithm, key material, and claim expectations.",
            "JWTs can contain sensitive claims, so sample-data checks should happen before production tokens are pasted.",
        ],
        trustCenterAngle: "The Trust Center documents how sensitive inputs are labeled and why token values must not enter storage, analytics, or logs.",
        comparisonRows: [
            {
                factor: "Decode semantics",
                byteflow: "The JWT decoder labels decode-only inspection and points users toward verification tools for signature checks.",
                other: "JWT debuggers may combine display and verification controls in one interface.",
                note: "The key distinction is whether a signature was actually verified.",
            },
            {
                factor: "Sensitive input handling",
                byteflow: "JWT tools are marked as sensitive input and avoid persisting token values.",
                other: "Review the runtime behavior and storage policy of any token debugger before using real tokens.",
                note: "Never paste production tokens into a page you cannot inspect or trust.",
            },
            {
                factor: "Broader workflow",
                byteflow: "Related tools cover Base64 inspection, hashing, and URL encoding around token handling.",
                other: "A dedicated JWT site can be familiar for quick manual checks.",
                note: "Use the tool that makes the verification state most explicit.",
            },
        ],
        sections: [
            {
                heading: "Decode is not verification",
                body: [
                    "A decoded JWT header and payload are only parsed text. That view helps inspect alg, kid, exp, nbf, and claim names, but it does not prove trusted issuance.",
                ],
            },
            {
                heading: "A safer token review path",
                body: [
                    "Start with a redacted or non-production token. Decode it locally, inspect time-based claims, then verify only when the right key material and claim rules are available.",
                ],
            },
        ],
        faq: [
            {
                question: "Does Byteflow's JWT Decoder verify signatures?",
                answer: "No. It is for decode-only inspection. Use JWT Workbench or the verifier tool when you need a real signature check.",
            },
            {
                question: "Is it safe to paste a production JWT?",
                answer: "Treat JWTs as sensitive. Use sample tokens first and verify local behavior before handling production values.",
            },
        ],
    }
}

function jwtPageCopyZhCN(): GrowthPageCopy {
    return {
        eyebrow: "对比",
        title: "Byteflow 与 jwt.io 对比",
        description: "比较 Byteflow 的 JWT 工具与 jwt.io 式 token 调试方式，并说明解码和验证边界。",
        intent: "当团队需要在本地解码 JWT，同时避免把解码误认为签名验证时，可使用本页。",
        summaryPoints: [
            "Byteflow 将仅解码检查与验证工作流分开。",
            "JWT 签名验证仍需要正确算法、密钥材料和 claims 预期。",
            "JWT 可能包含敏感 claims，因此粘贴生产 token 前应先用样例数据检查。",
        ],
        trustCenterAngle: "隐私与信任中心说明敏感输入如何标记，以及 token 值为什么不能进入 storage、analytics 或日志。",
        comparisonRows: [
            { factor: "解码语义", byteflow: "JWT 解码器明确标注仅解码检查，并引导用户使用验证工具检查签名。", other: "JWT 调试器可能把展示和验证控件放在同一界面。", note: "关键区别是签名是否真的被验证。" },
            { factor: "敏感输入处理", byteflow: "JWT 工具标记为敏感输入，并避免持久化 token 值。", other: "使用真实 token 前，应审查任何 token 调试器的运行行为和存储策略。", note: "不要把生产 token 粘贴到无法检查或不可信的页面。" },
            { factor: "更广工作流", byteflow: "相关工具覆盖 token 处理周边的 Base64 检查、hash 和 URL 编码。", other: "专用 JWT 站点在快速手动检查时可能更熟悉。", note: "选择能最明确表达验证状态的工具。" },
        ],
        sections: [
            { heading: "解码不是验证", body: ["解码后的 JWT header 和 payload 只是被解析出的文本。它能帮助检查 alg、kid、exp、nbf 和 claim 名称，但不能证明 token 由可信方签发。"] },
            { heading: "更安全的 token 检查路径", body: ["先使用脱敏或非生产 token。本地解码后检查时间类 claims，只有在具备正确密钥材料和 claim 规则时再执行验证。"] },
        ],
        faq: [
            { question: "Byteflow 的 JWT 解码器会验证签名吗？", answer: "不会。它用于仅解码检查。需要真正签名检查时，请使用 JWT 工作台或验证工具。" },
            { question: "粘贴生产 JWT 安全吗？", answer: "应把 JWT 视为敏感信息。先用样例 token，并在处理生产值前验证本地运行行为。" },
        ],
    }
}

function jwtPageCopyZhTW(): GrowthPageCopy {
    return {
        ...jwtPageCopyZhCN(),
        eyebrow: "比較",
        title: "Byteflow 與 jwt.io 比較",
        description: "比較 Byteflow 的 JWT 工具與 jwt.io 式 token 偵錯方式，並說明解碼和驗證邊界。",
        intent: "當團隊需要在本地解碼 JWT，同時避免把解碼誤認為簽章驗證時，可使用本頁。",
        summaryPoints: [
            "Byteflow 將僅解碼檢查與驗證工作流分開。",
            "JWT 簽章驗證仍需要正確演算法、金鑰材料與 claims 預期。",
            "JWT 可能包含敏感 claims，因此貼上正式 token 前應先用範例資料檢查。",
        ],
        trustCenterAngle: "隱私與信任中心說明敏感輸入如何標記，以及 token 值為什麼不能進入 storage、analytics 或日誌。",
        comparisonRows: [
            { factor: "解碼語義", byteflow: "JWT 解碼器明確標示僅解碼檢查，並引導使用者使用驗證工具檢查簽章。", other: "JWT 偵錯器可能把顯示與驗證控制放在同一介面。", note: "關鍵差異是簽章是否真的被驗證。" },
            { factor: "敏感輸入處理", byteflow: "JWT 工具標記為敏感輸入，並避免持久化 token 值。", other: "使用真實 token 前，應審查任何 token 偵錯器的執行行為與儲存策略。", note: "不要把正式 token 貼到無法檢查或不可信的頁面。" },
            { factor: "更廣工作流", byteflow: "相關工具覆蓋 token 處理周邊的 Base64 檢查、hash 與 URL 編碼。", other: "專用 JWT 網站在快速手動檢查時可能更熟悉。", note: "選擇能最明確表達驗證狀態的工具。" },
        ],
        sections: [
            { heading: "解碼不是驗證", body: ["解碼後的 JWT header 與 payload 只是被解析出的文字。它能協助檢查 alg、kid、exp、nbf 與 claim 名稱，但不能證明 token 由可信方簽發。"] },
            { heading: "更安全的 token 檢查路徑", body: ["先使用脫敏或非正式 token。本地解碼後檢查時間類 claims，只有在具備正確金鑰材料與 claim 規則時再執行驗證。"] },
        ],
        faq: [
            { question: "Byteflow 的 JWT 解碼器會驗證簽章嗎？", answer: "不會。它用於僅解碼檢查。需要真正簽章檢查時，請使用 JWT 工作台或驗證工具。" },
            { question: "貼上正式 JWT 安全嗎？", answer: "應把 JWT 視為敏感資訊。先用範例 token，並在處理正式值前驗證本地執行行為。" },
        ],
    }
}

function jwtPageCopyJa(): GrowthPageCopy {
    return {
        eyebrow: "比較",
        title: "Byteflow と jwt.io の比較",
        description: "Byteflow の JWT ツールと jwt.io 型の token デバッグを、デコードと検証の境界も含めて比較します。",
        intent: "JWT をローカルでデコードしつつ、デコードを署名検証と混同しないようにしたいチーム向けです。",
        summaryPoints: ["Byteflow はデコードだけの確認と検証ワークフローを分けます。", "JWT の署名検証には正しいアルゴリズム、鍵材料、claim の期待値が必要です。", "JWT には機密 claims が含まれることがあるため、本番 token の前にサンプルで確認します。"],
        trustCenterAngle: "プライバシーと信頼センターでは、機密入力のラベル付けと、token 値を storage、analytics、ログに入れてはいけない理由を説明しています。",
        comparisonRows: [
            { factor: "デコードの意味", byteflow: "JWT デコーダーはデコードのみの確認であることを示し、署名確認には検証ツールを案内します。", other: "JWT デバッガーは表示と検証の操作を一つの画面にまとめることがあります。", note: "重要なのは署名が実際に検証されたかどうかです。" },
            { factor: "機密入力の扱い", byteflow: "JWT ツールは機密入力として表示され、token 値を永続化しない設計です。", other: "実 token の前に、デバッガーの実行挙動と保存方針を確認します。", note: "確認できないページや信頼できないページに本番 token を貼り付けないでください。" },
            { factor: "周辺ワークフロー", byteflow: "Base64 確認、hash、URL エンコードなど token 周辺作業へつながります。", other: "専用 JWT サイトは手早い手動確認で慣れている場合があります。", note: "検証状態が最も明確なツールを選びます。" },
        ],
        sections: [{ heading: "デコードは検証ではない", body: ["デコードされた JWT header と payload は解析されたテキストにすぎません。alg、kid、exp、nbf、claim 名を確認できますが、信頼できる発行を証明しません。"] }, { heading: "より安全な token 確認手順", body: ["まずマスク済みまたは非本番 token を使います。ローカルでデコードして時刻系 claims を確認し、正しい鍵材料と claim ルールがある場合だけ検証します。"] }],
        faq: [{ question: "Byteflow の JWT デコーダーは署名を検証しますか？", answer: "いいえ。デコードのみの確認用です。実際の署名確認には JWTワークベンチまたは検証ツールを使います。" }, { question: "本番 JWT を貼り付けても安全ですか？", answer: "JWT は機密情報として扱ってください。まずサンプル token を使い、本番値の前にローカル動作を確認します。" }],
    }
}

function jwtPageCopyKo(): GrowthPageCopy {
    return {
        eyebrow: "비교",
        title: "Byteflow와 jwt.io 비교",
        description: "Byteflow의 JWT 도구와 jwt.io 방식의 token 디버깅을 디코딩 및 검증 경계와 함께 비교합니다.",
        intent: "JWT를 로컬에서 디코딩하되 디코딩을 서명 검증으로 오해하지 않도록 할 때 사용합니다.",
        summaryPoints: ["Byteflow는 디코딩 전용 점검과 검증 워크플로를 분리합니다.", "JWT 서명 검증에는 올바른 알고리즘, 키 자료, claim 기대값이 필요합니다.", "JWT에는 민감한 claims가 있을 수 있으므로 운영 token을 붙여넣기 전에 샘플 데이터로 확인합니다."],
        trustCenterAngle: "개인정보 및 신뢰 센터는 민감한 입력 라벨과 token 값이 storage, analytics, 로그에 들어가면 안 되는 이유를 설명합니다.",
        comparisonRows: [
            { factor: "디코딩 의미", byteflow: "JWT 디코더는 디코딩 전용 점검임을 표시하고 서명 확인에는 검증 도구를 안내합니다.", other: "JWT 디버거는 표시와 검증 컨트롤을 한 화면에 함께 둘 수 있습니다.", note: "핵심 차이는 서명이 실제로 검증되었는지입니다." },
            { factor: "민감 입력 처리", byteflow: "JWT 도구는 민감 입력으로 표시되며 token 값을 지속 저장하지 않습니다.", other: "실제 token을 쓰기 전에 디버거의 실행 동작과 저장 정책을 확인해야 합니다.", note: "검사할 수 없거나 신뢰할 수 없는 페이지에 운영 token을 붙여넣지 마세요." },
            { factor: "주변 워크플로", byteflow: "Base64 검사, hash, URL 인코딩 등 token 주변 작업으로 이어집니다.", other: "전용 JWT 사이트는 빠른 수동 점검에 익숙할 수 있습니다.", note: "검증 상태를 가장 명확하게 보여주는 도구를 선택하세요." },
        ],
        sections: [{ heading: "디코딩은 검증이 아닙니다", body: ["디코딩된 JWT header와 payload는 파싱된 텍스트일 뿐입니다. alg, kid, exp, nbf, claim 이름을 볼 수 있지만 신뢰된 발급을 증명하지 않습니다."] }, { heading: "더 안전한 token 검토 경로", body: ["먼저 마스킹했거나 운영이 아닌 token을 사용합니다. 로컬에서 디코딩해 시간 관련 claims를 확인하고, 올바른 키 자료와 claim 규칙이 있을 때만 검증합니다."] }],
        faq: [{ question: "Byteflow의 JWT 디코더가 서명을 검증하나요?", answer: "아니요. 디코딩 전용 점검 도구입니다. 실제 서명 확인에는 JWT 워크벤치 또는 검증 도구를 사용하세요." }, { question: "운영 JWT를 붙여넣어도 안전한가요?", answer: "JWT는 민감 정보로 취급하세요. 먼저 샘플 token을 사용하고 운영 값을 다루기 전에 로컬 동작을 확인하세요." }],
    }
}

function jwtPageCopyDe(): GrowthPageCopy {
    return {
        eyebrow: "Vergleich",
        title: "Byteflow und jwt.io im Vergleich",
        description: "Vergleiche Byteflows JWT-Tools mit jwt.io-ähnlichem Token-Debugging, inklusive Decoding- und Verifikationsgrenzen.",
        intent: "Nutze diese Seite, wenn ein Team JWTs lokal decodieren muss, ohne Decoding mit Signaturprüfung zu verwechseln.",
        summaryPoints: ["Byteflow trennt reine Decoding-Ansicht von Verifikations-Workflows.", "JWT-Signaturprüfung benötigt weiterhin Algorithmus, Schlüsselmaterial und Claim-Erwartungen.", "JWTs können sensible Claims enthalten; prüfe zuerst mit Beispieldaten."],
        trustCenterAngle: "Das Datenschutz- und Vertrauenszentrum beschreibt Labels für sensible Eingaben und warum Token-Werte nicht in Storage, Analytics oder Logs gehören.",
        comparisonRows: [
            { factor: "Decoding-Semantik", byteflow: "Der JWT-Dekoder kennzeichnet reine Decoding-Ansicht und verweist für Signaturen auf Verifikations-Tools.", other: "JWT-Debugger können Anzeige und Verifikationskontrollen in einer Oberfläche kombinieren.", note: "Entscheidend ist, ob die Signatur wirklich geprüft wurde." },
            { factor: "Sensible Eingaben", byteflow: "JWT-Tools sind als sensible Eingabe markiert und speichern Token-Werte nicht dauerhaft.", other: "Prüfe Laufzeitverhalten und Speicherpolitik jedes Debuggers vor echten Tokens.", note: "Füge Produktions-Tokens nie in eine Seite ein, die du nicht prüfen oder vertrauen kannst." },
            { factor: "Breiterer Workflow", byteflow: "Verwandte Tools decken Base64-Prüfung, Hashing und URL-Encoding rund um Tokens ab.", other: "Eine dedizierte JWT-Seite kann für schnelle manuelle Checks vertraut sein.", note: "Nutze das Tool, das den Verifikationsstatus am klarsten zeigt." },
        ],
        sections: [{ heading: "Decoding ist keine Verifikation", body: ["Ein decodierter JWT-Header und Payload sind nur geparster Text. Man kann alg, kid, exp, nbf und Claim-Namen prüfen, aber keine vertrauenswürdige Ausstellung beweisen."] }, { heading: "Sichererer Token-Prüfpfad", body: ["Beginne mit einem redigierten oder Nicht-Produktions-Token. Decodiere lokal, prüfe zeitbasierte Claims und verifiziere erst mit passendem Schlüsselmaterial und Claim-Regeln."] }],
        faq: [{ question: "Verifiziert Byteflows JWT-Dekoder Signaturen?", answer: "Nein. Er dient nur der Decoding-Ansicht. Für echte Signaturprüfung nutze JWT-Workbench oder das Verifikations-Tool." }, { question: "Ist das Einfügen eines Produktions-JWT sicher?", answer: "Behandle JWTs als sensibel. Nutze zuerst Beispiel-Tokens und prüfe lokales Verhalten vor Produktionswerten." }],
    }
}

function jwtPageCopyFr(): GrowthPageCopy {
    return {
        eyebrow: "Comparatif",
        title: "Comparatif Byteflow et jwt.io",
        description: "Comparez les outils JWT de Byteflow avec un débogage de token de type jwt.io, y compris les limites entre décodage et vérification.",
        intent: "Utilisez cette page lorsqu'une équipe doit décoder des JWT localement sans confondre décodage et vérification de signature.",
        summaryPoints: ["Byteflow sépare l'inspection par décodage des workflows de vérification.", "La vérification de signature JWT nécessite toujours le bon algorithme, les clés et les attentes de claims.", "Les JWT peuvent contenir des claims sensibles ; commencez par des données d'exemple avant les tokens de production."],
        trustCenterAngle: "Le Centre de confiance documente les labels d'entrées sensibles et explique pourquoi les valeurs de token ne doivent pas aller dans le stockage, l'analytics ou les logs.",
        comparisonRows: [
            { factor: "Sens du décodage", byteflow: "Le Décodeur JWT signale l'inspection par décodage seulement et oriente vers les outils de vérification pour les signatures.", other: "Un débogueur JWT peut regrouper affichage et contrôles de vérification dans une même interface.", note: "La différence clé est de savoir si la signature a réellement été vérifiée." },
            { factor: "Entrées sensibles", byteflow: "Les outils JWT sont marqués comme entrées sensibles et évitent de persister les valeurs de token.", other: "Vérifiez le comportement d'exécution et la politique de stockage avant d'utiliser de vrais tokens.", note: "Ne collez jamais un token de production dans une page que vous ne pouvez pas inspecter ou approuver." },
            { factor: "Workflow élargi", byteflow: "Les outils liés couvrent Base64, hash et encodage URL autour de la manipulation des tokens.", other: "Un site JWT dédié peut être familier pour des contrôles manuels rapides.", note: "Choisissez l'outil qui rend l'état de vérification le plus explicite." },
        ],
        sections: [{ heading: "Décoder n'est pas vérifier", body: ["Un header et un payload JWT décodés ne sont que du texte analysé. Ils aident à inspecter alg, kid, exp, nbf et les noms de claims, mais ne prouvent pas une émission fiable."] }, { heading: "Un parcours de revue plus sûr", body: ["Commencez par un token expurgé ou hors production. Décodez localement, inspectez les claims temporels, puis vérifiez seulement avec les bonnes clés et règles de claims."] }],
        faq: [{ question: "Le Décodeur JWT de Byteflow vérifie-t-il les signatures ?", answer: "Non. Il sert à l'inspection par décodage seulement. Pour une vraie vérification, utilisez l'Atelier JWT ou l'outil de vérification." }, { question: "Puis-je coller un JWT de production ?", answer: "Traitez les JWT comme sensibles. Utilisez d'abord des tokens d'exemple et vérifiez le comportement local avant les valeurs de production." }],
    }
}

function jsonAlternativeCopyEn(): GrowthPageCopy {
    return {
        eyebrow: "Privacy-first alternative",
        title: "JSON Formatter privacy-first alternative",
        description: "Format, validate, and inspect JSON in a browser-local workflow before sharing API payloads or config changes.",
        intent: "Use this page when JSON may include internal IDs, API payloads, or incident data that should not be uploaded to an opaque formatter.",
        summaryPoints: ["Use a browser-local formatter for sensitive API examples, config snippets, and log payload fragments.", "Validate with sample or redacted data before using internal payloads.", "Pair formatting with diffing and type generation when the payload is part of a contract review."],
        trustCenterAngle: "The Trust Center describes how browser-local tools can be verified and which storage types are reserved for safe preferences.",
        sections: [{ heading: "What makes a JSON formatter privacy-first", body: ["A privacy-first JSON formatter should make the processing boundary visible: whether the page sends payloads to a server, stores input, or records copy actions."] }, { heading: "Recommended workflow", body: ["Paste a small redacted sample, format it, inspect nested fields, and remove secrets before sharing the formatted output."] }],
        steps: [{ name: "Format a redacted sample", text: "Open the JSON formatter with a sample that preserves structure but removes secrets and personal data.", toolKey: "json_formatter" }, { name: "Compare the expected contract", text: "Use diffing or type generation to confirm field names, nesting, and optional values.", toolKey: "json_diff_viewer" }, { name: "Verify the local boundary", text: "Open DevTools Network, clear the log, run the formatter, and confirm that the payload is not sent to a tool-processing endpoint." }],
        faq: [{ question: "Can I use this for production API payloads?", answer: "Prefer redacted samples. If production data is unavoidable, verify local runtime behavior first and remove secrets before copying output." }, { question: "Does formatting JSON remove sensitive fields?", answer: "No. Formatting changes structure and whitespace; it does not redact secrets." }],
    }
}

function localizedJsonAlternative(locale: Locale): GrowthPageCopy {
    const map: Record<Locale, GrowthPageCopy> = {
        en: jsonAlternativeCopyEn(),
        "zh-CN": { eyebrow: "隐私优先替代方案", title: "隐私优先 JSON 格式化替代方案", description: "在浏览器本地格式化、校验和检查 JSON，再分享 API payload 或配置变更。", intent: "当 JSON 可能包含内部 ID、API payload 或事故数据，不应上传到不透明格式化工具时，可使用本页。", summaryPoints: ["敏感 API 示例、配置片段和日志 payload 片段应优先使用浏览器本地格式化工具。", "使用内部 payload 前，先用样例或脱敏数据验证。", "当 payload 属于契约审查时，将格式化与 diff、类型生成结合。"], trustCenterAngle: "隐私与信任中心说明如何验证浏览器本地工具，以及哪些存储类型仅用于安全偏好。", sections: [{ heading: "什么让 JSON 格式化工具具备隐私优先特征", body: ["隐私优先 JSON 格式化工具应让处理边界可见：页面是否把 payload 发到服务器、是否保存输入、是否记录复制动作。"] }, { heading: "推荐工作流", body: ["粘贴小型脱敏样例，完成格式化，检查嵌套字段，并在分享格式化输出前移除 secrets。"] }], steps: [{ name: "格式化脱敏样例", text: "用保留结构但移除 secrets 和个人数据的样例打开 JSON 格式化工具。", toolKey: "json_formatter" }, { name: "比较预期契约", text: "使用 diff 或类型生成确认字段名、嵌套结构和可选值。", toolKey: "json_diff_viewer" }, { name: "验证本地边界", text: "打开 DevTools Network，清空记录，运行格式化工具，确认 payload 没有发送到工具处理端点。" }], faq: [{ question: "可以用于生产 API payload 吗？", answer: "优先使用脱敏样例。如果无法避免生产数据，请先验证本地运行行为，并在复制输出前移除 secrets。" }, { question: "格式化 JSON 会移除敏感字段吗？", answer: "不会。格式化只改变结构和空白，不会脱敏 secrets。" }] },
        "zh-TW": { eyebrow: "隱私優先替代方案", title: "隱私優先 JSON 格式化替代方案", description: "在瀏覽器本地格式化、驗證與檢查 JSON，再分享 API payload 或設定變更。", intent: "當 JSON 可能包含內部 ID、API payload 或事故資料，不應上傳到不透明格式化工具時，可使用本頁。", summaryPoints: ["敏感 API 範例、設定片段與日誌 payload 片段應優先使用瀏覽器本地格式化工具。", "使用內部 payload 前，先用範例或脫敏資料驗證。", "當 payload 屬於契約審查時，將格式化與 diff、型別產生結合。"], trustCenterAngle: "隱私與信任中心說明如何驗證瀏覽器本地工具，以及哪些儲存類型僅用於安全偏好。", sections: [{ heading: "什麼讓 JSON 格式化工具具備隱私優先特徵", body: ["隱私優先 JSON 格式化工具應讓處理邊界可見：頁面是否把 payload 送到伺服器、是否儲存輸入、是否記錄複製動作。"] }, { heading: "建議工作流", body: ["貼上小型脫敏範例，完成格式化，檢查巢狀欄位，並在分享格式化輸出前移除 secrets。"] }], steps: [{ name: "格式化脫敏範例", text: "用保留結構但移除 secrets 和個人資料的範例開啟 JSON 格式化工具。", toolKey: "json_formatter" }, { name: "比較預期契約", text: "使用 diff 或型別產生確認欄位名、巢狀結構與可選值。", toolKey: "json_diff_viewer" }, { name: "驗證本地邊界", text: "開啟 DevTools Network，清空紀錄，執行格式化工具，確認 payload 沒有送到工具處理端點。" }], faq: [{ question: "可以用於正式 API payload 嗎？", answer: "優先使用脫敏範例。如果無法避免正式資料，請先驗證本地執行行為，並在複製輸出前移除 secrets。" }, { question: "格式化 JSON 會移除敏感欄位嗎？", answer: "不會。格式化只改變結構與空白，不會脫敏 secrets。" }] },
        ja: { eyebrow: "プライバシー重視の代替案", title: "プライバシー重視の JSON 整形代替案", description: "API payload や設定変更を共有する前に、ブラウザ内で JSON を整形、検証、確認します。", intent: "JSON に内部 ID、API payload、インシデントデータが含まれ、不透明な整形ツールへアップロードすべきでない場合に使います。", summaryPoints: ["機密性のある API 例、設定断片、ログ payload はブラウザ内の整形ツールを優先します。", "内部 payload の前に、サンプルまたはマスク済みデータで検証します。", "契約レビューでは整形を diff や型生成と組み合わせます。"], trustCenterAngle: "プライバシーと信頼センターは、ブラウザ内ツールの確認方法と、安全な設定に限定される保存領域を説明します。", sections: [{ heading: "JSON 整形ツールがプライバシー重視である条件", body: ["処理境界が見えることが重要です。payload をサーバーへ送るか、入力を保存するか、コピー操作を記録するかを確認できる必要があります。"] }, { heading: "推奨ワークフロー", body: ["小さなマスク済みサンプルを貼り付けて整形し、ネストした項目を確認し、共有前に secrets を削除します。"] }], steps: [{ name: "マスク済みサンプルを整形する", text: "構造を残しつつ secrets と個人データを除いたサンプルで JSON フォーマッターを開きます。", toolKey: "json_formatter" }, { name: "期待する契約と比較する", text: "diff または型生成で、項目名、ネスト、任意値を確認します。", toolKey: "json_diff_viewer" }, { name: "ローカル境界を確認する", text: "DevTools Network を開き、ログを消去して整形ツールを実行し、payload が処理エンドポイントへ送信されないことを確認します。" }], faq: [{ question: "本番 API payload に使えますか？", answer: "まずマスク済みサンプルを使ってください。本番データが避けられない場合は、ローカル動作を確認し、コピー前に secrets を削除します。" }, { question: "JSON 整形は機密項目を削除しますか？", answer: "いいえ。整形は構造と空白を変えるだけで、secrets をマスクしません。" }] },
        ko: { eyebrow: "개인정보 우선 대안", title: "개인정보 우선 JSON 정리 대안", description: "API payload 또는 설정 변경을 공유하기 전에 브라우저에서 JSON을 정리, 검증, 검사합니다.", intent: "JSON에 내부 ID, API payload, 사고 데이터가 포함되어 불투명한 정리 도구에 업로드하면 안 될 때 사용합니다.", summaryPoints: ["민감한 API 예시, 설정 조각, 로그 payload는 브라우저 로컬 정리 도구를 우선 사용합니다.", "내부 payload를 쓰기 전에 샘플 또는 마스킹한 데이터로 검증합니다.", "payload가 계약 검토 대상이면 정리 후 diff와 타입 생성을 함께 사용합니다."], trustCenterAngle: "개인정보 및 신뢰 센터는 브라우저 로컬 도구 확인 방법과 안전한 설정에만 쓰이는 저장 영역을 설명합니다.", sections: [{ heading: "JSON 정리 도구가 개인정보 우선이 되는 조건", body: ["처리 경계가 보여야 합니다. 페이지가 payload를 서버로 보내는지, 입력을 저장하는지, 복사 동작을 기록하는지 확인할 수 있어야 합니다."] }, { heading: "권장 워크플로", body: ["작은 마스킹 샘플을 붙여넣고 정리한 뒤 중첩 필드를 확인하고, 공유 전 secrets를 제거합니다."] }], steps: [{ name: "마스킹 샘플 정리", text: "구조는 보존하되 secrets와 개인 데이터를 제거한 샘플로 JSON 포매터를 엽니다.", toolKey: "json_formatter" }, { name: "예상 계약과 비교", text: "diff 또는 타입 생성을 사용해 필드명, 중첩, 선택 값을 확인합니다.", toolKey: "json_diff_viewer" }, { name: "로컬 경계 확인", text: "DevTools Network를 열고 로그를 비운 뒤 정리 도구를 실행해 payload가 처리 엔드포인트로 전송되지 않는지 확인합니다." }], faq: [{ question: "운영 API payload에 사용할 수 있나요?", answer: "마스킹 샘플을 우선 사용하세요. 운영 데이터가 불가피하면 먼저 로컬 실행 동작을 확인하고 출력 복사 전 secrets를 제거하세요." }, { question: "JSON 정리가 민감한 필드를 제거하나요?", answer: "아니요. 정리는 구조와 공백만 바꾸며 secrets를 마스킹하지 않습니다." }] },
        de: { eyebrow: "Datenschutzfreundliche Alternative", title: "Datenschutzfreundliche JSON-Formatierung", description: "Formatiere, validiere und prüfe JSON lokal im Browser, bevor API-Payloads oder Konfigurationsänderungen geteilt werden.", intent: "Nutze diese Seite, wenn JSON interne IDs, API-Payloads oder Incident-Daten enthalten kann, die nicht in ein undurchsichtiges Formatierungswerkzeug hochgeladen werden sollten.", summaryPoints: ["Für sensible API-Beispiele, Konfigurationsausschnitte und Log-Payloads ist ein browserlokales Formatierungswerkzeug vorzuziehen.", "Validiere zuerst mit Beispieldaten oder redigierten Daten, bevor interne Payloads genutzt werden.", "Kombiniere Formatierung mit Diff und Typgenerierung, wenn der Payload Teil einer Vertragsprüfung ist."], trustCenterAngle: "Das Datenschutz- und Vertrauenszentrum beschreibt, wie browserlokale Tools geprüft werden und welche Speicherarten nur für sichere Einstellungen reserviert sind.", sections: [{ heading: "Was ein JSON-Formatierungswerkzeug datenschutzfreundlich macht", body: ["Die Verarbeitungsgrenze muss sichtbar sein: ob die Seite Payloads an Server sendet, Eingaben speichert oder Kopieraktionen aufzeichnet."] }, { heading: "Empfohlener Workflow", body: ["Füge ein kleines redigiertes Beispiel ein, formatiere es, prüfe verschachtelte Felder und entferne Secrets vor dem Teilen der Ausgabe."] }], steps: [{ name: "Redigiertes Beispiel formatieren", text: "Öffne den JSON-Formatter mit einem Beispiel, das Struktur behält, aber Secrets und personenbezogene Daten entfernt.", toolKey: "json_formatter" }, { name: "Erwarteten Vertrag vergleichen", text: "Nutze Diff oder Typgenerierung, um Feldnamen, Verschachtelung und optionale Werte zu bestätigen.", toolKey: "json_diff_viewer" }, { name: "Lokale Grenze prüfen", text: "Öffne DevTools Network, lösche das Log, führe das Formatierungswerkzeug aus und prüfe, dass der Payload nicht an einen Tool-Endpunkt gesendet wird." }], faq: [{ question: "Kann ich das für Produktions-API-Payloads nutzen?", answer: "Bevorzuge redigierte Beispiele. Wenn Produktionsdaten unvermeidbar sind, prüfe zuerst das lokale Laufzeitverhalten und entferne Secrets vor dem Kopieren." }, { question: "Entfernt JSON-Formatierung sensible Felder?", answer: "Nein. Formatierung ändert Struktur und Leerraum, redigiert aber keine Secrets." }] },
        fr: { eyebrow: "Alternative respectueuse de la vie privée", title: "Alternative locale pour formater JSON", description: "Formatez, validez et inspectez JSON dans le navigateur avant de partager des payloads API ou des changements de configuration.", intent: "Utilisez cette page lorsque le JSON peut contenir des ID internes, des payloads API ou des données d'incident qui ne doivent pas être envoyés à un formatter opaque.", summaryPoints: ["Préférez un formatter local pour les exemples API sensibles, les extraits de configuration et les fragments de payload issus de logs.", "Validez avec un exemple ou des données expurgées avant d'utiliser des payloads internes.", "Associez formatage, diff et génération de types lorsque le payload fait partie d'une revue de contrat."], trustCenterAngle: "Le Centre de confiance explique comment vérifier les outils locaux et quels stockages sont réservés aux préférences sûres.", sections: [{ heading: "Ce qui rend un formatter JSON respectueux de la vie privée", body: ["La limite de traitement doit être visible : envoi éventuel des payloads à un serveur, stockage de l'entrée ou enregistrement des actions de copie."] }, { heading: "Workflow recommandé", body: ["Collez un petit exemple expurgé, formatez-le, inspectez les champs imbriqués et retirez les secrets avant de partager la sortie."] }], steps: [{ name: "Formater un exemple expurgé", text: "Ouvrez le Formateur JSON avec un exemple qui garde la structure mais retire secrets et données personnelles.", toolKey: "json_formatter" }, { name: "Comparer le contrat attendu", text: "Utilisez un diff ou une génération de types pour confirmer les noms de champs, l'imbrication et les valeurs optionnelles.", toolKey: "json_diff_viewer" }, { name: "Vérifier la limite locale", text: "Ouvrez DevTools Network, videz le journal, lancez le formatter et confirmez que le payload n'est pas envoyé à un endpoint de traitement." }], faq: [{ question: "Puis-je l'utiliser avec des payloads API de production ?", answer: "Préférez des exemples expurgés. Si les données de production sont inévitables, vérifiez d'abord le comportement local et retirez les secrets avant de copier la sortie." }, { question: "Le formatage JSON supprime-t-il les champs sensibles ?", answer: "Non. Il change la structure et les espaces, mais ne masque pas les secrets." }] },
    }
    return map[locale]
}

function jsonAlternativeCopyZhCN() { return localizedJsonAlternative("zh-CN") }
function jsonAlternativeCopyZhTW() { return localizedJsonAlternative("zh-TW") }
function jsonAlternativeCopyJa() { return localizedJsonAlternative("ja") }
function jsonAlternativeCopyKo() { return localizedJsonAlternative("ko") }
function jsonAlternativeCopyDe() { return localizedJsonAlternative("de") }
function jsonAlternativeCopyFr() { return localizedJsonAlternative("fr") }

function hashComparisonCopyEn(): GrowthPageCopy {
    return {
        eyebrow: "Security comparison",
        title: "MD5 vs SHA-256",
        description: "Compare MD5 and SHA-256 for checksums, compatibility work, and modern integrity verification.",
        intent: "Use this page when you need to choose a hash algorithm for integrity checks without overstating security guarantees.",
        summaryPoints: ["MD5 is useful for legacy compatibility checks but is not appropriate for new security-sensitive designs.", "SHA-256 is the safer default for modern integrity verification and many security workflows.", "A hash is not encryption and does not hide the original input from someone who already knows likely values."],
        trustCenterAngle: "Hashing can be browser-local, but secrets and uploaded file contents still require careful handling and should not be persisted.",
        comparisonRows: [
            { factor: "Primary use", byteflow: "Use the hash generator to produce MD5 or SHA-256 locally for checksums and comparison workflows.", other: "MD5 may appear in legacy systems, existing manifests, and compatibility documentation.", note: "Compatibility is not the same as security suitability." },
            { factor: "Security posture", byteflow: "Prefer SHA-256 for new integrity checks and document why weaker algorithms are present.", other: "MD5 should be treated as a legacy checksum, not a collision-resistant choice.", note: "Do not use MD5 for new password, signature, or tamper-resistance designs." },
            { factor: "Input sensitivity", byteflow: "Hashing runs locally, but sensitive input can still leak through copy, logs, screenshots, or saved files.", other: "Any online hash page should be inspected before production secrets or files are used.", note: "Never treat a hash operation as anonymization by default." },
        ],
        sections: [{ heading: "Use MD5 only for legacy compatibility", body: ["MD5 still appears in old manifests, historical checksums, and systems that cannot be changed immediately. Label it as compatibility work and avoid expanding it into new security-sensitive paths."] }, { heading: "Use SHA-256 for modern integrity checks", body: ["SHA-256 is a stronger default for downloaded artifacts, release files, and data exchanged between systems. Pair it with signatures or authenticated channels when you need origin assurance."] }],
        faq: [{ question: "Should I ever create a new MD5 workflow?", answer: "Only for explicit legacy compatibility. For new integrity checks, prefer SHA-256 or a stronger algorithm required by your platform." }, { question: "Does SHA-256 encrypt my data?", answer: "No. SHA-256 creates a digest. It does not make the input confidential." }],
    }
}

function localizedHashComparison(locale: Locale): GrowthPageCopy {
    const map: Record<Locale, GrowthPageCopy> = {
        en: hashComparisonCopyEn(),
        "zh-CN": {
            eyebrow: "安全对比",
            title: "MD5 与 SHA-256 对比",
            description: "比较 MD5 和 SHA-256 在 checksum、兼容性和现代完整性校验中的适用场景。",
            intent: "当你需要为完整性校验选择 hash 算法，又不想夸大安全保证时，可使用本页。",
            summaryPoints: ["MD5 可用于遗留兼容性检查，但不适合新的安全敏感设计。", "SHA-256 是现代完整性验证和许多安全工作流中更安全的默认选择。", "hash 不是加密，也不会向已经知道候选值的人隐藏原始输入。"],
            trustCenterAngle: "hash 可以在浏览器本地运行，但 secrets 和上传文件内容仍需要谨慎处理，不能被持久化。",
            comparisonRows: [{ factor: "主要用途", byteflow: "使用哈希生成器在本地生成 MD5 或 SHA-256，用于 checksum 和比较工作流。", other: "MD5 可能出现在遗留系统、现有 manifest 和兼容性文档中。", note: "兼容性不等于安全适用性。" }, { factor: "安全姿态", byteflow: "新的完整性校验优先使用 SHA-256，并说明为什么仍存在较弱算法。", other: "MD5 应被视为遗留 checksum，而不是抗碰撞选择。", note: "不要在新的密码、签名或防篡改设计中使用 MD5。" }, { factor: "输入敏感性", byteflow: "hash 在本地运行，但敏感输入仍可能通过复制、日志、截图或保存文件泄露。", other: "使用生产 secrets 或文件前，应检查任何在线 hash 页面。", note: "不要默认把 hash 操作视为匿名化。" }],
            sections: [{ heading: "只在遗留兼容性中使用 MD5", body: ["MD5 仍会出现在旧 manifest、历史 checksum 和暂时无法更改的系统中。应将其标记为兼容性工作，避免扩展到新的安全敏感路径。"] }, { heading: "现代完整性校验使用 SHA-256", body: ["SHA-256 更适合下载产物、发布文件和系统间数据的完整性验证。需要来源保证时，还应配合签名或经过认证的通道。"] }],
            faq: [{ question: "还应该创建新的 MD5 工作流吗？", answer: "只有明确的遗留兼容性需求才应这样做。新的完整性校验应优先使用 SHA-256 或平台要求的更强算法。" }, { question: "SHA-256 会加密数据吗？", answer: "不会。SHA-256 生成 digest，不会让输入变成机密。" }],
        },
        "zh-TW": {
            eyebrow: "安全比較",
            title: "MD5 與 SHA-256 比較",
            description: "比較 MD5 和 SHA-256 在 checksum、相容性與現代完整性驗證中的適用情境。",
            intent: "當你需要為完整性驗證選擇 hash 演算法，又不想誇大安全保證時，可使用本頁。",
            summaryPoints: ["MD5 可用於既有相容性檢查，但不適合新的安全敏感設計。", "SHA-256 是現代完整性驗證和許多安全工作流中更安全的預設選擇。", "hash 不是加密，也不會向已知道候選值的人隱藏原始輸入。"],
            trustCenterAngle: "hash 可以在瀏覽器本地執行，但 secrets 和上傳檔案內容仍需要謹慎處理，不能被持久化。",
            comparisonRows: [{ factor: "主要用途", byteflow: "使用雜湊產生器在本地產生 MD5 或 SHA-256，用於 checksum 和比較工作流。", other: "MD5 可能出現在既有系統、現有 manifest 和相容性文件中。", note: "相容性不等於安全適用性。" }, { factor: "安全姿態", byteflow: "新的完整性驗證優先使用 SHA-256，並說明為什麼仍存在較弱演算法。", other: "MD5 應被視為既有 checksum，而不是抗碰撞選擇。", note: "不要在新的密碼、簽章或防竄改設計中使用 MD5。" }, { factor: "輸入敏感性", byteflow: "hash 在本地執行，但敏感輸入仍可能透過複製、日誌、截圖或儲存檔案洩露。", other: "使用正式 secrets 或檔案前，應檢查任何線上 hash 頁面。", note: "不要預設把 hash 操作視為匿名化。" }],
            sections: [{ heading: "只在既有相容性中使用 MD5", body: ["MD5 仍會出現在舊 manifest、歷史 checksum 和暫時無法更改的系統中。應將其標記為相容性工作，避免擴展到新的安全敏感路徑。"] }, { heading: "現代完整性驗證使用 SHA-256", body: ["SHA-256 更適合下載產物、發布檔案和系統間資料的完整性驗證。需要來源保證時，還應搭配簽章或經過認證的通道。"] }],
            faq: [{ question: "還應該建立新的 MD5 工作流嗎？", answer: "只有明確的既有相容性需求才應這樣做。新的完整性驗證應優先使用 SHA-256 或平台要求的更強演算法。" }, { question: "SHA-256 會加密資料嗎？", answer: "不會。SHA-256 產生 digest，不會讓輸入變成機密。" }],
        },
        ja: {
            eyebrow: "セキュリティ比較",
            title: "MD5 と SHA-256 の比較",
            description: "checksum、互換性、現代的な整合性確認における MD5 と SHA-256 の使い分けを比較します。",
            intent: "整合性確認の hash アルゴリズムを選ぶ際に、安全保証を過大評価しないためのページです。",
            summaryPoints: ["MD5 はレガシー互換性確認には使えますが、新しいセキュリティ重視の設計には適しません。", "SHA-256 は現代的な整合性確認や多くのセキュリティワークフローのより安全な既定値です。", "hash は暗号化ではなく、候補値を知っている相手から元入力を隠すものではありません。"],
            trustCenterAngle: "hash はブラウザ内で実行できますが、secrets やアップロードファイル内容は慎重に扱い、永続化してはいけません。",
            comparisonRows: [{ factor: "主な用途", byteflow: "ハッシュジェネレーターで MD5 または SHA-256 をローカル生成し、checksum や比較に使います。", other: "MD5 はレガシーシステム、既存 manifest、互換性文書に残っていることがあります。", note: "互換性はセキュリティ適性と同じではありません。" }, { factor: "安全性", byteflow: "新しい整合性確認では SHA-256 を優先し、弱いアルゴリズムが残る理由を文書化します。", other: "MD5 はレガシー checksum として扱い、衝突耐性のある選択肢とは見なしません。", note: "新しいパスワード、署名、改ざん耐性設計に MD5 を使わないでください。" }, { factor: "入力の機密性", byteflow: "hash はローカル実行でも、コピー、ログ、スクリーンショット、保存ファイルから漏れる可能性があります。", other: "本番 secrets やファイルの前に、オンライン hash ページの挙動を確認します。", note: "hash 操作を自動的な匿名化と見なさないでください。" }],
            sections: [{ heading: "MD5 はレガシー互換性だけに使う", body: ["MD5 は古い manifest、過去の checksum、すぐ変更できないシステムに残っています。互換性作業として明示し、新しいセキュリティ経路へ広げないでください。"] }, { heading: "現代的な整合性確認には SHA-256", body: ["SHA-256 はダウンロード成果物、リリースファイル、システム間データの確認に適しています。出所保証が必要な場合は署名や認証済みチャネルと組み合わせます。"] }],
            faq: [{ question: "新しい MD5 ワークフローを作るべきですか？", answer: "明示的なレガシー互換性だけです。新しい整合性確認では SHA-256 またはプラットフォームが求めるより強い方式を優先します。" }, { question: "SHA-256 はデータを暗号化しますか？", answer: "いいえ。SHA-256 は digest を作るだけで、入力を機密にしません。" }],
        },
        ko: {
            eyebrow: "보안 비교",
            title: "MD5와 SHA-256 비교",
            description: "checksum, 호환성, 현대적 무결성 검증에서 MD5와 SHA-256을 비교합니다.",
            intent: "무결성 확인용 hash 알고리즘을 선택하면서 보안 보장을 과장하지 않기 위한 페이지입니다.",
            summaryPoints: ["MD5는 레거시 호환성 확인에는 쓸 수 있지만 새로운 보안 민감 설계에는 적합하지 않습니다.", "SHA-256은 현대적 무결성 검증과 많은 보안 워크플로에서 더 안전한 기본값입니다.", "hash는 암호화가 아니며 가능한 값을 아는 사람에게 원본 입력을 숨기지 않습니다."],
            trustCenterAngle: "hash는 브라우저 로컬에서 실행될 수 있지만 secrets와 업로드 파일 내용은 신중히 다뤄야 하며 지속 저장하면 안 됩니다.",
            comparisonRows: [{ factor: "주요 용도", byteflow: "해시 생성기로 MD5 또는 SHA-256을 로컬 생성해 checksum과 비교 작업에 사용합니다.", other: "MD5는 레거시 시스템, 기존 manifest, 호환성 문서에 남아 있을 수 있습니다.", note: "호환성은 보안 적합성과 같지 않습니다." }, { factor: "보안 태도", byteflow: "새 무결성 확인에는 SHA-256을 우선 사용하고 약한 알고리즘이 남아 있는 이유를 문서화합니다.", other: "MD5는 충돌 저항 선택지가 아니라 레거시 checksum으로 다룹니다.", note: "새 암호, 서명, 변조 방지 설계에는 MD5를 쓰지 마세요." }, { factor: "입력 민감도", byteflow: "hash가 로컬 실행되어도 복사, 로그, 스크린샷, 저장 파일로 민감 입력이 새어 나갈 수 있습니다.", other: "운영 secrets나 파일을 쓰기 전에 온라인 hash 페이지를 검사해야 합니다.", note: "hash 작업을 기본 익명화로 취급하지 마세요." }],
            sections: [{ heading: "MD5는 레거시 호환성에만 사용", body: ["MD5는 오래된 manifest, 과거 checksum, 즉시 바꿀 수 없는 시스템에 남아 있습니다. 호환성 작업으로 표시하고 새로운 보안 민감 경로로 확장하지 마세요."] }, { heading: "현대적 무결성 확인에는 SHA-256", body: ["SHA-256은 다운로드 산출물, 릴리스 파일, 시스템 간 데이터 확인에 더 적합합니다. 출처 보장이 필요하면 서명 또는 인증된 채널과 함께 사용합니다."] }],
            faq: [{ question: "새 MD5 워크플로를 만들어도 되나요?", answer: "명확한 레거시 호환성 요구가 있을 때만 가능합니다. 새 무결성 확인에는 SHA-256 또는 플랫폼이 요구하는 더 강한 알고리즘을 우선 사용하세요." }, { question: "SHA-256이 데이터를 암호화하나요?", answer: "아니요. SHA-256은 digest를 만들 뿐 입력을 기밀로 만들지 않습니다." }],
        },
        de: {
            eyebrow: "Sicherheitsvergleich",
            title: "MD5 und SHA-256 im Vergleich",
            description: "Vergleiche MD5 und SHA-256 für Checksums, Kompatibilität und moderne Integritätsprüfung.",
            intent: "Nutze diese Seite, um einen Hash-Algorithmus für Integritätsprüfungen zu wählen, ohne Sicherheitsgarantien zu übertreiben.",
            summaryPoints: ["MD5 ist für Legacy-Kompatibilität nützlich, aber nicht für neue sicherheitssensible Designs geeignet.", "SHA-256 ist der sicherere Standard für moderne Integritätsprüfung und viele Sicherheits-Workflows.", "Ein Hash ist keine Verschlüsselung und verbirgt die Eingabe nicht vor jemandem, der wahrscheinliche Werte kennt."],
            trustCenterAngle: "Hashing kann browserlokal laufen, aber Secrets und hochgeladene Dateiinhalte müssen vorsichtig behandelt und dürfen nicht persistiert werden.",
            comparisonRows: [{ factor: "Hauptzweck", byteflow: "Erzeuge MD5 oder SHA-256 lokal mit dem Hash-Generator für Checksums und Vergleiche.", other: "MD5 kann in Legacy-Systemen, vorhandenen Manifests und Kompatibilitätsdokumenten auftauchen.", note: "Kompatibilität ist nicht gleich Sicherheitseignung." }, { factor: "Sicherheitshaltung", byteflow: "Bevorzuge SHA-256 für neue Integritätsprüfungen und dokumentiere, warum schwächere Algorithmen vorhanden sind.", other: "MD5 sollte als Legacy-Checksum behandelt werden, nicht als kollisionsresistente Wahl.", note: "Nutze MD5 nicht für neue Passwort-, Signatur- oder Manipulationsschutz-Designs." }, { factor: "Eingabesensibilität", byteflow: "Hashing läuft lokal, aber sensible Eingaben können über Kopien, Logs, Screenshots oder gespeicherte Dateien leaken.", other: "Jede Online-Hash-Seite sollte vor Produktions-Secrets oder Dateien geprüft werden.", note: "Behandle Hashing nie automatisch als Anonymisierung." }],
            sections: [{ heading: "MD5 nur für Legacy-Kompatibilität", body: ["MD5 erscheint noch in alten Manifests, historischen Checksums und Systemen, die nicht sofort geändert werden können. Markiere es als Kompatibilitätsarbeit und erweitere es nicht auf neue sicherheitssensible Pfade."] }, { heading: "SHA-256 für moderne Integritätsprüfung", body: ["SHA-256 ist ein stärkerer Standard für Download-Artefakte, Release-Dateien und Datenaustausch zwischen Systemen. Für Herkunftssicherheit kombiniere es mit Signaturen oder authentifizierten Kanälen."] }],
            faq: [{ question: "Sollte ich neue MD5-Workflows erstellen?", answer: "Nur für explizite Legacy-Kompatibilität. Für neue Integritätsprüfungen nutze SHA-256 oder einen stärkeren von der Plattform geforderten Algorithmus." }, { question: "Verschlüsselt SHA-256 meine Daten?", answer: "Nein. SHA-256 erzeugt einen Digest und macht die Eingabe nicht vertraulich." }],
        },
        fr: {
            eyebrow: "Comparatif sécurité",
            title: "Comparatif MD5 et SHA-256",
            description: "Comparez MD5 et SHA-256 pour les checksums, la compatibilité et la vérification d'intégrité moderne.",
            intent: "Utilisez cette page pour choisir un algorithme de hash pour l'intégrité sans surestimer les garanties de sécurité.",
            summaryPoints: ["MD5 peut servir aux contrôles de compatibilité hérités, mais ne convient pas aux nouveaux designs sensibles.", "SHA-256 est le choix par défaut plus sûr pour l'intégrité moderne et de nombreux workflows sécurité.", "Un hash n'est pas un chiffrement et ne cache pas l'entrée à quelqu'un qui connaît des valeurs probables."],
            trustCenterAngle: "Le hash peut s'exécuter localement, mais les secrets et contenus de fichiers importés doivent rester protégés et ne pas être persistés.",
            comparisonRows: [{ factor: "Usage principal", byteflow: "Utilisez le Générateur de hash pour produire MD5 ou SHA-256 localement dans des workflows de checksum et comparaison.", other: "MD5 peut apparaître dans des systèmes hérités, manifests existants et documents de compatibilité.", note: "La compatibilité n'est pas une aptitude de sécurité." }, { factor: "Posture sécurité", byteflow: "Préférez SHA-256 pour les nouveaux contrôles d'intégrité et documentez la présence d'algorithmes plus faibles.", other: "MD5 doit être traité comme un checksum hérité, pas comme un choix résistant aux collisions.", note: "N'utilisez pas MD5 pour de nouveaux designs de mots de passe, signatures ou anti-altération." }, { factor: "Sensibilité de l'entrée", byteflow: "Le hash est local, mais une entrée sensible peut fuir par copie, logs, captures ou fichiers enregistrés.", other: "Toute page de hash en ligne doit être inspectée avant des secrets ou fichiers de production.", note: "Ne considérez jamais le hash comme une anonymisation par défaut." }],
            sections: [{ heading: "Utiliser MD5 seulement pour la compatibilité héritée", body: ["MD5 reste présent dans d'anciens manifests, checksums historiques et systèmes qui ne peuvent pas changer immédiatement. Signalez-le comme compatibilité et ne l'étendez pas à de nouveaux chemins sensibles."] }, { heading: "Utiliser SHA-256 pour l'intégrité moderne", body: ["SHA-256 est un meilleur défaut pour les artefacts téléchargés, fichiers de release et échanges entre systèmes. Ajoutez signatures ou canaux authentifiés lorsqu'une garantie d'origine est nécessaire."] }],
            faq: [{ question: "Faut-il créer un nouveau workflow MD5 ?", answer: "Seulement pour une compatibilité héritée explicite. Pour une nouvelle intégrité, préférez SHA-256 ou un algorithme plus fort exigé par la plateforme." }, { question: "SHA-256 chiffre-t-il mes données ?", answer: "Non. SHA-256 crée un digest ; il ne rend pas l'entrée confidentielle." }],
        },
    }
    return map[locale]
}

function hashComparisonCopyZhCN() { return localizedHashComparison("zh-CN") }
function hashComparisonCopyZhTW() { return localizedHashComparison("zh-TW") }
function hashComparisonCopyJa() { return localizedHashComparison("ja") }
function hashComparisonCopyKo() { return localizedHashComparison("ko") }
function hashComparisonCopyDe() { return localizedHashComparison("de") }
function hashComparisonCopyFr() { return localizedHashComparison("fr") }

function jwtHowToCopyEn(): GrowthPageCopy {
    return {
        eyebrow: "How-to",
        title: "How to decode JWT locally",
        description: "Decode JWT headers and payloads in the browser while keeping verification, claims, and sensitive token handling clear.",
        intent: "Use this workflow when you need to inspect a token safely and explain what was decoded versus what was verified.",
        summaryPoints: ["Use sample or redacted tokens first.", "Inspect header and payload claims without treating the result as verified.", "Move to a verification workflow only when you have the correct key and expected claims."],
        trustCenterAngle: "JWT pages are sensitive-input workflows; the Trust Center explains why token values must not enter storage, analytics, or logs.",
        steps: [{ name: "Prepare a sample token", text: "Use a non-production token or redact claim values before opening any debugging workflow.", toolKey: "jwt_decoder" }, { name: "Decode the header and payload", text: "Inspect algorithm, key id, issuer, audience, expiration, not-before, issued-at, and custom claims.", toolKey: "jwt_decoder" }, { name: "Separate decode from verification", text: "Record that a decoded token is only parsed. It is not trusted until signature and claims are verified.", toolKey: "jwt_workbench" }, { name: "Verify with the right key material", text: "Use the verifier only when you know the expected algorithm and have the matching secret or public key.", toolKey: "jwt_verifier" }],
        sections: [{ heading: "What local decoding gives you", body: ["Local decoding helps inspect structure, time-based claims, and obvious mistakes such as an unexpected alg value or missing audience."] }, { heading: "What local decoding does not prove", body: ["A decoded payload can be modified by anyone who can edit text. Authorization depends on signature verification and application policy."] }],
        faq: [{ question: "Can I decode a JWT without the secret?", answer: "Yes. Header and payload decoding does not require a secret, but signature verification does." }, { question: "Should I paste a customer token?", answer: "Avoid it. Use a test token, redact claims, or verify the local boundary with sample data first." }],
    }
}

function localizedJwtHowTo(locale: Locale): GrowthPageCopy {
    const map: Record<Locale, GrowthPageCopy> = {
        en: jwtHowToCopyEn(),
        "zh-CN": { eyebrow: "操作指南", title: "如何在本地解码 JWT", description: "在浏览器中解码 JWT header 和 payload，同时明确验证、claims 和敏感 token 处理边界。", intent: "当你需要安全检查 token，并说明哪些内容只是解码、哪些内容已经验证时，可使用此工作流。", summaryPoints: ["先使用样例或脱敏 token。", "检查 header 和 payload claims，但不要把结果视为已验证。", "只有具备正确密钥和预期 claims 时，再进入验证工作流。"], trustCenterAngle: "JWT 页面属于敏感输入工作流；隐私与信任中心解释 token 值为什么不能进入 storage、analytics 或日志。", steps: [{ name: "准备样例 token", text: "打开任何调试工作流前，使用非生产 token 或脱敏 claim 值。", toolKey: "jwt_decoder" }, { name: "解码 header 和 payload", text: "检查算法、key id、issuer、audience、expiration、not-before、issued-at 和自定义 claims。", toolKey: "jwt_decoder" }, { name: "区分解码与验证", text: "记录 decoded token 只是被解析；只有签名和 claims 验证通过后才可信。", toolKey: "jwt_workbench" }, { name: "使用正确密钥材料验证", text: "只有知道预期算法并具备匹配 secret 或 public key 时才使用验证器。", toolKey: "jwt_verifier" }], sections: [{ heading: "本地解码能给你什么", body: ["本地解码能帮助检查结构、时间类 claims，以及意外 alg 值或缺失 audience 等明显问题。"] }, { heading: "本地解码不能证明什么", body: ["任何能编辑文本的人都能修改 decoded payload。授权仍取决于签名验证和应用策略。"] }], faq: [{ question: "没有 secret 可以解码 JWT 吗？", answer: "可以。header 和 payload 解码不需要 secret，但签名验证需要。" }, { question: "应该粘贴客户 token 吗？", answer: "应避免。请使用测试 token、脱敏 claims，或先用样例数据验证本地边界。" }] },
        "zh-TW": { eyebrow: "操作指南", title: "如何在本地解碼 JWT", description: "在瀏覽器中解碼 JWT header 與 payload，同時明確驗證、claims 與敏感 token 處理邊界。", intent: "當你需要安全檢查 token，並說明哪些內容只是解碼、哪些內容已經驗證時，可使用此工作流。", summaryPoints: ["先使用範例或脫敏 token。", "檢查 header 與 payload claims，但不要把結果視為已驗證。", "只有具備正確金鑰和預期 claims 時，再進入驗證工作流。"], trustCenterAngle: "JWT 頁面屬於敏感輸入工作流；隱私與信任中心解釋 token 值為什麼不能進入 storage、analytics 或日誌。", steps: [{ name: "準備範例 token", text: "開啟任何偵錯工作流前，使用非正式 token 或脫敏 claim 值。", toolKey: "jwt_decoder" }, { name: "解碼 header 與 payload", text: "檢查演算法、key id、issuer、audience、expiration、not-before、issued-at 與自訂 claims。", toolKey: "jwt_decoder" }, { name: "區分解碼與驗證", text: "記錄 decoded token 只是被解析；只有簽章與 claims 驗證通過後才可信。", toolKey: "jwt_workbench" }, { name: "使用正確金鑰材料驗證", text: "只有知道預期演算法並具備匹配 secret 或 public key 時才使用驗證器。", toolKey: "jwt_verifier" }], sections: [{ heading: "本地解碼能給你什麼", body: ["本地解碼能協助檢查結構、時間類 claims，以及意外 alg 值或缺失 audience 等明顯問題。"] }, { heading: "本地解碼不能證明什麼", body: ["任何能編輯文字的人都能修改 decoded payload。授權仍取決於簽章驗證和應用策略。"] }], faq: [{ question: "沒有 secret 可以解碼 JWT 嗎？", answer: "可以。header 與 payload 解碼不需要 secret，但簽章驗證需要。" }, { question: "應該貼上客戶 token 嗎？", answer: "應避免。請使用測試 token、脫敏 claims，或先用範例資料驗證本地邊界。" }] },
        ja: { eyebrow: "手順", title: "JWT をローカルでデコードする方法", description: "ブラウザ内で JWT header と payload をデコードし、検証、claims、機密 token の扱いを明確にします。", intent: "token を安全に確認し、何がデコードで何が検証済みか説明する必要があるときに使います。", summaryPoints: ["まずサンプルまたはマスク済み token を使います。", "header と payload の claims を確認しますが、結果を検証済みと扱いません。", "正しい鍵と期待 claims がある場合だけ検証ワークフローへ進みます。"], trustCenterAngle: "JWT ページは機密入力ワークフローです。プライバシーと信頼センターは token 値を storage、analytics、ログに入れてはいけない理由を説明します。", steps: [{ name: "サンプル token を準備する", text: "デバッグワークフローを開く前に、非本番 token またはマスク済み claim 値を使います。", toolKey: "jwt_decoder" }, { name: "header と payload をデコードする", text: "アルゴリズム、key id、issuer、audience、expiration、not-before、issued-at、カスタム claims を確認します。", toolKey: "jwt_decoder" }, { name: "デコードと検証を分ける", text: "decoded token は解析されただけで、署名と claims が検証されるまでは信頼できないと記録します。", toolKey: "jwt_workbench" }, { name: "正しい鍵材料で検証する", text: "期待アルゴリズムと対応する secret または public key が分かる場合だけ検証器を使います。", toolKey: "jwt_verifier" }], sections: [{ heading: "ローカルデコードで分かること", body: ["構造、時刻系 claims、予期しない alg 値や audience 不足などの明らかな問題を確認できます。"] }, { heading: "ローカルデコードで証明できないこと", body: ["decoded payload はテキストを編集できる人なら変更できます。認可は署名検証とアプリケーションポリシーに依存します。"] }], faq: [{ question: "secret なしで JWT をデコードできますか？", answer: "はい。header と payload のデコードに secret は不要ですが、署名検証には必要です。" }, { question: "顧客 token を貼り付けるべきですか？", answer: "避けてください。テスト token、マスク済み claims、またはサンプルデータでのローカル境界確認を先に行います。" }] },
        ko: { eyebrow: "방법", title: "JWT를 로컬에서 디코딩하는 방법", description: "브라우저에서 JWT header와 payload를 디코딩하면서 검증, claims, 민감한 token 처리 경계를 명확히 합니다.", intent: "token을 안전하게 점검하고 무엇이 디코딩되었고 무엇이 검증되었는지 설명해야 할 때 사용합니다.", summaryPoints: ["먼저 샘플 또는 마스킹한 token을 사용합니다.", "header와 payload claims를 확인하되 결과를 검증된 것으로 취급하지 않습니다.", "올바른 키와 예상 claims가 있을 때만 검증 워크플로로 이동합니다."], trustCenterAngle: "JWT 페이지는 민감 입력 워크플로입니다. 개인정보 및 신뢰 센터는 token 값이 storage, analytics, 로그에 들어가면 안 되는 이유를 설명합니다.", steps: [{ name: "샘플 token 준비", text: "디버깅 워크플로를 열기 전에 운영이 아닌 token 또는 마스킹한 claim 값을 사용합니다.", toolKey: "jwt_decoder" }, { name: "header와 payload 디코딩", text: "알고리즘, key id, issuer, audience, expiration, not-before, issued-at, 사용자 정의 claims를 확인합니다.", toolKey: "jwt_decoder" }, { name: "디코딩과 검증 분리", text: "decoded token은 파싱된 것일 뿐이며 서명과 claims가 검증되기 전에는 신뢰할 수 없다고 기록합니다.", toolKey: "jwt_workbench" }, { name: "올바른 키 자료로 검증", text: "예상 알고리즘과 일치하는 secret 또는 public key를 알고 있을 때만 검증기를 사용합니다.", toolKey: "jwt_verifier" }], sections: [{ heading: "로컬 디코딩으로 알 수 있는 것", body: ["구조, 시간 기반 claims, 예상 밖의 alg 값이나 audience 누락 같은 명확한 문제를 확인할 수 있습니다."] }, { heading: "로컬 디코딩이 증명하지 못하는 것", body: ["decoded payload는 텍스트를 편집할 수 있는 누구나 바꿀 수 있습니다. 인가는 서명 검증과 애플리케이션 정책에 달려 있습니다."] }], faq: [{ question: "secret 없이 JWT를 디코딩할 수 있나요?", answer: "네. header와 payload 디코딩에는 secret이 필요 없지만 서명 검증에는 필요합니다." }, { question: "고객 token을 붙여넣어야 하나요?", answer: "피하세요. 테스트 token, 마스킹한 claims 또는 샘플 데이터로 로컬 경계를 먼저 확인하세요." }] },
        de: { eyebrow: "Anleitung", title: "JWT lokal decodieren", description: "Decodiere JWT-Header und Payload im Browser und halte Verifikation, Claims und sensible Token-Behandlung klar getrennt.", intent: "Nutze diesen Workflow, wenn du ein Token sicher prüfen und erklären musst, was decodiert und was verifiziert wurde.", summaryPoints: ["Nutze zuerst Beispiel- oder redigierte Tokens.", "Prüfe Header- und Payload-Claims, ohne das Ergebnis als verifiziert zu behandeln.", "Wechsle erst mit korrektem Schlüssel und erwarteten Claims in die Verifikation."], trustCenterAngle: "JWT-Seiten sind Workflows mit sensiblen Eingaben; das Datenschutz- und Vertrauenszentrum erklärt, warum Token-Werte nicht in Storage, Analytics oder Logs gehören.", steps: [{ name: "Beispiel-Token vorbereiten", text: "Nutze ein Nicht-Produktions-Token oder redigiere Claim-Werte vor jedem Debugging-Workflow.", toolKey: "jwt_decoder" }, { name: "Header und Payload decodieren", text: "Prüfe Algorithmus, key id, issuer, audience, expiration, not-before, issued-at und eigene Claims.", toolKey: "jwt_decoder" }, { name: "Decoding von Verifikation trennen", text: "Halte fest, dass ein decoded token nur geparst ist und erst nach Signatur- und Claim-Prüfung vertraut wird.", toolKey: "jwt_workbench" }, { name: "Mit richtigem Schlüsselmaterial verifizieren", text: "Nutze den Verifier nur, wenn Algorithmus und passendes Secret oder Public Key bekannt sind.", toolKey: "jwt_verifier" }], sections: [{ heading: "Was lokales Decoding zeigt", body: ["Du erkennst Struktur, zeitbasierte Claims und offensichtliche Fehler wie unerwartete alg-Werte oder fehlende audience."] }, { heading: "Was lokales Decoding nicht beweist", body: ["Ein decoded payload kann von jedem geändert werden, der Text bearbeiten kann. Autorisierung hängt von Signaturprüfung und App-Policy ab."] }], faq: [{ question: "Kann ich ein JWT ohne Secret decodieren?", answer: "Ja. Header und Payload benötigen kein Secret; Signaturprüfung schon." }, { question: "Sollte ich ein Kunden-Token einfügen?", answer: "Vermeide es. Nutze Test-Tokens, redigierte Claims oder prüfe die lokale Grenze zuerst mit Beispieldaten." }] },
        fr: { eyebrow: "Guide pratique", title: "Décoder un JWT localement", description: "Décodez header et payload JWT dans le navigateur tout en gardant claires la vérification, les claims et la gestion sensible des tokens.", intent: "Utilisez ce workflow pour inspecter un token en sécurité et expliquer ce qui a été décodé ou vérifié.", summaryPoints: ["Utilisez d'abord des tokens d'exemple ou expurgés.", "Inspectez header et payload sans considérer le résultat comme vérifié.", "Passez à la vérification seulement avec la bonne clé et les claims attendus."], trustCenterAngle: "Les pages JWT manipulent des entrées sensibles ; le Centre de confiance explique pourquoi les valeurs de token ne doivent pas entrer dans le stockage, l'analytics ou les logs.", steps: [{ name: "Préparer un token d'exemple", text: "Utilisez un token hors production ou expurgez les claims avant d'ouvrir un workflow de débogage.", toolKey: "jwt_decoder" }, { name: "Décoder header et payload", text: "Inspectez algorithme, key id, issuer, audience, expiration, not-before, issued-at et claims personnalisés.", toolKey: "jwt_decoder" }, { name: "Séparer décodage et vérification", text: "Notez qu'un decoded token est seulement analysé ; il n'est fiable qu'après vérification de signature et de claims.", toolKey: "jwt_workbench" }, { name: "Vérifier avec les bonnes clés", text: "Utilisez le vérificateur seulement si vous connaissez l'algorithme attendu et disposez du secret ou public key correspondant.", toolKey: "jwt_verifier" }], sections: [{ heading: "Ce que le décodage local apporte", body: ["Il aide à inspecter la structure, les claims temporels et des erreurs évidentes comme un alg inattendu ou une audience manquante."] }, { heading: "Ce que le décodage local ne prouve pas", body: ["Un decoded payload peut être modifié par toute personne qui édite du texte. L'autorisation dépend de la vérification de signature et de la politique applicative."] }], faq: [{ question: "Puis-je décoder un JWT sans secret ?", answer: "Oui. Le décodage du header et du payload ne nécessite pas de secret, contrairement à la vérification de signature." }, { question: "Dois-je coller un token client ?", answer: "Évitez. Utilisez un token de test, des claims expurgés ou vérifiez d'abord la limite locale avec des données d'exemple." }] },
    }
    return map[locale]
}

function jwtHowToCopyZhCN() { return localizedJwtHowTo("zh-CN") }
function jwtHowToCopyZhTW() { return localizedJwtHowTo("zh-TW") }
function jwtHowToCopyJa() { return localizedJwtHowTo("ja") }
function jwtHowToCopyKo() { return localizedJwtHowTo("ko") }
function jwtHowToCopyDe() { return localizedJwtHowTo("de") }
function jwtHowToCopyFr() { return localizedJwtHowTo("fr") }

function base64FixCopyEn(): GrowthPageCopy {
    return {
        eyebrow: "Troubleshooting",
        title: "Base64 invalid length fix",
        description: "Fix Base64 invalid length errors by checking padding, URL-safe alphabets, whitespace, and binary/text assumptions.",
        intent: "Use this page when a Base64 decoder rejects input or produces unreadable output during API, log, or token debugging.",
        summaryPoints: ["Invalid length often means missing padding or accidental truncation.", "URL-safe Base64 replaces + and / with - and _, so use the right alphabet before decoding.", "A successful decode can still be binary data, compressed data, or text in a different encoding."],
        trustCenterAngle: "Base64 values can contain tokens, file fragments, or logs. Keep raw input out of persistent storage and shared diagnostics.",
        steps: [{ name: "Remove transport noise", text: "Trim quotes, whitespace, line breaks, and copied prompt characters before retrying the decode.", toolKey: "base64_encode_decode" }, { name: "Check the alphabet", text: "If the value contains - or _, treat it as URL-safe Base64 or convert those characters before decoding.", toolKey: "url_encode_decode" }, { name: "Restore padding", text: "If length modulo 4 is 2, add ==; if it is 3, add =. If it is 1, the value is probably truncated.", toolKey: "base64_encode_decode" }, { name: "Confirm whether the result is text", text: "Decoded bytes may be binary, compressed, encrypted, or text in a different encoding." }],
        sections: [{ heading: "Why invalid length happens", body: ["Base64 encodes bytes in groups that commonly end with padding. Some transports remove padding, wrap lines, or switch to the URL-safe alphabet."] }, { heading: "What not to do", body: ["Do not keep adding random characters until the decoder accepts the string. That can produce a different byte stream and hide the upstream problem."] }],
        faq: [{ question: "How much padding should I add?", answer: "Add padding only to make the length divisible by 4: == for remainder 2, = for remainder 3. A remainder of 1 usually means truncation." }, { question: "Why is decoded output unreadable?", answer: "The decoded bytes may be binary, compressed, encrypted, or text using a different character encoding." }],
    }
}

function localizedBase64Fix(locale: Locale): GrowthPageCopy {
    const map: Record<Locale, GrowthPageCopy> = {
        en: base64FixCopyEn(),
        "zh-CN": { eyebrow: "排障", title: "Base64 长度错误修复", description: "通过检查 padding、URL-safe 字母表、空白字符和二进制/文本假设来修复 Base64 invalid length 错误。", intent: "当 Base64 解码器拒绝输入，或在 API、日志、token 调试中产生不可读输出时，可使用本页。", summaryPoints: ["invalid length 通常意味着缺少 padding 或被意外截断。", "URL-safe Base64 会用 - 和 _ 替代 + 和 /，解码前应选择正确字母表。", "成功解码后仍可能是二进制数据、压缩数据或其他编码文本。"], trustCenterAngle: "Base64 值可能包含 token、文件片段或日志。请避免把原始输入写入持久存储或共享诊断。", steps: [{ name: "移除传输噪声", text: "重试解码前，去掉引号、空白、换行和复制时带入的提示符字符。", toolKey: "base64_encode_decode" }, { name: "检查字母表", text: "如果值包含 - 或 _，请按 URL-safe Base64 处理，或在解码前转换这些字符。", toolKey: "url_encode_decode" }, { name: "恢复 padding", text: "长度模 4 为 2 时加 ==；为 3 时加 =。如果为 1，值很可能已被截断。", toolKey: "base64_encode_decode" }, { name: "确认结果是否为文本", text: "解码后的 bytes 可能是二进制、压缩、加密内容，或使用不同字符编码的文本。" }], sections: [{ heading: "为什么会出现 invalid length", body: ["Base64 按字节分组编码，末尾通常会有 padding。有些传输会移除 padding、换行包装，或切换到 URL-safe 字母表。"] }, { heading: "不要这样做", body: ["不要随意添加字符直到解码器接受字符串。那可能产生不同 byte stream，并掩盖上游问题。"] }], faq: [{ question: "应该添加多少 padding？", answer: "只添加让长度能被 4 整除的 padding：余数为 2 加 ==，余数为 3 加 =。余数为 1 通常表示截断。" }, { question: "为什么解码输出不可读？", answer: "解码后的 bytes 可能是二进制、压缩、加密内容，或使用不同字符编码的文本。" }] },
        "zh-TW": { eyebrow: "排障", title: "Base64 長度錯誤修復", description: "透過檢查 padding、URL-safe 字母表、空白字元和二進位/文字假設來修復 Base64 invalid length 錯誤。", intent: "當 Base64 解碼器拒絕輸入，或在 API、日誌、token 偵錯中產生不可讀輸出時，可使用本頁。", summaryPoints: ["invalid length 通常表示缺少 padding 或被意外截斷。", "URL-safe Base64 會用 - 和 _ 取代 + 和 /，解碼前應選擇正確字母表。", "成功解碼後仍可能是二進位資料、壓縮資料或其他編碼文字。"], trustCenterAngle: "Base64 值可能包含 token、檔案片段或日誌。請避免把原始輸入寫入持久儲存或共享診斷。", steps: [{ name: "移除傳輸雜訊", text: "重試解碼前，去掉引號、空白、換行和複製時帶入的提示符字元。", toolKey: "base64_encode_decode" }, { name: "檢查字母表", text: "如果值包含 - 或 _，請按 URL-safe Base64 處理，或在解碼前轉換這些字元。", toolKey: "url_encode_decode" }, { name: "恢復 padding", text: "長度模 4 為 2 時加 ==；為 3 時加 =。如果為 1，值很可能已被截斷。", toolKey: "base64_encode_decode" }, { name: "確認結果是否為文字", text: "解碼後的 bytes 可能是二進位、壓縮、加密內容，或使用不同字元編碼的文字。" }], sections: [{ heading: "為什麼會出現 invalid length", body: ["Base64 按位元組分組編碼，末尾通常會有 padding。有些傳輸會移除 padding、換行包裝，或切換到 URL-safe 字母表。"] }, { heading: "不要這樣做", body: ["不要隨意新增字元直到解碼器接受字串。那可能產生不同 byte stream，並掩蓋上游問題。"] }], faq: [{ question: "應該加入多少 padding？", answer: "只加入讓長度能被 4 整除的 padding：餘數為 2 加 ==，餘數為 3 加 =。餘數為 1 通常表示截斷。" }, { question: "為什麼解碼輸出不可讀？", answer: "解碼後的 bytes 可能是二進位、壓縮、加密內容，或使用不同字元編碼的文字。" }] },
        ja: { eyebrow: "トラブルシュート", title: "Base64 の長さエラーを修正する", description: "padding、URL-safe 文字、空白、バイナリ/テキストの前提を確認して Base64 invalid length エラーを修正します。", intent: "API、ログ、token デバッグで Base64 デコードが拒否される、または読めない出力になる場合に使います。", summaryPoints: ["invalid length は padding 不足または意図しない切り詰めを示すことが多いです。", "URL-safe Base64 は + と / を - と _ に置き換えるため、正しい文字セットでデコードします。", "デコード成功後も、結果はバイナリ、圧縮データ、別エンコーディングのテキストかもしれません。"], trustCenterAngle: "Base64 値には token、ファイル断片、ログが含まれることがあります。生入力を永続保存や共有診断に入れないでください。", steps: [{ name: "転送ノイズを除去する", text: "再デコード前に引用符、空白、改行、コピー時のプロンプト文字を取り除きます。", toolKey: "base64_encode_decode" }, { name: "文字セットを確認する", text: "- または _ が含まれる場合は URL-safe Base64 として扱うか、デコード前に変換します。", toolKey: "url_encode_decode" }, { name: "padding を戻す", text: "長さ mod 4 が 2 なら ==、3 なら = を追加します。1 の場合は切り詰めの可能性が高いです。", toolKey: "base64_encode_decode" }, { name: "結果がテキストか確認する", text: "デコードされた bytes はバイナリ、圧縮、暗号化内容、または別文字エンコーディングのテキストかもしれません。" }], sections: [{ heading: "invalid length が起きる理由", body: ["Base64 は bytes をグループ化してエンコードし、多くの場合末尾に padding が付きます。転送経路によって padding 削除、改行、URL-safe 形式への切替が起こります。"] }, { heading: "避けるべきこと", body: ["デコーダーが受け付けるまでランダムな文字を追加しないでください。別の byte stream が生成され、上流の問題を隠すことがあります。"] }], faq: [{ question: "padding はどれだけ追加しますか？", answer: "長さが 4 で割り切れる分だけ追加します。余り 2 は ==、余り 3 は =。余り 1 は通常切り詰めです。" }, { question: "なぜデコード結果が読めないのですか？", answer: "デコードされた bytes はバイナリ、圧縮、暗号化内容、または別の文字エンコーディングのテキストかもしれません。" }] },
        ko: { eyebrow: "문제 해결", title: "Base64 길이 오류 해결", description: "padding, URL-safe 문자, 공백, 바이너리/텍스트 가정을 확인해 Base64 invalid length 오류를 해결합니다.", intent: "API, 로그, token 디버깅 중 Base64 디코더가 입력을 거부하거나 읽을 수 없는 출력을 만들 때 사용합니다.", summaryPoints: ["invalid length는 대개 padding 누락 또는 의도치 않은 잘림을 뜻합니다.", "URL-safe Base64는 +와 /를 -와 _로 바꾸므로 디코딩 전 올바른 알파벳을 선택해야 합니다.", "디코딩이 성공해도 결과는 바이너리, 압축 데이터, 다른 인코딩의 텍스트일 수 있습니다."], trustCenterAngle: "Base64 값에는 token, 파일 조각, 로그가 포함될 수 있습니다. 원본 입력을 지속 저장소나 공유 진단에 넣지 마세요.", steps: [{ name: "전송 노이즈 제거", text: "다시 디코딩하기 전에 따옴표, 공백, 줄바꿈, 복사된 프롬프트 문자를 제거합니다.", toolKey: "base64_encode_decode" }, { name: "알파벳 확인", text: "값에 - 또는 _가 있으면 URL-safe Base64로 처리하거나 디코딩 전에 변환합니다.", toolKey: "url_encode_decode" }, { name: "padding 복원", text: "길이 mod 4가 2이면 ==, 3이면 =를 추가합니다. 1이면 값이 잘렸을 가능성이 큽니다.", toolKey: "base64_encode_decode" }, { name: "결과가 텍스트인지 확인", text: "디코딩된 bytes는 바이너리, 압축, 암호화 내용 또는 다른 문자 인코딩의 텍스트일 수 있습니다." }], sections: [{ heading: "invalid length가 발생하는 이유", body: ["Base64는 bytes를 그룹으로 인코딩하며 보통 끝에 padding이 붙습니다. 일부 전송 경로는 padding을 제거하거나 줄을 나누거나 URL-safe 알파벳으로 바꿉니다."] }, { heading: "하지 말아야 할 일", body: ["디코더가 받아들일 때까지 임의 문자를 계속 추가하지 마세요. 다른 byte stream을 만들고 상위 문제를 숨길 수 있습니다."] }], faq: [{ question: "padding은 얼마나 추가해야 하나요?", answer: "길이가 4로 나누어떨어지도록만 추가합니다. 나머지 2는 ==, 3은 =입니다. 나머지 1은 보통 잘림을 의미합니다." }, { question: "왜 디코딩 출력이 읽히지 않나요?", answer: "디코딩된 bytes는 바이너리, 압축, 암호화 내용 또는 다른 문자 인코딩의 텍스트일 수 있습니다." }] },
        de: { eyebrow: "Fehlerbehebung", title: "Base64-Längenfehler beheben", description: "Behebe Base64 invalid length durch Prüfung von Padding, URL-safe Alphabet, Leerraum und Binary/Text-Annahmen.", intent: "Nutze diese Seite, wenn ein Base64-Decoder Eingaben ablehnt oder bei API-, Log- oder Token-Debugging unlesbare Ausgabe erzeugt.", summaryPoints: ["Invalid length bedeutet oft fehlendes Padding oder versehentliche Kürzung.", "URL-safe Base64 ersetzt + und / durch - und _, daher muss vor dem Decoding das richtige Alphabet gewählt werden.", "Ein erfolgreiches Decoding kann weiterhin Binärdaten, komprimierte Daten oder Text in anderer Kodierung ergeben."], trustCenterAngle: "Base64-Werte können Tokens, Dateifragmente oder Logs enthalten. Rohdaten gehören nicht in dauerhaften Storage oder geteilte Diagnosen.", steps: [{ name: "Transport-Rauschen entfernen", text: "Entferne Anführungszeichen, Leerraum, Zeilenumbrüche und kopierte Prompt-Zeichen vor dem erneuten Decoding.", toolKey: "base64_encode_decode" }, { name: "Alphabet prüfen", text: "Wenn der Wert - oder _ enthält, behandle ihn als URL-safe Base64 oder konvertiere die Zeichen vor dem Decoding.", toolKey: "url_encode_decode" }, { name: "Padding wiederherstellen", text: "Bei Länge modulo 4 gleich 2 füge == hinzu; bei 3 füge = hinzu. Bei 1 ist der Wert vermutlich gekürzt.", toolKey: "base64_encode_decode" }, { name: "Textausgabe prüfen", text: "Decodierte Bytes können binär, komprimiert, verschlüsselt oder Text in einer anderen Kodierung sein." }], sections: [{ heading: "Warum invalid length entsteht", body: ["Base64 kodiert Bytes in Gruppen, die häufig mit Padding enden. Manche Transporte entfernen Padding, umbrechen Zeilen oder wechseln zum URL-safe Alphabet."] }, { heading: "Was du nicht tun solltest", body: ["Füge nicht zufällig Zeichen hinzu, bis der Decoder akzeptiert. Das kann einen anderen Byte-Stream erzeugen und das eigentliche Upstream-Problem verdecken."] }], faq: [{ question: "Wie viel Padding soll ich hinzufügen?", answer: "Nur so viel, dass die Länge durch 4 teilbar ist: == bei Rest 2, = bei Rest 3. Rest 1 deutet meist auf Kürzung hin." }, { question: "Warum ist die decodierte Ausgabe unlesbar?", answer: "Die Bytes können binär, komprimiert, verschlüsselt oder Text in einer anderen Zeichenkodierung sein." }] },
        fr: { eyebrow: "Diagnostic", title: "Corriger une longueur Base64 invalide", description: "Corrigez les erreurs Base64 invalid length en vérifiant padding, alphabet URL-safe, espaces et hypothèses binaire/texte.", intent: "Utilisez cette page lorsqu'un décodeur Base64 refuse l'entrée ou produit une sortie illisible pendant un diagnostic API, log ou token.", summaryPoints: ["Invalid length signifie souvent padding manquant ou troncature accidentelle.", "Base64 URL-safe remplace + et / par - et _, il faut donc choisir le bon alphabet avant de décoder.", "Un décodage réussi peut encore produire des données binaires, compressées ou du texte dans un autre encodage."], trustCenterAngle: "Les valeurs Base64 peuvent contenir tokens, fragments de fichiers ou logs. Gardez l'entrée brute hors du stockage persistant et des diagnostics partagés.", steps: [{ name: "Retirer le bruit de transport", text: "Supprimez guillemets, espaces, retours ligne et caractères de prompt copiés avant de réessayer.", toolKey: "base64_encode_decode" }, { name: "Vérifier l'alphabet", text: "Si la valeur contient - ou _, traitez-la comme Base64 URL-safe ou convertissez ces caractères avant décodage.", toolKey: "url_encode_decode" }, { name: "Restaurer le padding", text: "Si longueur modulo 4 vaut 2, ajoutez == ; si elle vaut 3, ajoutez =. Si elle vaut 1, la valeur est probablement tronquée.", toolKey: "base64_encode_decode" }, { name: "Confirmer si le résultat est du texte", text: "Les bytes décodés peuvent être binaires, compressés, chiffrés ou du texte dans un autre encodage." }], sections: [{ heading: "Pourquoi invalid length se produit", body: ["Base64 encode les bytes par groupes qui se terminent souvent par du padding. Certains transports retirent le padding, coupent les lignes ou passent à l'alphabet URL-safe."] }, { heading: "Ce qu'il ne faut pas faire", body: ["N'ajoutez pas des caractères au hasard jusqu'à ce que le décodeur accepte. Cela peut produire un autre flux de bytes et masquer le problème amont."] }], faq: [{ question: "Combien de padding ajouter ?", answer: "Ajoutez seulement ce qui rend la longueur divisible par 4 : == pour un reste de 2, = pour un reste de 3. Un reste de 1 indique souvent une troncature." }, { question: "Pourquoi la sortie décodée est-elle illisible ?", answer: "Les bytes décodés peuvent être binaires, compressés, chiffrés ou du texte dans un autre encodage." }] },
    }
    return map[locale]
}

function base64FixCopyZhCN() { return localizedBase64Fix("zh-CN") }
function base64FixCopyZhTW() { return localizedBase64Fix("zh-TW") }
function base64FixCopyJa() { return localizedBase64Fix("ja") }
function base64FixCopyKo() { return localizedBase64Fix("ko") }
function base64FixCopyDe() { return localizedBase64Fix("de") }
function base64FixCopyFr() { return localizedBase64Fix("fr") }

type ComparisonSeed = GrowthPageCopy

function getComparisonTermLocalization(): Record<Locale, Record<string, string>> {
    return {
        en: {},
        "zh-CN": {
            "JSON Formatter": "JSON 格式化工具",
            "JSON Validator": "JSON 校验",
            "JSON Diff Viewer": "JSON 差异对比",
            "JSON to TypeScript": "JSON 转 TypeScript",
            "Base64 Encode/Decode": "Base64 编码/解码",
            "Base64 Encoding": "Base64 编码",
            "Encryption": "加密",
            "HAR Sanitizer": "HAR 脱敏器",
            "Log Scrubber": "日志脱敏工具",
            "cURL to Code": "cURL 转代码",
            "HTTP Request Builder": "HTTP 请求构建器",
            "SVG Optimizer": "SVG 优化器",
            "SVG Converter": "SVG 转换器",
            "Related tools": "相关工具",
            "Related Tools": "相关工具",
        },
        "zh-TW": {
            "JSON Formatter": "JSON 格式化工具",
            "JSON Validator": "JSON 驗證",
            "JSON Diff Viewer": "JSON 差異比對",
            "JSON to TypeScript": "JSON 轉 TypeScript",
            "Base64 Encode/Decode": "Base64 編碼/解碼",
            "Base64 Encoding": "Base64 編碼",
            "Encryption": "加密",
            "HAR Sanitizer": "HAR 脫敏器",
            "Log Scrubber": "日誌脫敏工具",
            "cURL to Code": "cURL 轉程式碼",
            "HTTP Request Builder": "HTTP 請求建構器",
            "SVG Optimizer": "SVG 最佳化工具",
            "SVG Converter": "SVG 轉換器",
            "Related tools": "相關工具",
            "Related Tools": "相關工具",
        },
        ja: {
            "JSON Formatter": "JSON フォーマッター",
            "JSON Validator": "JSON バリデーター",
            "JSON Diff Viewer": "JSON 差分ビューワー",
            "JSON to TypeScript": "JSON から TypeScript へ変換",
            "Base64 Encode/Decode": "Base64 エンコード/デコード",
            "Base64 Encoding": "Base64 エンコード",
            "Encryption": "暗号化",
            "HAR Sanitizer": "HAR サニタイザー",
            "Log Scrubber": "ログスクラバー",
            "cURL to Code": "cURL→コード変換",
            "HTTP Request Builder": "HTTPリクエストビルダー",
            "SVG Optimizer": "SVG オプティマイザー",
            "SVG Converter": "SVG コンバーター",
            "Related tools": "関連ツール",
            "Related Tools": "関連ツール",
        },
        ko: {
            "JSON Formatter": "JSON 포매터",
            "JSON Validator": "JSON 검증기",
            "JSON Diff Viewer": "JSON 차이 확인",
            "JSON to TypeScript": "JSON을 TypeScript로 변환",
            "Base64 Encode/Decode": "Base64 인코딩/디코딩",
            "Base64 Encoding": "Base64 인코딩",
            "Encryption": "암호화",
            "HAR Sanitizer": "HAR 삭제 도구",
            "Log Scrubber": "로그 스크러버",
            "cURL to Code": "cURL → 코드 변환",
            "HTTP Request Builder": "HTTP 요청 빌더",
            "SVG Optimizer": "SVG 최적화 도구",
            "SVG Converter": "SVG 변환기",
            "Related tools": "관련 도구",
            "Related Tools": "관련 도구",
        },
        de: {
            "JSON Formatter": "JSON-Formatter",
            "JSON Validator": "JSON-Validator",
            "JSON Diff Viewer": "JSON-Diff-Viewer",
            "JSON to TypeScript": "JSON zu TypeScript",
            "Base64 Encode/Decode": "Base64 kodieren/dekodieren",
            "Base64 Encoding": "Base64-Kodierung",
            "Encryption": "Verschlüsselung",
            "HAR Sanitizer": "HAR-Bereiniger",
            "Log Scrubber": "Log-Bereiniger",
            "cURL to Code": "cURL → Code",
            "HTTP Request Builder": "HTTP-Anfrage-Builder",
            "SVG Optimizer": "SVG-Optimierer",
            "SVG Converter": "SVG-Konverter",
            "Related tools": "Verwandte Tools",
            "Related Tools": "Verwandte Tools",
        },
        fr: {
            "JSON Formatter": "Formateur JSON",
            "JSON Validator": "Validateur JSON",
            "JSON Diff Viewer": "Visualiseur de diff JSON",
            "JSON to TypeScript": "JSON vers TypeScript",
            "Base64 Encode/Decode": "Encodage/Décodage Base64",
            "Base64 Encoding": "Encodage Base64",
            "Encryption": "chiffrement",
            "HAR Sanitizer": "Assainisseur HAR",
            "Log Scrubber": "Nettoyeur de logs",
            "cURL to Code": "cURL vers Code",
            "HTTP Request Builder": "Constructeur de requêtes HTTP",
            "SVG Optimizer": "Optimiseur SVG",
            "SVG Converter": "Convertisseur SVG",
            "Related tools": "Outils connexes",
            "Related Tools": "Outils connexes",
        },
    }
}

function localizeComparisonTerms(value: string, locale: Locale) {
    const replacements = getComparisonTermLocalization()[locale]
    return Object.entries(replacements)
        .sort(([left], [right]) => right.length - left.length)
        .reduce((current, [source, replacement]) => current.replaceAll(source, replacement), value)
}

function getComparisonLocaleCopy(): Record<Locale, {
    eyebrowPrefix: string
    titlePrefix: string
    descriptionPrefix: string
    intentPrefix: string
    summaryPrefix: string
    trustPrefix: string
    factorSuffix: string
    byteflowPrefix: string
    otherPrefix: string
    notePrefix: string
    sectionPrefix: string
    faqQuestionPrefix: string
    faqAnswerPrefix: string
}> {
    return {
        en: {
        eyebrowPrefix: "",
        titlePrefix: "",
        descriptionPrefix: "",
        intentPrefix: "",
        summaryPrefix: "",
        trustPrefix: "",
        factorSuffix: "",
        byteflowPrefix: "",
        otherPrefix: "",
        notePrefix: "",
        sectionPrefix: "",
        faqQuestionPrefix: "",
        faqAnswerPrefix: "",
    },
    "zh-CN": {
        eyebrowPrefix: "对比",
        titlePrefix: "对比：",
        descriptionPrefix: "决策框架：",
        intentPrefix: "使用场景：",
        summaryPrefix: "要点：",
        trustPrefix: "隐私边界：",
        factorSuffix: "（决策因素）",
        byteflowPrefix: "Byteflow 本地流程：",
        otherPrefix: "另一种选择：",
        notePrefix: "实践说明：",
        sectionPrefix: "实践判断：",
        faqQuestionPrefix: "常见问题：",
        faqAnswerPrefix: "回答：",
    },
    "zh-TW": {
        eyebrowPrefix: "比較",
        titlePrefix: "比較：",
        descriptionPrefix: "決策框架：",
        intentPrefix: "使用情境：",
        summaryPrefix: "重點：",
        trustPrefix: "隱私邊界：",
        factorSuffix: "（決策因素）",
        byteflowPrefix: "Byteflow 本地流程：",
        otherPrefix: "另一種選擇：",
        notePrefix: "實務說明：",
        sectionPrefix: "實務判斷：",
        faqQuestionPrefix: "常見問題：",
        faqAnswerPrefix: "回答：",
    },
    ja: {
        eyebrowPrefix: "比較",
        titlePrefix: "比較：",
        descriptionPrefix: "判断フレーム：",
        intentPrefix: "利用場面：",
        summaryPrefix: "要点：",
        trustPrefix: "プライバシー境界：",
        factorSuffix: "（判断項目）",
        byteflowPrefix: "Byteflow のローカル手順：",
        otherPrefix: "別の選択肢：",
        notePrefix: "実務メモ：",
        sectionPrefix: "実務判断：",
        faqQuestionPrefix: "質問：",
        faqAnswerPrefix: "回答：",
    },
    ko: {
        eyebrowPrefix: "비교",
        titlePrefix: "비교: ",
        descriptionPrefix: "결정 기준: ",
        intentPrefix: "사용 상황: ",
        summaryPrefix: "요점: ",
        trustPrefix: "개인정보 경계: ",
        factorSuffix: " (결정 항목)",
        byteflowPrefix: "Byteflow 로컬 흐름: ",
        otherPrefix: "다른 선택지: ",
        notePrefix: "실무 메모: ",
        sectionPrefix: "실무 판단: ",
        faqQuestionPrefix: "질문: ",
        faqAnswerPrefix: "답변: ",
    },
    de: {
        eyebrowPrefix: "Vergleich",
        titlePrefix: "Vergleich: ",
        descriptionPrefix: "Entscheidungsrahmen: ",
        intentPrefix: "Einsatzfall: ",
        summaryPrefix: "Kernpunkt: ",
        trustPrefix: "Datenschutzgrenze: ",
        factorSuffix: " (Kriterium)",
        byteflowPrefix: "Byteflow lokaler Ablauf: ",
        otherPrefix: "Andere Option: ",
        notePrefix: "Praxisnotiz: ",
        sectionPrefix: "Praktische Einordnung: ",
        faqQuestionPrefix: "Frage: ",
        faqAnswerPrefix: "Antwort: ",
    },
    fr: {
        eyebrowPrefix: "Comparatif",
        titlePrefix: "Comparatif : ",
        descriptionPrefix: "Cadre de décision : ",
        intentPrefix: "Cas d'usage : ",
        summaryPrefix: "Point clé : ",
        trustPrefix: "Limite de confidentialité : ",
        factorSuffix: " (critère)",
        byteflowPrefix: "Flux local Byteflow : ",
        otherPrefix: "Autre option : ",
        notePrefix: "Note pratique : ",
        sectionPrefix: "Lecture pratique : ",
        faqQuestionPrefix: "Question : ",
        faqAnswerPrefix: "Réponse : ",
        },
    }
}

function localizeComparisonSeed(seed: ComparisonSeed, locale: Locale): GrowthPageCopy {
    if (locale === "en") return seed
    const copy = getComparisonLocaleCopy()[locale]
    return {
        eyebrow: copy.eyebrowPrefix,
        title: `${copy.titlePrefix}${localizeComparisonTerms(seed.title, locale)}`,
        description: `${copy.descriptionPrefix}${localizeComparisonTerms(seed.description, locale)}`,
        intent: `${copy.intentPrefix}${localizeComparisonTerms(seed.intent, locale)}`,
        summaryPoints: seed.summaryPoints.map((point) => `${copy.summaryPrefix}${localizeComparisonTerms(point, locale)}`),
        trustCenterAngle: `${copy.trustPrefix}${localizeComparisonTerms(seed.trustCenterAngle, locale)}`,
        comparisonRows: seed.comparisonRows?.map((row) => ({
            factor: `${localizeComparisonTerms(row.factor, locale)}${copy.factorSuffix}`,
            byteflow: `${copy.byteflowPrefix}${localizeComparisonTerms(row.byteflow, locale)}`,
            other: `${copy.otherPrefix}${localizeComparisonTerms(row.other, locale)}`,
            note: `${copy.notePrefix}${localizeComparisonTerms(row.note, locale)}`,
        })),
        sections: seed.sections.map((section) => ({
            heading: `${copy.sectionPrefix}${localizeComparisonTerms(section.heading, locale)}`,
            body: section.body.map((paragraph) => `${copy.sectionPrefix}${localizeComparisonTerms(paragraph, locale)}`),
            bullets: section.bullets?.map((bullet) => `${copy.summaryPrefix}${localizeComparisonTerms(bullet, locale)}`),
        })),
        faq: seed.faq.map((item) => ({
            question: `${copy.faqQuestionPrefix}${localizeComparisonTerms(item.question, locale)}`,
            answer: `${copy.faqAnswerPrefix}${localizeComparisonTerms(item.answer, locale)}`,
        })),
    }
}

function comparisonPageCopy(seed: ComparisonSeed): Record<Locale, GrowthPageCopy> {
    return {
        en: seed,
        "zh-CN": localizeComparisonSeed(seed, "zh-CN"),
        "zh-TW": localizeComparisonSeed(seed, "zh-TW"),
        ja: localizeComparisonSeed(seed, "ja"),
        ko: localizeComparisonSeed(seed, "ko"),
        de: localizeComparisonSeed(seed, "de"),
        fr: localizeComparisonSeed(seed, "fr"),
    }
}

export function getGrowthPage(slug: GrowthPageSlug) {
    return GROWTH_PAGES.find((page) => page.slug === slug)
}

export function getGrowthIndex(slug: GrowthIndexSlug) {
    return GROWTH_INDEXES.find((index) => index.slug === slug)
}

export function getGrowthPagesByKind(kind: GrowthPageKind) {
    return GROWTH_PAGES.filter((page) => page.kind === kind)
}

export function getGrowthPageCopy(slug: GrowthPageSlug, locale: Locale) {
    return getGrowthPage(slug)?.copy[locale] ?? null
}
