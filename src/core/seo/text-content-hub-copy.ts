import type { Locale } from "@/core/i18n/i18n"

type FeaturedWorkflow = {
    toolKey: string
    title: string
    description: string
}

type TextContentHubFaq = {
    question: string
    answer: string
}

export type TextContentHubCopy = {
    eyebrow: string
    metaDescription: string
    intro: string
    detail: string
    highlightsTitle: string
    highlights: string[]
    workflowsTitle: string
    workflowsIntro: string
    workflows: FeaturedWorkflow[]
    workflowStepsTitle: string
    workflowSteps: string[]
    faqTitle: string
    faqs: TextContentHubFaq[]
}

const SHARED_WORKFLOWS: FeaturedWorkflow[] = [
    {
        toolKey: "letter_counter",
        title: "Count words and characters",
        description: "Measure titles, snippets, and draft length before you publish or ship copy.",
    },
    {
        toolKey: "multiple_whitespace_remover",
        title: "Clean spacing before publishing",
        description: "Collapse repeated spaces and line-break noise after copy/paste from docs, AI drafts, or spreadsheets.",
    },
    {
        toolKey: "slugify_case_converter",
        title: "Prepare clean slugs and case variants",
        description: "Turn headlines into URL-safe slugs or switch between common naming styles.",
    },
    {
        toolKey: "text_diff_checker",
        title: "Compare revisions or approvals",
        description: "Spot exactly what changed between two drafts before review, localization, or release.",
    },
]

