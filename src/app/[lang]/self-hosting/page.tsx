import Link from "next/link"
import { notFound } from "next/navigation"
import { HeartHandshake, Server, ShieldCheck, WifiOff } from "lucide-react"
import type { Locale } from "@/core/i18n/i18n"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

const SELF_HOSTING_COPY: Record<Locale, {
    badge: string
    intro: string
    repositoryLink: string
    checklistTitle: string
    cacheTitle: string
    cacheBody: string
    boundaryTitle: string
    boundaryBody: string
    checks: string[]
}> = {
    en: {
        badge: "Internal deployment",
        intro: "Teams can deploy byteflow.tools as a static app while keeping the product promise intact: no account, no cloud history, no server-side tool payload processing, and browser-local behavior by default.",
        repositoryLink: "Repository",
        checklistTitle: "Deployment checklist",
        cacheTitle: "Cache behavior",
        cacheBody: "The PWA may cache the app shell and tool chunks. Tool input, output, uploaded file content, external-request responses, secrets, and generated content must not be cached by default.",
        boundaryTitle: "Commercial boundary",
        boundaryBody: "Future support can focus on sponsorship, packaging, internal deployment help, or security review. It should not depend on collecting tool payloads, forced accounts, or hosted history.",
        checks: [
            "Serve the static export from an internal static host, CDN, or object storage bucket.",
            "Keep analytics disabled unless the provider and taxonomy are privacy-safe and aggregate only.",
            "Apply the documented CSP, Permissions-Policy, Referrer-Policy, COOP, and CORP headers.",
            "Do not add accounts, cloud history, server-side payload processing, or default payload persistence.",
            "Cache only versioned app shell files, icons, static assets, and tool chunks.",
        ],
    },
    "zh-CN": {
        badge: "内部部署",
        intro: "团队可以把 byteflow.tools 作为静态应用部署，同时保持产品承诺：无需账号、无云端历史、无服务端工具 payload 处理，并默认在浏览器本地运行。",
        repositoryLink: "代码仓库",
        checklistTitle: "部署检查清单",
        cacheTitle: "缓存行为",
        cacheBody: "PWA 可以缓存应用外壳和工具代码块。工具输入、输出、上传文件内容、外部请求响应、密钥和生成内容默认不得缓存。",
        boundaryTitle: "商业边界",
        boundaryBody: "未来支持可以聚焦赞助、打包、内部部署协助或安全审查，不应依赖收集工具 payload、强制账号或托管历史。",
        checks: [
            "从内部静态主机、CDN 或对象存储桶提供静态导出。",
            "除非提供方和事件分类已确认隐私安全且仅聚合统计，否则保持分析关闭。",
            "应用文档中的 CSP、Permissions-Policy、Referrer-Policy、COOP 和 CORP 响应头。",
            "不要添加账号、云端历史、服务端 payload 处理或默认 payload 持久化。",
            "只缓存带版本的应用外壳、图标、静态资源和工具代码块。",
        ],
    },
    "zh-TW": {
        badge: "內部部署",
        intro: "團隊可以把 byteflow.tools 作為靜態應用部署，同時維持產品承諾：無需帳號、無雲端歷史、無服務端工具 payload 處理，並預設在瀏覽器本地執行。",
        repositoryLink: "程式碼倉庫",
        checklistTitle: "部署檢查清單",
        cacheTitle: "快取行為",
        cacheBody: "PWA 可以快取應用外殼和工具程式碼區塊。工具輸入、輸出、上傳檔案內容、外部請求回應、密鑰和生成內容預設不得快取。",
        boundaryTitle: "商業邊界",
        boundaryBody: "未來支援可以聚焦贊助、打包、內部部署協助或安全審查，不應依賴收集工具 payload、強制帳號或託管歷史。",
        checks: [
            "從內部靜態主機、CDN 或物件儲存桶提供靜態匯出。",
            "除非提供方和事件分類已確認隱私安全且僅聚合統計，否則保持分析關閉。",
            "套用文件中的 CSP、Permissions-Policy、Referrer-Policy、COOP 和 CORP 回應頭。",
            "不要新增帳號、雲端歷史、服務端 payload 處理或預設 payload 持久化。",
            "只快取帶版本的應用外殼、圖示、靜態資源和工具程式碼區塊。",
        ],
    },
    ja: {
        badge: "社内デプロイ",
        intro: "チームは byteflow.tools を静的アプリとして導入しつつ、アカウント不要、クラウド履歴なし、サーバー側 tool payload 処理なし、既定でブラウザローカルという約束を保てます。",
        repositoryLink: "リポジトリ",
        checklistTitle: "デプロイチェックリスト",
        cacheTitle: "キャッシュ動作",
        cacheBody: "PWA はアプリシェルとツールチャンクをキャッシュできます。ツール入力、出力、アップロードファイル、外部リクエスト応答、シークレット、生成内容は既定でキャッシュしません。",
        boundaryTitle: "商用化の境界",
        boundaryBody: "将来の支援はスポンサー、パッケージング、社内導入支援、セキュリティレビューに集中できます。tool payload の収集、強制アカウント、ホスト履歴に依存すべきではありません。",
        checks: [
            "静的エクスポートを社内静的ホスト、CDN、またはオブジェクトストレージから配信します。",
            "提供者とイベント分類がプライバシー安全で集計のみと確認できるまで分析は無効にします。",
            "文書化された CSP、Permissions-Policy、Referrer-Policy、COOP、CORP ヘッダーを適用します。",
            "アカウント、クラウド履歴、サーバー側 payload 処理、既定の payload 永続化を追加しません。",
            "バージョン付きアプリシェル、アイコン、静的アセット、ツールチャンクだけをキャッシュします。",
        ],
    },
    ko: {
        badge: "내부 배포",
        intro: "팀은 byteflow.tools를 정적 앱으로 배포하면서 계정 없음, 클라우드 기록 없음, 서버 측 도구 payload 처리 없음, 기본 브라우저 로컬 동작을 유지할 수 있습니다.",
        repositoryLink: "저장소",
        checklistTitle: "배포 체크리스트",
        cacheTitle: "캐시 동작",
        cacheBody: "PWA는 앱 셸과 도구 청크를 캐시할 수 있습니다. 도구 입력, 출력, 업로드 파일, 외부 요청 응답, 비밀값, 생성 콘텐츠는 기본적으로 캐시하면 안 됩니다.",
        boundaryTitle: "상업화 경계",
        boundaryBody: "향후 지원은 후원, 패키징, 내부 배포 지원, 보안 검토에 집중할 수 있습니다. 도구 payload 수집, 강제 계정, 호스팅 기록에 의존해서는 안 됩니다.",
        checks: [
            "정적 export를 내부 정적 호스트, CDN 또는 객체 스토리지 버킷에서 제공합니다.",
            "제공자와 이벤트 분류가 개인정보 보호에 안전하고 집계 전용일 때만 분석을 켭니다.",
            "문서화된 CSP, Permissions-Policy, Referrer-Policy, COOP, CORP 헤더를 적용합니다.",
            "계정, 클라우드 기록, 서버 측 payload 처리 또는 기본 payload 저장을 추가하지 않습니다.",
            "버전이 있는 앱 셸, 아이콘, 정적 자산, 도구 청크만 캐시합니다.",
        ],
    },
    de: {
        badge: "Interne Bereitstellung",
        intro: "Teams können byteflow.tools als statische App bereitstellen und dabei das Produktversprechen bewahren: kein Konto, kein Cloud-Verlauf, keine serverseitige Tool-Payload-Verarbeitung und standardmäßig browser-lokales Verhalten.",
        repositoryLink: "Repository",
        checklistTitle: "Deployment-Checkliste",
        cacheTitle: "Cache-Verhalten",
        cacheBody: "Die PWA darf App-Shell und Tool-Chunks zwischenspeichern. Tool-Eingaben, Ausgaben, hochgeladene Dateien, externe Antworten, Geheimnisse und generierte Inhalte dürfen standardmäßig nicht gecacht werden.",
        boundaryTitle: "Kommerzielle Grenze",
        boundaryBody: "Künftige Unterstützung kann sich auf Sponsoring, Packaging, interne Bereitstellungshilfe oder Sicherheitsprüfung konzentrieren. Sie sollte nicht auf Tool-Payload-Sammlung, Pflichtkonten oder gehostetem Verlauf beruhen.",
        checks: [
            "Statischen Export über internen Static Host, CDN oder Object Storage bereitstellen.",
            "Analytics deaktiviert lassen, außer Anbieter und Taxonomie sind datenschutzsicher und nur aggregiert.",
            "Dokumentierte CSP-, Permissions-Policy-, Referrer-Policy-, COOP- und CORP-Header anwenden.",
            "Keine Konten, keinen Cloud-Verlauf, keine serverseitige Payload-Verarbeitung und keine standardmäßige Payload-Persistenz hinzufügen.",
            "Nur versionierte App-Shell-Dateien, Icons, statische Assets und Tool-Chunks cachen.",
        ],
    },
    fr: {
        badge: "Déploiement interne",
        intro: "Les équipes peuvent déployer byteflow.tools comme application statique tout en gardant la promesse produit : aucun compte, aucun historique cloud, aucun traitement serveur des payloads d’outils et exécution locale au navigateur par défaut.",
        repositoryLink: "Dépôt",
        checklistTitle: "Liste de vérification du déploiement",
        cacheTitle: "Comportement du cache",
        cacheBody: "La PWA peut mettre en cache le shell applicatif et les modules d’outils. Les entrées, sorties, fichiers importés, réponses externes, secrets et contenus générés ne doivent pas être mis en cache par défaut.",
        boundaryTitle: "Limite commerciale",
        boundaryBody: "Un support futur peut porter sur sponsoring, packaging, aide au déploiement interne ou revue sécurité. Il ne doit pas dépendre de la collecte de payloads, de comptes forcés ni d’un historique hébergé.",
        checks: [
            "Servir l’export statique depuis un hôte interne, un CDN ou un stockage objet.",
            "Garder l’analytics désactivée sauf si le fournisseur et la taxonomie sont sûrs et uniquement agrégés.",
            "Appliquer les en-têtes CSP, Permissions-Policy, Referrer-Policy, COOP et CORP documentés.",
            "Ne pas ajouter de comptes, d’historique cloud, de traitement serveur des payloads ni de persistance par défaut.",
            "Mettre en cache seulement le shell versionné, les icônes, les assets statiques et les modules d’outils.",
        ],
    },
}

