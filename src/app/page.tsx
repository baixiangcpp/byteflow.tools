import type { Metadata } from "next"
import { LOCALES } from "@/core/i18n/i18n"

const SITE_URL = "https://byteflow.tools"

const ROOT_ALTERNATES = Object.fromEntries(
    LOCALES.map((locale) => [locale, `${SITE_URL}/${locale}`]),
) as Record<string, string>

ROOT_ALTERNATES["x-default"] = SITE_URL

export const metadata: Metadata = {
    title: {
        absolute: "byteflow.tools | Privacy-first Developer Tools",
    },
    alternates: {
        canonical: SITE_URL,
        languages: ROOT_ALTERNATES,
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootPage() {
    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                    (function() {
                      var supported = ${JSON.stringify(LOCALES)};
                      var lang = 'en';

                      // Check if user has manually selected a language before
                      try {
                        var saved = localStorage.getItem('byteflow:preferred-locale');
                        if (saved && supported.indexOf(saved) >= 0) {
                          lang = saved;
                        } else {
                          // Fall back to browser language detection
                          var raw = (navigator.language || 'en').toLowerCase();
                          if (raw === 'zh-cn' || raw === 'zh-sg') lang = 'zh-CN';
                          else if (raw === 'zh-tw' || raw === 'zh-hk' || raw === 'zh-mo') lang = 'zh-TW';
                          else if (raw === 'zh' || raw.indexOf('zh-') === 0) lang = 'zh-CN';
                          else if (raw.indexOf('ja') === 0) lang = 'ja';
                          else if (raw.indexOf('ko') === 0) lang = 'ko';
                          else if (raw.indexOf('de') === 0) lang = 'de';
                          else if (raw.indexOf('fr') === 0) lang = 'fr';
                          if (supported.indexOf(lang) < 0) lang = 'en';
                        }
                      } catch (e) {
                        // localStorage not available, use browser language
                        var raw = (navigator.language || 'en').toLowerCase();
                        if (raw === 'zh-cn' || raw === 'zh-sg') lang = 'zh-CN';
                        else if (raw === 'zh-tw' || raw === 'zh-hk' || raw === 'zh-mo') lang = 'zh-TW';
                        else if (raw === 'zh' || raw.indexOf('zh-') === 0) lang = 'zh-CN';
                        else if (raw.indexOf('ja') === 0) lang = 'ja';
                        else if (raw.indexOf('ko') === 0) lang = 'ko';
                        else if (raw.indexOf('de') === 0) lang = 'de';
                        else if (raw.indexOf('fr') === 0) lang = 'fr';
                        if (supported.indexOf(lang) < 0) lang = 'en';
                      }

                      var search = window.location.search || '';
                      var hash = window.location.hash || '';
                      if (search.indexOf('handoff=') >= 0 || search.indexOf('handoff_ref=') >= 0) {
                        hash = '#' + search.slice(1);
                        search = '';
                      }
                      var suffix = search + hash;
                      var target = '/' + lang + suffix;
                      window.location.replace(target);
                    })();
                `,
                }}
            />
            <main className="mx-auto max-w-xl px-6 py-16 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">byteflow.tools</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Choose your language. You will be redirected automatically.
                </p>
                <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
                    {LOCALES.map((locale) => (
                        <li key={locale}>
                            <a
                                href={`/${locale}`}
                                className="inline-flex rounded-md border border-border px-3 py-1.5 hover:border-primary/50"
                            >
                                {locale}
                            </a>
                        </li>
                    ))}
                </ul>
            </main>
        </>
    )
}
