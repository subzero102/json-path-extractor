import { JSONPath } from 'jsonpath-plus';

export function evaluate(json, pathStr, mode = 'values') {
  if (!pathStr || !pathStr.trim()) {
    return { result: null, paths: null, error: null, empty: true };
  }
  if (json === null || json === undefined) {
    return { result: null, paths: null, error: 'No valid JSON loaded', empty: false };
  }
  try {
    const result = JSONPath({ path: pathStr, json, resultType: 'value' });
    let paths = null;
    if (mode === 'paths') {
      try {
        paths = JSONPath({ path: pathStr, json, resultType: 'path' });
      } catch {
        paths = [];
      }
    }
    return { result, paths, error: null, empty: false };
  } catch (e) {
    return { result: null, paths: null, error: e.message || String(e), empty: false };
  }
}

export function evaluatePathsOnly(json, pathStr) {
  if (!pathStr || !pathStr.trim() || json === null || json === undefined) return [];
  try {
    return JSONPath({ path: pathStr, json, resultType: 'path' }) || [];
  } catch {
    return [];
  }
}

export function stringifyResult(result) {
  if (result === null || result === undefined) return '';
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}
