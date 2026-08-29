import './style.css';
import { buildTree, clearTree } from './treeBuilder.js';
import { generateVariants } from './pathVariants.js';
import { evaluate, stringifyResult } from './evaluator.js';

const THEME_KEY = 'json-path-extractor:theme';
const DEFAULT_THEME = 'dark';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function setSavedTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

applyTheme(getSavedTheme() || DEFAULT_THEME);

const jsonInput = document.getElementById('jsonInput');
const jsonHighlight = document.getElementById('jsonHighlight');
const treeContainer = document.getElementById('treeContainer');
const errorMsg = document.getElementById('errorMsg');
const pathInput = document.getElementById('pathInput');
const pathOutput = document.getElementById('pathOutput');
const pathStatus = document.getElementById('pathStatus');

const variantEls = {
  absolute: document.getElementById('variantAbsolute'),
  bracket: document.getElementById('variantBracket'),
  deepScan: document.getElementById('variantDeepScan'),
  wildcard: document.getElementById('variantWildcard'),
};

let parsedJSON = null;
let hasValidJSON = false;

const defaultJSON = `{
  "data": [{
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "JSON:API paints my bikeshed!",
      "body": "The shortest article. Ever.",
      "created": "2015-05-22T14:56:29.000Z",
      "updated": "2015-05-22T14:56:28.000Z"
    },
    "relationships": {
      "author": {
        "data": { "id": "42", "type": "people" }
      }
    }
  }],
  "included": [
    {
      "type": "people",
      "id": "42",
      "attributes": {
        "name": "John",
        "age": 80,
        "gender": "male"
      }
    }
  ]
}`;

function setVariants(pathArray) {
  const v = generateVariants(pathArray);
  variantEls.absolute.textContent = v.absolute;
  variantEls.bracket.textContent = v.bracket;
  variantEls.deepScan.textContent = v.deepScan;
  variantEls.wildcard.textContent = v.wildcard;

  for (const el of Object.values(variantEls)) {
    if (!el.textContent || el.textContent === 'N/A') el.classList.add('empty');
    else el.classList.remove('empty');
  }
}

