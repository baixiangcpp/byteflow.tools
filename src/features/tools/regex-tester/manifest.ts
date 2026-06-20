import type { ToolMeta } from "@/core/registry/types"

export const toolManifest = {
    key: "regex_tester",
    slug: "regex-tester",
    category: "network-web",
    relatedTools: ["jsonpath_playground", "text_diff_checker", "url_encode_decode"],
    privacy: {
        executionMode: "browser-local",
        offlineCapable: true,
        sensitiveInput: false,
        externalRequest: {
            required: false,
            endpointType: "none",
        },
    },
    keywords: ["regex tester", "regex online", "test regular expression", "regex debugger"],
    searchKeywords: ["regex", "regexp", "test regex", "regex match", "regular expression", "pattern test", "pattern tester", "正则表达式", "正規表現", "정규식 테스터", "匹配测试"],
} satisfies ToolMeta
