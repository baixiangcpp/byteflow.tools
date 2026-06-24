import Link from "next/link"
import { notFound } from "next/navigation"
import { Boxes, MonitorDown, ShieldCheck } from "lucide-react"
import type { Locale } from "@/core/i18n/i18n"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

const MVP_TOOL_KEYS = [
    "json_formatter",
    "base64_encode_decode",
    "jwt_decoder",
    "regex_tester",
    "uuid_generator",
    "password_generator",
    "url_encode_decode",
    "hash_generator",
    "log_scrubber",
] as const

const DISTRIBUTION_COPY: Record<Locale, {
    badge: string
    heading: string
    intro: string
    mvpTitle: string
    mvpBodyPrefix: string
    mvpBodySuffix: string
    roadmapLink: string
    options: Array<{ title: string; verdict: string; body: string }>
}> = {
    en: {
        badge: "Feasibility",
        heading: "PWA, extension, and desktop wrapper research",
        intro: "Frequent users may want faster offline access. Any distribution path must keep local-only processing, no payload sync, no account requirement, and no cloud history as default non-negotiables.",
        mvpTitle: "MVP scope and non-goals",
        mvpBodyPrefix: "A future MVP would focus on",
        mvpBodySuffix: "Non-goals include payload sync, account login, browsing-history collection, background scraping, and server-side payload processing.",
        roadmapLink: "Linked from roadmap",
        options: [
            { title: "PWA", verdict: "Preferred first path", body: "Already preserves the hosted site's browser-local runtime, offline app shell, and no-payload-sync model." },
            { title: "Browser extension", verdict: "Research only", body: "Could offer popup and context-menu access for common tools, but permissions must stay narrow and payload sync must remain out of scope." },
            { title: "Desktop wrapper", verdict: "Research only", body: "Could help offline-heavy users, but packaging, update signing, and native shell security increase maintenance cost." },
        ],
    },
    "zh-CN": {
        badge: "可行性",
        heading: "PWA、浏览器扩展与桌面封装研究",
        intro: "高频用户可能需要更快的离线访问。任何分发路径都必须默认保留仅本地处理、不同步 payload、无需账号和无云端历史。",
        mvpTitle: "MVP 范围与非目标",
        mvpBodyPrefix: "未来 MVP 会优先覆盖",
        mvpBodySuffix: "非目标包括 payload 同步、账号登录、浏览历史收集、后台抓取和服务端 payload 处理。",
        roadmapLink: "已从路线图链接",
        options: [
            { title: "PWA", verdict: "首选路径", body: "已保留托管站点的浏览器本地运行时、离线应用外壳和无 payload 同步模型。" },
            { title: "浏览器扩展", verdict: "仅研究", body: "可为常用工具提供弹窗和右键菜单入口，但权限必须收窄，payload 同步仍不在范围内。" },
            { title: "桌面封装", verdict: "仅研究", body: "可帮助重度离线用户，但打包、更新签名和原生外壳安全会增加维护成本。" },
        ],
    },
    "zh-TW": {
        badge: "可行性",
        heading: "PWA、瀏覽器擴充功能與桌面封裝研究",
        intro: "高頻使用者可能需要更快的離線存取。任何分發路徑都必須預設保留僅本地處理、不同步 payload、無需帳號和無雲端歷史。",
        mvpTitle: "MVP 範圍與非目標",
        mvpBodyPrefix: "未來 MVP 會優先覆蓋",
        mvpBodySuffix: "非目標包括 payload 同步、帳號登入、瀏覽歷史收集、背景抓取和服務端 payload 處理。",
        roadmapLink: "已從路線圖連結",
        options: [
            { title: "PWA", verdict: "首選路徑", body: "已保留託管網站的瀏覽器本地執行時、離線應用外殼和無 payload 同步模型。" },
            { title: "瀏覽器擴充功能", verdict: "僅研究", body: "可為常用工具提供彈窗和右鍵選單入口，但權限必須收窄，payload 同步仍不在範圍內。" },
            { title: "桌面封裝", verdict: "僅研究", body: "可協助重度離線使用者，但打包、更新簽章和原生外殼安全會增加維護成本。" },
        ],
    },
    ja: {
        badge: "実現性",
        heading: "PWA、ブラウザ拡張、デスクトップラッパー調査",
        intro: "頻繁に使うユーザーは、より速いオフラインアクセスを求める場合があります。どの配布方法でも、ローカル処理、payload 同期なし、アカウント不要、クラウド履歴なしを既定として保つ必要があります。",
        mvpTitle: "MVP 範囲と非目標",
        mvpBodyPrefix: "将来の MVP は次のツールを優先します:",
        mvpBodySuffix: "非目標は payload 同期、アカウントログイン、閲覧履歴収集、バックグラウンド取得、サーバー側 payload 処理です。",
        roadmapLink: "ロードマップからリンク",
        options: [
            { title: "PWA", verdict: "最初の推奨経路", body: "ホスト版のブラウザローカル実行、オフラインアプリシェル、payload 同期なしのモデルをすでに保っています。" },
            { title: "ブラウザ拡張", verdict: "調査のみ", body: "よく使うツールにポップアップやコンテキストメニューを提供できますが、権限は狭く保ち、payload 同期は対象外にします。" },
            { title: "デスクトップラッパー", verdict: "調査のみ", body: "オフライン重視のユーザーに役立つ可能性がありますが、パッケージング、更新署名、ネイティブシェルの安全性が保守コストを増やします。" },
        ],
    },
    ko: {
        badge: "실현 가능성",
        heading: "PWA, 브라우저 확장, 데스크톱 래퍼 연구",
        intro: "자주 사용하는 사용자는 더 빠른 오프라인 접근을 원할 수 있습니다. 어떤 배포 경로도 로컬 전용 처리, payload 동기화 없음, 계정 불필요, 클라우드 기록 없음을 기본으로 유지해야 합니다.",
        mvpTitle: "MVP 범위와 비목표",
        mvpBodyPrefix: "향후 MVP는 다음 도구에 집중합니다:",
        mvpBodySuffix: "비목표에는 payload 동기화, 계정 로그인, 브라우징 기록 수집, 백그라운드 스크래핑, 서버 측 payload 처리가 포함됩니다.",
        roadmapLink: "로드맵에서 연결됨",
        options: [
            { title: "PWA", verdict: "우선 경로", body: "호스팅 사이트의 브라우저 로컬 런타임, 오프라인 앱 셸, payload 동기화 없는 모델을 이미 보존합니다." },
            { title: "브라우저 확장", verdict: "연구 전용", body: "일반 도구에 팝업과 컨텍스트 메뉴 접근을 제공할 수 있지만 권한은 좁게 유지하고 payload 동기화는 범위 밖이어야 합니다." },
            { title: "데스크톱 래퍼", verdict: "연구 전용", body: "오프라인 중심 사용자에게 도움이 될 수 있지만 패키징, 업데이트 서명, 네이티브 셸 보안이 유지보수 비용을 높입니다." },
        ],
    },
    de: {
        badge: "Machbarkeit",
        heading: "PWA-, Erweiterungs- und Desktop-Wrapper-Forschung",
        intro: "Häufige Nutzer wünschen eventuell schnelleren Offline-Zugriff. Jeder Distributionspfad muss lokale Verarbeitung, keine Payload-Synchronisierung, keine Kontopflicht und keinen Cloud-Verlauf als Standard bewahren.",
        mvpTitle: "MVP-Umfang und Nichtziele",
        mvpBodyPrefix: "Ein künftiges MVP würde sich konzentrieren auf",
        mvpBodySuffix: "Nichtziele sind Payload-Synchronisierung, Konto-Login, Browserverlauf-Erfassung, Hintergrund-Scraping und serverseitige Payload-Verarbeitung.",
        roadmapLink: "Von der Roadmap verlinkt",
        options: [
            { title: "PWA", verdict: "Bevorzugter erster Pfad", body: "Bewahrt bereits die browser-lokale Laufzeit, Offline-App-Shell und das Modell ohne Payload-Synchronisierung." },
            { title: "Browser-Erweiterung", verdict: "Nur Forschung", body: "Könnte Popup- und Kontextmenüzugriff für häufige Tools bieten, aber Berechtigungen müssen eng bleiben und Payload-Synchronisierung bleibt außerhalb des Umfangs." },
            { title: "Desktop-Wrapper", verdict: "Nur Forschung", body: "Könnte Offline-Nutzern helfen, erhöht aber Wartungskosten durch Packaging, Update-Signierung und native Shell-Sicherheit." },
        ],
    },
    fr: {
        badge: "Faisabilité",
        heading: "Recherche PWA, extension navigateur et wrapper desktop",
        intro: "Les utilisateurs fréquents peuvent vouloir un accès hors ligne plus rapide. Toute voie de distribution doit conserver par défaut le traitement local, sans synchronisation de payload, sans compte requis et sans historique cloud.",
        mvpTitle: "Portée MVP et non-objectifs",
        mvpBodyPrefix: "Un futur MVP se concentrerait sur",
        mvpBodySuffix: "Les non-objectifs incluent synchronisation de payload, connexion obligatoire, collecte d’historique, scraping en arrière-plan et traitement serveur des payloads.",
        roadmapLink: "Lié depuis la feuille de route",
        options: [
            { title: "PWA", verdict: "Premier chemin préféré", body: "Préserve déjà l’exécution locale au navigateur, le shell hors ligne et le modèle sans synchronisation de payload." },
            { title: "Extension navigateur", verdict: "Recherche seulement", body: "Pourrait offrir un accès popup et menu contextuel aux outils courants, mais les permissions doivent rester étroites et la synchronisation de payload hors périmètre." },
            { title: "Wrapper desktop", verdict: "Recherche seulement", body: "Pourrait aider les usages hors ligne intensifs, mais packaging, signature des mises à jour et sécurité de shell natif augmentent la maintenance." },
        ],
    },
}

export default async function DistributionResearchPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()
    const t = getTranslation(lang)
    const copy = DISTRIBUTION_COPY[lang]
    const mvpTools = MVP_TOOL_KEYS.map((key) => t.tools[key].title).join(", ")

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <section className="rounded-lg border border-border/70 bg-card/55 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{copy.badge}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{copy.heading}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {copy.intro}
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                {copy.options.map((option) => (
                    <article key={option.title} className="rounded-lg border border-border/70 bg-background/55 p-5">
                        <Boxes className="h-5 w-5 text-primary" aria-hidden="true" />
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{option.verdict}</p>
                        <h2 className="mt-1 text-lg font-semibold">{option.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{option.body}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-lg border border-primary/30 bg-primary/10 p-5">
                <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                    <div>
                        <h2 className="text-lg font-semibold">{copy.mvpTitle}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {copy.mvpBodyPrefix} {mvpTools}. {copy.mvpBodySuffix}
                        </p>
                    </div>
                </div>
            </section>

            <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${lang}/roadmap`}>
                <MonitorDown className="h-4 w-4" aria-hidden="true" />
                {copy.roadmapLink}
            </Link>
        </div>
    )
}
