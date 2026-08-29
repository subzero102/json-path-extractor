import './style.css';
import { buildTree, clearTree, expandAndHighlightPath, searchJSON } from './treeBuilder.js';
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

const treeSearchInput = document.getElementById('treeSearchInput');
const treeSearchClear = document.getElementById('treeSearchClear');
const treeSearchCount = document.getElementById('treeSearchCount');
const treeSearchResults = document.getElementById('treeSearchResults');

const variantEls = {
  absolute: document.getElementById('variantAbsolute'),
  bracket: document.getElementById('variantBracket'),
  deepScan: document.getElementById('variantDeepScan'),
  wildcard: document.getElementById('variantWildcard'),
  filter: document.getElementById('variantFilter'),
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
  const v = generateVariants(pathArray, parsedJSON);
  variantEls.absolute.textContent = v.absolute;
  variantEls.bracket.textContent = v.bracket;
  variantEls.deepScan.textContent = v.deepScan;
  variantEls.wildcard.textContent = v.wildcard;
  variantEls.filter.textContent = v.filter;

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

function resetTreeSearch() {
  if (treeSearchInput) treeSearchInput.value = '';
  if (treeSearchClear) treeSearchClear.classList.add('hidden');
  if (treeSearchCount) {
    treeSearchCount.textContent = '';
    treeSearchCount.classList.add('hidden');
  }
  if (treeSearchResults) {
    treeSearchResults.classList.add('hidden');
    treeSearchResults.innerHTML = '';
  }
}

function renderTreeFromText(text) {
  const trimmed = text.trim();
  resetTreeSearch();
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

// Tree search logic
function hideTreeSearchResults() {
  if (!treeSearchResults) return;
  treeSearchResults.classList.add('hidden');
  treeSearchResults.innerHTML = '';
}

function handleTreeSearch() {
  if (!treeSearchInput) return;
  const query = treeSearchInput.value.trim();
  if (!query || !hasValidJSON || !parsedJSON) {
    hideTreeSearchResults();
    treeSearchCount?.classList.add('hidden');
    treeSearchClear?.classList.add('hidden');
    return;
  }

  treeSearchClear?.classList.remove('hidden');
  const matches = searchJSON(parsedJSON, query, 30);

  if (treeSearchCount) {
    treeSearchCount.textContent = `${matches.length}${matches.length >= 30 ? '+' : ''} found`;
    treeSearchCount.classList.remove('hidden');
  }

  if (matches.length === 0) {
    treeSearchResults.innerHTML = '<div class="tree-search-empty">No matching keys, values, or labels</div>';
    treeSearchResults.classList.remove('hidden');
    return;
  }

  treeSearchResults.innerHTML = '';
  for (const match of matches) {
    const item = document.createElement('div');
    item.className = 'tree-search-item';

    const variants = generateVariants(match.path, parsedJSON);
    const suggestedPath = variants.filter !== 'N/A' ? variants.filter : variants.absolute;

    const labelRow = document.createElement('div');
    labelRow.className = 'search-item-header';

    const matchBadge = document.createElement('span');
    matchBadge.className = `search-badge badge-${match.type}`;
    matchBadge.textContent = match.type;
    labelRow.appendChild(matchBadge);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'search-item-title';
    titleSpan.textContent =
      match.type === 'label' || match.type === 'name'
        ? `${match.matchVal} (${match.parentKey})`
        : `${match.matchKey}: ${match.matchVal}`;
    labelRow.appendChild(titleSpan);

    item.appendChild(labelRow);

    const pathCode = document.createElement('code');
    pathCode.className = 'search-item-path';
    pathCode.textContent = suggestedPath;
    item.appendChild(pathCode);

    item.addEventListener('click', () => {
      hideTreeSearchResults();
      expandAndHighlightPath(treeContainer, match.path);
      onSelectPath(match.path);
      pathInput.value = suggestedPath;
      evaluateAndRender();
    });

    treeSearchResults.appendChild(item);
  }

  treeSearchResults.classList.remove('hidden');
}

const debouncedTreeSearch = debounce(handleTreeSearch, 150);
treeSearchInput?.addEventListener('input', debouncedTreeSearch);
treeSearchInput?.addEventListener('focus', () => {
  if (treeSearchInput.value.trim()) handleTreeSearch();
});
treeSearchInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const firstItem = treeSearchResults?.querySelector('.tree-search-item');
    if (firstItem) {
      firstItem.click();
    }
  } else if (e.key === 'Escape') {
    hideTreeSearchResults();
  }
});

treeSearchClear?.addEventListener('click', () => {
  if (!treeSearchInput) return;
  treeSearchInput.value = '';
  hideTreeSearchResults();
  treeSearchCount?.classList.add('hidden');
  treeSearchClear?.classList.add('hidden');
  treeSearchInput.focus();
});

document.addEventListener('click', (e) => {
  if (
    treeSearchResults &&
    !treeSearchResults.contains(e.target) &&
    e.target !== treeSearchInput &&
    e.target !== treeSearchClear
  ) {
    hideTreeSearchResults();
  }
});

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
