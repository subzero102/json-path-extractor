function isExpandable(value) {
  return value !== null && typeof value === 'object';
}

function getPreview(value) {
  if (Array.isArray(value)) return ` [${value.length}]`;
  if (value !== null && typeof value === 'object') return ` {${Object.keys(value).length}}`;
  return '';
}

const COPY_ICON_SVG =
  '<svg width="12" height="12" aria-hidden="true"><use href="#icon-copy-symbol"></use></svg>';

function createDocIcon(curPath) {
  const btn = document.createElement('button');
  btn.className = 'doc-icon';
  btn.type = 'button';
  btn.dataset.action = 'select-path';
  btn.dataset.path = JSON.stringify(curPath);
  btn.innerHTML = COPY_ICON_SVG;
  const pathLabel = curPath.length > 0 ? curPath.join('.') : 'root';
  btn.title = `Generate JSONPath for ${pathLabel}`;
  btn.setAttribute('aria-label', `Generate JSONPath for ${pathLabel}`);
  return btn;
}

function renderChildrenInto(container, value, curPath, isArray) {
  const frag = document.createDocumentFragment();
  if (isArray) {
    for (let idx = 0; idx < value.length; idx++) {
      const child = value[idx];
      const childPath = [...curPath, String(idx)];
      frag.appendChild(createNode(child, String(idx), childPath, true));
    }
  } else {
    for (const [k, v] of Object.entries(value)) {
      const childPath = [...curPath, String(k)];
      frag.appendChild(createNode(v, k, childPath, false));
    }
  }
  container.appendChild(frag);
  container.dataset.rendered = 'true';
}

function createNode(value, key, curPath, isArrayParent) {
  const node = document.createElement('div');
  node.className = 'tree-node';
  if (key !== null) {
    node.dataset.segment = String(key);
  }

  const line = document.createElement('div');
  line.className = 'tree-line';

  const expandable = isExpandable(value);
  const toggle = document.createElement('span');
  toggle.className = 'tree-toggle';
  if (expandable) {
    toggle.textContent = '▶';
    toggle.classList.add('expandable');
    toggle.dataset.action = 'toggle';
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-label', `Toggle node ${key !== null ? key : 'items'}`);
    toggle.setAttribute('aria-expanded', 'false');
  } else {
    toggle.textContent = '';
  }
  line.appendChild(toggle);

  const keySpan = document.createElement('span');
  keySpan.className = 'tree-key';

  if (key !== null) {
    if (isArrayParent) {
      keySpan.textContent = `[${key}]`;
      keySpan.classList.add('array-index');
    } else {
      keySpan.textContent = `"${key}"`;
    }
    const colon = document.createElement('span');
    colon.textContent = ': ';
    colon.className = 'tree-colon';
    line.appendChild(keySpan);
    line.appendChild(colon);
  }

  const valueSpan = document.createElement('span');
  valueSpan.className = 'tree-value';

  if (value === null) {
    valueSpan.textContent = 'null';
    valueSpan.classList.add('val-null');
  } else if (typeof value === 'string') {
    valueSpan.textContent = `"${value}"`;
    valueSpan.classList.add('val-string');
    valueSpan.title = value;
  } else if (typeof value === 'number') {
    valueSpan.textContent = String(value);
    valueSpan.classList.add('val-number');
  } else if (typeof value === 'boolean') {
    valueSpan.textContent = String(value);
    valueSpan.classList.add('val-boolean');
  } else if (Array.isArray(value)) {
    valueSpan.textContent = `[${value.length}]`;
    valueSpan.classList.add('val-bracket');
  } else if (typeof value === 'object') {
    valueSpan.textContent = `{${Object.keys(value).length}}`;
    valueSpan.classList.add('val-bracket');
  }

  line.appendChild(valueSpan);

  const comma = document.createElement('span');
  comma.className = 'tree-comma';
  line.appendChild(comma);

  const icon = createDocIcon(curPath);
  line.appendChild(icon);

  node.appendChild(line);

  if (expandable) {
    node._value = value;
    node._path = curPath;
    node._isArray = Array.isArray(value);

    const children = document.createElement('div');
    children.className = 'tree-children collapsed';
    node.appendChild(children);
  }

  return node;
}

