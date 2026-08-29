# Implementation Tasks

Checkable list for build phase. Tick after verification.

## Phase 1 — Setup & Dependencies
- [x] Initialize Vite vanilla project (preserve `.docs/` and spec assets)
- [x] Install `jsonpath-plus`
- [x] Create `src/` layout and stub files
- [x] Draft `index.html` skeleton with Zones A/B/C and seeded example JSON
- [x] Draft `src/style.css` tokens, grid, tree styling, responsive breakpoint
- [x] Verify `npm run build` (succeeds: 34KB JS / 6.5KB CSS)

## Phase 2 — Core Logic
- [x] Implement `src/pathVariants.js` + standalone node sanity (absolute/bracket/deep/wildcard cases)
- [x] Implement `src/treeBuilder.js` (collapsed default, fragment, toggle, 📄 binding, stopPropagation)
- [x] Implement `src/evaluator.js` (jsonpath-plus wrapper, error handling)
- [x] Wire `src/main.js` (debounced parse, error border, renderTree, onSelect→variants, variant→sandbox)
- [x] UX polish: Copy buttons, empty states, N/A, responsive
- [x] Variant logic verified — `store.book[0].author` → absolute `$.store.book[0].author`, deepScan `$..author`, wildcard `$.store.book[*].author`; array index last → deepScan `N/A`

## Phase 3 — Docker & Verification
- [x] Write `Dockerfile` (multi-stage)
- [x] Write `docker-compose.yml` (8080:80)
- [x] Write `nginx.conf` (SPA fallback, gzip, cache headers)
- [x] Write `.dockerignore`
- [x] `npm run build` succeeds and `dist/` contains assets (3.5KB html, 6.5KB css, 34KB js)
- [x] `docker build` + run smoke: HTTP 200 on :8080, served from nginx:alpine, content matches index.html

## Post-build
- [ ] Update this checklist to checked state
- [ ] Optional: add `README.md` usage section (if requested)