export default async function SelfHostingPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()
    const t = getTranslation(lang)
    const copy = SELF_HOSTING_COPY[lang]

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <section className="rounded-lg border border-border/70 bg-card/55 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{copy.badge}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.pages.self_hosting_title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {copy.intro}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                    <a className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="https://github.com/baixiangcpp/byteflow.tools" target="_blank" rel="noopener noreferrer">
                        <Server className="h-4 w-4" aria-hidden="true" />
                        {copy.repositoryLink}
                    </a>
                    <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${lang}/trust-center`}>
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        {t.pages.trust_center_title}
                    </Link>
                    <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${lang}/support`}>
                        <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                        {t.pages.support_title}
                    </Link>
                </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-background/55 p-5">
                <h2 className="text-lg font-semibold">{copy.checklistTitle}</h2>
                <ul className="mt-4 space-y-3">
                    {copy.checks.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <article className="rounded-lg border border-border/70 bg-card/55 p-5">
                    <WifiOff className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="mt-3 text-lg font-semibold">{copy.cacheTitle}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {copy.cacheBody}
                    </p>
                </article>
                <article className="rounded-lg border border-border/70 bg-card/55 p-5">
                    <Server className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="mt-3 text-lg font-semibold">{copy.boundaryTitle}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {copy.boundaryBody}
                    </p>
                    <Link className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/${lang}/support`}>
                        <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.pages.support_private_deployment_title}
                    </Link>
                </article>
            </section>
        </div>
    )
}
