import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, GitPullRequest, Map, ShieldCheck } from "lucide-react"
import type { Locale } from "@/core/i18n/i18n"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

const ROADMAP_COPY: Record<Locale, {
    badge: string
    intro: string
    changelogLink: string
    productBoundaryTitle: string
    productBoundaryBody: string
    items: Array<{ title: string; status: string; body: string }>
}> = {
    en: {
        badge: "Public planning",
        intro: "The roadmap prioritizes browser-local utility, privacy-visible workflows, and sustainable open-source maintenance. It does not propose accounts, cloud history, or server-side payload processing.",
        changelogLink: "Changelog",
        productBoundaryTitle: "Product boundary",
        productBoundaryBody: "New features must preserve local-first behavior by default. Public requests should use sanitized examples and must not include production secrets, private payloads, customer data, tokens, logs, or screenshots containing sensitive content.",
        items: [
            { title: "Core privacy and trust", status: "Active", body: "Keep sensitive-input warnings, external-request confirmations, Trust Center links, and storage guards aligned with manifests." },
            { title: "Tool UX polish", status: "Active", body: "Improve local batch workflows, export controls, mobile layouts, keyboard paths, and actionable validation states." },
            { title: "Content and discovery", status: "Active", body: "Add higher-quality comparison, guide, workflow, and llms.txt surfaces without mass-generating thin pages." },
            { title: "Distribution research", status: "Exploring", body: "Evaluate whether PWA, browser extension, or desktop wrapper access can preserve local-only processing with low maintenance risk." },
        ],
    },
    "zh-CN": {
        badge: "公开规划",
        intro: "路线图优先关注浏览器本地工具、清晰可见的隐私工作流，以及可持续的开源维护。它不计划账号、云端历史或服务端 payload 处理。",
        changelogLink: "更新日志",
        productBoundaryTitle: "产品边界",
        productBoundaryBody: "新功能默认必须保持本地优先。公开请求应使用脱敏示例，不能包含生产密钥、私有 payload、客户数据、token、日志或含敏感内容的截图。",
        items: [
            { title: "核心隐私与信任", status: "进行中", body: "让敏感输入提示、外部请求确认、信任中心链接和存储守卫持续与 manifest 保持一致。" },
            { title: "工具体验打磨", status: "进行中", body: "改进本地批量流程、导出控制、移动端布局、键盘路径和可操作的校验状态。" },
            { title: "内容与发现", status: "进行中", body: "增加更高质量的比较、指南、工作流和 llms.txt 入口，避免批量生成低质量页面。" },
            { title: "分发研究", status: "探索中", body: "评估 PWA、浏览器扩展或桌面封装是否能以低维护风险保留仅本地处理。" },
        ],
    },
    "zh-TW": {
        badge: "公開規劃",
        intro: "路線圖優先關注瀏覽器本地工具、清晰可見的隱私工作流程，以及可持續的開源維護。它不計畫帳號、雲端歷史或服務端 payload 處理。",
        changelogLink: "更新日誌",
        productBoundaryTitle: "產品邊界",
        productBoundaryBody: "新功能預設必須保持本地優先。公開請求應使用脫敏範例，不能包含正式環境密鑰、私有 payload、客戶資料、token、日誌或含敏感內容的截圖。",
        items: [
            { title: "核心隱私與信任", status: "進行中", body: "讓敏感輸入提示、外部請求確認、信任中心連結和儲存守衛持續與 manifest 保持一致。" },
            { title: "工具體驗打磨", status: "進行中", body: "改善本地批量流程、匯出控制、行動端版面、鍵盤路徑和可操作的驗證狀態。" },
            { title: "內容與發現", status: "進行中", body: "增加更高品質的比較、指南、工作流程和 llms.txt 入口，避免批量生成薄內容頁面。" },
            { title: "分發研究", status: "探索中", body: "評估 PWA、瀏覽器擴充功能或桌面封裝是否能以低維護風險保留僅本地處理。" },
        ],
    },
    ja: {
        badge: "公開計画",
        intro: "ロードマップは、ブラウザローカルの実用性、見えるプライバシーワークフロー、持続可能なオープンソース保守を優先します。アカウント、クラウド履歴、サーバー側 payload 処理は計画していません。",
        changelogLink: "変更履歴",
        productBoundaryTitle: "プロダクト境界",
        productBoundaryBody: "新機能は既定でローカル優先を維持する必要があります。公開リクエストにはサニタイズ済み例だけを使い、本番シークレット、非公開 payload、顧客データ、token、ログ、機密スクリーンショットを含めないでください。",
        items: [
            { title: "プライバシーと信頼", status: "進行中", body: "機密入力警告、外部リクエスト確認、信頼センターリンク、保存ガードを manifest と一致させ続けます。" },
            { title: "ツール体験の改善", status: "進行中", body: "ローカル一括処理、エクスポート、モバイルレイアウト、キーボード操作、実用的な検証状態を改善します。" },
            { title: "コンテンツと発見性", status: "進行中", body: "比較、ガイド、ワークフロー、llms.txt を高品質に増やし、薄いページの量産は避けます。" },
            { title: "配布方式調査", status: "調査中", body: "PWA、ブラウザ拡張、デスクトップラッパーが低い保守リスクでローカル処理を保てるか評価します。" },
        ],
    },
    ko: {
        badge: "공개 계획",
        intro: "로드맵은 브라우저 로컬 유틸리티, 눈에 보이는 개인정보 보호 워크플로, 지속 가능한 오픈소스 유지보수를 우선합니다. 계정, 클라우드 기록, 서버 측 payload 처리는 제안하지 않습니다.",
        changelogLink: "변경 로그",
        productBoundaryTitle: "제품 경계",
        productBoundaryBody: "새 기능은 기본적으로 로컬 우선 동작을 유지해야 합니다. 공개 요청에는 정리된 예시만 사용하고 운영 비밀값, 비공개 payload, 고객 데이터, token, 로그, 민감한 스크린샷을 포함하지 않아야 합니다.",
        items: [
            { title: "핵심 개인정보 보호와 신뢰", status: "진행 중", body: "민감 입력 경고, 외부 요청 확인, 신뢰 센터 링크, 저장 가드를 manifest와 계속 맞춥니다." },
            { title: "도구 UX 개선", status: "진행 중", body: "로컬 일괄 워크플로, 내보내기 제어, 모바일 레이아웃, 키보드 경로, 실행 가능한 검증 상태를 개선합니다." },
            { title: "콘텐츠와 발견성", status: "진행 중", body: "비교, 가이드, 워크플로, llms.txt 표면을 더 높은 품질로 추가하고 얇은 페이지 대량 생성을 피합니다." },
            { title: "배포 연구", status: "탐색 중", body: "PWA, 브라우저 확장, 데스크톱 래퍼가 낮은 유지보수 위험으로 로컬 전용 처리를 보존할 수 있는지 평가합니다." },
        ],
    },
    de: {
        badge: "Öffentliche Planung",
        intro: "Die Roadmap priorisiert browser-lokale Werkzeuge, sichtbare Datenschutzabläufe und nachhaltige Open-Source-Wartung. Konten, Cloud-Verlauf oder serverseitige Payload-Verarbeitung sind nicht vorgesehen.",
        changelogLink: "Änderungsprotokoll",
        productBoundaryTitle: "Produktgrenze",
        productBoundaryBody: "Neue Funktionen müssen standardmäßig lokal bleiben. Öffentliche Anfragen sollen bereinigte Beispiele verwenden und dürfen keine Produktionsgeheimnisse, privaten Payloads, Kundendaten, Token, Logs oder sensiblen Screenshots enthalten.",
        items: [
            { title: "Kernbereiche Datenschutz und Vertrauen", status: "Aktiv", body: "Warnungen für sensible Eingaben, Bestätigungen externer Anfragen, Links zum Vertrauenszentrum und Speicher-Gates bleiben mit Manifests abgeglichen." },
            { title: "Tool-UX verbessern", status: "Aktiv", body: "Lokale Batch-Workflows, Exportsteuerung, mobile Layouts, Tastaturpfade und hilfreiche Validierungszustände werden verbessert." },
            { title: "Inhalt und Auffindbarkeit", status: "Aktiv", body: "Hochwertigere Vergleichs-, Guide-, Workflow- und llms.txt-Flächen werden ergänzt, ohne dünne Seiten massenhaft zu erzeugen." },
            { title: "Distributionsforschung", status: "In Prüfung", body: "PWA, Browser-Erweiterung und Desktop-Wrapper werden darauf geprüft, ob lokale Verarbeitung mit geringem Wartungsrisiko erhalten bleibt." },
        ],
    },
    fr: {
        badge: "Planification publique",
        intro: "La feuille de route privilégie les outils locaux au navigateur, les flux confidentialité visibles et une maintenance open source durable. Elle ne prévoit pas de comptes, d’historique cloud ni de traitement serveur des payloads.",
        changelogLink: "Journal des changements",
        productBoundaryTitle: "Limite produit",
        productBoundaryBody: "Les nouvelles fonctionnalités doivent rester local-first par défaut. Les demandes publiques doivent utiliser des exemples nettoyés et ne jamais inclure secrets de production, payloads privés, données client, tokens, logs ou captures sensibles.",
        items: [
            { title: "Confidentialité et confiance", status: "Actif", body: "Garder les avertissements d’entrée sensible, confirmations de requête externe, liens vers le centre de confiance et garde-fous de stockage alignés avec les manifests." },
            { title: "Amélioration UX des outils", status: "Actif", body: "Améliorer les flux batch locaux, contrôles d’export, mises en page mobile, parcours clavier et états de validation actionnables." },
            { title: "Contenu et découverte", status: "Actif", body: "Ajouter des comparatifs, guides, workflows et surfaces llms.txt de meilleure qualité sans produire des pages minces en masse." },
            { title: "Recherche de distribution", status: "Exploration", body: "Évaluer si PWA, extension navigateur ou wrapper desktop peuvent préserver le traitement local avec un risque de maintenance réduit." },
        ],
    },
}

export default async function RoadmapPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()
    const t = getTranslation(lang)
    const copy = ROADMAP_COPY[lang]

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <section className="rounded-lg border border-border/70 bg-card/55 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{copy.badge}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.pages.roadmap_title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {copy.intro}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${lang}/changelog`}>
                        <GitPullRequest className="h-4 w-4" aria-hidden="true" />
                        {copy.changelogLink}
                    </Link>
                    <a className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="https://github.com/baixiangcpp/byteflow.tools/issues/new?template=feature_request.yml" target="_blank" rel="noopener noreferrer">
                        <Map className="h-4 w-4" aria-hidden="true" />
                        {t.common.request_tool}
                    </a>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                {copy.items.map((item) => (
                    <article key={item.title} className="rounded-lg border border-border/70 bg-background/55 p-5">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.status}</p>
                                <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                            </div>
                        </div>
                    </article>
                ))}
            </section>

            <section className="rounded-lg border border-primary/30 bg-primary/10 p-5">
                <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                    <div>
                        <h2 className="text-lg font-semibold">{copy.productBoundaryTitle}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {copy.productBoundaryBody}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
