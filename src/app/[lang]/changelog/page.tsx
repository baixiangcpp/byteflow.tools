import Link from "next/link"
import { notFound } from "next/navigation"
import { GitPullRequest, Sparkles } from "lucide-react"
import type { Locale } from "@/core/i18n/i18n"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

const CHANGELOG_COPY: Record<Locale, {
    badge: string
    intro: string
    roadmapLink: string
    entries: Array<{ date: string; title: string; items: string[] }>
}> = {
    en: {
        badge: "Release notes",
        intro: "Recent updates across browser-local tools, privacy copy, technical SEO, accessibility, and public planning.",
        roadmapLink: "View roadmap",
        entries: [
            {
                date: "2026-06-24",
                title: "Discovery, accessibility, and privacy polish",
                items: [
                    "Related tools explain why each recommendation is useful.",
                    "UUID batches support pagination and local export formats.",
                    "llms.txt is generated from source metadata for answer engines.",
                    "Trust Center links are closer to sensitive and external-request flows.",
                ],
            },
            {
                date: "2026-06-23",
                title: "Content, schema, and Trust Center growth",
                items: [
                    "Tool and category structured data expanded.",
                    "Localized guide quality gates improved.",
                    "Security reporting path and Trust Center surfaces clarified.",
                ],
            },
        ],
    },
    "zh-CN": {
        badge: "发布记录",
        intro: "记录浏览器本地工具、隐私文案、技术 SEO、无障碍和公开规划的近期更新。",
        roadmapLink: "查看路线图",
        entries: [
            {
                date: "2026-06-24",
                title: "发现体验、无障碍与隐私打磨",
                items: [
                    "相关工具会说明每个推荐的用途。",
                    "UUID 批量生成支持分页和本地导出格式。",
                    "llms.txt 从源元数据生成，服务于答案引擎发现。",
                    "信任中心链接更靠近敏感输入和外部请求流程。",
                ],
            },
            {
                date: "2026-06-23",
                title: "内容、结构化数据与信任中心扩展",
                items: [
                    "扩展工具页和分类页结构化数据。",
                    "改进本地化指南质量门禁。",
                    "澄清安全报告路径和信任中心入口。",
                ],
            },
        ],
    },
    "zh-TW": {
        badge: "發布記錄",
        intro: "記錄瀏覽器本地工具、隱私文案、技術 SEO、無障礙與公開規劃的近期更新。",
        roadmapLink: "查看路線圖",
        entries: [
            {
                date: "2026-06-24",
                title: "發現體驗、無障礙與隱私打磨",
                items: [
                    "相關工具會說明每個推薦的用途。",
                    "UUID 批量生成支援分頁和本地匯出格式。",
                    "llms.txt 從來源元資料生成，服務於答案引擎發現。",
                    "信任中心連結更靠近敏感輸入和外部請求流程。",
                ],
            },
            {
                date: "2026-06-23",
                title: "內容、結構化資料與信任中心擴展",
                items: [
                    "擴展工具頁和分類頁結構化資料。",
                    "改善本地化指南品質門禁。",
                    "釐清安全報告路徑和信任中心入口。",
                ],
            },
        ],
    },
    ja: {
        badge: "リリースノート",
        intro: "ブラウザローカルツール、プライバシー文言、技術 SEO、アクセシビリティ、公開計画の最近の更新です。",
        roadmapLink: "ロードマップを見る",
        entries: [
            {
                date: "2026-06-24",
                title: "発見性、アクセシビリティ、プライバシー改善",
                items: [
                    "関連ツールが各おすすめの理由を説明するようになりました。",
                    "UUID の一括生成にページングとローカルエクスポートを追加しました。",
                    "llms.txt をソースメタデータから生成するようにしました。",
                    "信頼センターのリンクを機密入力と外部リクエストの近くに配置しました。",
                ],
            },
            {
                date: "2026-06-23",
                title: "コンテンツ、構造化データ、信頼センター拡張",
                items: [
                    "ツールとカテゴリの構造化データを拡張しました。",
                    "ローカライズ済みガイドの品質ゲートを改善しました。",
                    "セキュリティ報告経路と信頼センター導線を明確にしました。",
                ],
            },
        ],
    },
    ko: {
        badge: "릴리스 노트",
        intro: "브라우저 로컬 도구, 개인정보 보호 문구, 기술 SEO, 접근성, 공개 계획의 최근 업데이트입니다.",
        roadmapLink: "로드맵 보기",
        entries: [
            {
                date: "2026-06-24",
                title: "발견성, 접근성, 개인정보 보호 개선",
                items: [
                    "관련 도구가 각 추천의 이유를 설명합니다.",
                    "UUID 일괄 생성에 페이지네이션과 로컬 내보내기 형식을 추가했습니다.",
                    "llms.txt를 소스 메타데이터에서 생성합니다.",
                    "신뢰 센터 링크를 민감 입력 및 외부 요청 흐름 가까이에 배치했습니다.",
                ],
            },
            {
                date: "2026-06-23",
                title: "콘텐츠, 구조화 데이터, 신뢰 센터 확장",
                items: [
                    "도구와 카테고리 구조화 데이터를 확장했습니다.",
                    "현지화 가이드 품질 게이트를 개선했습니다.",
                    "보안 신고 경로와 신뢰 센터 표면을 명확히 했습니다.",
                ],
            },
        ],
    },
    de: {
        badge: "Versionshinweise",
        intro: "Aktuelle Änderungen an browser-lokalen Tools, Datenschutztexten, technischer SEO, Barrierefreiheit und öffentlicher Planung.",
        roadmapLink: "Roadmap ansehen",
        entries: [
            {
                date: "2026-06-24",
                title: "Auffindbarkeit, Barrierefreiheit und Datenschutz",
                items: [
                    "Verwandte Tools erklären, warum eine Empfehlung nützlich ist.",
                    "UUID-Batches unterstützen Paginierung und lokale Exportformate.",
                    "llms.txt wird aus Quellmetadaten für Antwortmaschinen generiert.",
                    "Links zum Vertrauenszentrum liegen näher an sensiblen und externen Abläufen.",
                ],
            },
            {
                date: "2026-06-23",
                title: "Inhalt, Schema und Vertrauenszentrum",
                items: [
                    "Strukturierte Daten für Tools und Kategorien wurden erweitert.",
                    "Qualitätsprüfungen für lokalisierte Guides wurden verbessert.",
                    "Sicherheitsmeldeweg und Vertrauenszentrum wurden klarer gemacht.",
                ],
            },
        ],
    },
    fr: {
        badge: "Notes de version",
        intro: "Mises à jour récentes des outils locaux au navigateur, textes de confidentialité, SEO technique, accessibilité et planification publique.",
        roadmapLink: "Voir la feuille de route",
        entries: [
            {
                date: "2026-06-24",
                title: "Découverte, accessibilité et confidentialité",
                items: [
                    "Les outils associés expliquent l’utilité de chaque recommandation.",
                    "Les lots UUID prennent en charge la pagination et les exports locaux.",
                    "llms.txt est généré depuis les métadonnées source pour les moteurs de réponse.",
                    "Les liens vers le centre de confiance sont plus proches des flux sensibles et externes.",
                ],
            },
            {
                date: "2026-06-23",
                title: "Contenu, schéma et centre de confiance",
                items: [
                    "Les données structurées des outils et catégories ont été étendues.",
                    "Les garde-fous qualité des guides localisés ont été améliorés.",
                    "Le chemin de signalement sécurité et les surfaces de confiance sont clarifiés.",
                ],
            },
        ],
    },
}

export default async function ChangelogPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()
    const t = getTranslation(lang)
    const copy = CHANGELOG_COPY[lang]

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8">
            <section className="rounded-lg border border-border/70 bg-card/55 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{copy.badge}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.pages.changelog_title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {copy.intro}
                </p>
            </section>

            <section className="space-y-4">
                {copy.entries.map((entry) => (
                    <article key={entry.date} className="rounded-lg border border-border/70 bg-background/55 p-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold">{entry.title}</h2>
                            <time className="text-xs font-medium text-muted-foreground">{entry.date}</time>
                        </div>
                        <ul className="mt-3 space-y-2">
                            {entry.items.map((item) => (
                                <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </section>

            <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${lang}/roadmap`}>
                <GitPullRequest className="h-4 w-4" aria-hidden="true" />
                {copy.roadmapLink}
            </Link>
        </div>
    )
}
