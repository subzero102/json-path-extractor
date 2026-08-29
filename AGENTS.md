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
  - `docker compose up --build` — run built app behind nginx
  - `./init-letsencrypt.sh` — first-time Let's Encrypt cert bootstrap (run once on the VPS)
- **Requires:** Node.js 18+, npm, Docker
- **Deployment (VPS 213.210.21.177, domain extractjsonpath.com):**
  - DNS A record `extractjsonpath.com` -> `213.210.21.177`
  - Ports opened in VPS firewall: `80/tcp` (HTTP, used for ACME HTTP-01 and HTTPS redirect), `443/tcp` (HTTPS), `22/tcp` (SSH)
  - Container port mapping: host `80` -> container `8080` (HTTP), host `443` -> container `8443` (TLS)
  - First deploy: `./init-letsencrypt.sh` (obtains certificates and starts the stack)
  - Certbot auto-renews every 12h inside the `certbot` service with permissions deploy-hook
- **Layout:** `index.html` (entry), `src/` (source), `vite.config.js`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `init-letsencrypt.sh`, `certbot/`
- **Remote:** `https://github.com/subzero102/json-path-extractor.git` (default branch: `main`)
