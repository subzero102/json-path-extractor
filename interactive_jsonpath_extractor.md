# Project Specification: Interactive JSONPath Extractor & Tester

## 1. Project Overview
Build a pure client-side web application that allows users to paste complex JSON payloads, interactively navigate a collapsible tree structure, generate various JSONPath expressions with a single click, and test those expressions against the original payload in real-time. 

This tool will frequently be used to parse massive, deeply nested files like Salesforce CRM Analytics dashboard templates. Therefore, DOM rendering performance, efficient recursive logic, and a default-collapsed tree state are strict requirements.

## 2. Tech Stack
* **Frontend Tooling:** Vite
* **Core Logic:** Vanilla JavaScript (ES6 Modules)
* **Styling:** Vanilla CSS (Flexbox/Grid layout)
* **Query Evaluation:** `jsonpath-plus` (client-side dependency)
* **Deployment:** Docker (Multi-stage build with Nginx Alpine), Docker Compose

## 3. UI/UX Architecture
The interface follows a single-page, responsive, grid-based layout divided into three main functional zones:

**Zone A: Top Split-Pane (Data & Navigation)**
* **Left Pane (Raw Input):** A `<textarea>` where the user pastes raw JSON. It should include basic syntax validation and error handling (turn border red on invalid JSON).
* **Right Pane (Interactive Tree):** A visual CSS tree representing the parsed JSON. 
  * Nested objects/arrays MUST be collapsed by default to prevent DOM freezing on large files.
  * Use a clickable toggle (▶ / ▼) to expand/collapse nodes.
  * Every line (key/value pair) must have a lightweight document icon (`📄`) appended at the end. Clicking this icon generates the path for that specific node.

**Zone B: Middle Pane (Path Variants)**
* A display section that updates instantly when a node's document icon is clicked in Zone A.
* Displays four calculated JSONPath variants for the selected node:
  1. **Absolute:** Dot notation (e.g., `$.store.book[0].author`).
  2. **Bracket:** Bracket notation for all keys (e.g., `$['store']['book'][0]['author']`).
  3. **Deep Scan:** Recursive descent to the specific key (e.g., `$..author`). Display "N/A" if targeting an array index.
  4. **Array Wildcard:** Replaces the closest array index with a wildcard (e.g., `$.store.book[*].author`).

**Zone C: Bottom Pane (Testing Sandbox)**
* **Input:** A text input field for a JSONPath expression. When a user clicks any of the generated variants in Zone B, it automatically populates this field.
* **Output:** A read-only `<textarea>` that displays the stringified result of running the JSONPath expression against the original JSON payload using `jsonpath-plus`.

## 4. Implementation Steps

### Phase 1: Setup & Dependencies
1. Initialize a vanilla Vite project.
2. Install `jsonpath-plus` via npm.
3. Configure `index.html`, `style.css`, and `main.js`.

### Phase 2: Core JavaScript Logic
1. **Input Listener:** Bind an `input` event to the raw JSON textarea. On valid JSON parse, pass the object to the tree builder.
2. **Recursive Tree Builder (`buildTree`):** Write a recursive function to generate the DOM tree. 
   * **Crucial:** Pass an array of keys (e.g., `['store', 'book', '0']`) down the recursive chain.
   * Do not traverse the DOM backward to find the path. The icon's `onclick` event must bind directly to the passed-down key array.
3. **Variant Generator:** Write a function that takes the key array and calculates the Absolute, Bracket, Deep Scan, and Wildcard strings.
4. **Evaluation Engine:** Bind the testing input field to `jsonpath-plus`. Re-evaluate and update the output textarea whenever the path input changes.

### Phase 3: Dockerization
Create a `Dockerfile` for a multi-stage build:
* **Stage 1 (Builder):** Use `node:20-alpine`, install dependencies, and run `npm run build`.
* **Stage 2 (Production):** Use `nginx:alpine`, copy the Vite `dist` folder to `/usr/share/nginx/html`, and expose port 80.
* Provide a standard `docker-compose.yml` to map port 8080 to container port 80.

## 5. Coding Constraints
* Do not use React, Vue, or backend frameworks (no Express/Node server).
* Ensure styling is clean, modern, and space-efficient. Use system fonts and a neutral color palette.
* Prevent click events on the path generation icons from triggering the expand/collapse toggles (use `e.stopPropagation()`).
