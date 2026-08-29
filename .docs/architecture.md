# Architecture

## Wireframe (from `json-path-extractor-illustration.png`)

```
+----------------------------------------------------+
| JSON PATH Extractor                                 |
| Provide the JSON here:        Expanded JSON         |
| +----------------------+  +----------------------+  |
| | textarea #jsonInput  |  | div #treeContainer   |  |
| | (raw JSON, mono)     |  | ▼"data":[{ 📄       |  |
| |                      |  |  "type":"articles" 📄 |  |
| +----------------------+  |  … ▶/▼ + 📄 per line|  |
| +----------------------+  +----------------------+  |
| | .variants (Zone B) 4 variants + Copy             |
| +--------------------------------------------------+
| Test the JSON Paths:                                |
| Path: [input #pathInput]                            |
| JSON Path Output                                    |
| +------------------------------------------------+ |
| | textarea #pathOutput (readOnly)                  | |
| +------------------------------------------------+ |
+----------------------------------------------------+
```

## Zones
- **Zone A — Top split** `display:grid; grid-template-columns:1fr 1fr; gap:16px; max-height:55vh`
  - Left: `#jsonInput` `<textarea>` monospace, `spellcheck=false`, red border `.error`
  - Right: `#treeContainer` `<div role="tree">` scrollable, system font for structure but mono for values. Each row `.line` with `.toggle`, `.key`, `.sep`, `.value`, `button.doc-icon`.
- **Zone B — Variants** `.variants-grid` (4 rows; desktop `grid` 110px label + `code` + `Copy`; mobile stack). Row ids: `variantAbsolute`, `variantBracket`, `variantDeepScan`, `variantWildcard`. Clicking a code or Copy populates Zone C input.
- **Zone C — Sandbox** `#pathInput` text + `#pathOutput` textarea. Output is `resultType:value` JSON.stringify.

## Component Map

```
index.html
  └─ src/main.js (orchestrator)
       ├─ src/treeBuilder.js :: buildTree(value, path, container, onSelect)
       │     └─ emits pathArray on 📄 click
       ├─ src/pathVariants.js :: generateVariants(pathArray) -> {a,b,d,w}
       │     └─ renders Zone B + on click -> set #pathInput
       └─ src/evaluator.js :: evaluate(json, pathStr) -> value[]
             └─ uses jsonpath-plus JSONPath
  └─ src/style.css (tokens, grid, tree lines, responsive)
```

## Data Flow
1. `input#jsonInput → JSON.parse → parsedJSON` (global in `main.js`)
2. `parsedJSON → buildTree → DOM tree (path arrays closed-over on icons)`
3. `icon click(pathArray) → generateVariants → Zone B DOM`
4. `variant click → #pathInput.value = variant → evaluate(parsedJSON, path)`
5. Manual edit of `#pathInput → evaluate` on `input` event.

## Styling Tokens
`--bg:#f9fafb --card:#fff --border:#e5e7eb --text:#111827 --muted:#6b7280 --accent:#2563eb --error:#dc2626 --radius:10px`
Fonts: `system: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial` ; `mono: ui-monospace,SFMono-Regular,Menlo,monospace`.

## Docker
`node:20-alpine` builder runs `npm ci && npm run build`; artifacts copied to `nginx:alpine` `/usr/share/nginx/html`; `nginx.conf` serves SPA with `try_files $uri /index.html`, gzip on. `docker-compose.yml` maps `8080:80`.

## Performance Notes
- Default collapsed: children `display:none` avoids layout cost for large files.
- Single `DocumentFragment` per build, `createElement` (no repeated `innerHTML`).
- Debounced parse (150ms) prevents thrash on large paste.
- Collapse/expand toggles class only, no rebuild.
