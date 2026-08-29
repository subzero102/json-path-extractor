# Spec Analysis — Requirement Trace

Source: `interactive_jsonpath_extractor.md` (61 lines)

| # | Requirement | Zone/File | Status Plan |
|---|-------------|-----------|-------------|
| R1 | Paste complex JSON, client-side only, no backend | Zone A left, `main.js` JSON.parse | Implemented |
| R2 | Massive Salesforce template perf: collapsed default, efficient recursion, no DOM back-traversal | `treeBuilder.js` | Must — fragment + propagated pathArray |
| R3 | Vite + Vanilla JS + Vanilla CSS + jsonpath-plus | Tooling | Vite vanilla, npm i jsonpath-plus |
| R4 | Docker multi-stage nginx | Dockerfile | node:20-alpine → nginx:alpine |
| R5 | Left pane textarea, syntax validation, red border on invalid | `#jsonInput.error` | CSS `.error{border-color:var(--error)}` |
| R6 | Right pane tree, collapsed default, ▶/▼ toggle | `#treeContainer` | `div.children.collapsed{display:none}` |
| R7 | Every line has 📄 icon at end, generates path | `.doc-icon` | `createButton` + bound `curPath` |
| R8 | Middle pane 4 variants instant update on icon click | Zone B | `generateVariants` onSelect |
| R9 | Absolute: `$.store.book[0].author` (dot notation) | `pathVariants.js` absolute | isIndex→[n], isIdent→.k else ['k'] |
| R10 | Bracket: `$['store']['book'][0]['author']` | bracket | ['k'] or [n] |
| R11 | Deep Scan: `$..author` else N/A on index | deepScan | last key check |
| R12 | Array Wildcard: closest index → `[*]` | wildcard | findLastIndex isIndex |
| R13 | Bottom input populates on variant click | Zone C `#pathInput` | click handler → value + evaluate |
| R14 | Output read-only textarea stringified jsonpath-plus result | `#pathOutput` | `JSON.stringify(result,null,2)` |
| R15 | Don’t use React/Vue/Express | Global | Vanilla only |
| R16 | Clean, modern, space-efficient, system fonts, neutral palette | `style.css` | Tokens above |
| R17 | `e.stopPropagation()` on icon so not toggling | `treeBuilder.js` | Explicit |
| R18 | Responsive grid single page | `style.css` | Grid+media query |

## Constraints Checklist
- [x] No framework imports
- [x] `jsonpath-plus` is only npm dep (plus vite)
- [x] Collapsed by default (strict)
- [x] Recursive builder signature `buildTree(value, pathKeys, container, onSelect)` (+ children fragment)
- [x] Icons bound via closure array, not DOM traversal
- [x] `stopPropagation` verified
- [x] Border red on invalid JSON

## Open Decisions (recorded)
- Wildcard with no array index → returns Absolute (spec silent).
- DeepScan with special-char key → `['key']` form preserved in `$..['key']` vs `$..key`.
- “N/A” literal shown, not empty.
- Copy buttons added as UX enhancement (not forbidden).