export const TEXT_CONTENT_HUB_COPY: Record<Locale, TextContentHubCopy> = {
    en: {
        eyebrow: "Writing and cleanup workflow",
        metaDescription: "Explore browser-based text and content tools for word counts, whitespace cleanup, markdown checks, slug prep, and draft comparison.",
        intro: "This hub groups the text utilities that are most useful before publishing docs, landing pages, blog posts, release notes, and support content.",
        detail: "Use it when you need quick counts, whitespace fixes, slug preparation, markdown review, or side-by-side draft comparison without sending copy to a server.",
        highlightsTitle: "What this hub helps with",
        highlights: [
            "Check length and structure before a page, email, or changelog goes live.",
            "Normalize whitespace, casing, and URL-safe slugs across reused content blocks.",
            "Compare revisions and preview markdown output while keeping the workflow local in the browser.",
        ],
        workflowsTitle: "Popular text workflows",
        workflowsIntro: "Start from the job you need to finish, then jump into the exact tool.",
        workflows: SHARED_WORKFLOWS,
        workflowStepsTitle: "Suggested review flow",
        workflowSteps: [
            "Run a quick count first so titles, snippets, and CTA blocks fit the target surface.",
            "Clean whitespace and normalize casing or slug format before reusing the text in docs, CMS fields, or filenames.",
            "Finish with diff or markdown preview checks to confirm the final version is ready to publish.",
        ],
        faqTitle: "Text workflow FAQ",
        faqs: [
            {
                question: "What can I do from this text and content hub?",
                answer: "You can count text, remove extra whitespace, convert casing or slugs, compare revisions, preview markdown, and then jump into other related content utilities.",
            },
            {
                question: "Which tool should I start with for blog or SEO copy?",
                answer: "Start with the letter counter when you need length checks, then use whitespace cleanup or slug conversion, and finish with diff review if multiple drafts are involved.",
            },
            {
                question: "Do these text tools upload my content?",
                answer: "Most text utilities on byteflow.tools run locally in the browser, so routine cleanup and comparison work can stay on-device.",
            },
        ],
    },
    "zh-CN": {
        eyebrow: "写作与清理工作流",
        metaDescription: "汇总字数统计、空白清理、Markdown 检查、Slug 生成和文本对比等本地文本处理工具。",
        intro: "这个 hub 把发布文档、落地页、博客、更新日志和帮助中心内容前最常用的文本工具集中到了一页。",
        detail: "当你需要快速统计字数、清理空白、生成 slug、检查 Markdown 或对比多个版本时，可以从这里开始，而且无需把文本发送到服务器。",
        highlightsTitle: "这个 hub 适合解决什么问题",
        highlights: [
            "上线前检查标题、摘要、邮件文案或更新说明的长度与结构。",
            "统一重复使用内容中的空白、大小写和 URL slug 格式。",
            "在浏览器本地完成版本对比与 Markdown 预览，减少内容返工。",
        ],
        workflowsTitle: "常见文本工作流",
        workflowsIntro: "先按任务进入，再跳到最合适的工具。",
        workflows: [
            {
                toolKey: "letter_counter",
                title: "统计字数和字符数",
                description: "发布前检查标题、摘要、社媒文案和正文长度是否合适。",
            },
            {
                toolKey: "multiple_whitespace_remover",
                title: "发布前清理多余空白",
                description: "清除从文档、AI 草稿或表格复制后产生的多余空格和换行噪音。",
            },
            {
                toolKey: "slugify_case_converter",
                title: "生成干净 slug 和大小写格式",
                description: "把标题转换成 URL slug，或在常见命名风格之间快速切换。",
            },
            {
                toolKey: "text_diff_checker",
                title: "比较修订稿与审批稿",
                description: "在评审、翻译交接或发布前准确找出两个版本的差异。",
            },
        ],
        workflowStepsTitle: "建议处理顺序",
        workflowSteps: [
            "先做一次字数统计，确认标题、摘要和 CTA 文案适配目标位置。",
            "再清理空白并统一大小写或 slug 格式，方便复用到文档、CMS 字段或文件名中。",
            "最后用 diff 或 Markdown 预览确认最终版本可以直接发布。",
        ],
        faqTitle: "文本处理常见问题",
        faqs: [
            {
                question: "这个文本与内容 hub 能做什么？",
                answer: "你可以在这里完成字数统计、空白清理、slug 转换、版本对比、Markdown 预览，并继续进入其他相关内容工具。",
            },
            {
                question: "写博客或 SEO 文案时应该先用哪个工具？",
                answer: "先用字数统计检查长度，再做空白清理或 slug 转换；如果有多个版本，再补一次文本对比。",
            },
            {
                question: "这些文本工具会上传我的内容吗？",
                answer: "byteflow.tools 上的大多数文本工具都在浏览器本地运行，常规清理和对比流程通常不需要把文本发到服务器。",
            },
        ],
    },
    "zh-TW": {
        eyebrow: "寫作與清理流程",
        metaDescription: "整合字數統計、空白整理、Markdown 檢查、Slug 產生與文本差異比對等本地文字工具。",
        intro: "這個 hub 把發佈文件、落地頁、部落格、更新說明與說明中心內容前最常用的文字工具集中在同一頁。",
        detail: "當你需要快速計數、整理空白、產生 slug、檢查 Markdown 或比對多個版本時，可以直接從這裡開始，而且不必把內容送到伺服器。",
        highlightsTitle: "這個 hub 適合處理什麼",
        highlights: [
            "上線前檢查標題、摘要、郵件文案或更新說明的長度與結構。",
            "統一重複使用內容中的空白、大小寫與 URL slug 格式。",
            "在瀏覽器本地完成版本比對與 Markdown 預覽，降低返工成本。",
        ],
        workflowsTitle: "常見文字流程",
        workflowsIntro: "先從任務切入，再跳到最合適的工具。",
        workflows: [
            {
                toolKey: "letter_counter",
                title: "統計字數與字元數",
                description: "發佈前檢查標題、摘要、社群文案與正文長度是否合適。",
            },
            {
                toolKey: "multiple_whitespace_remover",
                title: "發佈前整理多餘空白",
                description: "清除從文件、AI 草稿或表格貼上後產生的多餘空格與換行雜訊。",
            },
            {
                toolKey: "slugify_case_converter",
                title: "建立乾淨 slug 與大小寫格式",
                description: "把標題轉成 URL slug，或在常見命名格式之間快速切換。",
            },
            {
                toolKey: "text_diff_checker",
                title: "比較修訂稿與核稿版本",
                description: "在審稿、翻譯交接或發佈前精確找出兩份草稿的差異。",
            },
        ],
        workflowStepsTitle: "建議處理順序",
        workflowSteps: [
            "先做一次字數統計，確認標題、摘要與 CTA 文案符合目標版位。",
            "再整理空白並統一大小寫或 slug 格式，方便重用到文件、CMS 欄位或檔名。",
            "最後用 diff 或 Markdown 預覽確認最終版本可以直接發佈。",
        ],
        faqTitle: "文字流程常見問題",
        faqs: [
            {
                question: "這個文字與內容 hub 可以做什麼？",
                answer: "你可以在這裡完成字數統計、空白整理、slug 轉換、版本比對、Markdown 預覽，並繼續進入其他相關內容工具。",
            },
            {
                question: "寫部落格或 SEO 文案時該先用哪個工具？",
                answer: "先用字數統計檢查長度，再做空白整理或 slug 轉換；如果有多個版本，再補一次文本比對。",
            },
            {
                question: "這些文字工具會上傳我的內容嗎？",
                answer: "byteflow.tools 上的大多數文字工具都在瀏覽器本地執行，日常整理與比對通常不需要把內容送到伺服器。",
            },
        ],
    },
    ja: {
        eyebrow: "執筆と整形のワークフロー",
        metaDescription: "文字数確認、空白整理、Markdown チェック、slug 作成、差分比較をまとめたローカル実行のテキストハブです。",
        intro: "この hub では、ドキュメント、LP、ブログ、リリースノート、ヘルプ記事を公開する前によく使うテキスト系ツールをまとめています。",
        detail: "文字数確認、空白の整理、slug 生成、Markdown の確認、下書き同士の比較を、テキストをサーバーへ送らずに始めたいときに使えます。",
        highlightsTitle: "この hub でできること",
        highlights: [
            "公開前にタイトル、説明文、メール文面、更新告知の長さと構成を確認できます。",
            "再利用する文章の空白、ケース、URL slug を揃えられます。",
            "ブラウザ内で差分確認や Markdown プレビューを行い、確認フローを短縮できます。",
        ],
        workflowsTitle: "よくあるテキスト作業",
        workflowsIntro: "やりたい作業から入り、そのまま適切なツールへ進めます。",
        workflows: [
            {
                toolKey: "letter_counter",
                title: "文字数と単語数を確認する",
                description: "公開前にタイトル、要約、SNS 文面、本文の長さを確認します。",
            },
            {
                toolKey: "multiple_whitespace_remover",
                title: "公開前に余分な空白を整理する",
                description: "ドキュメント、AI 下書き、表計算から貼り付けた後の余分な空白や改行を整えます。",
            },
            {
                toolKey: "slugify_case_converter",
                title: "slug とケース表記を整える",
                description: "見出しを URL 用の slug に変換したり、命名規則を切り替えたりできます。",
            },
            {
                toolKey: "text_diff_checker",
                title: "修正版同士を比較する",
                description: "レビュー、翻訳受け渡し、公開前にどこが変わったかを正確に確認できます。",
            },
        ],
        workflowStepsTitle: "おすすめの確認順",
        workflowSteps: [
            "まず文字数を確認し、タイトルや説明文、CTA が掲載面に収まるかを把握します。",
            "次に空白やケース、slug を整えて、ドキュメントや CMS、ファイル名へ再利用しやすくします。",
            "最後に diff または Markdown プレビューで、公開前の最終状態を確認します。",
        ],
        faqTitle: "テキスト作業 FAQ",
        faqs: [
            {
                question: "このテキストとコンテンツ hub では何ができますか？",
                answer: "文字数確認、空白整理、slug 変換、差分比較、Markdown プレビューを行い、そのまま関連する他のツールへ進めます。",
            },
            {
                question: "ブログや SEO 用の文章なら最初にどのツールを使うべきですか？",
                answer: "長さ確認が必要なら文字数カウンターから始め、その後に空白整理や slug 変換を行い、複数案がある場合は最後に差分比較を使うのが分かりやすいです。",
            },
            {
                question: "これらのテキストツールは文章をアップロードしますか？",
                answer: "byteflow.tools の多くのテキストツールはブラウザ内で動作するため、通常の整形や比較作業はローカルで完結します。",
            },
        ],
    },
    ko: {
        eyebrow: "작성 및 정리 워크플로",
        metaDescription: "글자 수 확인, 공백 정리, Markdown 점검, slug 생성, 초안 비교를 한곳에 모은 로컬 텍스트 도구 허브입니다.",
        intro: "이 hub 는 문서, 랜딩 페이지, 블로그, 릴리스 노트, 도움말 콘텐츠를 발행하기 전에 자주 쓰는 텍스트 도구를 한곳에 모아 둡니다.",
        detail: "글자 수 확인, 공백 정리, slug 준비, Markdown 검토, 초안 비교를 서버 업로드 없이 빠르게 시작하고 싶을 때 이 페이지에서 바로 들어갈 수 있습니다.",
        highlightsTitle: "이 hub 가 도와주는 작업",
        highlights: [
            "게시 전에 제목, 요약, 이메일 문구, 변경 로그의 길이와 구조를 점검할 수 있습니다.",
            "재사용하는 콘텐츠 블록의 공백, 대소문자, URL slug 형식을 정리할 수 있습니다.",
            "브라우저 안에서 diff 확인과 Markdown 미리보기를 끝내며 검수 흐름을 줄일 수 있습니다.",
        ],
        workflowsTitle: "자주 쓰는 텍스트 작업",
        workflowsIntro: "하려는 작업부터 고른 뒤 바로 맞는 도구로 이동하세요.",
        workflows: [
            {
                toolKey: "letter_counter",
                title: "단어 수와 글자 수 확인",
                description: "게시 전에 제목, 요약, 소셜 문구, 본문 길이를 빠르게 점검합니다.",
            },
            {
                toolKey: "multiple_whitespace_remover",
                title: "게시 전 공백 정리",
                description: "문서, AI 초안, 스프레드시트에서 붙여넣은 뒤 생긴 불필요한 공백과 줄바꿈을 정리합니다.",
            },
            {
                toolKey: "slugify_case_converter",
                title: "slug 와 케이스 형식 정리",
                description: "헤드라인을 URL slug 로 바꾸거나 자주 쓰는 명명 규칙으로 전환합니다.",
            },
            {
                toolKey: "text_diff_checker",
                title: "수정본과 승인본 비교",
                description: "리뷰, 번역 전달, 배포 전에 무엇이 바뀌었는지 정확히 확인합니다.",
            },
        ],
        workflowStepsTitle: "권장 검토 순서",
        workflowSteps: [
            "먼저 글자 수를 확인해 제목, 요약, CTA 문구가 들어갈 위치에 맞는지 봅니다.",
            "그다음 공백을 정리하고 케이스나 slug 형식을 맞춰 문서, CMS 필드, 파일명에 재사용하기 쉽게 만듭니다.",
            "마지막으로 diff 또는 Markdown 미리보기로 최종본이 바로 게시 가능한지 확인합니다.",
        ],
        faqTitle: "텍스트 작업 FAQ",
        faqs: [
            {
                question: "이 텍스트 및 콘텐츠 hub 에서 무엇을 할 수 있나요?",
                answer: "글자 수 확인, 공백 정리, slug 변환, 버전 비교, Markdown 미리보기를 수행하고 다른 관련 콘텐츠 도구로 이어서 이동할 수 있습니다.",
            },
            {
                question: "블로그나 SEO 문구라면 어떤 도구부터 시작해야 하나요?",
                answer: "길이 확인이 필요하면 글자 수 도구부터 시작하고, 이후 공백 정리나 slug 변환을 진행한 뒤 초안이 여러 개면 마지막에 diff 비교를 쓰는 흐름이 좋습니다.",
            },
            {
                question: "이 텍스트 도구들이 내용을 업로드하나요?",
                answer: "byteflow.tools 의 대부분 텍스트 도구는 브라우저에서 로컬로 동작하므로 일반적인 정리와 비교 작업은 기기 안에서 끝낼 수 있습니다.",
            },
        ],
    },
    de: {
        eyebrow: "Schreiben und Bereinigen",
        metaDescription: "Browserbasierter Hub für Zeichenzählung, Leerzeichen-Bereinigung, Markdown-Prüfung, Slug-Erstellung und Textvergleich.",
        intro: "Dieser Hub bündelt die Textwerkzeuge, die vor der Veröffentlichung von Dokumentation, Landingpages, Blogposts, Release Notes und Hilfecopy am häufigsten gebraucht werden.",
        detail: "Nutzen Sie ihn, wenn Sie schnell Längen prüfen, Leerraum bereinigen, Slugs vorbereiten, Markdown kontrollieren oder Entwürfe vergleichen möchten, ohne Text an einen Server zu senden.",
        highlightsTitle: "Wobei dieser Hub hilft",
        highlights: [
            "Länge und Struktur prüfen, bevor eine Seite, E-Mail oder ein Changelog live geht.",
            "Leerraum, Schreibweisen und URL-Slugs über wiederverwendete Content-Blöcke hinweg vereinheitlichen.",
            "Revisionen vergleichen und Markdown lokal im Browser prüfen.",
        ],
        workflowsTitle: "Typische Text-Workflows",
        workflowsIntro: "Starten Sie mit der Aufgabe und springen Sie dann direkt in das passende Werkzeug.",
        workflows: [
            {
                toolKey: "letter_counter",
                title: "Wörter und Zeichen zählen",
                description: "Prüfen Sie Titel, Snippets und Entwurfslängen vor Veröffentlichung oder Versand.",
            },
            {
                toolKey: "multiple_whitespace_remover",
                title: "Abstände vor der Veröffentlichung bereinigen",
                description: "Entfernen Sie doppelte Leerzeichen und Zeilenumbrüche nach Copy-Paste aus Docs, KI-Entwürfen oder Tabellen.",
            },
            {
                toolKey: "slugify_case_converter",
                title: "Saubere Slugs und Schreibweisen vorbereiten",
                description: "Wandeln Sie Überschriften in URL-Slugs um oder wechseln Sie zwischen gängigen Namensformaten.",
            },
            {
                toolKey: "text_diff_checker",
                title: "Revisionen oder Freigaben vergleichen",
                description: "Sehen Sie exakt, was sich zwischen zwei Fassungen vor Review, Lokalisierung oder Release geändert hat.",
            },
        ],
        workflowStepsTitle: "Empfohlener Prüfablauf",
        workflowSteps: [
            "Zuerst die Länge prüfen, damit Titel, Snippets und CTAs in die Zieloberfläche passen.",
            "Dann Leerraum bereinigen und Schreibweise oder Slug-Format vereinheitlichen, bevor der Text in Docs, CMS-Felder oder Dateinamen übernommen wird.",
            "Zum Schluss Diff oder Markdown-Vorschau verwenden, um die veröffentlichungsreife Fassung zu bestätigen.",
        ],
        faqTitle: "FAQ zu Text-Workflows",
        faqs: [
            {
                question: "Was kann ich in diesem Text- und Content-Hub erledigen?",
                answer: "Sie können Text zählen, Leerraum bereinigen, Slugs oder Schreibweisen umwandeln, Versionen vergleichen, Markdown prüfen und anschließend weitere passende Tools öffnen.",
            },
            {
                question: "Mit welchem Tool beginne ich bei Blog- oder SEO-Texten?",
                answer: "Starten Sie mit dem Zähler für Längenprüfungen, nutzen Sie danach Bereinigung oder Slug-Konvertierung und schließen Sie mit einem Diff ab, wenn mehrere Entwürfe im Spiel sind.",
            },
            {
                question: "Laden diese Texttools meinen Inhalt hoch?",
                answer: "Die meisten Textwerkzeuge auf byteflow.tools laufen lokal im Browser, sodass normale Bereinigung und Vergleich direkt auf dem Gerät bleiben können.",
            },
        ],
    },
    fr: {
        eyebrow: "Rédaction et nettoyage",
        metaDescription: "Hub de texte local dans le navigateur pour comptage, nettoyage des espaces, vérification Markdown, préparation de slugs et comparaison de brouillons.",
        intro: "Ce hub regroupe les outils texte les plus utiles avant de publier de la documentation, des landing pages, des articles, des notes de version ou du contenu d'aide.",
        detail: "Utilisez-le pour vérifier rapidement une longueur, nettoyer les espaces, préparer un slug, relire du Markdown ou comparer deux brouillons sans envoyer le texte vers un serveur.",
        highlightsTitle: "Ce que ce hub aide à faire",
        highlights: [
            "Vérifier la longueur et la structure avant de publier une page, un email ou un changelog.",
            "Uniformiser espaces, casse et slugs URL dans des blocs de contenu réutilisés.",
            "Comparer des révisions et prévisualiser du Markdown en local dans le navigateur.",
        ],
        workflowsTitle: "Workflows texte fréquents",
        workflowsIntro: "Partez de la tâche à terminer, puis ouvrez directement l'outil adapté.",
        workflows: [
            {
                toolKey: "letter_counter",
                title: "Compter mots et caractères",
                description: "Mesurez titres, extraits et longueur de brouillon avant publication.",
            },
            {
                toolKey: "multiple_whitespace_remover",
                title: "Nettoyer les espaces avant publication",
                description: "Supprimez les espaces répétés et retours de ligne parasites après un copier-coller depuis des docs, brouillons IA ou tableaux.",
            },
            {
                toolKey: "slugify_case_converter",
                title: "Préparer des slugs et casses propres",
                description: "Transformez un titre en slug URL ou basculez entre plusieurs styles de nommage.",
            },
            {
                toolKey: "text_diff_checker",
                title: "Comparer révisions ou validations",
                description: "Repérez exactement ce qui a changé entre deux versions avant revue, localisation ou mise en ligne.",
            },
        ],
        workflowStepsTitle: "Flux de vérification conseillé",
        workflowSteps: [
            "Commencez par le comptage pour vérifier que titres, extraits et CTA tiennent dans la surface visée.",
            "Nettoyez ensuite les espaces et normalisez la casse ou le slug avant réutilisation dans la doc, le CMS ou les noms de fichiers.",
            "Terminez avec un diff ou une prévisualisation Markdown pour confirmer que la version finale est prête à être publiée.",
        ],
        faqTitle: "FAQ workflow texte",
        faqs: [
            {
                question: "Que puis-je faire depuis ce hub texte et contenu ?",
                answer: "Vous pouvez compter du texte, nettoyer les espaces, convertir la casse ou les slugs, comparer des versions, prévisualiser du Markdown puis ouvrir d'autres utilitaires liés au contenu.",
            },
            {
                question: "Par quel outil commencer pour un texte SEO ou un article ?",
                answer: "Commencez par le compteur si vous devez contrôler la longueur, utilisez ensuite le nettoyage ou la conversion de slug, puis terminez par un diff s'il existe plusieurs brouillons.",
            },
            {
                question: "Ces outils texte envoient-ils mon contenu ?",
                answer: "La plupart des utilitaires texte de byteflow.tools fonctionnent localement dans le navigateur, donc les tâches courantes de nettoyage et comparaison peuvent rester sur l'appareil.",
            },
        ],
    },
}

export function getTextContentHubCopy(locale: Locale): TextContentHubCopy {
    return TEXT_CONTENT_HUB_COPY[locale] ?? TEXT_CONTENT_HUB_COPY.en
}
