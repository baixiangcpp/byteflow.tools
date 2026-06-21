# Byteflow i18n Glossary

This glossary is the source of truth for user-facing localization of privacy, runtime, workflow, and tool-family terms. Every copy change must keep all supported locales aligned: `en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `de`, and `fr`.

## Rules

- Localize complete page copy in the same PR: title, description, headings, body copy, CTAs, FAQ, table text, examples, schema-visible text, and SEO metadata.
- Hard merge rule: user-facing copy is not complete until every supported locale in the same PR has complete, accurate localized text.
- User-facing copy must ship as complete, accurate localized text across every supported locale.
- No English-only originality: do not author original content only for `en` while other locales receive fallback, literal filler, or metadata-only localization.
- No partial originality: the complete affected user-facing surface must be localized. Do not make only one locale, one section, or only above-the-fold copy original while leaving the rest as generic fallback copy.
- Partial localization is a merge blocker. Split scope before opening the PR if accurate localization for all supported locales is not ready.
- Keep technical tokens such as `JSON`, `JWT`, `API`, `Base64`, `UUID`, `SHA-256`, and `HMAC` unchanged when that is the natural local form.
- Prefer clear product language over literal translation when a locale has a more natural technical term.

## Privacy And Runtime Terms

| Concept | en | zh-CN | zh-TW | ja | ko | de | fr |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Browser-local | Browser-local | 浏览器本地 | 瀏覽器本地 | ブラウザ内 | 브라우저 로컬 | browserlokal | local dans le navigateur |
| Offline capable | Offline capable | 支持离线 | 支援離線 | オフライン対応 | 오프라인 가능 | offlinefähig | utilisable hors ligne |
| External request | External request | 外部请求 | 外部請求 | 外部リクエスト | 외부 요청 | externe Anfrage | requête externe |
| Sensitive input | Sensitive input | 敏感输入 | 敏感輸入 | 機密入力 | 민감한 입력 | sensible Eingabe | entrée sensible |
| Privacy-first | Privacy-first | 隐私优先 | 隱私優先 | プライバシー重視 | 개인정보 우선 | datenschutzfreundlich | respectueux de la vie privée |
| Local-first | Local-first | 本地优先 | 本地優先 | ローカル優先 | 로컬 우선 | lokal zuerst | local-first |

## Tool Family Terms

| Concept | en | zh-CN | zh-TW | ja | ko | de | fr |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Formatter | Formatter | 格式化工具 | 格式化工具 | フォーマッター | 포매터 | Formatierer | formateur |
| Encoder | Encoder | 编码器 | 編碼器 | エンコーダー | 인코더 | Encoder | encodeur |
| Decoder | Decoder | 解码器 | 解碼器 | デコーダー | 디코더 | Decoder | décodeur |
| Hash | Hash | 哈希 | 雜湊 | ハッシュ | 해시 | Hash | hash |
| Workflow | Workflow | 工作流 | 工作流 | ワークフロー | 워크플로 | Workflow | workflow |
| Pipeline | Pipeline | Pipeline | Pipeline | パイプライン | 파이프라인 | Pipeline | pipeline |

## Writing Notes

- Chinese: use Simplified Chinese for `zh-CN` and Traditional Chinese for `zh-TW`. Keep spaces around Latin technical tokens when readability improves.
- Japanese: keep particles natural and avoid English carryover except accepted technical tokens.
- Korean: check particles after English tokens and avoid awkward transliteration.
- German: prefer compounds where natural, but avoid overlong button text.
- French: keep accents, agreement, and apostrophes correct; do not use unaccented fallback copy.
