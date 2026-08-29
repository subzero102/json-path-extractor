# Plan — Interactive JSONPath Extractor & Tester

## 1. Overview
Pure client-side SPA (Vite + Vanilla JS + Vanilla CSS + `jsonpath-plus`, Nginx) that lets users paste large/ deeply-nested JSON (e.g., Salesforce CRM Analytics dashboard templates), browse a default-collapsed interactive tree, click `📄` per node to generate four JSONPath variants, and test arbitrary paths against the payload via `jsonpath-plus`.

Constraints: no React/Vue/backend, DOM must stay performant on massive files (collapsed default, DocumentFragment), path bound via propagated `keyArray` (no DOM back-traversal), `e.stopPropagation()` on icons.

## 2. Tech Stack
- **Tooling:** Vite 5 (vanilla template)
- **Runtime:** ES6 modules, vanilla JS
- **Styling:** Vanilla CSS, Flex/Grid, system + mono fonts, neutral palette
- **Query:** `jsonpath-plus` (client-side)
- **Deployment:** Docker multi-stage (`node:20-alpine` → `nginx:alpine`), `docker-compose.yml` `8080:80`

## 3. Phases

### Phase 1 — Setup & Dependencies
- Initialize `npm create vite@latest . -- --template vanilla` (in place)
- `npm i jsonpath-plus`
- Configure `index.html`, `src/style.css`, `src/main.js`
- Seed example JSON that matches illustration (JSON:API article example)

### Phase 2 — Core Logic
1. **Input Listener (`src/main.js`)** — `input` + debounce 150ms on `#jsonInput`; `JSON.parse` success → remove `.error`, call `buildTree`; failure → add `.error` (red border), clear tree, keep last valid parse for evaluator fallback.
2. **Tree Builder (`src/treeBuilder.js`)** — `buildTree(value, pathKeys, container)` recursive; `curPath=[...path,String(key)]` propagated; `DocumentFragment`; container nodes collapse => `children {display:none}` + toggle `▶/▼`; leaf + container lines get `button.icon 📄` bound to `onSelect(curPath)`; click on icon stops propagation.
3. **Variant Generator (`src/pathVariants.js`)** — `generateVariants(pathArray)` → `{absolute, bracket, deepScan, wildcard}` — see §4.
4. **Evaluation Engine (`src/evaluator.js`)** — wraps `JSONPath({path,json})`, invoked on `#pathInput` input and on variant click populating the field; renders `JSON.stringify(result,null,2)` to `#pathOutput`; catch → `Error: …`.

### Phase 3 — Dockerization
- `Dockerfile` two stages, `nginx.conf` SPA fallback + gzip, `.dockerignore`
- `docker-compose.yml` port mapping
- Verify `npm run build` + `docker compose up --build` on :8080

## 4. Variant Rules
Helpers: `isIndex(k)=/^\d+$/.test(k)`, `isIdent(k)=/^[a-zA-Z_$][\w$]*$/.test(k)`, `esc=s.replace(/'/g,"\\'")`
- **Absolute:** `"$" + path.map(k=>isIndex(k)?`[${k}]`:isIdent(k)?`.${k}`:`['${esc(k)}']`).join("")`
- **Bracket:** `"$" + path.map(k=>isIndex(k)?`[${k}]`:`['${esc(k)}']`).join("")`
- **Deep Scan:** if no path or `isIndex(last)` → `"N/A"` else `"$.."+(isIdent(last)?last:`['${esc(last)}']`)`
- **Wildcard:** find last index of `isIndex`; if none → same as Absolute; else build Absolute with `[*]` at that index.

## 5. Verification
- `npm run build` succeeds, `dist/` present.
- Manual QA matrix: valid/invalid JSON, large file collapsed perf, expand/collapse, 📄 → variants, click variant → sandbox, deepScan N/A on index, wildcard on multi-array path, copy buttons.
- Docker smoke: `curl localhost:8080`.

## 6. Risks
- Huge JSON → DOM blow-up even collapsed (one node per key). Mitigated by collapsed + Fragment. Optional future: virtualization.
- `jsonpath-plus` ESM interop — handle both named `JSONPath` and default export.
- `N/A` UX for deepScan/wildcard made explicit rather than empty string.

## 7. Task Order (see `implementation-tasks.md`)
Scaffold → install → HTML/CSS shell → JS modules → wire events → Docker → verify.