export function ensureNodeExpanded(node) {
  if (!node) return;
  const children = node.querySelector(':scope > .tree-children');
  const line = node.querySelector(':scope > .tree-line');
  const toggle = line?.querySelector('.tree-toggle');

  if (children && node._value !== undefined && !children.dataset.rendered) {
    renderChildrenInto(children, node._value, node._path, node._isArray);
  }

  if (children && children.classList.contains('collapsed')) {
    children.classList.remove('collapsed');
    if (toggle) {
      toggle.textContent = '▼';
      toggle.setAttribute('aria-expanded', 'true');
    }
    line?.classList.add('expanded');
  }
}

function toggleTreeNode(node) {
  if (!node) return;
  const children = node.querySelector(':scope > .tree-children');
  const line = node.querySelector(':scope > .tree-line');
  const toggle = line?.querySelector('.tree-toggle');
  if (!children) return;

  const isCollapsed = children.classList.contains('collapsed');
  if (isCollapsed) {
    if (node._value !== undefined && !children.dataset.rendered) {
      renderChildrenInto(children, node._value, node._path, node._isArray);
    }
    children.classList.remove('collapsed');
    if (toggle) {
      toggle.textContent = '▼';
      toggle.setAttribute('aria-expanded', 'true');
    }
    line?.classList.add('expanded');
  } else {
    children.classList.add('collapsed');
    if (toggle) {
      toggle.textContent = '▶';
      toggle.setAttribute('aria-expanded', 'false');
    }
    line?.classList.remove('expanded');
  }
}

export function buildTree(data, container, onSelect) {
  container.innerHTML = '';
  const frag = document.createDocumentFragment();

  // Root node
  const rootNode = document.createElement('div');
  rootNode.className = 'tree-node root-node';
  const rootLine = document.createElement('div');
  rootLine.className = 'tree-line root-line';
  const rootToggle = document.createElement('span');
  rootToggle.className = 'tree-toggle expandable';
  const rootExpandable = isExpandable(data);

  if (rootExpandable) {
    rootToggle.textContent = '▼';
    rootToggle.dataset.action = 'toggle';
    rootToggle.setAttribute('role', 'button');
    rootToggle.setAttribute('tabindex', '0');
    rootToggle.setAttribute('aria-label', 'Toggle root JSON container');
    rootToggle.setAttribute('aria-expanded', 'true');
  } else {
    rootToggle.textContent = '';
  }
  rootLine.appendChild(rootToggle);

  const rootKey = document.createElement('span');
  rootKey.className = 'tree-key root-key';
  rootKey.textContent = '{root}';
  rootLine.appendChild(rootKey);

  const rootVal = document.createElement('span');
  rootVal.className = 'tree-value val-bracket';
  if (Array.isArray(data)) rootVal.textContent = ` [${data.length}]`;
  else if (data !== null && typeof data === 'object') rootVal.textContent = ` {${Object.keys(data).length}}`;
  else rootVal.textContent = '';
  rootLine.appendChild(rootVal);

  const rootIcon = createDocIcon([]);
  rootLine.appendChild(rootIcon);
  rootNode.appendChild(rootLine);

  if (rootExpandable) {
    const rootChildren = document.createElement('div');
    rootChildren.className = 'tree-children';
    // Render top 1-level children immediately so user sees the initial structure
    renderChildrenInto(rootChildren, data, [], Array.isArray(data));
    rootNode.appendChild(rootChildren);
  }

  frag.appendChild(rootNode);
  container.appendChild(frag);

  // Set up single delegated event handler on container if not already attached
  if (!container._hasDelegatedListener) {
    container._hasDelegatedListener = true;

    container.addEventListener('click', (e) => {
      const docIcon = e.target.closest('.doc-icon');
      if (docIcon) {
        e.stopPropagation();
        if (container._onSelect && docIcon.dataset.path) {
          try {
            const parsedPath = JSON.parse(docIcon.dataset.path);
            container._onSelect(parsedPath);
          } catch {}
        }
        return;
      }

      const toggle = e.target.closest('.tree-toggle.expandable');
      if (toggle) {
        e.stopPropagation();
        const treeNode = toggle.closest('.tree-node');
        toggleTreeNode(treeNode);
        return;
      }

      const line = e.target.closest('.tree-line');
      if (line) {
        const treeNode = line.closest('.tree-node');
        toggleTreeNode(treeNode);
      }
    });

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const toggle = e.target.closest('.tree-toggle.expandable');
        if (toggle) {
          e.preventDefault();
          e.stopPropagation();
          const treeNode = toggle.closest('.tree-node');
          toggleTreeNode(treeNode);
        }
      }
    });
  }

  container._onSelect = onSelect;
}

