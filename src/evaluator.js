import { JSONPath } from 'jsonpath-plus';

export function evaluate(json, pathStr) {
  if (!pathStr || !pathStr.trim()) {
    return { result: null, error: null, empty: true };
  }
  if (json === null || json === undefined) {
    return { result: null, error: 'No valid JSON loaded', empty: false };
  }
  try {
    const result = JSONPath({ path: pathStr, json });
    return { result, error: null, empty: false };
  } catch (e) {
    return { result: null, error: e.message || String(e), empty: false };
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
