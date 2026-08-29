# Decisions (ADRs)

## ADR-001: Vite Vanilla Template
Chosen over manual rollup because spec mandates Vite; vanilla template gives `index.html` + `src/main.js` with zero framework.

## ADR-002: jsonpath-plus Import
`jsonpath-plus` ships ESM. Import as `import { JSONPath } from 'jsonpath-plus'` with fallback to default export if needed. Evaluator isolates import so swap is trivial.

## ADR-003: Default Collapsed & Fragment
All nested `object`/`array` children rendered but hidden (`display:none`). Single `DocumentFragment` per build minimizes reflow. Alternative (lazy render on expand) deferred for simplicity and to keep searchability.

## ADR-004: Wildcard — Last Index
Spec: "Replaces the closest array index with a wildcard". Interpreted as last numeric segment. If multiple arrays (e.g., `$.a[0].b[2].c`) → result `$.a[0].b[*].c`. If none, return absolute (explicit N/A considered but absolute is more useful).

## ADR-005: nginx SPA Config
Use custom `nginx.conf` with `try_files $uri $uri/ /index.html` so deep links don’t 404, plus `gzip on`.

## ADR-006: No Backend, No State Library
All state in `main.js` module scope (`parsedJSON`, `selectedPath`). No localStorage persistence (could be added later).

## ADR-007: Copy Buttons
Spec doesn’t forbid additions; copy buttons on Zone B variants improve usability without altering required 4-variant display.

## ADR-008: Sample JSON Seeding
Seed `#jsonInput` with illustration’s JSON:API article example for immediate demo; matches image’s “Provide the JSON here” placeholder.
