export function buildQuery(params = {}) {
  const keys = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '');
  if (!keys.length) return '';
  const qs = keys.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  return qs ? `?${qs}` : '';
}

export function resolveMediaUrl(url) {
  if (!url) return url;
  try {
    // 如果已经是完整的 http/https URL，直接返回，避免错误重写主机名
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    let apiBase;
    try {
      apiBase = import.meta?.env?.VITE_API_BASE;
    } catch (e) {
      apiBase = undefined;
    }
    const fallbackOrigin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
    const apiOrigin = (() => {
      try { return apiBase ? new URL(apiBase).origin : fallbackOrigin; } catch { return fallbackOrigin; }
    })();

    // 相对路径 /media 或 /static
    if (url.startsWith('/media') || url.startsWith('/static')) {
      return `${apiOrigin}${url}`;
    }

    const u = new URL(url, apiOrigin);
    const needRewrite = (u.hostname === '127.0.0.1' || u.hostname === 'localhost');
    if (needRewrite) {
      const target = new URL(apiOrigin);
      u.protocol = target.protocol;
      u.host = target.host;
      return u.toString();
    }
    return u.toString();
  } catch {
    return url;
  }
}

export default { buildQuery, resolveMediaUrl };
