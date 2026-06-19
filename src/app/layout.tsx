import type { Metadata } from "next";
import Script from "next/script";
import "@/app/globals.css";
import { DeferredToaster } from "@/components/ui/deferred-toaster";
import { PWA_THEME_COLOR } from "@/core/pwa/constants";
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
        <Script src="/runtime/theme-manifest-bootstrap.js" strategy="beforeInteractive" />
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
