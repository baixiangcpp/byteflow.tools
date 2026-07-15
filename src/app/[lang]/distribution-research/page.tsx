import Link from "next/link"
import { notFound } from "next/navigation"
import { Boxes, MessageSquarePlus, MonitorDown, ShieldCheck, ThumbsUp } from "lucide-react"
import type { Locale } from "@/core/i18n/i18n"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { StaticPageContainer } from "@/components/layout/page-container"

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

const DISTRIBUTION_REQUEST_URL = "https://github.com/baixiangcpp/byteflow.tools/issues/new?template=feature_request.yml&title=feat%3A%20extension%20or%20desktop%20distribution"
const DISTRIBUTION_VOTE_URL = "https://github.com/baixiangcpp/byteflow.tools/issues?q=is%3Aissue%20is%3Aopen%20label%3Aenhancement"

const DISTRIBUTION_COPY: Record<Locale, {
    badge: string
    heading: string
    intro: string
    mvpTitle: string
    mvpBodyPrefix: string
    mvpBodySuffix: string
    roadmapLink: string
    feedbackTitle: string
    feedbackBody: string
    requestLink: string
    voteLink: string
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
        feedbackTitle: "Vote on launcher demand",
        feedbackBody: "Add a thumbs-up or comment on existing launcher requests, or open a sanitized request if no extension or desktop distribution issue matches your need. Do not include private payloads, URLs, secrets, logs, screenshots, or generated output.",
        requestLink: "Request launcher access",
        voteLink: "Vote on existing requests",
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
        feedbackTitle: "为启动器需求投票",
        feedbackBody: "可以在已有启动器请求上点赞或评论；如果没有匹配的扩展或桌面分发请求，请用脱敏内容提交。不要包含私有 payload、URL、密钥、日志、截图或生成内容。",
        requestLink: "请求启动器入口",
        voteLink: "为已有请求投票",
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
        feedbackTitle: "為啟動器需求投票",
        feedbackBody: "可以在既有啟動器請求上按讚或留言；如果沒有符合的擴充功能或桌面分發請求，請用脫敏內容提交。不要包含私有 payload、URL、密鑰、日誌、截圖或生成內容。",
        requestLink: "請求啟動器入口",
        voteLink: "為既有請求投票",
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
        feedbackTitle: "ランチャー需要に投票",
        feedbackBody: "既存のランチャー要望に thumbs-up やコメントを追加できます。該当する拡張機能またはデスクトップ配布の要望がなければ、サニタイズ済み内容でリクエストしてください。非公開 payload、URL、シークレット、ログ、スクリーンショット、生成出力は含めないでください。",
        requestLink: "ランチャーアクセスをリクエスト",
        voteLink: "既存リクエストに投票",
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
        feedbackTitle: "런처 수요에 투표",
        feedbackBody: "기존 런처 요청에 thumbs-up 반응이나 댓글을 남길 수 있습니다. 맞는 확장 또는 데스크톱 배포 요청이 없다면 정리된 내용으로 요청하세요. 비공개 payload, URL, 비밀값, 로그, 스크린샷, 생성 출력은 포함하지 마세요.",
        requestLink: "런처 접근 요청",
        voteLink: "기존 요청에 투표",
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
        feedbackTitle: "Launcher-Nachfrage priorisieren",
        feedbackBody: "Geben Sie bestehenden Launcher-Anfragen einen Daumen hoch oder kommentieren Sie sie. Wenn keine passende Erweiterungs- oder Desktop-Verteilungsanfrage existiert, öffnen Sie eine bereinigte Anfrage. Keine privaten Payloads, URLs, Geheimnisse, Logs, Screenshots oder generierten Ausgaben posten.",
        requestLink: "Launcher-Zugriff anfragen",
        voteLink: "Bestehende Anfragen priorisieren",
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
        feedbackTitle: "Voter pour la demande de lanceur",
        feedbackBody: "Ajoutez un pouce levé ou un commentaire aux demandes de lanceur existantes. Si aucune demande d’extension ou de distribution desktop ne correspond, ouvrez une demande nettoyée. N’incluez pas de payloads privés, URL, secrets, logs, captures ou sorties générées.",
        requestLink: "Demander un accès lanceur",
        voteLink: "Voter pour les demandes existantes",
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
        <StaticPageContainer className="space-y-8">
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

            <section className="rounded-lg border border-border/70 bg-background/55 p-5">
                <h2 className="text-lg font-semibold">{copy.feedbackTitle}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{copy.feedbackBody}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <a className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={DISTRIBUTION_REQUEST_URL} target="_blank" rel="noopener noreferrer">
                        <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                        {copy.requestLink}
                    </a>
                    <a className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={DISTRIBUTION_VOTE_URL} target="_blank" rel="noopener noreferrer">
                        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                        {copy.voteLink}
                    </a>
                    <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${lang}/roadmap`}>
                        <MonitorDown className="h-4 w-4" aria-hidden="true" />
                        {copy.roadmapLink}
                    </Link>
                </div>
            </section>
        </StaticPageContainer>
    )
}