export function clearTree(container, message = 'No valid JSON') {
  container.innerHTML = `<div class="tree-empty">${message}</div>`;
}

export function expandAndHighlightPath(container, pathArray) {
  if (!container || !Array.isArray(pathArray) || pathArray.length === 0) return null;

  // Ensure root is expanded
  const rootNode = container.querySelector('.root-node');
  ensureNodeExpanded(rootNode);

  const rootChildren = rootNode?.querySelector(':scope > .tree-children');
  let currentParent = rootChildren;
  let targetLine = null;

  for (let i = 0; i < pathArray.length; i++) {
    if (!currentParent) break;
    const segment = String(pathArray[i]);
    const childNode = Array.from(currentParent.children).find(
      (el) => el.classList.contains('tree-node') && el.dataset.segment === segment
    );
    if (!childNode) break;

    const line = childNode.querySelector(':scope > .tree-line');

    if (i === pathArray.length - 1) {
      targetLine = line;
    }

    if (i < pathArray.length - 1) {
      // Ensure ancestor is expanded (triggers lazy render if needed)
      ensureNodeExpanded(childNode);
      currentParent = childNode.querySelector(':scope > .tree-children');
    }
  }

  if (targetLine) {
    targetLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    targetLine.classList.add('tree-highlight-match');
    setTimeout(() => {
      targetLine.classList.remove('tree-highlight-match');
    }, 2400);
  }

  return targetLine;
}

export function searchJSON(data, query, maxResults = 30) {
  if (!data || !query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results = [];

  function walk(val, curPath = [], parentKey = null) {
    if (results.length >= maxResults) return;
    if (val === null || val === undefined) return;

    if (typeof val === 'object') {
      if (!Array.isArray(val)) {
        if (typeof val.label === 'string' && val.label.toLowerCase().includes(q)) {
          results.push({
            path: [...curPath],
            type: 'label',
            matchKey: 'label',
            matchVal: val.label,
            parentKey: parentKey || '{root}',
          });
        } else if (typeof val.name === 'string' && val.name.toLowerCase().includes(q)) {
          results.push({
            path: [...curPath],
            type: 'name',
            matchKey: 'name',
            matchVal: val.name,
            parentKey: parentKey || '{root}',
          });
        }
      }

      if (Array.isArray(val)) {
        for (let idx = 0; idx < val.length; idx++) {
          if (results.length >= maxResults) return;
          walk(val[idx], [...curPath, String(idx)], String(idx));
        }
      } else {
        for (const [k, v] of Object.entries(val)) {
          if (results.length >= maxResults) return;
          const kLower = k.toLowerCase();
          if (kLower.includes(q) && k !== 'label' && k !== 'name') {
            results.push({
              path: [...curPath, k],
              type: 'key',
              matchKey: k,
              matchVal:
                typeof v === 'object' && v !== null
                  ? Array.isArray(v)
                    ? `[${v.length}]`
                    : `{${Object.keys(v).length}}`
                  : String(v),
              parentKey: k,
            });
          }
          walk(v, [...curPath, k], k);
        }
      }
    } else {
      const valStr = String(val);
      if (valStr.toLowerCase().includes(q)) {
        const lastKey = curPath[curPath.length - 1];
        if (lastKey !== 'label' && lastKey !== 'name') {
          results.push({
            path: [...curPath],
            type: 'value',
            matchKey: lastKey || '',
            matchVal: valStr,
            parentKey: lastKey,
          });
        }
      }
    }
  }

  walk(data, []);
  return results;
}
