# AGENTS

## Git Workflow

When the user says to push to main, commit the changes and run `git push origin main`. Do not create a branch unless explicitly specified.

## Repository

- **Name:** json-path-extractor
- **Description:** Interactive, client-side JSONPath tester. Paste JSON on the left, write a JSONPath expression, and inspect the extracted results on the right.
- **Stack:** Vite (vanilla JS/HTML/CSS), jsonpath-plus
- **Commands:**
  - `npm run dev` — start Vite dev server (default http://localhost:5173)
  - `npm run build` — production build to `dist/`
  - `npm run preview` — preview production build
  - `docker compose up --build` — run built app behind nginx (http://localhost:8080)
- **Requires:** Node.js 18+, npm, Docker
- **Layout:** `index.html` (entry), `src/` (source), `vite.config.js`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`
- **Remote:** `https://github.com/subzero102/json-path-extractor.git` (default branch: `main`)
