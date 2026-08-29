function isIndex(k) {
  return /^\d+$/.test(String(k));
}

function isIdent(k) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(k));
}

function esc(k) {
  return String(k).replace(/'/g, "\\'");
}

function formatFilterValue(val) {
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  const str = String(val);
  if (!str.includes("'")) {
    return `'${str}'`;
  }
  if (!str.includes('"')) {
    return `"${str}"`;
  }
  return `'${str.replace(/'/g, "\\'")}'`;
}

function getFilterProperty(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;

  // Primary: @.label (explicitly prioritized for text search)
  if (typeof obj.label === 'string' && obj.label.trim() !== '') {
    return { key: 'label', value: obj.label };
  }
  if (typeof obj.label === 'number') {
    return { key: 'label', value: obj.label };
  }

  // Secondary standard entity identifier keys
  for (const k of ['name', 'title', 'id', 'key']) {
    if (typeof obj[k] === 'string' && obj[k].trim() !== '') {
      return { key: k, value: obj[k] };
    }
    if (typeof obj[k] === 'number') {
      return { key: k, value: obj[k] };
    }
  }

  return null;
}

function generateFilterVariant(path, rootData) {
  if (!rootData || !Array.isArray(path) || path.length === 0) return 'N/A';

  // Walk path and collect values
  let cur = rootData;
  const nodes = [{ key: '$', val: cur }];
  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    if (cur !== null && cur !== undefined && typeof cur === 'object') {
      cur = cur[k];
    } else {
      cur = undefined;
    }
    nodes.push({ key: k, val: cur });
  }

  // Find candidate segments
  // Index i corresponds to path[i], child is nodes[i + 1].val, parent is nodes[i].val
  const filterCandidates = [];
  for (let i = 0; i < path.length; i++) {
    const childVal = nodes[i + 1].val;
    const parentVal = nodes[i].val;
    const k = path[i];

    const filterProp = getFilterProperty(childVal);
    if (filterProp) {
      if (
        filterProp.key === 'label' ||
        isIndex(k) ||
        (parentVal && typeof parentVal === 'object' && !Array.isArray(parentVal) && Object.keys(parentVal).length > 1)
      ) {
        filterCandidates.push({ index: i, prop: filterProp });
      }
    }
  }

  if (filterCandidates.length === 0) {
    return 'N/A';
  }

  // If any candidate has 'label', prioritize candidates with 'label'
  const hasLabel = filterCandidates.some((c) => c.prop.key === 'label');
  let activeCandidates;
  if (hasLabel) {
    activeCandidates = filterCandidates.filter((c) => c.prop.key === 'label');
  } else {
    // If any candidate is an array index item (e.g. data[0]), prefer filtering the array item by id/name
    const arrayItemCandidate = filterCandidates.find((c) => isIndex(path[c.index]));
    if (arrayItemCandidate) {
      activeCandidates = [arrayItemCandidate];
    } else {
      activeCandidates = [filterCandidates[filterCandidates.length - 1]];
    }
  }

  const candidateMap = new Map();
  for (const c of activeCandidates) {
    candidateMap.set(c.index, c.prop);
  }

  let filterPath = '$';
  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    if (candidateMap.has(i)) {
      const { key: propKey, value: propVal } = candidateMap.get(i);
      const valStr = formatFilterValue(propVal);
      filterPath += `..[?(@.${propKey} == ${valStr})]`;
    } else {
      if (isIndex(k)) {
        filterPath += `[${k}]`;
      } else if (isIdent(k)) {
        filterPath += `.${k}`;
      } else {
        filterPath += `['${esc(k)}']`;
      }
    }
  }

  return filterPath;
}

export function generateVariants(pathArray, rootData) {
  const path = Array.isArray(pathArray) ? pathArray : [];

  // Absolute: dot notation where possible
  let absolute = '$';
  for (const k of path) {
    if (isIndex(k)) {
      absolute += `[${k}]`;
    } else if (isIdent(k)) {
      absolute += `.${k}`;
    } else {
      absolute += `['${esc(k)}']`;
    }
  }

  // Bracket: bracket notation for all keys
  let bracket = '$';
  for (const k of path) {
    if (isIndex(k)) {
      bracket += `[${k}]`;
    } else {
      bracket += `['${esc(k)}']`;
    }
  }

  // Deep Scan: recursive descent to specific key, N/A if targeting array index
  let deepScan = 'N/A';
  if (path.length > 0) {
    const last = path[path.length - 1];
    if (!isIndex(last)) {
      if (isIdent(last)) {
        deepScan = `$..${last}`;
      } else {
        deepScan = `$..['${esc(last)}']`;
      }
    }
  } else {
    deepScan = 'N/A';
  }

  // Array Wildcard: replace closest (last) array index with [*]
  let wildcard = absolute;
  let lastIndexPos = -1;
  for (let i = path.length - 1; i >= 0; i--) {
    if (isIndex(path[i])) {
      lastIndexPos = i;
      break;
    }
  }
  if (lastIndexPos !== -1) {
    let w = '$';
    for (let i = 0; i < path.length; i++) {
      const k = path[i];
      if (i === lastIndexPos) {
        w += '[*]';
      } else if (isIndex(k)) {
        w += `[${k}]`;
      } else if (isIdent(k)) {
        w += `.${k}`;
      } else {
        w += `['${esc(k)}']`;
      }
    }
    wildcard = w;
  } else if (path.length === 0) {
    wildcard = '$';
  } else {
    wildcard = absolute;
  }

  // Filter Search: [?(@.label == '...')] text/predicate filter
  const filter = generateFilterVariant(path, rootData);

  // When path empty, variants should be "$" except deepScan and filter
  if (path.length === 0) {
    absolute = '$';
    bracket = '$';
    wildcard = '$';
  }

  return { absolute, bracket, deepScan, wildcard, filter };
}
