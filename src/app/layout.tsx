import type { Metadata } from "next";
import "@/app/globals.css";
import { DeferredToaster } from "@/components/ui/deferred-toaster";
import { LOCALES } from "@/core/i18n/i18n";
import { PWA_THEME_COLOR, PWA_THEME_COLOR_LIGHT } from "@/core/pwa/constants";
import { buildSiteKeywords } from "@/core/seo/seo";

export const metadata: Metadata = {
  metadataBase: new URL("https://byteflow.tools"),
  title: { default: "byteflow.tools | Privacy-first Developer Tools", template: "%s | byteflow.tools" },
  description: "A growing collection of privacy-first, client-side developer utilities. Format, encode, decode, generate, and validate - all locally in your browser.",
  keywords: buildSiteKeywords({ lang: "en", title: "byteflow.tools | Privacy-first Developer Tools" }),
  openGraph: {
    title: "byteflow.tools | Privacy-first Developer Tools",
    description: "A growing collection of privacy-first, client-side developer utilities.",
    url: "https://byteflow.tools",
    siteName: "byteflow.tools",
    type: "website",
    images: ["https://byteflow.tools/icon-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "byteflow.tools | Privacy-first Developer Tools",
    description: "A growing collection of privacy-first, client-side developer utilities.",
    images: ["https://byteflow.tools/icon-512.png"],
  },
};

const FOUC_SCRIPT = `
(function(){
  try {
    var locales = ${JSON.stringify(LOCALES)};
    var p = window.location.pathname || "/";
    var seg = p.split("/").filter(Boolean)[0];
    var activeLang = locales.indexOf(seg) >= 0 ? seg : "en";
    document.documentElement.setAttribute("lang", activeLang);

    var t = localStorage.getItem('theme');
    if (!t) {
      var m = document.cookie.match(/(?:^|;\\s*)theme=([^;]*)/);
      t = m ? m[1] : null;
    }
    if (!t) t = 'dark';
    if (t === 'system') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;

    var manifestHref = activeLang === 'en' ? '/manifest.json' : '/manifest.' + activeLang + '.json';
    var manifestLink = document.getElementById('app-manifest');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.id = 'app-manifest';
      manifestLink.rel = 'manifest';
      var currentScript = document.currentScript;
      if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.insertBefore(manifestLink, currentScript.nextSibling);
      } else {
        document.head.appendChild(manifestLink);
      }
    }
    manifestLink.href = manifestHref;

    var themeColor = t === 'light' ? '${PWA_THEME_COLOR_LIGHT}' : '${PWA_THEME_COLOR}';
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', themeColor);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `output: "export"` prevents the root layout from seeing nested `[lang]` params at render time.
    // `npm run postprocess:export-html-lang` rewrites the exported HTML files to the correct locale lang.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" id="app-manifest" href="/manifest.json" />
        <meta name="theme-color" content={PWA_THEME_COLOR} />
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <DeferredToaster />
      </body>
    </html>
  );
}
