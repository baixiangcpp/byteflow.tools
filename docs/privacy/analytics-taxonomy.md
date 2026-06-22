# Privacy-Safe Analytics Taxonomy

Byteflow analytics events must use the allowlist in `src/core/analytics/taxonomy.json`.
Runtime hooks are no-ops by default; any future provider must stay cookie-free,
anonymous, and aggregate-only.

## Allowed events

- `tool_loaded`
- `tool_action`
- `copy_output`
- `download_output`
- `search_performed`
- `related_tool_click`
- `pwa_installed`

## Allowed parameters

- `tool_id`
- `related_tool_id`
- `action_type`
- `language`
- `input_size_bucket`
- `query_length_bucket`
- `results_count`
- `size_bucket`
- `source_page`
- `platform`

## Forbidden data

Never send tool input, tool output, payloads, JWTs, tokens, secrets, full URLs,
file names, file contents, image contents, log bodies, hash values, search query text,
user identifiers, session identifiers, or exact sensitive lengths.

Search events may record only `query_length_bucket` and `results_count`.
File-related events may record only coarse size buckets and safe tool/action IDs.
