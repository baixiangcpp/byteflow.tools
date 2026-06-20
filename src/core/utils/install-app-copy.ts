import type { Locale } from "@/core/i18n/i18n"

export type GuidePlatform = "chrome_desktop" | "android" | "ios" | "edge" | "firefox"

type InstallBenefitKey = "instant_launch" | "works_offline" | "local_first"

type InstallGuide = {
    label: string
    title: string
    steps: string[]
    screenshot: string
}

type InstallBenefit = {
    key: InstallBenefitKey
    title: string
    description: string
}

type InstallFaq = {
    question: string
    answer: string
}

export type InstallPageCopy = {
    badge: string
    title: string
    subtitle: string
    installNow: string
    seeGuide: string
    alreadyInstalled: string
    openApp: string
    sectionBenefits: string
    sectionGuide: string
    sectionFaq: string
    sectionBottom: string
    bottomTrust: string
    manualHint: string
    guidePreviewLabel: string
    benefits: InstallBenefit[]
    guides: Record<GuidePlatform, InstallGuide>
    faq: InstallFaq[]
}

const GUIDE_SCREENSHOTS: Record<GuidePlatform, string> = {
    chrome_desktop: "/pwa-screenshots/install-chrome-desktop.png",
    android: "/pwa-screenshots/install-android.png",
    ios: "/pwa-screenshots/install-ios-safari.png",
    edge: "/pwa-screenshots/install-edge.png",
    firefox: "/pwa-screenshots/install-firefox.png",
}

