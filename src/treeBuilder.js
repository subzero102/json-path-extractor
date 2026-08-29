function isExpandable(value) {
  return value !== null && typeof value === 'object';
}

function getPreview(value) {
  if (Array.isArray(value)) return ` [${value.length}]`;
  if (value !== null && typeof value === 'object') return ` {${Object.keys(value).length}}`;
  return '';
}

function createDocIcon(curPath, onSelect) {
  const btn = document.createElement('button');
  btn.className = 'doc-icon';
  btn.type = 'button';
  btn.textContent = '📄';
  btn.title = 'Generate JSONPath for this node';
  btn.setAttribute('aria-label', 'Generate path');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelect([...curPath]);
  });
  return btn;
}

function createNode(value, key, curPath, onSelect, isArrayParent) {
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
  } else {
    // root primitive or root container without key — no key label
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
  // comma visual only; CSS handles separators
  line.appendChild(comma);

  const icon = createDocIcon(curPath, onSelect);
  line.appendChild(icon);

  node.appendChild(line);

  if (expandable) {
    const children = document.createElement('div');
    children.className = 'tree-children collapsed';

    if (Array.isArray(value)) {
      value.forEach((child, idx) => {
        const childPath = [...curPath, String(idx)];
        const childNode = createNode(child, String(idx), childPath, onSelect, true);
        children.appendChild(childNode);
      });
    } else {
      for (const [k, v] of Object.entries(value)) {
        const childPath = [...curPath, String(k)];
        const childNode = createNode(v, k, childPath, onSelect, false);
        children.appendChild(childNode);
      }
    }

    const toggleFn = () => {
      const isCollapsed = children.classList.contains('collapsed');
      if (isCollapsed) {
        children.classList.remove('collapsed');
        toggle.textContent = '▼';
        line.classList.add('expanded');
      } else {
        children.classList.add('collapsed');
        toggle.textContent = '▶';
        line.classList.remove('expanded');
      }
    };

    line.addEventListener('click', toggleFn);
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFn();
    });

    node.appendChild(children);
  }

  return node;
}

export function buildTree(data, container, onSelect) {
  container.innerHTML = '';
  const frag = document.createDocumentFragment();

  // Add root $ line with icon
  const rootLineWrap = document.createElement('div');
  rootLineWrap.className = 'tree-node root-node';
  const rootLine = document.createElement('div');
  rootLine.className = 'tree-line root-line';
  const rootToggle = document.createElement('span');
  rootToggle.className = 'tree-toggle expandable';
  const rootExpandable = isExpandable(data);
  if (rootExpandable) {
    rootToggle.textContent = '▼';
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
  const rootIcon = createDocIcon([], onSelect);
  rootLine.appendChild(rootIcon);
  rootLineWrap.appendChild(rootLine);

  if (rootExpandable) {
    const rootChildren = document.createElement('div');
    rootChildren.className = 'tree-children'; // root expanded by one level

    if (Array.isArray(data)) {
      data.forEach((child, idx) => {
        const childPath = [String(idx)];
        rootChildren.appendChild(createNode(child, String(idx), childPath, onSelect, true));
      });
    } else {
      for (const [k, v] of Object.entries(data)) {
        const childPath = [String(k)];
        rootChildren.appendChild(createNode(v, k, childPath, onSelect, false));
      }
    }

    const rootToggleFn = () => {
      const isCollapsed = rootChildren.classList.contains('collapsed');
      if (isCollapsed) {
        rootChildren.classList.remove('collapsed');
        rootToggle.textContent = '▼';
      } else {
        rootChildren.classList.add('collapsed');
        rootToggle.textContent = '▶';
      }
    };
    rootLine.addEventListener('click', rootToggleFn);
    rootToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      rootToggleFn();
    });

    rootLineWrap.appendChild(rootChildren);
  }

  frag.appendChild(rootLineWrap);
  container.appendChild(frag);
}

export function clearTree(container, message = 'No valid JSON') {
  container.innerHTML = `<div class="tree-empty">${message}</div>`;
}

export function expandAndHighlightPath(container, pathArray) {
  if (!container || !Array.isArray(pathArray) || pathArray.length === 0) return null;

  // Ensure root is expanded
  const rootNode = container.querySelector('.root-node');
  const rootLine = rootNode?.querySelector('.root-line');
  const rootChildren = rootNode?.querySelector(':scope > .tree-children');
  if (rootChildren && rootChildren.classList.contains('collapsed')) {
    rootChildren.classList.remove('collapsed');
    const rootToggle = rootLine?.querySelector('.tree-toggle');
    if (rootToggle) rootToggle.textContent = '▼';
  }

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
    const children = childNode.querySelector(':scope > .tree-children');

    if (i === pathArray.length - 1) {
      targetLine = line;
    }

    if (children && i < pathArray.length - 1) {
      // Expand ancestor
      children.classList.remove('collapsed');
      const toggle = line?.querySelector('.tree-toggle');
      if (toggle && toggle.classList.contains('expandable')) {
        toggle.textContent = '▼';
      }
      line?.classList.add('expanded');
      currentParent = children;
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
