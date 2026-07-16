# Input intent taxonomy

Tool input sizing uses five stable intents:

| Intent | Use |
| --- | --- |
| `scalar` | Numbers, colors, flags, enum-like controls, and other compact values. |
| `shortText` | URLs, names, expressions, and short free-form text. |
| `payload` | User-authored JSON, CSV, tokens, logs, code, and multiline data. |
| `workbench` | Dense editor or split-pane work areas. |
| `generatedOutput` | Read-only generated text or code with copy/export actions. |

`Input`, `Textarea`, Monaco wrappers, and `TextOutputPanel` emit `data-input-intent` at runtime. The create-tool scaffold declares a payload input, a workbench container, and generated output explicitly.

`tests/guards/input-intent-taxonomy.test.ts` parses every TSX file under `src` to inventory shared controls plus raw `input`, `textarea`, and `select` elements. Representative routes must declare an explicit intent. Remaining hardcoded height tokens are frozen by a stable file/tag/token hash, so a new unclassified size fails CI without depending on source line numbers.