function onSelectPath(pathArray) {
  setVariants(pathArray);
  // highlight selected variants area
  document.getElementById('zoneB')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleVariantClick(variantName) {
  const code = variantEls[variantName].textContent;
  if (!code || code === 'N/A') return;
  pathInput.value = code;
  evaluateAndRender();
}

function evaluateAndRender() {
  const pathStr = pathInput.value;
  if (!hasValidJSON) {
    pathOutput.value = 'No valid JSON loaded. Fix the JSON in the left pane first.';
    pathStatus.textContent = '';
    return;
  }
  if (!pathStr.trim()) {
    pathOutput.value = '';
    pathStatus.textContent = '';
    return;
  }
  const { result, error, empty } = evaluate(parsedJSON, pathStr);
  if (empty) {
    pathOutput.value = '';
    pathStatus.textContent = '';
    return;
  }
  if (error) {
    pathOutput.value = `Error: ${error}`;
    pathStatus.textContent = 'Error';
    pathStatus.style.color = 'var(--error)';
  } else {
    const count = Array.isArray(result) ? result.length : 0;
    pathOutput.value = stringifyResult(result);
    pathStatus.textContent = `${count} result${count !== 1 ? 's' : ''}`;
    pathStatus.style.color = 'var(--muted)';
  }
}

function renderTreeFromText(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    parsedJSON = null;
    hasValidJSON = false;
    clearError();
    clearTree(treeContainer, 'Paste JSON to see the tree');
    pathOutput.value = '';
    return;
  }
  try {
    const data = JSON.parse(text);
    parsedJSON = data;
    hasValidJSON = true;
    clearError();
    buildTree(data, treeContainer, onSelectPath);
    // re-evaluate if path exists
    if (pathInput.value.trim()) evaluateAndRender();
  } catch (e) {
    hasValidJSON = false;
    showError(parseJSONError(e, text));
    clearTree(treeContainer, 'Invalid JSON — fix errors to rebuild tree');
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function escapeHTML(s) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function positionToLineCol(text, pos) {
  const safe = Math.max(0, Math.min(pos, text.length));
  let line = 1, col = 1;
  for (let i = 0; i < safe; i++) {
    if (text.charCodeAt(i) === 10) { line++; col = 1; }
    else col++;
  }
  return { line, col };
}

function parseJSONError(e, text) {
  const msg = e?.message || String(e);
  const m = msg.match(/position\s+(\d+)/i);
  if (!m) return { line: null, col: null, message: msg };
  const pos = parseInt(m[1], 10);
  const { line, col } = positionToLineCol(text, pos);
  return { line, col, position: pos, message: msg };
}

function renderHighlight(text, errInfo) {
  if (!errInfo || errInfo.line == null) {
    jsonHighlight.innerHTML = (escapeHTML(text) || '') + '\u200B';
    jsonHighlight.dataset.errLine = '';
    return;
  }
  const lines = text.split('\n');
  const idx = errInfo.line - 1;
  if (idx < 0 || idx >= lines.length) {
    jsonHighlight.innerHTML = escapeHTML(text) + '\u200B';
    return;
  }
  const before = lines.slice(0, idx).join('\n');
  const errLine = lines[idx];
  const after = lines.slice(idx + 1).join('\n');
  const caretOffset = Math.max(0, errInfo.col - 1);
  const beforeCaret = errLine.slice(0, caretOffset);
  const atCaret = errLine.slice(caretOffset, caretOffset + 1) || ' ';
  const afterCaret = errLine.slice(caretOffset + 1);

  const html =
    escapeHTML(before) +
    (before ? '\n' : '') +
    `<span class="err-line">${escapeHTML(beforeCaret)}<span class="err-caret"></span>${escapeHTML(atCaret)}${escapeHTML(afterCaret)}</span>` +
    (after ? '\n' + escapeHTML(after) : '') +
    '\u200B';
  jsonHighlight.innerHTML = html;
  jsonHighlight.dataset.errLine = String(errInfo.line);
  // Sync scroll
  jsonHighlight.scrollTop = jsonInput.scrollTop;
  jsonHighlight.scrollLeft = jsonInput.scrollLeft;
}

function showError(errInfo) {
  jsonInput.classList.add('error');
  if (!errInfo || errInfo.line == null) {
    errorMsg.innerHTML = `<span class="err-text">${escapeHTML(errInfo?.message || 'Invalid JSON')}</span>`;
  } else {
    errorMsg.innerHTML =
      `<button type="button" class="err-loc" id="errLocBtn" title="Jump to error">` +
      `Line ${errInfo.line}, Col ${errInfo.col}</button>` +
      `<span class="err-text">${escapeHTML(errInfo.message)}</span>`;
    const btn = document.getElementById('errLocBtn');
    btn?.addEventListener('click', () => jumpToError(errInfo));
  }
  renderHighlight(jsonInput.value, errInfo);
}

function clearError() {
  jsonInput.classList.remove('error');
  errorMsg.innerHTML = '';
  renderHighlight(jsonInput.value, null);
}

function jumpToError(errInfo) {
  // Move caret to error position
  const text = jsonInput.value;
  const safe = Math.max(0, Math.min(errInfo.position || 0, text.length));
  jsonInput.focus();
  jsonInput.setSelectionRange(safe, safe);
  // Approximate scroll: compute line height and offsetTop
  const lh = parseFloat(getComputedStyle(jsonInput).lineHeight) || 20;
  jsonInput.scrollTop = Math.max(0, (errInfo.line - 3) * lh);
  jsonInput.dispatchEvent(new Event('scroll'));
}

// Wiring
const debouncedRender = debounce(() => renderTreeFromText(jsonInput.value), 150);
jsonInput.addEventListener('input', debouncedRender);
jsonInput.addEventListener('scroll', () => {
  jsonHighlight.scrollTop = jsonInput.scrollTop;
  jsonHighlight.scrollLeft = jsonInput.scrollLeft;
});

pathInput.addEventListener('input', evaluateAndRender);

// Variant click + copy
for (const [name, el] of Object.entries(variantEls)) {
  const row = el.closest('.variant');
  const copyBtn = row?.querySelector('.btn-copy');
  el.addEventListener('click', () => handleVariantClick(name));
  copyBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const val = el.textContent;
    if (!val || val === 'N/A') return;
    // also populate sandbox like spec requires
    pathInput.value = val;
    evaluateAndRender();
    try {
      await navigator.clipboard.writeText(val);
      const prev = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = prev;
        copyBtn.classList.remove('copied');
      }, 1200);
    } catch {}
  });
}

// Init
jsonInput.value = defaultJSON;
renderTreeFromText(defaultJSON);
setVariants([]);

const themeToggle = document.getElementById('themeToggle');
themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  setSavedTheme(next);
  themeToggle.setAttribute('aria-label', `Switch to ${current} mode`);
});