export const INSTALL_PAGE_COPY: Record<Locale, InstallPageCopy> = {
    en: {
        badge: "Installable PWA",
        title: "Install byteflow.tools as an app",
        subtitle: "Use byteflow.tools offline with a native-like app shell. Most browser-local tools process payloads locally, and core tools can keep working after the app shell is cached. External-request tools still need network for lookup actions.",
        installNow: "Install now",
        seeGuide: "See install guide",
        alreadyInstalled: "Already installed",
        openApp: "Open app",
        sectionBenefits: "Why install",
        sectionGuide: "Install guide",
        sectionFaq: "FAQ",
        sectionBottom: "Take byteflow.tools offline",
        bottomTrust: "Privacy-first by design. Fast by default. Browser-local tools work without network.",
        manualHint: "Install prompt is unavailable in this browser. Follow the platform steps below.",
        guidePreviewLabel: "Guide preview",
        benefits: [
            {
                key: "instant_launch",
                title: "Instant launch",
                description: "Open in a standalone window with faster repeat startup.",
            },
            {
                key: "works_offline",
                title: "Works offline",
                description: "Core formatter and encoder workflows continue without network.",
            },
            {
                key: "local_first",
                title: "Browser-local first",
                description: "Browser-local tools keep content on device for local processing; external-request tools are labeled before network use.",
            },
        ],
        guides: {
            chrome_desktop: {
                label: "Chrome Desktop",
                title: "Install on Chrome Desktop",
                steps: [
                    "Open byteflow.tools in Chrome.",
                    "Click the install icon in the address bar.",
                    "Confirm install to open the standalone app window.",
                ],
                screenshot: GUIDE_SCREENSHOTS.chrome_desktop,
            },
            android: {
                label: "Android",
                title: "Install on Android",
                steps: [
                    "Open byteflow.tools in Chrome on Android.",
                    "Tap the three-dot menu and choose Install app.",
                    "Confirm Add to Home screen.",
                ],
                screenshot: GUIDE_SCREENSHOTS.android,
            },
            ios: {
                label: "iOS Safari",
                title: "Install on iOS Safari",
                steps: [
                    "Open byteflow.tools in Safari.",
                    "Tap Share, then select Add to Home Screen.",
                    "Tap Add and launch from the home screen icon.",
                ],
                screenshot: GUIDE_SCREENSHOTS.ios,
            },
            edge: {
                label: "Edge",
                title: "Install on Microsoft Edge",
                steps: [
                    "Open byteflow.tools in Edge.",
                    "Open the browser menu and choose Apps > Install this site as an app.",
                    "Confirm to finish installation.",
                ],
                screenshot: GUIDE_SCREENSHOTS.edge,
            },
            firefox: {
                label: "Firefox",
                title: "Firefox note",
                steps: [
                    "Firefox currently has limited PWA installation support.",
                    "Use Chrome, Edge, or Safari for full install flow.",
                    "You can still bookmark byteflow.tools for quick access.",
                ],
                screenshot: GUIDE_SCREENSHOTS.firefox,
            },
        },
        faq: [
            {
                question: "What is the difference between a PWA and a native app?",
                answer: "A PWA runs with web technologies but can launch from your home screen and work offline like an app shell.",
            },
            {
                question: "Does installation require payment?",
                answer: "No. byteflow.tools installation is free.",
            },
            {
                question: "How do updates work?",
                answer: "Updates are downloaded in the background and applied when you choose to refresh.",
            },
            {
                question: "How do I uninstall?",
                answer: "Use your OS app uninstall action, or remove it from browser app management.",
            },
            {
                question: "Will my data sync to a server?",
                answer: "Browser-local tools do not sync data to a server. External-request tools are labeled and only contact the network when you run their lookup actions.",
            },
        ],
    },
    "zh-CN": {
        badge: "可安装 PWA",
        title: "将 byteflow.tools 安装为应用",
        subtitle: "像原生应用一样离线使用 byteflow.tools。多数浏览器本地工具会在本地处理内容，应用外壳缓存后核心工具可继续离线使用。外部请求工具执行查询操作时仍需要网络。",
        installNow: "立即安装",
        seeGuide: "查看安装教程",
        alreadyInstalled: "已安装",
        openApp: "打开应用",
        sectionBenefits: "安装价值",
        sectionGuide: "安装教程",
        sectionFaq: "常见问题",
        sectionBottom: "把 byteflow.tools 带到离线环境",
        bottomTrust: "隐私优先，速度优先。浏览器本地工具无网可用。",
        manualHint: "当前浏览器不支持安装弹窗，请按下方步骤手动安装。",
        guidePreviewLabel: "教程预览",
        benefits: [
            {
                key: "instant_launch",
                title: "秒速启动",
                description: "以独立窗口打开，重复启动更快。",
            },
            {
                key: "works_offline",
                title: "离线可用",
                description: "核心格式化与编码流程无网络也能继续使用。",
            },
            {
                key: "local_first",
                title: "浏览器本地优先",
                description: "浏览器本地工具会在设备内处理内容；外部请求工具会在联网前标记。",
            },
        ],
        guides: {
            chrome_desktop: {
                label: "Chrome 桌面版",
                title: "在 Chrome 桌面版安装",
                steps: [
                    "在 Chrome 中打开 byteflow.tools。",
                    "点击地址栏中的安装图标。",
                    "确认安装后将以独立应用窗口打开。",
                ],
                screenshot: GUIDE_SCREENSHOTS.chrome_desktop,
            },
            android: {
                label: "Android",
                title: "在 Android 安装",
                steps: [
                    "在 Android Chrome 中打开 byteflow.tools。",
                    "点击右上角三点菜单，选择“安装应用”。",
                    "确认“添加到主屏幕”。",
                ],
                screenshot: GUIDE_SCREENSHOTS.android,
            },
            ios: {
                label: "iOS Safari",
                title: "在 iOS Safari 安装",
                steps: [
                    "在 Safari 中打开 byteflow.tools。",
                    "点击“分享”，选择“添加到主屏幕”。",
                    "点击“添加”，随后可从主屏幕图标启动。",
                ],
                screenshot: GUIDE_SCREENSHOTS.ios,
            },
            edge: {
                label: "Edge",
                title: "在 Microsoft Edge 安装",
                steps: [
                    "在 Edge 中打开 byteflow.tools。",
                    "打开浏览器菜单，选择“应用”>“将此站点安装为应用”。",
                    "确认后完成安装。",
                ],
                screenshot: GUIDE_SCREENSHOTS.edge,
            },
            firefox: {
                label: "Firefox",
                title: "Firefox 说明",
                steps: [
                    "Firefox 当前对 PWA 安装支持有限。",
                    "如需完整安装流程，请使用 Chrome、Edge 或 Safari。",
                    "你也可以将 byteflow.tools 添加书签以便快速访问。",
                ],
                screenshot: GUIDE_SCREENSHOTS.firefox,
            },
        },
        faq: [
            {
                question: "PWA 和原生应用有什么区别？",
                answer: "PWA 使用 Web 技术构建，但可像应用一样从主屏幕启动并支持离线壳体验。",
            },
            {
                question: "安装需要付费吗？",
                answer: "不需要，byteflow.tools 安装与使用均免费。",
            },
            {
                question: "更新如何生效？",
                answer: "更新会在后台下载，你刷新后即可应用最新版本。",
            },
            {
                question: "如何卸载？",
                answer: "可通过系统卸载应用，或在浏览器应用管理中移除。",
            },
            {
                question: "我的数据会同步到服务器吗？",
                answer: "浏览器本地工具不会同步到服务器。外部请求工具会明确标记，并且只会在你运行查询操作时访问网络。",
            },
        ],
    },
    "zh-TW": {
        badge: "可安裝 PWA",
        title: "將 byteflow.tools 安裝為應用程式",
        subtitle: "以原生 App 體驗離線使用 byteflow.tools。多數瀏覽器本地工具會在本地處理內容，應用外殼快取後核心工具可繼續離線使用。外部請求工具執行查詢操作時仍需要網路。",
        installNow: "立即安裝",
        seeGuide: "查看安裝教學",
        alreadyInstalled: "已安裝",
        openApp: "開啟應用程式",
        sectionBenefits: "安裝價值",
        sectionGuide: "安裝教學",
        sectionFaq: "常見問題",
        sectionBottom: "把 byteflow.tools 帶到離線場景",
        bottomTrust: "隱私優先、速度優先。瀏覽器本地工具無網可用。",
        manualHint: "目前瀏覽器不支援安裝彈窗，請依下方步驟手動安裝。",
        guidePreviewLabel: "教學預覽",
        benefits: [
            {
                key: "instant_launch",
                title: "秒速啟動",
                description: "以獨立視窗開啟，重複啟動更快速。",
            },
            {
                key: "works_offline",
                title: "離線可用",
                description: "核心格式化與編碼流程在無網路時也可繼續使用。",
            },
            {
                key: "local_first",
                title: "瀏覽器本地優先",
                description: "瀏覽器本地工具會在裝置內處理內容；外部請求工具會在連網前標記。",
            },
        ],
        guides: {
            chrome_desktop: {
                label: "Chrome 桌面版",
                title: "在 Chrome 桌面版安裝",
                steps: [
                    "在 Chrome 中開啟 byteflow.tools。",
                    "點擊網址列中的安裝圖示。",
                    "確認安裝後會以獨立應用視窗開啟。",
                ],
                screenshot: GUIDE_SCREENSHOTS.chrome_desktop,
            },
            android: {
                label: "Android",
                title: "在 Android 安裝",
                steps: [
                    "在 Android Chrome 中開啟 byteflow.tools。",
                    "點擊右上角三點選單，選擇「安裝應用程式」。",
                    "確認「新增到主畫面」。",
                ],
                screenshot: GUIDE_SCREENSHOTS.android,
            },
            ios: {
                label: "iOS Safari",
                title: "在 iOS Safari 安裝",
                steps: [
                    "在 Safari 中開啟 byteflow.tools。",
                    "點擊「分享」，選擇「加入主畫面」。",
                    "點擊「加入」，即可從主畫面圖示啟動。",
                ],
                screenshot: GUIDE_SCREENSHOTS.ios,
            },
            edge: {
                label: "Edge",
                title: "在 Microsoft Edge 安裝",
                steps: [
                    "在 Edge 中開啟 byteflow.tools。",
                    "開啟瀏覽器選單，選擇「應用程式」>「將此網站安裝為應用程式」。",
                    "確認後完成安裝。",
                ],
                screenshot: GUIDE_SCREENSHOTS.edge,
            },
            firefox: {
                label: "Firefox",
                title: "Firefox 說明",
                steps: [
                    "Firefox 目前對 PWA 安裝支援有限。",
                    "若需要完整安裝流程，請使用 Chrome、Edge 或 Safari。",
                    "你仍可將 byteflow.tools 加入書籤以便快速存取。",
                ],
                screenshot: GUIDE_SCREENSHOTS.firefox,
            },
        },
        faq: [
            {
                question: "PWA 與原生 App 有什麼差異？",
                answer: "PWA 以 Web 技術建置，但可像 App 一樣從主畫面啟動並支援離線外殼體驗。",
            },
            {
                question: "安裝需要付費嗎？",
                answer: "不需要，byteflow.tools 的安裝與使用皆免費。",
            },
            {
                question: "更新如何生效？",
                answer: "更新會在背景下載，你重新整理後即可套用最新版本。",
            },
            {
                question: "如何解除安裝？",
                answer: "可透過系統解除安裝，或在瀏覽器應用管理中移除。",
            },
            {
                question: "我的資料會同步到伺服器嗎？",
                answer: "瀏覽器本地工具不會同步到伺服器。外部請求工具會明確標記，且只會在你執行查詢操作時使用網路。",
            },
        ],
    },
    ja: {
        badge: "インストール可能なPWA",
        title: "byteflow.tools をアプリとしてインストール",
        subtitle: "ネイティブアプリのように、byteflow.tools をオフラインでも使えます。多くのブラウザローカルツールはローカルで処理され、アプリシェルのキャッシュ後は主要機能をオフラインで継続できます。外部リクエストツールの検索操作にはネットワークが必要です。",
        installNow: "今すぐインストール",
        seeGuide: "インストール手順を見る",
        alreadyInstalled: "インストール済み",
        openApp: "アプリを開く",
        sectionBenefits: "インストールする理由",
        sectionGuide: "インストール手順",
        sectionFaq: "FAQ",
        sectionBottom: "byteflow.tools をオフラインで使う",
        bottomTrust: "プライバシー重視。高速。ブラウザローカルツールはオフライン対応。",
        manualHint: "このブラウザではインストールプロンプトが使えません。下の手順を確認してください。",
        guidePreviewLabel: "手順プレビュー",
        benefits: [
            {
                key: "instant_launch",
                title: "すぐに起動",
                description: "スタンドアロンウィンドウで開き、再起動も高速です。",
            },
            {
                key: "works_offline",
                title: "オフライン対応",
                description: "主要な整形・エンコード作業はネットワークなしでも継続できます。",
            },
            {
                key: "local_first",
                title: "ブラウザローカル優先",
                description: "ブラウザローカルツールは端末内で処理します。外部リクエストツールはネットワーク利用前に表示されます。",
            },
        ],
        guides: {
            chrome_desktop: {
                label: "Chrome デスクトップ",
                title: "Chrome デスクトップでインストール",
                steps: [
                    "Chrome で byteflow.tools を開きます。",
                    "アドレスバーのインストールアイコンをクリックします。",
                    "確認すると、スタンドアロンアプリとして起動します。",
                ],
                screenshot: GUIDE_SCREENSHOTS.chrome_desktop,
            },
            android: {
                label: "Android",
                title: "Android でインストール",
                steps: [
                    "Android の Chrome で byteflow.tools を開きます。",
                    "右上メニューから「アプリをインストール」を選びます。",
                    "「ホーム画面に追加」を確認します。",
                ],
                screenshot: GUIDE_SCREENSHOTS.android,
            },
            ios: {
                label: "iOS Safari",
                title: "iOS Safari でインストール",
                steps: [
                    "Safari で byteflow.tools を開きます。",
                    "共有をタップし、「ホーム画面に追加」を選びます。",
                    "「追加」をタップし、ホーム画面のアイコンから起動します。",
                ],
                screenshot: GUIDE_SCREENSHOTS.ios,
            },
            edge: {
                label: "Edge",
                title: "Microsoft Edge でインストール",
                steps: [
                    "Edge で byteflow.tools を開きます。",
                    "ブラウザメニューから「アプリ」>「このサイトをアプリとしてインストール」を選びます。",
                    "確認してインストールを完了します。",
                ],
                screenshot: GUIDE_SCREENSHOTS.edge,
            },
            firefox: {
                label: "Firefox",
                title: "Firefox について",
                steps: [
                    "Firefox の PWA インストール対応は現在限定的です。",
                    "完全なインストール手順には Chrome / Edge / Safari を利用してください。",
                    "Firefox ではブックマーク追加で素早くアクセスできます。",
                ],
                screenshot: GUIDE_SCREENSHOTS.firefox,
            },
        },
        faq: [
            {
                question: "PWA とネイティブアプリの違いは？",
                answer: "PWA は Web 技術で動作しますが、ホーム画面から起動でき、オフラインでもアプリのように使えます。",
            },
            {
                question: "インストールに料金は必要ですか？",
                answer: "不要です。byteflow.tools のインストールと利用は無料です。",
            },
            {
                question: "更新はどう反映されますか？",
                answer: "更新はバックグラウンドで取得され、再読み込み時に適用されます。",
            },
            {
                question: "アンインストール方法は？",
                answer: "OS のアプリ削除機能、またはブラウザのアプリ管理から削除できます。",
            },
            {
                question: "データはサーバーに同期されますか？",
                answer: "ブラウザローカルツールはサーバーへ同期しません。外部リクエストツールは表示され、検索操作を実行した場合のみネットワークを使います。",
            },
        ],
    },
    ko: {
        badge: "설치 가능한 PWA",
        title: "byteflow.tools를 앱으로 설치",
        subtitle: "byteflow.tools를 네이티브 앱처럼 오프라인에서 사용하세요。대부분의 브라우저 로컬 도구는 로컬에서 처리되며, 앱 셸 캐시 후 핵심 기능을 오프라인으로 계속 사용할 수 있습니다. 외부 요청 도구의 조회 작업에는 네트워크가 필요합니다.",
        installNow: "지금 설치",
        seeGuide: "설치 가이드 보기",
        alreadyInstalled: "이미 설치됨",
        openApp: "앱 열기",
        sectionBenefits: "설치해야 하는 이유",
        sectionGuide: "설치 가이드",
        sectionFaq: "FAQ",
        sectionBottom: "byteflow.tools를 오프라인으로",
        bottomTrust: "개인정보 보호 우선. 빠른 속도. 브라우저 로컬 도구는 오프라인 지원.",
        manualHint: "이 브라우저에서는 설치 프롬프트를 지원하지 않습니다. 아래 수동 가이드를 확인하세요.",
        guidePreviewLabel: "가이드 미리보기",
        benefits: [
            {
                key: "instant_launch",
                title: "즉시 실행",
                description: "독립 창으로 실행되어 반복 실행 속도가 더 빠릅니다.",
            },
            {
                key: "works_offline",
                title: "오프라인 동작",
                description: "핵심 포맷팅/인코딩 작업은 네트워크 없이도 계속 사용할 수 있습니다.",
            },
            {
                key: "local_first",
                title: "브라우저 로컬 우선",
                description: "브라우저 로컬 도구는 기기에서 처리합니다. 외부 요청 도구는 네트워크 사용 전에 표시됩니다.",
            },
        ],
        guides: {
            chrome_desktop: {
                label: "Chrome 데스크톱",
                title: "Chrome 데스크톱에 설치",
                steps: [
                    "Chrome에서 byteflow.tools를 엽니다.",
                    "주소창의 설치 아이콘을 클릭합니다.",
                    "설치를 확인하면 독립 앱 창으로 열립니다.",
                ],
                screenshot: GUIDE_SCREENSHOTS.chrome_desktop,
            },
            android: {
                label: "Android",
                title: "Android에 설치",
                steps: [
                    "Android Chrome에서 byteflow.tools를 엽니다.",
                    "우측 상단 점 세 개 메뉴에서 '앱 설치'를 선택합니다.",
                    "'홈 화면에 추가'를 확인합니다.",
                ],
                screenshot: GUIDE_SCREENSHOTS.android,
            },
            ios: {
                label: "iOS Safari",
                title: "iOS Safari에 설치",
                steps: [
                    "Safari에서 byteflow.tools를 엽니다.",
                    "공유를 누른 뒤 '홈 화면에 추가'를 선택합니다.",
                    "'추가'를 누르고 홈 화면 아이콘에서 실행합니다.",
                ],
                screenshot: GUIDE_SCREENSHOTS.ios,
            },
            edge: {
                label: "Edge",
                title: "Microsoft Edge에 설치",
                steps: [
                    "Edge에서 byteflow.tools를 엽니다.",
                    "브라우저 메뉴에서 '앱' > '이 사이트를 앱으로 설치'를 선택합니다.",
                    "확인 후 설치를 완료합니다.",
                ],
                screenshot: GUIDE_SCREENSHOTS.edge,
            },
            firefox: {
                label: "Firefox",
                title: "Firefox 안내",
                steps: [
                    "Firefox는 현재 PWA 설치 지원이 제한적입니다.",
                    "완전한 설치 흐름은 Chrome, Edge, Safari 사용을 권장합니다.",
                    "Firefox에서는 북마크로 빠르게 접근할 수 있습니다.",
                ],
                screenshot: GUIDE_SCREENSHOTS.firefox,
            },
        },
        faq: [
            {
                question: "PWA와 네이티브 앱의 차이는 무엇인가요?",
                answer: "PWA는 웹 기술로 동작하지만 홈 화면에서 실행되고 앱처럼 오프라인 사용이 가능합니다.",
            },
            {
                question: "설치에 비용이 드나요?",
                answer: "아니요. byteflow.tools 설치와 사용은 무료입니다.",
            },
            {
                question: "업데이트는 어떻게 적용되나요?",
                answer: "업데이트는 백그라운드에서 내려받고, 새로고침 시 적용됩니다.",
            },
            {
                question: "삭제는 어떻게 하나요?",
                answer: "운영체제의 앱 삭제 기능 또는 브라우저 앱 관리에서 제거할 수 있습니다.",
            },
            {
                question: "데이터가 서버로 동기화되나요?",
                answer: "브라우저 로컬 도구는 서버로 동기화하지 않습니다. 외부 요청 도구는 표시되며 조회 작업을 실행할 때만 네트워크를 사용합니다.",
            },
        ],
    },
    de: {
        badge: "Installierbare PWA",
        title: "byteflow.tools als App installieren",
        subtitle: "Nutzen Sie byteflow.tools offline mit App-ähnlicher Oberfläche. Die meisten browser-lokalen Tools verarbeiten lokal, und Kernfunktionen bleiben nach App-Shell-Caching offline verfügbar. Tools mit externer Anfrage benötigen für Lookup-Aktionen weiterhin Netzwerk.",
        installNow: "Jetzt installieren",
        seeGuide: "Installationsanleitung",
        alreadyInstalled: "Bereits installiert",
        openApp: "App öffnen",
        sectionBenefits: "Warum installieren",
        sectionGuide: "Installationsanleitung",
        sectionFaq: "FAQ",
        sectionBottom: "byteflow.tools offline nutzen",
        bottomTrust: "Datenschutz zuerst. Schnell. Browser-lokale Tools funktionieren ohne Netzwerk.",
        manualHint: "In diesem Browser ist kein Installationsprompt verfügbar. Folgen Sie der Anleitung unten.",
        guidePreviewLabel: "Vorschau",
        benefits: [
            {
                key: "instant_launch",
                title: "Sofort starten",
                description: "Startet im eigenständigen Fenster und ist bei Wiederholungen schneller bereit.",
            },
            {
                key: "works_offline",
                title: "Offline nutzbar",
                description: "Kern-Workflows zum Formatieren und Kodieren funktionieren auch ohne Netzwerk.",
            },
            {
                key: "local_first",
                title: "Browser-lokal zuerst",
                description: "Browser-lokale Tools verarbeiten Inhalte auf dem Gerät; externe Anfragen werden vor Netzwerkzugriff markiert.",
            },
        ],
        guides: {
            chrome_desktop: {
                label: "Chrome Desktop",
                title: "In Chrome Desktop installieren",
                steps: [
                    "Öffnen Sie byteflow.tools in Chrome.",
                    "Klicken Sie auf das Installationssymbol in der Adressleiste.",
                    "Bestätigen Sie die Installation, um die App im eigenen Fenster zu öffnen.",
                ],
                screenshot: GUIDE_SCREENSHOTS.chrome_desktop,
            },
            android: {
                label: "Android",
                title: "Auf Android installieren",
                steps: [
                    "Öffnen Sie byteflow.tools in Chrome auf Android.",
                    "Tippen Sie auf das Drei-Punkte-Menü und wählen Sie 'App installieren'.",
                    "Bestätigen Sie 'Zum Startbildschirm hinzufügen'.",
                ],
                screenshot: GUIDE_SCREENSHOTS.android,
            },
            ios: {
                label: "iOS Safari",
                title: "In iOS Safari installieren",
                steps: [
                    "Öffnen Sie byteflow.tools in Safari.",
                    "Tippen Sie auf Teilen und wählen Sie 'Zum Home-Bildschirm'.",
                    "Tippen Sie auf Hinzufügen und starten Sie über das Homescreen-Icon.",
                ],
                screenshot: GUIDE_SCREENSHOTS.ios,
            },
            edge: {
                label: "Edge",
                title: "In Microsoft Edge installieren",
                steps: [
                    "Öffnen Sie byteflow.tools in Edge.",
                    "Öffnen Sie das Browser-Menü und wählen Sie Apps > Diese Website als App installieren.",
                    "Bestätigen Sie die Installation.",
                ],
                screenshot: GUIDE_SCREENSHOTS.edge,
            },
            firefox: {
                label: "Firefox",
                title: "Hinweis zu Firefox",
                steps: [
                    "Firefox unterstützt PWA-Installationen derzeit nur eingeschränkt.",
                    "Für den vollständigen Ablauf verwenden Sie Chrome, Edge oder Safari.",
                    "Alternativ können Sie byteflow.tools als Lesezeichen speichern.",
                ],
                screenshot: GUIDE_SCREENSHOTS.firefox,
            },
        },
        faq: [
            {
                question: "Was ist der Unterschied zwischen PWA und nativer App?",
                answer: "Eine PWA nutzt Web-Technologien, kann aber wie eine App vom Startbildschirm geöffnet und offline genutzt werden.",
            },
            {
                question: "Ist die Installation kostenpflichtig?",
                answer: "Nein. Die Installation und Nutzung von byteflow.tools ist kostenlos.",
            },
            {
                question: "Wie funktionieren Updates?",
                answer: "Updates werden im Hintergrund geladen und nach einem Refresh übernommen.",
            },
            {
                question: "Wie deinstalliere ich die App?",
                answer: "Nutzen Sie die Deinstallationsfunktion Ihres Systems oder entfernen Sie die App im Browser-Manager.",
            },
            {
                question: "Werden meine Daten mit einem Server synchronisiert?",
                answer: "Browser-lokale Tools synchronisieren keine Daten mit einem Server. Tools mit externer Anfrage sind markiert und kontaktieren das Netzwerk nur bei Lookup-Aktionen.",
            },
        ],
    },
    fr: {
        badge: "PWA installable",
        title: "Installer byteflow.tools comme application",
        subtitle: "Utilisez byteflow.tools hors ligne avec une expérience type application. La plupart des outils locaux au navigateur traitent localement, et les fonctionnalités principales restent disponibles hors ligne après mise en cache de l'app shell. Les outils à requête externe nécessitent toujours le réseau pour les actions de recherche.",
        installNow: "Installer maintenant",
        seeGuide: "Voir le guide d'installation",
        alreadyInstalled: "Déjà installé",
        openApp: "Ouvrir l'app",
        sectionBenefits: "Pourquoi installer",
        sectionGuide: "Guide d'installation",
        sectionFaq: "FAQ",
        sectionBottom: "Passez byteflow.tools en mode hors ligne",
        bottomTrust: "Confidentialité d'abord. Rapide. Les outils locaux au navigateur fonctionnent hors ligne.",
        manualHint: "Le prompt d'installation n'est pas disponible dans ce navigateur. Suivez les étapes ci-dessous.",
        guidePreviewLabel: "Aperçu du guide",
        benefits: [
            {
                key: "instant_launch",
                title: "Démarrage instantané",
                description: "Ouvrez dans une fenêtre autonome avec un relancement plus rapide.",
            },
            {
                key: "works_offline",
                title: "Fonctionne hors ligne",
                description: "Les flux principaux de formatage et d'encodage continuent sans réseau.",
            },
            {
                key: "local_first",
                title: "Local au navigateur d’abord",
                description: "Les outils locaux au navigateur traitent sur l’appareil ; les requêtes externes sont signalées avant usage réseau.",
            },
        ],
        guides: {
            chrome_desktop: {
                label: "Chrome Desktop",
                title: "Installer sur Chrome Desktop",
                steps: [
                    "Ouvrez byteflow.tools dans Chrome.",
                    "Cliquez sur l'icône d'installation dans la barre d'adresse.",
                    "Confirmez pour ouvrir l'application dans une fenêtre autonome.",
                ],
                screenshot: GUIDE_SCREENSHOTS.chrome_desktop,
            },
            android: {
                label: "Android",
                title: "Installer sur Android",
                steps: [
                    "Ouvrez byteflow.tools dans Chrome sur Android.",
                    "Touchez le menu trois points puis choisissez 'Installer l'application'.",
                    "Confirmez l'ajout à l'écran d'accueil.",
                ],
                screenshot: GUIDE_SCREENSHOTS.android,
            },
            ios: {
                label: "iOS Safari",
                title: "Installer sur iOS Safari",
                steps: [
                    "Ouvrez byteflow.tools dans Safari.",
                    "Touchez Partager puis 'Sur l'écran d'accueil'.",
                    "Touchez Ajouter puis lancez depuis l'icône de l'écran d'accueil.",
                ],
                screenshot: GUIDE_SCREENSHOTS.ios,
            },
            edge: {
                label: "Edge",
                title: "Installer sur Microsoft Edge",
                steps: [
                    "Ouvrez byteflow.tools dans Edge.",
                    "Ouvrez le menu du navigateur puis Apps > Installer ce site comme application.",
                    "Confirmez l'installation.",
                ],
                screenshot: GUIDE_SCREENSHOTS.edge,
            },
            firefox: {
                label: "Firefox",
                title: "Note Firefox",
                steps: [
                    "Firefox prend actuellement en charge l'installation PWA de façon limitée.",
                    "Pour un flux complet, utilisez Chrome, Edge ou Safari.",
                    "Vous pouvez aussi enregistrer byteflow.tools en favori pour un accès rapide.",
                ],
                screenshot: GUIDE_SCREENSHOTS.firefox,
            },
        },
        faq: [
            {
                question: "Quelle est la différence entre une PWA et une application native ?",
                answer: "Une PWA fonctionne avec des technologies web, mais peut se lancer depuis l'écran d'accueil et fonctionner hors ligne comme une application.",
            },
            {
                question: "L'installation est-elle payante ?",
                answer: "Non. L'installation et l'utilisation de byteflow.tools sont gratuites.",
            },
            {
                question: "Comment fonctionnent les mises à jour ?",
                answer: "Les mises à jour sont téléchargées en arrière-plan et appliquées après actualisation.",
            },
            {
                question: "Comment désinstaller ?",
                answer: "Utilisez la désinstallation de votre système ou retirez l'application depuis la gestion des apps du navigateur.",
            },
            {
                question: "Mes données sont-elles synchronisées vers un serveur ?",
                answer: "Les outils locaux au navigateur ne synchronisent pas de données vers un serveur. Les outils à requête externe sont signalés et ne contactent le réseau que lors des actions de recherche.",
            },
        ],
    },
}

export function getInstallPageCopy(locale: Locale): InstallPageCopy {
    return INSTALL_PAGE_COPY[locale] || INSTALL_PAGE_COPY.en
}
