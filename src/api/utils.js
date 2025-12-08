export function buildQuery(params = {}) {
  const keys = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '');
  if (!keys.length) return '';
  const qs = keys.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  return qs ? `?${qs}` : '';
}

export default { buildQuery };
