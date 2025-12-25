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

// 上传图片
export async function uploadImage(formData) {
  // 统一 API 根路径：与其他 api 模块保持一致，末尾自带 /api
  let API_ROOT;
  try {
    API_ROOT = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000/api';
  } catch (e) {
    API_ROOT = 'http://localhost:8000/api';
  }

  const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 正确的后端路径是 /api/upload/image/
  const uploadUrl = `${API_ROOT}/upload/image/`;
  console.log('上传URL:', uploadUrl);
  console.log('Token:', token ? '存在' : '不存在');

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  console.log('响应状态:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('上传失败，错误响应:', error);
    throw new Error(error.message || error.detail || `上传失败: ${response.status}`);
  }

  const result = await response.json();
  console.log('上传成功，完整响应:', result);
  
  // 处理后端返回的格式 { code, message, data: { url } }
  if (result.code && result.code !== 200) {
    console.error('业务错误，code:', result.code, 'message:', result.message);
    throw new Error(result.message || '上传失败');
  }
  
  // 返回整个 data 对象，包含 url
  return result.data || result;
}

export default { buildQuery, resolveMediaUrl, uploadImage };
