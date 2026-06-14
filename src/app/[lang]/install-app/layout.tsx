import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Locale } from "@/core/i18n/i18n"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildStaticPageMetadata } from "@/core/seo/seo"

const INSTALL_METADATA_COPY: Record<Locale, { title: string; description: string }> = {
    en: {
        title: "Install App",
        description: "Install byteflow.tools as a PWA for faster startup, offline access, and local-first developer workflows.",
    },
    "zh-CN": {
        title: "安装应用",
        description: "将 byteflow.tools 安装为 PWA，获得更快启动、离线访问和本地优先的开发工作流。",
    },
    "zh-TW": {
        title: "安裝應用程式",
        description: "將 byteflow.tools 安裝為 PWA，取得更快啟動、離線存取與在地優先工作流。",
    },
    ja: {
        title: "アプリをインストール",
        description: "byteflow.tools を PWA としてインストールし、高速起動・オフライン利用・ローカル優先ワークフローを実現。",
    },
    ko: {
        title: "앱 설치",
        description: "byteflow.tools를 PWA로 설치해 더 빠른 실행, 오프라인 접근, 로컬 우선 워크플로를 이용하세요.",
    },
    de: {
        title: "App installieren",
        description: "Installieren Sie byteflow.tools als PWA für schnelleren Start, Offline-Nutzung und lokale Entwickler-Workflows.",
    },
    fr: {
        title: "Installer l'app",
        description: "Installez byteflow.tools comme PWA pour un démarrage plus rapide, l'accès hors ligne et un workflow local-first.",
    },
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const copy = INSTALL_METADATA_COPY[locale]

    return buildStaticPageMetadata({
        lang: locale,
        slug: "install-app",
        title: copy.title,
        description: copy.description,
    })
}

export default function InstallAppLayout({ children }: { children: React.ReactNode }) {
    return children
}
