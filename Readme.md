# JSONPath Extractor

An interactive, client-side JSONPath tester. Paste JSON on the left, write a JSONPath expression, and inspect the extracted results on the right.

## Features

- Live JSONPath evaluation powered by [jsonpath-plus](https://www.npmjs.com/package/jsonpath-plus)
- Split-pane editor with syntax highlighting and validation
- Tree-style result viewer with collapsible nodes
- Light / dark theme toggle
- 100% client-side — no data leaves the browser

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

Opens Vite's dev server (default: http://localhost:5173).

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Preview production build

```bash
npm run preview
```

## Docker

A `Dockerfile` and `docker-compose.yml` are included for running the built app behind nginx.

```bash
docker compose up --build
```

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool & dev server
- [jsonpath-plus](https://www.npmjs.com/package/jsonpath-plus) — JSONPath engine
- Vanilla JS, HTML, CSS

## Project Structure

```
.
├── index.html        # App entry
├── src/              # App source
├── vite.config.js    # Vite config
├── Dockerfile        # Production image (nginx)
├── docker-compose.yml
└── nginx.conf
```

## License

MIT
