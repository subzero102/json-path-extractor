function isIndex(k) {
  return /^\d+$/.test(k);
}

function isIdent(k) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k);
}

function esc(k) {
  return k.replace(/'/g, "\\'");
}

export function generateVariants(pathArray) {
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

  // When path empty, variants should be "$" except deepScan
  if (path.length === 0) {
    absolute = '$';
    bracket = '$';
    wildcard = '$';
  }

  return { absolute, bracket, deepScan, wildcard };
}
