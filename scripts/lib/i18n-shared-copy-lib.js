export const INTENTIONAL_SAME_AS_EN = {
    "nav.navigation": ["de", "fr"],
    "nav.text_string": ["de"],
    "nav.web_api": ["de", "fr"],
    "common.avatar": ["de", "fr"],
    "common.handle": ["de"],
    "common.hash_tool.live": ["de"],
    "common.hash_tool.mode": ["fr"],
    "common.hash_tool.mode_hmac": ["fr"],
    "common.overlay": ["de"],
    "common.privacy_footer.opensource_label": ["de", "fr"],
    "common.saturation": ["fr"],
    "common.style": ["fr"],
    "common.thumbnail_output_status": ["de"],
    "common.transparent": ["de", "fr"],
    "common.theme_system": ["de"],
    "common.validation": ["fr"],
    "pages.about_oss_title": ["de"],
    "pages.contact_title": ["fr"],
    "pages.privacy_contact_title": ["fr"],
    "tools.hash_generator.hmac_sha256": ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"],
    "tools.hash_generator.hmac_sha512": ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"],
    "tools.hash_generator.mode_hmac": ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"],
    "tools.html_css_beautifier.mode_css": ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"],
    "tools.html_css_beautifier.mode_html": ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"],
    "tools.html_formatter.mode_html": ["zh-CN", "zh-TW", "ja", "ko", "de", "fr"],
};

export function isIntentionalSameAsEnglishKey(key, locale) {
    return (INTENTIONAL_SAME_AS_EN[key] ?? []).includes(locale);
}
