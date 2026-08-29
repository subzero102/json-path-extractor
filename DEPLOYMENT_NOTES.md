# Deployment Issue Notes — extractjsonpath.com

## Setup
- VPS: `213.210.21.177`, domain `extractjsonpath.com` (DNS A record points to this IP).
- Stack: Vite build → nginx-unprivileged (container) + certbot (sidecar) via docker compose.
- Local clone path: `/opt/json-path-extractor`.

## Port layout
- Host `80`   → container `8080` (HTTP, serves ACME challenge + 301 → HTTPS).
- Host `8443` → container `8080` (HTTP, also redirects to HTTPS; kept for symmetry).
- Host `443`  → container `8443` (HTTPS).
- OS firewall: `80`, `443`, `8443` opened.

## What was fixed during the session
1. **Dockerfile**: switched to `nginxinc/nginx-unprivileged:1.27-alpine` (runs as uid 101, listens on 8080 by default).
2. **docker-compose.yml**: hardening (non-root, `read_only`, `tmpfs`, `cap_drop: ALL`, `no-new-privileges`, resource limits, log rotation, healthcheck). Added certbot sidecar with shared `certs` and `certbot-www` volumes. Bound ports explicitly to `213.210.21.177`.
3. **nginx.conf**: two server blocks (HTTP on 8080, TLS on 8443), security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), `server_tokens off`, TLS 1.2/1.3, OCSP stapling, HTTP→HTTPS redirect.
4. **init-letsencrypt.sh**: bootstraps a self-signed dummy cert, starts nginx, requests a real Let's Encrypt cert via webroot, reloads nginx.
5. **Fixed bugs in init-letsencrypt.sh**:
   - `mkdir -p` before `openssl` so the dummy cert path exists inside the volume.
   - `rm` cleanup step made idempotent (the `&&` chain was failing when paths didn't exist).

## Blocker Resolution & Root Cause Summary

The issue was diagnosed as a combination of four compounding issues:
1. **Firewall Port 80**: `AGENTS.md` mistakenly documented port `8443` as the ACME challenge port. In Hostinger's external hPanel firewall, `8443` and `443` had been added, but `80` was omitted. Let's Encrypt HTTP-01 strictly requires port 80. Port 80 and 22 were subsequently opened in Hostinger hPanel firewall.
2. **Permission Denied for Non-Root Nginx (UID 101)**: The base image was switched to `nginxinc/nginx-unprivileged:1.27-alpine` (runs as UID `101:101`), whereas Certbot runs as root (`0:0`). Certbot writes private keys with mode `0600` and directories with `0700`. Nginx failed configuration checks with `Permission denied` when trying to read `privkey.pem`.
3. **Premature Dummy Cert Deletion**: `init-letsencrypt.sh` deleted dummy certs before real certs were acquired, leaving the volume empty upon failure. Additionally, `nginx.conf` required `chain.pem` which dummy self-signed certs did not include.
4. **Host IP Binding in docker-compose**: Ports were bound specifically to `213.210.21.177:80:8080`, causing local `curl 127.0.0.1` tests to fail with `Connection refused`.

### Solutions Applied
- `docker-compose.yml`: Standardized ports to `"80:8080"` and `"443:8443"`, decoupled `certbot` from `web`, and added an automatic renewal deploy-hook (`chmod -R a+rX /etc/letsencrypt/live /etc/letsencrypt/archive`).
- `init-letsencrypt.sh`: Replaced the dummy cert mechanism with Certbot standalone ACME bootstrap (`certbot certonly --standalone -p 80:80`), applied UID 101 read permissions, and brought up the compose stack cleanly.
- `AGENTS.md`: Updated port and deployment specifications.

## Current Deployment Runbook (Execute on VPS)

Run the following commands on the VPS (`/opt/json-path-extractor`):

```bash
cd /opt/json-path-extractor

# 1. Pull latest fixes
git pull origin main

# 2. Clean up any broken containers/volumes
docker compose down
docker volume rm json-path-extractor_certs json-path-extractor_certbot-www 2>/dev/null || true

# 3. Run the bootstrap script
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh

# 4. Verify deployment
docker compose ps
curl -Iv https://extractjsonpath.com
```
